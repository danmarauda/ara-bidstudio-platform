# TODO: Unify Relationship Analysis and created_by_analysis Fields

**Priority:** Medium
**Effort:** Medium
**Status:** Backlog

## Background

The `Relationship` model currently has two separate fields for tracking analysis relationships, mirroring the same architectural pattern (and kludge) found in the `Annotation` model:

1. **`analysis`** (ForeignKey to Analysis) - Organizational/filtering field
   - Controls which "mode" the relationship appears in (analysis mode vs manual mode)
   - If set: relationship only appears when querying with that specific `analysis_id`
   - If NULL: relationship appears in "manual mode" (no `analysis_id` specified)

2. **`created_by_analysis`** (ForeignKey to Analysis) - Privacy/permissions field
   - Controls who can see the relationship based on analysis permissions
   - If set: relationship only visible to users with READ permission on that analysis
   - If NULL: relationship visible to anyone with doc+corpus permissions

3. **`created_by_extract`** (ForeignKey to Extract) - Privacy/permissions field
   - Controls who can see the relationship based on extract permissions
   - If set: relationship only visible to users with READ permission on that extract
   - If NULL: relationship visible to anyone with doc+corpus permissions

## The Problem

Having two separate fields for analysis tracking introduces complexity and potential security concerns (same issues as Annotations):

### 🔴 **Architectural Issues**

1. **Confusing Mental Model**: Two analysis fields serve overlapping purposes
2. **Validation Complexity**: Must maintain consistency between `analysis` and `created_by_analysis`
3. **Query Complexity**: Privacy and organizational filters must be coordinated
4. **Potential for Misuse**: Although validation prevents dangerous combinations, the model itself allows confusion
5. **Code Duplication**: Same pattern exists in both Annotation and Relationship models

### ⚠️ **Current Mitigation (Implemented - 2025-10-13)**

As of this implementation, we enforce consistency through model validation:
- If both `analysis` and `created_by_analysis` are set, they MUST match
- Valid combinations:
  - `analysis=None, created_by_analysis=None` → Public manual relationship
  - `analysis=A, created_by_analysis=A` → Analysis A's relationship (analysis mode only)
  - `analysis=None, created_by_analysis=A` → Analysis A's relationship (manual mode, but private)
- Mutual exclusivity enforced: cannot have both `created_by_analysis` AND `created_by_extract`

See: `opencontractserver/annotations/models.py` - `Relationship.clean()` method (lines 275-305)

## Current Implementation (2025-10-13)

### Fields Added
- `created_by_analysis` (ForeignKey to Analysis, null=True, on_delete=SET_NULL)
- `created_by_extract` (ForeignKey to Extract, null=True, on_delete=SET_NULL)

### Privacy Filtering
Privacy filtering implemented in `RelationshipQueryOptimizer.get_document_relationships()`:
- Queries visible analyses (public, created by user, or with explicit permissions)
- Queries visible extracts (created by user or with explicit permissions)
- Excludes non-structural relationships created by analyses/extracts user can't see
- Structural relationships always visible (if user can read document)

See: `opencontractserver/annotations/query_optimizer.py` (lines 401-450)

### Database Constraints
- Check constraint ensures mutual exclusivity of `created_by_analysis` and `created_by_extract`
- Indexes on `analysis`, `created_by_analysis`, and `created_by_extract` for performance

### Tests
Comprehensive tests added in `opencontractserver/tests/permissioning/test_query_optimizer_methods.py`:
- `test_get_document_relationships_private_analysis` - Verifies analysis privacy filtering
- `test_get_document_relationships_private_extract` - Verifies extract privacy filtering

## Proposed Solution: Option 2 - Unify the Fields

### Remove the `analysis` field entirely and use only `created_by_analysis`

```python
class Relationship(BaseOCModel):
    # Remove this field:
    # analysis = models.ForeignKey(Analysis, null=True, ...)

    # Keep only this:
    created_by_analysis = models.ForeignKey(
        Analysis,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        help_text="If set, this relationship is private to users with permission to this analysis"
    )

    # And this:
    created_by_extract = models.ForeignKey(
        Extract,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        help_text="If set, this relationship is private to users with permission to this extract"
    )
```

### Update Query Logic

In `query_optimizer.py`:

```python
if analysis_id:
    # Filter to relationships from this analysis
    qs = qs.filter(created_by_analysis_id=analysis_id)
else:
    # Filter to manual relationships only (not from any analysis)
    qs = qs.filter(created_by_analysis__isnull=True)
```

### Benefits

1. **Simpler Model**: One field per source type, one purpose each
2. **Clearer Semantics**: If it's from an analysis, you need permission. Period.
3. **Reduced Validation**: No need to enforce consistency between two analysis fields
4. **Better Performance**: One less field to index and filter
5. **Easier to Understand**: New developers immediately grasp the model
6. **Consistency**: Same pattern can be applied to Annotations (see TODO_unify_analysis_fields.md)

## Impact Assessment

### Files Likely Affected

- `opencontractserver/annotations/models.py` - Model definition
- `opencontractserver/annotations/query_optimizer.py` - Query logic (already updated with privacy filtering)
- `config/graphql/types.py` - GraphQL schema
- `config/graphql/mutations.py` - Mutation logic (line 2048 - relationship creation)
- All test files creating relationships with analysis field

### Current State (as of 2025-10-13)
- Relationships are **NOT** currently created during analysis imports
- The `import_relationships` function in `utils/importing.py` doesn't set privacy fields
- Manual relationship creation via GraphQL mutations doesn't set `created_by_*` fields
- **Future Work**: When relationship imports from analyses are added, they should set `created_by_analysis`

## References

- Implementation of Privacy Fields: See this commit (2025-10-13)
- Test coverage: `test_get_document_relationships_private_analysis`, `test_get_document_relationships_private_extract`
- Annotation equivalent: `docs/architecture/TODO_unify_analysis_fields.md`
- Privacy filtering: `opencontractserver/annotations/query_optimizer.py` (lines 401-450)

## Next Steps

1. Get stakeholder buy-in on architectural change
2. Coordinate with Annotation model unification (do both together)
3. Create detailed migration plan with rollback strategy
4. Identify all affected code paths through static analysis
5. Create feature flag for gradual rollout if needed
6. Update API documentation
7. Schedule for future sprint (post-current feature freeze)
