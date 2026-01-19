# Backend Analyzer Framework

## Overview

The OpenContracts backend supports two distinct analyzer frameworks for processing documents and creating annotations:

1. **Task-based Analyzers** - Modern framework running within the Django application
2. **Gremlin-based Analyzers** - Legacy framework using external microservice engines

This document details how the backend handles analysis requests from frontend mutations, executes analyzers, and processes results.

## GraphQL Mutation Entry Point

### StartDocumentAnalysisMutation

**File**: `/config/graphql/mutations.py`

The primary entry point for triggering analyses is the `StartDocumentAnalysisMutation` GraphQL mutation, exposed as `startAnalysisOnDoc`:

```python
class StartDocumentAnalysisMutation(graphene.Mutation):
    class Arguments:
        document_id = graphene.ID(required=False, description="Id of the document to be analyzed.")
        analyzer_id = graphene.ID(required=True, description="Id of the analyzer to use.")
        corpus_id = graphene.ID(required=False, description="Optional Id of the corpus to associate with the analysis.")
        analysis_input_data = GenericScalar(required=False, description="Optional arguments to be passed to the analyzer.")

    ok = graphene.Boolean()
    message = graphene.String()
    obj = graphene.Field(AnalysisType)
```

**Key Features:**
- **Flexible Targeting**: Can analyze single documents (`document_id`) or entire corpuses (`corpus_id`)
- **Custom Configuration**: Supports `analysis_input_data` for analyzers requiring user input
- **Permission Validation**: Checks user permissions for documents and corpuses
- **Error Handling**: Returns structured success/failure responses

**Permission Logic:**
```python
# Document permission check
if document_pk:
    document = Document.objects.get(pk=document_pk)
    if not (document.creator == user or document.is_public):
        raise PermissionError("You don't have permission to analyze this document.")

# Corpus permission check
if corpus_pk:
    corpus = Corpus.objects.get(pk=corpus_pk)
    if not (corpus.creator == user or corpus.is_public):
        raise PermissionError("You don't have permission to analyze this corpus.")
```

## Analysis Orchestration

### process_analyzer Function

**File**: `/opencontractserver/tasks/corpus_tasks.py`

The mutation delegates to `process_analyzer()`, which orchestrates analysis execution:

```python
def process_analyzer(
    user_id: int | str,
    analyzer: Analyzer | None,
    corpus_id: str | int | None = None,
    document_ids: list[str | int] | None = None,
    corpus_action: CorpusAction | None = None,
    analysis_input_data: dict | None = None,
) -> Analysis:
```

**Process Flow:**
1. **Analysis Creation**: Creates `Analysis` record with metadata tracking
2. **Framework Detection**: Routes to appropriate analyzer framework based on `analyzer.task_name`
3. **Task Dispatch**: Queues Celery tasks for asynchronous execution
4. **Transaction Safety**: Uses `transaction.on_commit()` to ensure database consistency

### Analysis Creation and Setup

**File**: `/opencontractserver/utils/analysis.py`

```python
def create_and_setup_analysis(analyzer, user_id, corpus_id=None, doc_ids=None, corpus_action=None):
```

**Key Operations:**
- **Deduplication**: Reuses existing Analysis records when possible
- **Metadata Tracking**: Sets `analysis_started` timestamp
- **Permission Setup**: Grants CRUD permissions to creator
- **Document Association**: Links specific documents for targeted analysis

## Analyzer Frameworks

### 1. Task-based Analyzers (Modern Framework)

**Architecture**: Runs as Celery tasks within the main Django application

#### Analyzer Model Structure

**File**: `/opencontractserver/analyzer/models.py`

```python
class Analyzer(BaseOCModel):
    id = CharField(max_length=1024, primary_key=True)
    manifest = NullableJSONField(default=jsonfield_default_value, null=True, blank=True)
    description = TextField(null=False, blank=True, default="")
    disabled = BooleanField(default=False)
    is_public = BooleanField(default=True)
    icon = FileField(blank=True, upload_to=calculate_analyzer_icon_path)

    # Framework Selection Fields (mutually exclusive)
    host_gremlin = ForeignKey(GremlinEngine, null=True, blank=True)  # For Gremlin framework
    task_name = CharField(max_length=1024, null=True, blank=True)    # For task framework

    # Configuration Support
    input_schema = NullableJSONField(null=True, blank=True, help_text="Optional JSONSchema describing the analyzer input.")
```

**Database Constraints:**
- **Mutual Exclusivity**: Either `host_gremlin` OR `task_name` must be set (not both)
- **Uniqueness**: Each `task_name` and `host_gremlin` must be unique

#### Task Execution Flow

**File**: `/opencontractserver/tasks/corpus_tasks.py`

```python
@shared_task
def run_task_name_analyzer(
    analysis_id: int | str,
    document_ids: list[str | int] | None = None,
    analysis_input_data: dict | None = None,
):
```

**Process:**
1. **Task Resolution**: `get_doc_analyzer_task_by_name(task_name)` finds registered Celery task
2. **Document Batching**: Creates Celery chord for parallel document processing
3. **Custom Input**: Passes `analysis_input_data` to each task instance
4. **Completion Tracking**: Aggregates results via `mark_analysis_complete` callback

#### @doc_analyzer_task Decorator

**File**: `/opencontractserver/shared/decorators.py`

The `@doc_analyzer_task` decorator provides standardized infrastructure for analyzer tasks:

**Features:**
- **Document Validation**: Ensures documents and analysis exist
- **Lock Management**: Retries when documents are backend-locked with exponential backoff
- **Data Preparation**: Extracts PDF text, PAWLS parse data, and translation layers
- **Result Processing**: Handles annotation creation and database persistence
- **Error Handling**: Captures exceptions and stores in Analysis records
- **Schema Support**: Accepts `input_schema` for frontend configuration forms

**Function Signature:**
```python
@doc_analyzer_task(max_retries=3, input_schema={...})
def my_analyzer(pdf_text_extract, pdf_pawls_extract, doc_id, analysis_id, corpus_id, **kwargs):
    """
    Returns: (doc_annotations, span_label_pairs, metadata, task_pass, message)
    """
    return ([], [(span, "ENTITY")], [], True, "Analysis completed successfully")
```

**Expected Return Format:**
```python
# 5-tuple return format
(
    doc_annotations: List[str],           # Document-level labels
    span_label_pairs: List[Tuple[TextSpan, str]],  # Text spans with labels
    metadata: List[Dict[str, Any]],       # Additional task metadata
    task_pass: bool,                      # Success/failure indicator
    message: str                          # Human-readable result message
)
```

#### Annotation Processing

The decorator automatically handles annotation creation:

**PDF Documents** (Token-based):
```python
# Uses PAWLS translation layer for precise coordinates
annotation_data = pdf_data_layer.create_opencontract_annotation_from_span({
    "span": span,
    "annotation_label": label_text
})
```

**Text Documents** (Span-based):
```python
# Simple start/end character offsets
annot = Annotation(
    raw_text=pdf_text_extract[span["start"]:span["end"]],
    json={"start": span["start"], "end": span["end"]},
    annotation_type=LabelType.SPAN_LABEL
)
```

#### Example Task-based Analyzer

```python
@doc_analyzer_task(
    input_schema={
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
            "confidence_threshold": {
                "type": "number",
                "minimum": 0.0,
                "maximum": 1.0,
                "default": 0.7
            },
            "entity_types": {
                "type": "array",
                "items": {"type": "string"},
                "default": ["PERSON", "ORG", "MONEY"]
            }
        }
    }
)
def entity_extractor(pdf_text_extract, pdf_pawls_extract, **kwargs):
    """Extract named entities using configurable parameters."""

    # Get user configuration
    confidence = kwargs.get('confidence_threshold', 0.7)
    entity_types = kwargs.get('entity_types', ['PERSON', 'ORG', 'MONEY'])

    # Run NLP model
    entities = nlp_model.extract_entities(
        pdf_text_extract,
        confidence_threshold=confidence,
        entity_types=entity_types
    )

    # Format spans
    span_label_pairs = [
        ({"start": ent.start, "end": ent.end, "text": ent.text}, ent.label)
        for ent in entities
    ]

    return ([], span_label_pairs, [], True, f"Found {len(entities)} entities")
```

### 2. Gremlin-based Analyzers (Legacy Framework)

**Architecture**: External microservice engines running analyzers

#### GremlinEngine Model

```python
class GremlinEngine(BaseOCModel):
    url = CharField(max_length=1024)          # Engine endpoint URL
    api_key = CharField(max_length=1024)      # Authentication key
    last_synced = DateTimeField()             # Last sync timestamp
    install_started = DateTimeField()         # Installation tracking
    install_completed = DateTimeField()
    is_public = BooleanField(default=True)
```

#### Execution Flow

**File**: `/opencontractserver/utils/analyzer.py`

```python
def run_analysis(analysis_id: str, doc_ids: list[int | str] | None = None) -> int:
```

**Process:**
1. **Document Packaging**: Bundles document URLs (PDF, text extract, PAWLS parse)
2. **Submission Payload**: Creates analysis job request
3. **HTTP Dispatch**: POSTs job to Gremlin engine endpoint
4. **Callback Setup**: Registers callback URL for result notification

**Submission Format:**
```python
gremlin_submission = {
    "analyzer_id": analyzer.id,
    "callback_url": f"{settings.CALLBACK_ROOT_URL_FOR_ANALYZER}/analysis/{analysis.id}/complete",
    "callback_token": analysis.callback_token.__str__(),
    "documents": [
        {
            "original_id": doc.id,
            "pdf_file_url": get_django_file_field_url("pdf_file", doc),
            "txt_extract_file_url": get_django_file_field_url("txt_extract_file", doc),
            "pawls_parse_file_url": get_django_file_field_url("pawls_parse_file", doc)
        }
        for doc in docs
    ]
}
```

**Security Features:**
- **Callback Tokens**: UUID-based authentication for result callbacks
- **URL Generation**: Handles both AWS S3 and local file serving

## Analysis Lifecycle

### 1. Analysis Record

**File**: `/opencontractserver/analyzer/models.py`

```python
class Analysis(BaseOCModel):
    # Core References
    analyzer = ForeignKey(Analyzer, on_delete=CASCADE)
    analyzed_corpus = ForeignKey(Corpus, null=True, blank=True)
    analyzed_documents = ManyToManyField(Document, related_name="included_in_analyses")
    corpus_action = ForeignKey(CorpusAction, null=True, blank=True)

    # Security & Callbacks
    callback_token = UUIDField(default=uuid.uuid4, editable=False)
    received_callback_file = FileField()

    # Execution Tracking
    analysis_started = DateTimeField(null=True, blank=True)
    analysis_completed = DateTimeField(null=True, blank=True)
    status = CharField(choices=[(status.value, status.name) for status in JobStatus])

    # Results & Errors
    result_message = TextField(null=True, blank=True)
    error_message = TextField(null=True, blank=True)
    error_traceback = TextField(null=True, blank=True)
    import_log = TextField(null=True, blank=True)
```

### 2. Document Analysis Tracking

**File**: `/opencontractserver/documents/models.py`

```python
class DocumentAnalysisRow(BaseOCModel):
    """Tracks per-document analysis results within an Analysis."""
    document = ForeignKey(Document, on_delete=CASCADE)
    analysis = ForeignKey(Analysis, on_delete=CASCADE)
    annotations = ManyToManyField(Annotation, related_name="created_by_analysis_row")
```

### 3. Completion Handling

**Task Framework:**
```python
@shared_task
def mark_analysis_complete(analysis_id: str | int, doc_ids: list[int | str]) -> None:
    analysis = Analysis.objects.get(pk=analysis_id)
    analysis.analysis_completed = timezone.now()
    analysis.analyzed_documents.add(*doc_ids)
    analysis.save()
```

**Gremlin Framework:**
- External engines POST results to callback URLs
- Results processed via Django views handling callback tokens
- Annotations imported from standardized JSON format

## Error Handling and Reliability

### Task Framework Error Handling

**Retry Logic:**
```python
# Document lock retry with exponential backoff
if doc.backend_lock:
    retry_count = self.request.retries
    delay = min(INITIAL_DELAY + (retry_count * DELAY_INCREMENT), MAX_DELAY)
    if delay < MAX_DELAY:
        raise self.retry(countdown=delay)
```

**Error Capture:**
```python
try:
    result = func(...)
    if task_pass:
        analysis.result_message = message
    else:
        analysis.error_message = message
except Exception as e:
    analysis.error_message = str(e)
    analysis.error_traceback = traceback.format_exc()
    return [], [], [{"data": {"error": str(e)}}], False, str(e)
```

### Gremlin Framework Error Handling

- **Network Failures**: HTTP request timeouts and connection errors
- **Callback Validation**: Token-based authentication for result submissions
- **Malformed Results**: Validation of returned annotation data

## Configuration and Extensibility

### Input Schema Support

Analyzers can define JSON Schema for frontend configuration:

```python
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "model_name": {
            "type": "string",
            "enum": ["roberta-base", "bert-large"],
            "default": "roberta-base"
        },
        "confidence_threshold": {
            "type": "number",
            "minimum": 0.0,
            "maximum": 1.0,
            "default": 0.8
        }
    },
    "required": ["model_name"]
}
```

### Label Management

**Automatic Label Creation:**
- Task framework creates `AnnotationLabel` objects automatically
- Labels linked to originating `Analyzer` for tracking
- Supports document-level (`DOC_TYPE_LABEL`) and span-level (`TOKEN_LABEL`, `SPAN_LABEL`) annotations

### Permission System

**Analysis Permissions:**
- Analyses inherit creator permissions
- Support for public/private visibility
- Per-analysis permission grants via Django Guardian

**Document Access:**
- Analyzers can only process documents user has access to
- Supports both owned and publicly accessible documents
- Corpus-level permissions required for corpus analysis

## Performance and Scaling

### Parallel Processing

**Task Framework:**
```python
# Parallel document processing using Celery chord
chord(
    group([
        task_func.s(doc_id=doc_id, analysis_id=analysis.id, **analysis_input_data)
        for doc_id in document_ids
    ])
)(mark_analysis_complete.si(analysis_id=analysis.id, doc_ids=document_ids))
```

### Resource Management

- **Backend Locking**: Prevents concurrent processing of same document
- **Celery Queues**: Distributes work across worker processes
- **Database Transactions**: Ensures consistency during annotation creation

### Monitoring and Observability

- **Analysis Status Tracking**: `CREATED`, `RUNNING`, `COMPLETED`, `FAILED`
- **Execution Timestamps**: Start/completion tracking for performance analysis
- **Error Logging**: Detailed error messages and stack traces
- **Result Metrics**: Annotation counts and processing statistics

This backend analyzer framework provides a robust, scalable foundation for document analysis workflows.
