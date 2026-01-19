"""
Tests for the UnifiedAgentFactory and related tool conversion logic.
"""

from unittest.mock import AsyncMock, MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase

from opencontractserver.corpuses.models import Corpus
from opencontractserver.documents.models import Document
from opencontractserver.llms.agents.agent_factory import (
    UnifiedAgentFactory,
)
from opencontractserver.llms.agents.core_agents import AgentConfig, CoreAgent
from opencontractserver.llms.tools.tool_factory import (
    CoreTool,
)
from opencontractserver.llms.types import AgentFramework

User = get_user_model()


class TestAgentFactorySetup(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="factory_testuser", password="password", email="factory@test.com"
        )
        cls.corpus1 = Corpus.objects.create(
            title="Factory Test Corpus 1", creator=cls.user
        )
        cls.doc1 = Document.objects.create(
            title="Factory Test Doc 1", corpus=cls.corpus1, creator=cls.user
        )

        def dummy_callable_tool(q: str) -> str:
            return f"called: {q}"

        cls.callable_tool = dummy_callable_tool  # Store raw function
        cls.core_tool_instance = CoreTool.from_function(
            cls.callable_tool, name="dummy_core_from_callable"
        )


class TestUnifiedAgentFactory(TestAgentFactorySetup):

    @patch("opencontractserver.llms.agents.pydantic_ai_agents.PydanticAIDocumentAgent")
    @patch(f"{UnifiedAgentFactory.__module__}.get_default_config")
    @patch(f"{UnifiedAgentFactory.__module__}._convert_tools_for_framework")
    async def test_create_document_agent_pydantic_ai_with_tools(
        self,
        mock_convert_tools: MagicMock,
        mock_get_config: MagicMock,
        mock_pydantic_agent_class: MagicMock,
    ):
        mock_config = AgentConfig()
        mock_get_config.return_value = mock_config

        # Mock the agent instance
        mock_agent_instance = AsyncMock(spec=CoreAgent)
        mock_pydantic_agent_class.create = AsyncMock(return_value=mock_agent_instance)

        raw_tools = [self.callable_tool]
        converted_framework_tools = [MagicMock()]  # Mocked converted tools
        mock_convert_tools.return_value = converted_framework_tools

        agent = await UnifiedAgentFactory.create_document_agent(
            self.doc1,
            self.corpus1,
            framework=AgentFramework.PYDANTIC_AI,
            tools=raw_tools,
        )

        mock_get_config.assert_called_once_with(
            user_id=None,
            model_name="gpt-4o-mini",
            system_prompt=None,
            temperature=0.7,
            max_tokens=None,
            streaming=True,
            conversation=None,
            conversation_id=None,
            loaded_messages=None,
            embedder_path=None,
            tools=raw_tools,
        )
        mock_convert_tools.assert_called_once_with(
            raw_tools, AgentFramework.PYDANTIC_AI
        )
        mock_pydantic_agent_class.create.assert_called_once()
        self.assertIs(agent, mock_agent_instance)

    @patch("opencontractserver.llms.agents.pydantic_ai_agents.PydanticAICorpusAgent")
    @patch(f"{UnifiedAgentFactory.__module__}.get_default_config")
    async def test_create_corpus_agent_pydantic_ai(
        self, mock_get_config: MagicMock, mock_pydantic_agent_class: MagicMock
    ):
        mock_config = AgentConfig()
        mock_get_config.return_value = mock_config

        # Mock the agent instance
        mock_agent_instance = AsyncMock(spec=CoreAgent)
        mock_pydantic_agent_class.create = AsyncMock(return_value=mock_agent_instance)

        agent = await UnifiedAgentFactory.create_corpus_agent(
            self.corpus1, framework=AgentFramework.PYDANTIC_AI
        )

        mock_get_config.assert_called_once_with(
            user_id=None,
            model_name="gpt-4o-mini",  # Default from factory
            system_prompt=None,
            temperature=0.7,  # Default
            max_tokens=None,  # Default
            streaming=True,  # Default
            conversation=None,
            conversation_id=None,  # Default
            loaded_messages=None,
            embedder_path=None,
            tools=[],  # Default
        )
        mock_pydantic_agent_class.create.assert_called_once()
        self.assertIs(agent, mock_agent_instance)

    async def test_unsupported_framework_raises_error(self):
        """Test that invalid framework names raise ValueError."""
        with self.assertRaises(ValueError):
            await UnifiedAgentFactory.create_document_agent(
                self.doc1, self.corpus1, framework="invalid_framework_name"
            )
        with self.assertRaises(ValueError):
            await UnifiedAgentFactory.create_corpus_agent(
                self.corpus1, framework="invalid_framework_name"
            )
