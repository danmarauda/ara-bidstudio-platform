from django.db import migrations


class Migration(migrations.Migration):
    atomic = False  # Required for CREATE INDEX CONCURRENTLY

    """
    Performance indexes for annotation queries.
    These indexes are designed to optimize the most common query patterns
    in the OpenContracts annotation system.
    """

    dependencies = [
        ('annotations', '0035_remove_metadata_fields'),
    ]

    operations = [
        migrations.RunSQL(
            """
            -- Non-structural, page-scoped main path
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ann_doc_corpus_page_nonstruct
            ON annotations_annotation(document_id, corpus_id, page)
            WHERE structural = false;
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_ann_doc_corpus_page_nonstruct;"
        ),
        migrations.RunSQL(
            """
            -- Non-structural, user-created (analysis_id IS NULL)
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ann_doc_corpus_page_user
            ON annotations_annotation(document_id, corpus_id, page)
            WHERE structural = false AND analysis_id IS NULL;
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_ann_doc_corpus_page_user;"
        ),
        migrations.RunSQL(
            """
            -- Non-structural, with analysis filter
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ann_doc_corpus_analysis_page
            ON annotations_annotation(document_id, corpus_id, analysis_id, page)
            WHERE structural = false AND analysis_id IS NOT NULL;
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_ann_doc_corpus_analysis_page;"
        ),
        migrations.RunSQL(
            """
            -- Structural access is usually page-scoped as well
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ann_doc_page_struct
            ON annotations_annotation(document_id, page)
            WHERE structural = true;
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_ann_doc_page_struct;"
        ),
        migrations.RunSQL(
            """
            -- Relationships
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationship_corpus_doc_struct
            ON annotations_relationship(corpus_id, document_id, structural);
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_relationship_corpus_doc_struct;"
        ),
        # Removed feedback index creation since feedback app may not be installed
        # If feedback app is installed, it should create its own indexes
    ]