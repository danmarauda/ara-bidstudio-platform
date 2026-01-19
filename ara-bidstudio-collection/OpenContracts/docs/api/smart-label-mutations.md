# Smart Label Mutations API Reference

## Overview

The Smart Label System provides two GraphQL mutations for intelligent label management with automatic labelset handling.

## Mutations

### `smartLabelSearchOrCreate`

Searches for existing labels or creates new ones, automatically handling labelset creation when needed.

#### Arguments

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `corpusId` | String | Yes | ID of the corpus |
| `searchTerm` | String | Yes | Label text to search or create |
| `labelType` | String | Yes | Type of label (SPAN_LABEL, TOKEN_LABEL, etc.) |
| `color` | String | No | Hex color for new label (default: #1a75bc) |
| `description` | String | No | Description for new label |
| `icon` | String | No | Icon identifier (default: "tag") |
| `createIfNotFound` | Boolean | No | Create label if not found (default: false) |
| `labelsetTitle` | String | No | Title for new labelset (auto-generated if not provided) |
| `labelsetDescription` | String | No | Description for new labelset |

#### Returns

```graphql
{
  ok: Boolean!
  message: String!
  labels: [AnnotationLabelType]
  labelset: LabelSetType
  labelsetCreated: Boolean!
  labelCreated: Boolean!
}
```

#### Example

```graphql
mutation {
  smartLabelSearchOrCreate(
    corpusId: "Q29ycHVzVHlwZTox"
    searchTerm: "Contract Date"
    labelType: "SPAN_LABEL"
    createIfNotFound: true
    color: "#FF5733"
  ) {
    ok
    message
    labels {
      id
      text
      color
    }
    labelsetCreated
    labelCreated
  }
}
```

### `smartLabelList`

Lists all available labels for a corpus with status information.

#### Arguments

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `corpusId` | String | Yes | ID of the corpus |
| `labelType` | String | No | Filter by label type |

#### Returns

```graphql
{
  ok: Boolean!
  message: String!
  labels: [AnnotationLabelType]
  hasLabelset: Boolean!
  canCreateLabels: Boolean!
}
```

#### Example

```graphql
mutation {
  smartLabelList(
    corpusId: "Q29ycHVzVHlwZTox"
    labelType: "TOKEN_LABEL"
  ) {
    ok
    labels {
      id
      text
      labelType
      color
    }
    hasLabelset
    canCreateLabels
  }
}
```

## Behavior

### Search Logic
- Case-insensitive partial matching
- Searches within existing labels in the corpus's labelset
- Returns all matching labels

### Creation Logic
1. **No Labelset Exists**:
   - Creates labelset with provided or auto-generated title
   - Associates labelset with corpus
   - Creates label in new labelset
   - All in single transaction

2. **Labelset Exists**:
   - Creates label in existing labelset
   - Adds appropriate permissions

### Permissions
- Requires UPDATE permission on corpus
- Automatically sets CRUD permissions for created objects
- Respects corpus-level access controls

## Error Handling

| Error | Message | Cause |
|-------|---------|-------|
| Permission Denied | "You don't have permission to update this corpus" | User lacks UPDATE permission |
| Not Found | "Corpus not found" | Invalid corpus ID |
| Invalid State | "Cannot create label: corpus has no labelset..." | Labelset required but not creatable |

## Best Practices

1. **Use `createIfNotFound` judiciously**: Only set to `true` when user explicitly wants to create
2. **Provide meaningful descriptions**: Helps other users understand label purpose
3. **Use consistent colors**: Maintain visual consistency across label types
4. **Check `hasLabelset` first**: Use `smartLabelList` to check state before creation
5. **Handle all response fields**: Check `ok`, `labelCreated`, and `labelsetCreated` for complete state
