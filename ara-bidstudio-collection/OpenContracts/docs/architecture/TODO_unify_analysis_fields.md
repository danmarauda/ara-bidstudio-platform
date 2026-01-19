# TODO: Unify Analysis and created_by_analysis Fields

**Priority:** Medium
**Effort:** Medium
**Status:** Backlog

## Background

The `Annotation` model currently has two separate fields for tracking analysis relationships:

1. **`analysis`** (ForeignKey to Analysis) - Organizational/filtering field
   - Controls which "mode" the annotation appears in (analysis mode vs manual mode)
   - If set: annotation only appears when querying with that specific `analysis_id`
   - If NULL: annotation appears in "manual mode" (no `analysis_id` specified)

2. **`created_by_analysis`** (ForeignKey to Analysis) - Privacy/permissions field
   - Controls who can see the annotation based on analysis permissions
   - If set: annotation only visible to users with READ permission on that analysis
   - If NULL: annotation visible to anyone with doc+corpus permissions

## The Problem

Having two separate fields introduces complexity and potential security concerns:

### 🔴 **Architectural Issues**

1. **Confusing Mental Model**: Two fields serve overlapping purposes
2. **Validation Complexity**: Must maintain consistency between fields
3. **Query Complexity**: Privacy and organizational filters must be coordinated
4. **Potential for Misuse**: Although validation prevents dangerous combinations, the model itself allows confusion

### ⚠️ **Current Mitigation (Implemented)**

As of the fix in this commit, we enforce consistency through model validation:
- If both fields are set, they MUST match
- Valid combinations:
  - `analysis=None, created_by_analysis=None` → Public manual annotation
  - `analysis=A, created_by_analysis=A` → Analysis A's annotation (analysis mode only)
  - `analysis=None, created_by_analysis=A` → Analysis A's annotation (manual mode, but private)

See: `opencontractserver/annotations/models.py` - `Annotation.clean()` method

## Proposed Solution: Option 2 - Unify the Fields

### Remove the `analysis` field entirely and use only `created_by_analysis`

```python
class Annotation(BaseOCModel):
    # Remove this field:
    # analysis = models.ForeignKey(Analysis, null=True, ...)

    # Keep only this:
    created_by_analysis = models.ForeignKey(
        Analysis,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        help_text="If set, this annotation is private to users with permission to this analysis"
    )
```

### Update Query Logic

In `query_optimizer.py`:

```python
if analysis_id:
    # Filter to annotations from this analysis
    qs = qs.filter(created_by_analysis_id=analysis_id)
else:
    # Filter to manual annotations only (not from any analysis)
    qs = qs.filter(created_by_analysis__isnull=True)
```

### Benefits

1. **Simpler Model**: One field, one purpose
2. **Clearer Semantics**: If it's from an analysis, you need permission. Period.
3. **Reduced Validation**: No need to enforce consistency between two fields
4. **Better Performance**: One less field to index and filter
5. **Easier to Understand**: New developers immediately grasp the model

### Migration Strategy

1. **Phase 1: Data Migration**
   ```python
   # For all annotations where created_by_analysis is set but analysis is not:
   # Do nothing - they're already correct

   # For all annotations where both are set (and they match):
   # Remove the analysis field value (it's redundant with created_by_analysis)
   ```

2. **Phase 2: Code Updates**
   - Update all code referencing `annotation.analysis` to use `annotation.created_by_analysis`
   - Update all filters like `.filter(analysis=X)` to `.filter(created_by_analysis=X)`
   - Search for: `analysis=`, `.analysis`, `analysis_id`, `analysis__`

3. **Phase 3: Schema Change**
   - Create Django migration to remove the `analysis` field
   - Update indexes and constraints

4. **Phase 4: Cleanup**
   - Remove validation logic for field consistency (no longer needed)
   - Update documentation

## Impact Assessment

### Files Likely Affected

- `opencontractserver/annotations/models.py` - Model definition
- `opencontractserver/annotations/query_optimizer.py` - Query logic
- `opencontractserver/graphql/types.py` - GraphQL schema
- `opencontractserver/graphql/mutations/` - Mutation logic
- `opencontractserver/utils/analyzer.py` - Analysis import logic
- All test files creating annotations with analysis field

### Breaking Changes

- **GraphQL API**: `analysis` field on `AnnotationType` would change semantics
- **Database**: Existing queries/scripts using `analysis` field would break
- **Exports**: JSON exports including `analysis` field would change structure

## Related Issues

- Privacy concern identified during test failure investigation (2025-10-12)
- Original discussion of annotation privacy model

## References

- Implementation of Option 1 (Enforce Consistency): See commit history
- Test fixes: `test_annotation_privacy.py`, `test_analysis_annotation_import.py`
- Privacy analysis discussion: See previous architectural review notes

## Next Steps

1. Get stakeholder buy-in on architectural change
2. Create detailed migration plan with rollback strategy
3. Identify all affected code paths through static analysis
4. Create feature flag for gradual rollout if needed
5. Update API documentation
6. Schedule for future sprint (post-current feature freeze)

---

**Created:** 2025-10-12
**Last Updated:** 2025-10-12
**Author:** Development Team
**Reviewers:** TBD
