# Testing Patterns for Pydantic AI Agents

This document explains the recommended testing approaches for PydanticAI agents, replacing the brittle VCR cassette approach.

## Quick Summary

**❌ DON'T** use VCR cassettes with complex ID normalization
**✅ DO** use TestModel for integration tests
**✅ DO** use FunctionModel for complex response scenarios

## Why TestModel Instead of VCR?

### Problems with VCR Approach

1. **Environment Variance**: Document IDs differ between local (2, 3) and CI (5000+)
2. **Complex Normalization**: 300+ lines of regex for ID mapping is fragile
3. **Cassette Brittleness**: Must re-record for any test data changes
4. **Silent Failures**: Cassette matching fails silently, returning empty responses
5. **Debugging Difficulty**: Hard to diagnose why cassettes don't match in CI

### Benefits of TestModel

1. **Deterministic**: Same results locally and in CI/CD
2. **Fast**: No network latency or API rate limits
3. **Simple**: No ID normalization needed
4. **Reliable**: No cassette matching issues
5. **Cost-effective**: No API usage charges

## Testing Patterns

### Pattern 1: Basic TestModel Usage

For simple tests where you just need the agent to complete successfully:

```python
from pydantic_ai.models.test import TestModel

async def test_basic_agent():
    test_model = TestModel()

    agent = await PydanticAIDocumentAgent.create(
        document=self.doc1,
        corpus=self.corpus,
        config=config,
    )

    # NOTE: Use pydantic_ai_agent.override(), not agent.override()!
    with agent.pydantic_ai_agent.override(model=test_model):
        events = []
        async for event in agent.stream("What is this document about?"):
            events.append(event)

        # Verify completion
        final_events = [e for e in events if e.type == "final"]
        assert len(final_events) > 0
```

**Critical**: The agent wrapper exposes `pydantic_ai_agent`, not `agent`!

### Pattern 2: Custom Response Text (No Tool Calls)

For tests that need specific response content without tool execution:

```python
async def test_with_custom_response():
    test_model = TestModel(
        call_tools=[],  # Skip tool calls - just return text
        custom_output_text=(
            "The payment terms are: Party A pays Party B $10,000 within 30 days."
        )
    )

    with agent.pydantic_ai_agent.override(model=test_model):
        events = []
        async for event in agent.stream("What are the payment terms?"):
            events.append(event)

        final_event = [e for e in events if e.type == "final"][0]
        final_content = final_event.content or final_event.accumulated_content
        assert "payment" in final_content.lower()
        assert "$10,000" in final_content
```

**Note**: Set `call_tools=[]` to skip all tool execution and just return the custom text.

### Pattern 3: Structured Responses

TestModel generates data that satisfies Pydantic schemas:

```python
from pydantic import BaseModel

class PaymentInfo(BaseModel):
    amount: str
    deadline: str
    method: str

async def test_structured_output():
    test_model = TestModel()

    with agent.agent.override(model=test_model):
        result = await agent.structured_response(
            prompt="Extract payment information",
            target_type=PaymentInfo,
        )

        assert isinstance(result, PaymentInfo)
        assert isinstance(result.amount, str)
        assert isinstance(result.deadline, str)
```

### Pattern 4: Tool Execution Testing (Selective Tool Calling)

**IMPORTANT**: TestModel calls tools with arbitrary parameters. To avoid approval-required tools
raising exceptions and polluting test output, specify only READ-ONLY tools:

```python
async def test_tool_execution():
    # Call only READ-ONLY corpus tools to avoid approval errors
    # Get actual tool names from pydantic_ai_agents.py source code
    safe_corpus_tools = [
        'similarity_search',       # Vector search (read-only)
        'get_corpus_description',  # Read description (read-only)
        'list_documents',          # List docs (read-only)
        'ask_document',            # Nested agent queries (read-only)
        # Skip: 'update_corpus_description' - requires approval!
    ]

    test_model = TestModel(
        call_tools=safe_corpus_tools,  # Only safe tools
        custom_output_text="Based on available documents..."
    )

    with corpus_agent.pydantic_ai_agent.override(model=test_model):
        events = []
        async for event in corpus_agent.stream("What documents are available?"):
            events.append(event)

        # Verify tool calls were made
        thought_events = [e for e in events if e.type == "thought"]

        # TestModel called safe tools successfully
        assert len(thought_events) > 0
        print(f"Generated {len(thought_events)} thought events from tool calls")
```

**Key Points:**
- ✅ Use **actual tool names** from agent source code (not guesses!)
- ✅ Include **only read-only tools** (no `update_*`, `add_*`, `duplicate_*`)
- ✅ Avoids "Task exception was never retrieved" asyncio warnings
- ✅ Tests real tool execution pipeline without noise

### Pattern 5: FunctionModel for Advanced Control

For complex scenarios where you need full control over model responses:

```python
from pydantic_ai.models.function import FunctionModel, AgentInfo

async def test_with_function_model():
    def custom_model_fn(messages, agent_info: AgentInfo):
        """Custom logic to generate responses based on conversation state."""
        # Inspect messages
        last_message = messages[-1]

        # Return custom response based on context
        if "payment" in last_message.content.lower():
            return "The payment terms are $10,000 within 30 days."
        elif "deadline" in last_message.content.lower():
            return "The deadline is 30 days from contract signing."
        else:
            return "I can help you with payment and deadline information."

    function_model = FunctionModel(custom_model_fn)

    with agent.agent.override(model=function_model):
        result = await agent.run("What are the payment terms?")
        assert "payment" in result.output.lower()
```

### Pattern 6: Testing Nested Agent Calls (ask_document)

For corpus agents that call document agents via ask_document:

```python
async def test_nested_agent_calls():
    # Skip tool calls to avoid ask_document calling with invalid IDs
    test_model = TestModel(
        call_tools=[],  # No tool calls - just return custom text
        custom_output_text=(
            "Based on the Payment Terms Contract: "
            "Party A must pay $10,000 to Party B within 30 days."
        )
    )

    corpus_agent = await PydanticAICorpusAgent.create(
        corpus=self.corpus,
        config=config,
    )

    with corpus_agent.pydantic_ai_agent.override(model=test_model):
        events = []
        async for event in corpus_agent.stream(
            "What are the payment terms in the Payment Terms Contract?"
        ):
            events.append(event)

        final_events = [e for e in events if e.type == "final"]
        assert len(final_events) > 0

        final_event = final_events[0]
        final_content = final_event.content or final_event.accumulated_content
        assert "payment" in final_content.lower() or "$" in final_content
```

**Note**: TestModel generates arbitrary tool parameters. If you want to test `ask_document`
tool execution, include it in `call_tools` list (Pattern 4), but expect some tool calls to fail
with invalid document IDs.

## Migration Guide: VCR to TestModel

### Before (VCR approach):

```python
@vcr.use_cassette(
    "fixtures/vcr_cassettes/pydantic_ai_ask_document_tool.yaml",
    record_mode="once",
    filter_headers=["authorization", "x-api-key"],
    match_on=["method", "scheme", "host", "port", "path", "query", "body"],
)
async def test_with_vcr(self):
    # Complex VCR setup with ID normalization
    my_vcr = create_vcr_with_id_normalization(
        "pydantic_ai_ask_document_tool.yaml",
        {**self.doc_id_mapping, **self.corpus_id_mapping},
    )

    with my_vcr.use_cassette("pydantic_ai_ask_document_tool.yaml"):
        agent = await PydanticAICorpusAgent.create(...)
        # ... test code
```

### After (TestModel approach):

```python
async def test_with_testmodel(self):
    test_model = TestModel(
        custom_output_text="Expected response content here"
    )

    agent = await PydanticAICorpusAgent.create(...)

    with agent.agent.override(model=test_model):
        # ... test code (no VCR, no ID mapping!)
```

## When to Use Each Approach

| Scenario | Recommended Approach |
|----------|---------------------|
| Unit tests (testing your code) | **TestModel** |
| Integration tests (testing agent flows) | **TestModel** |
| Tests requiring specific responses | **TestModel** with `custom_output_text` |
| Tests with complex conditional logic | **FunctionModel** |
| End-to-end smoke tests | Keep ONE VCR test (optional) |
| Testing LLM quality (evals) | Real API calls (separate eval suite) |

## Best Practices

1. **Default to TestModel**: Use it for 90%+ of your tests
2. **Use `pydantic_ai_agent.override()`**: The agent wrapper exposes `pydantic_ai_agent`, not `agent`
3. **Skip tools for simple tests**: Set `call_tools=[]` when you just want custom output text
4. **Use actual tool names**: Look them up in source code, don't guess (causes KeyError)
5. **Only read-only tools**: When testing tool execution, use only safe tools (no `update_*`, `add_*`, `duplicate_*`)
6. **Custom text when needed**: Use `custom_output_text` for assertion-specific content
7. **Separate evals**: For LLM quality testing, use a separate evaluation suite with real API calls
8. **Fast feedback**: TestModel tests run in milliseconds vs seconds for VCR
9. **CI/CD friendly**: No environment-specific configuration needed
10. **No approval-required tools**: Avoid asyncio "Task exception was never retrieved" warnings

## Troubleshooting

### Issue: TestModel doesn't return expected content

**Solution**: Use `custom_output_text` parameter and set `call_tools=[]`:

```python
test_model = TestModel(
    call_tools=[],  # Skip tools
    custom_output_text="Your expected response here"
)
```

### Issue: "Task exception was never retrieved" asyncio warnings

**Problem**: TestModel called approval-required tools (e.g., `update_document_summary`)
which raised `ToolConfirmationRequired` in background tasks.

**Solution**: Specify only READ-ONLY tools in `call_tools`:

```python
safe_tools = [
    'similarity_search',
    'get_corpus_description',
    'list_documents',
    # Don't include: 'update_corpus_description', 'add_document_note', etc.
]
test_model = TestModel(call_tools=safe_tools)
```

### Issue: Tool names don't match (KeyError)

**Problem**: Guessing tool names instead of using actual names from source code.

**Solution**: Look up actual tool names in `pydantic_ai_agents.py`:

```bash
# For corpus agent, check lines ~2129-2134
# For document agent, check lines ~1789+
grep -n "name=" opencontractserver/llms/agents/pydantic_ai_agents.py
```

### Issue: Need different responses for different queries

**Solution**: Use FunctionModel with custom logic:

```python
def smart_responder(messages, agent_info):
    # Implement conditional logic based on messages
    return custom_response

function_model = FunctionModel(smart_responder)
```

### Issue: Need to test with real LLM for quality

**Solution**: Create separate evaluation suite (not unit/integration tests):

```python
# In tests/evals/test_llm_quality.py
@pytest.mark.eval  # Mark as eval, not regular test
async def test_real_llm_quality():
    # Use real model for quality evaluation
    agent = await PydanticAICorpusAgent.create(
        corpus=self.corpus,
        config=config,  # Uses real model
    )
    # Test LLM response quality
```

## Performance Comparison

| Approach | Speed | Reliability | CI/CD Issues | Maintenance |
|----------|-------|-------------|--------------|-------------|
| VCR with ID normalization | Slow (1-5s) | Low (brittle) | High | High |
| TestModel | Fast (<100ms) | High | None | Low |
| Real API calls | Very slow (5-30s) | Medium | Medium | Medium |

## Example: Complete Test File

See `test_pydantic_ai_integration_testmodel.py` for a complete example showing:
- Basic TestModel usage
- Custom output text
- Structured responses
- Tool execution testing
- Nested agent calls

## References

- [Pydantic AI Testing Documentation](https://ai.pydantic.dev/testing/)
- [TestModel API Reference](https://ai.pydantic.dev/api/models/test/)
- [FunctionModel Documentation](https://ai.pydantic.dev/api/models/function/)
