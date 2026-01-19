# Data Extraction Tutorial

This tutorial walks through extracting structured data from documents using OpenContracts' extraction system.

## Prerequisites

- OpenContracts instance running with Celery workers
- Documents uploaded to a corpus
- Admin or appropriate permissions for creating fieldsets

## Step 1: Create a Fieldset

A fieldset defines what data you want to extract from documents.

### Via Django Admin

1. Navigate to **Admin → Extracts → Fieldsets**
2. Click **"Add Fieldset"**
3. Enter:
   - **Name**: "Contract Terms"
   - **Description**: "Extract key terms from contracts"
4. Save

### Via GraphQL

```graphql
mutation CreateContractFieldset {
    createFieldset(
        name: "Contract Terms"
        description: "Extract key terms from contracts"
    ) {
        ok
        objId
        message
    }
}
```

## Step 2: Define Columns

Columns specify individual fields to extract.

### Example: Extract Multiple Contract Fields

Let's create columns for common contract data points:

#### Party Names Column

```graphql
mutation CreatePartiesColumn {
    createColumn(
        fieldsetId: "your-fieldset-id"
        name: "Parties"
        query: "Who are the contracting parties in this agreement?"
        outputType: "list[str]"
        mustContainText: "PARTIES"
    ) {
        ok
        objId
    }
}
```

#### Effective Date Column

```graphql
mutation CreateDateColumn {
    createColumn(
        fieldsetId: "your-fieldset-id"
        name: "Effective Date"
        query: "What is the effective date of this contract?"
        outputType: "str"
        instructions: "Format as YYYY-MM-DD"
        limitToLabel: "date-clause"
    ) {
        ok
        objId
    }
}
```

#### Payment Terms Column

```graphql
mutation CreatePaymentColumn {
    createColumn(
        fieldsetId: "your-fieldset-id"
        name: "Payment Terms"
        query: "What are the payment terms and amounts?"
        outputType: "str"
        mustContainText: "PAYMENT"
    ) {
        ok
        objId
    }
}
```

#### Termination Conditions Column

```graphql
mutation CreateTerminationColumn {
    createColumn(
        fieldsetId: "your-fieldset-id"
        name: "Termination Conditions"
        query: "Under what conditions can this contract be terminated?"
        outputType: "list[str]"
        extractIsList: true
    ) {
        ok
        objId
    }
}
```

## Step 3: Create an Extract

An extract links your fieldset to specific documents.

### Via Django Admin

1. Navigate to **Admin → Extracts → Extracts**
2. Click **"Add Extract"**
3. Configure:
   - **Name**: "Q4 Contract Analysis"
   - **Fieldset**: Select "Contract Terms"
   - **Corpus**: Select your corpus
   - **Documents**: Select documents to process
4. Save

### Via GraphQL

```graphql
mutation CreateExtract {
    createExtract(
        name: "Q4 Contract Analysis"
        fieldsetId: "your-fieldset-id"
        corpusId: "your-corpus-id"
        documentIds: ["doc1", "doc2", "doc3"]
    ) {
        ok
        objId
    }
}
```

## Step 4: Run the Extraction

Start the extraction process to populate datacells.

### Via GraphQL

```graphql
mutation RunExtraction {
    startExtract(extractId: "your-extract-id") {
        ok
        message
    }
}
```

### Via Python Script

```python
from opencontractserver.tasks.extract_orchestrator_tasks import run_extract
from opencontractserver.extracts.models import Extract

# Get the extract
extract = Extract.objects.get(id="your-extract-id")

# Start extraction
run_extract.delay(extract.id, user.id)
```

## Step 5: Monitor Progress

### Check Extract Status

```graphql
query ExtractStatus {
    extract(id: "your-extract-id") {
        name
        started
        finished
        error
        datacells {
            edges {
                node {
                    id
                    column {
                        name
                    }
                    document {
                        title
                    }
                    started
                    completed
                    failed
                }
            }
        }
    }
}
```

### Monitor via Django Admin

1. Navigate to **Admin → Extracts → Extracts**
2. Click on your extract
3. View the status fields and related datacells

## Step 6: Access Results

Once extraction completes, retrieve the structured data.

### Query All Results

```graphql
query GetExtractResults {
    extract(id: "your-extract-id") {
        datacells {
            edges {
                node {
                    document {
                        title
                    }
                    column {
                        name
                    }
                    data
                    completed
                }
            }
        }
    }
}
```

### Export to CSV

```python
import csv
from opencontractserver.extracts.models import Extract

extract = Extract.objects.get(id="your-extract-id")

with open('extract_results.csv', 'w', newline='') as csvfile:
    writer = csv.writer(csvfile)

    # Write header
    columns = extract.fieldset.columns.all()
    header = ['Document'] + [col.name for col in columns]
    writer.writerow(header)

    # Write data rows
    for document in extract.documents.all():
        row = [document.title]
        for column in columns:
            datacell = extract.extracted_datacells.filter(
                document=document,
                column=column
            ).first()
            row.append(datacell.data if datacell else '')
        writer.writerow(row)
```

## Advanced Examples

### Using Custom Output Types

Extract structured data with specific types:

```python
# Boolean extraction
column = Column.objects.create(
    fieldset=fieldset,
    name="Is Confidential",
    query="Does this contract contain confidentiality clauses?",
    output_type="bool"
)

# Integer extraction
column = Column.objects.create(
    fieldset=fieldset,
    name="Contract Value",
    query="What is the total contract value in dollars?",
    output_type="int",
    instructions="Extract numeric value only, no currency symbols"
)

# List extraction
column = Column.objects.create(
    fieldset=fieldset,
    name="Deliverables",
    query="List all deliverables mentioned in the contract",
    output_type="str",
    extract_is_list=True
)
```

### Filtering with Constraints

Use constraints to improve extraction accuracy:

```python
# Only extract from specific sections
column = Column.objects.create(
    fieldset=fieldset,
    name="Warranty Period",
    query="How long is the warranty period?",
    output_type="str",
    must_contain_text="WARRANTY",
    limit_to_label="warranty-clause"
)

# Multiple constraints
column = Column.objects.create(
    fieldset=fieldset,
    name="Arbitration Location",
    query="Where will arbitration take place?",
    output_type="str",
    must_contain_text="ARBITRATION",
    instructions="Extract city and state/country",
    limit_to_label="dispute-resolution"
)
```

### Batch Processing

Process multiple extracts efficiently:

```python
from celery import group
from opencontractserver.tasks.extract_orchestrator_tasks import run_extract

# Create multiple extracts
extracts = [
    Extract.objects.create(
        name=f"Batch {i}",
        fieldset=fieldset,
        corpus=corpus
    ) for i in range(5)
]

# Add documents to each extract
for i, extract in enumerate(extracts):
    docs = documents[i*10:(i+1)*10]  # 10 docs per extract
    extract.documents.set(docs)

# Run all extracts in parallel
job = group(
    run_extract.si(extract.id, user.id)
    for extract in extracts
)
result = job.apply_async()

# Wait for completion
result.get()
```

## Using WebSocket for Corpus Queries

For interactive exploration, use the WebSocket API:

```javascript
// Connect to corpus WebSocket
const ws = new WebSocket(`wss://your-server/ws/corpus/${corpusId}/`);

ws.onopen = () => {
    // Query about extracted data
    ws.send(JSON.stringify({
        query: "Summarize the payment terms across all contracts"
    }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'ASYNC_CONTENT') {
        console.log('Response:', data.delta);
    } else if (data.type === 'ASYNC_SOURCES') {
        console.log('Sources:', data.sources);
    }
};
```

## Troubleshooting

### Common Issues

#### Extraction Fails Immediately

Check Celery workers are running:
```bash
celery -A config worker -l info -Q celery,extract,ml
```

#### No Data Extracted

- Verify documents contain expected text
- Check `must_contain_text` constraints aren't too restrictive
- Review `limit_to_label` - ensure annotations exist with that label

#### Incorrect Data Types

Ensure `output_type` is a valid Python type:
- Primitives: `str`, `int`, `float`, `bool`
- Lists: `list[str]`, `list[int]`, etc.
- Or use `extract_is_list=True` with base type

#### Slow Extraction

- Increase Celery worker count
- Reduce `max_token_length` if context is too large
- Use more specific queries to reduce search scope

### Debugging

Enable detailed logging:

```python
# settings.py
LOGGING = {
    'loggers': {
        'opencontractserver.tasks': {
            'level': 'DEBUG',
        },
    },
}
```

Check datacell errors:
```python
failed_cells = Datacell.objects.filter(
    extract=extract,
    failed__isnull=False
)
for cell in failed_cells:
    print(f"Column: {cell.column.name}")
    print(f"Document: {cell.document.title}")
    print(f"Error: {cell.stacktrace}")
```

## Best Practices

1. **Start Small**: Test with a few documents before processing entire corpus
2. **Iterate on Queries**: Refine column queries based on initial results
3. **Use Constraints**: Apply `must_contain_text` and `limit_to_label` for accuracy
4. **Monitor Progress**: Check extraction status regularly
5. **Handle Failures**: Implement retry logic for failed datacells
6. **Validate Results**: Spot-check extracted data for accuracy
7. **Export Regularly**: Save results to avoid data loss

## Next Steps

- Learn about [Vector Store Architecture](../../extract_and_retrieval/vector_stores.md)
- Explore [Corpus Queries](../../extract_and_retrieval/corpus_queries.md)
- Review [API Reference](../../extract_and_retrieval/api_reference.md)
