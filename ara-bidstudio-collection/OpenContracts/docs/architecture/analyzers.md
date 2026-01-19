# Comprehensive Guide to Document Analyzers

## Overview
OpenContracts supports document analyzers that run as Celery tasks within the main application. These analyzers can automatically process documents and create annotations.

## 1. Database Structure
The `Analyzer` model has these key fields:
- `id`: CharField (primary key, max length 1024)
- `manifest`: JSON field for analyzer configuration
- `description`: Text field
- `disabled`: Boolean flag
- `is_public`: Boolean for visibility
- `icon`: File field
- `task_name`: CharField pointing to the Celery task (required)

## 2. How Analyzers Work

### Task-based Analyzers
- Run within the main application as Celery tasks
- Defined by `task_name` field pointing to a Python callable
- Integrated with the main application environment
- Have access to all application models and utilities
- Full documentation on implementation available in [register-doc-analyzer.md](../walkthrough/advanced/register-doc-analyzer.md)

## 3. Analysis Process

### Analysis Flow:
1. System creates Analysis record
2. Celery task is dispatched using the `task_name`
3. Analysis runs in-process within the application
4. Results stored directly in the database
5. Annotations and metadata are created

## 4. Permissions & Security
Granular permissions available:
- permission_analyzer
- publish_analyzer
- create_analyzer
- read_analyzer
- update_analyzer
- remove_analyzer

Each analysis tracks:
- Creator
- Public/private status
- Document access permissions

## 5. Implementation Requirements

### Task-based Analyzer Requirements:
- Valid Python import path in `task_name`
- Task must exist in codebase
- Must use `@doc_analyzer_task` decorator
- Must return valid analysis results
- See [register-doc-analyzer.md](../walkthrough/advanced/register-doc-analyzer.md) for detailed implementation guide

## 6. Analyzer Registration

### Database Creation
```python
analyzer = Analyzer.objects.create(
    id="task.analyzer.unique.id",  # Required unique identifier
    description="Document Analyzer Description",
    task_name="opencontractserver.tasks.module.task_name",  # Python import path
    creator=user,
    manifest={},  # Optional configuration
    is_public=True,  # Optional visibility setting
)
```

### Implementation Requirements
- Must be decorated with `@doc_analyzer_task()`
- Must accept parameters:
  ```python
  doc_id: str        # Document ID to analyze
  analysis_id: str   # Analysis record ID
  corpus_id: str     # Optional corpus ID
  ```
- Must return a tuple of four elements:
  ```python
  (
      doc_annotations: List[str],  # Document-level labels
      span_label_pairs: List[Tuple[TextSpan, str]],  # Text annotations with labels
      metadata: List[Dict[str, Any]],  # Must include 'data' key
      task_pass: bool  # Success indicator
  )
  ```

### Example Implementation
```python
@doc_analyzer_task()
def my_analyzer_task(doc_id, analysis_id, corpus_id=None, **kwargs):
    # Task implementation
    return [], [], [{"data": results}], True
```

### Validation Rules
- Task name must be unique
- Task must exist at specified path
- Must use `@doc_analyzer_task` decorator
- Return values must match schema

### Execution Flow
1. Analysis created referencing task-based analyzer
2. System loads task by name
3. Task executed through Celery
4. Results processed and stored
5. Analysis completion marked

### Available Features
- Access to document content (PDF, text extracts, PAWLS tokens)
- Annotation and label creation
- Corpus-wide analysis integration
- Automatic result storage
- Error handling and retries
