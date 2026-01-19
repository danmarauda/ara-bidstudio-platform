"""
Add performance indexes for relationship queries.
Following patterns from migration 0036.
"""

from django.db import migrations


class Migration(migrations.Migration):
    atomic = False  # Required for CONCURRENTLY

    dependencies = [
        ("annotations", "0036_add_performance_indexes"),
    ]

    operations = [
        migrations.RunSQL(
            """
            -- Index for user relationships (no analysis) queries
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rel_doc_corpus_user
            ON annotations_relationship(document_id, corpus_id)
            WHERE analysis_id IS NULL AND structural = false;
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_rel_doc_corpus_user;"
        ),
        migrations.RunSQL(
            """
            -- Index for analysis-specific relationship queries
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rel_doc_corpus_analysis
            ON annotations_relationship(document_id, corpus_id, analysis_id)
            WHERE analysis_id IS NOT NULL;
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_rel_doc_corpus_analysis;"
        ),
        migrations.RunSQL(
            """
            -- Index for structural relationships
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rel_doc_structural
            ON annotations_relationship(document_id)
            WHERE structural = true;
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_rel_doc_structural;"
        ),
        migrations.RunSQL(
            """
            -- Index for permission filtering (creator + public status)
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rel_permissions
            ON annotations_relationship(creator_id, is_public, document_id);
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_rel_permissions;"
        ),
        migrations.RunSQL(
            """
            -- Index for M2M source annotations table
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rel_source_ann
            ON annotations_relationship_source_annotations(relationship_id, annotation_id);
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_rel_source_ann;"
        ),
        migrations.RunSQL(
            """
            -- Index for M2M target annotations table
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rel_target_ann
            ON annotations_relationship_target_annotations(relationship_id, annotation_id);
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_rel_target_ann;"
        ),
    ]