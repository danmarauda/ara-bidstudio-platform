# OpenContracts Annotation & Relationship Performance Optimization Guide

## Summary

The OpenContracts `GetDocumentKnowledgeAndAnnotations` query suffers from (not unexpected) performance issues (10-30+ seconds) due to loading ALL annotations and relationships for a corpus. This documents the **implemented optimizations**:

1. **Database Optimization**: Strategic indexes and materialized views (migrations 0036-0039)
2. **Query Optimization**: Eliminating N+1 queries with proper prefetching via `AnnotationQueryOptimizer` and `RelationshipQueryOptimizer`

---

## Current Performance Analysis

### Database Indexes

The annotation and relationship models have comprehensive indexing including:

**Annotation Indexes (migration 0036):**
- Basic field indexes (page, document, corpus, creator, etc.)
- Composite indexes for common query patterns:
  - `idx_ann_doc_corpus_page_nonstruct` - Non-structural page queries
  - `idx_ann_doc_corpus_page_user` - User annotations (no analysis)
  - `idx_ann_doc_corpus_analysis_page` - Analysis-specific annotations
  - `idx_ann_doc_page_struct` - Structural annotations
  - `idx_relationship_corpus_doc_struct` - Relationship queries

**Relationship Indexes (migration 0038):**
- `idx_rel_doc_corpus_user` - User relationships (no analysis) queries
- `idx_rel_doc_corpus_analysis` - Analysis-specific relationship queries
- `idx_rel_doc_structural` - Structural relationships
- `idx_rel_permissions` - Permission filtering (creator + public status)
- `idx_rel_source_ann` - M2M source annotations table
- `idx_rel_target_ann` - M2M target annotations table

---

### No Permission Annotations for Relationships or Annotations  

Annotation or Relationship counts can be quite large and annotating each and every one introduces massive performance penalties. For this reason, we've removed obj-level permissions for these objs. If you need to permission speicifc groups of annotations or relationships in a corpus - e.g. a private set of Corpus annotations - the most obvious way to achieve this atm would be to create them via an Analysis which can be permissioned and layered on top of a Corpus. This could easily be adapted into something that could be created by human users and permissioned separately, though it was originally designed for machine-created annotations.