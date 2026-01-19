"""
Add optimized indexes for extract-based annotation filtering.
These indexes support efficient joins between datacells and annotations.
"""

from django.db import migrations


class Migration(migrations.Migration):
    atomic = False  # Enable CONCURRENTLY for non-blocking index creation

    dependencies = [
        ("extracts", "0020_datacell_llm_call_log"),
    ]

    operations = [
        migrations.RunSQL(
            """
            -- Primary index for datacell lookups by extract and document
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_datacell_extract_document_id
            ON extracts_datacell(extract_id, document_id, id)
            WHERE extract_id IS NOT NULL;
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_datacell_extract_document_id;",
        ),
        migrations.RunSQL(
            """
            -- Forward M2M join: datacell -> annotations
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_datacell_sources_forward
            ON extracts_datacell_sources(datacell_id, annotation_id);
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_datacell_sources_forward;",
        ),
        migrations.RunSQL(
            """
            -- Reverse M2M join: annotation -> datacells (for invalidation and reverse lookups)
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_datacell_sources_reverse
            ON extracts_datacell_sources(annotation_id, datacell_id);
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_datacell_sources_reverse;",
        ),
        migrations.RunSQL(
            """
            -- Add uniqueness constraint to prevent duplicate M2M entries
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'unique_datacell_annotation'
                ) THEN
                    ALTER TABLE extracts_datacell_sources
                    ADD CONSTRAINT unique_datacell_annotation
                    UNIQUE (datacell_id, annotation_id);
                END IF;
            END $$;
            """,
            reverse_sql="ALTER TABLE extracts_datacell_sources DROP CONSTRAINT IF EXISTS unique_datacell_annotation;",
        ),
        migrations.RunSQL(
            """
            -- Index for document-only queries
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_datacell_document
            ON extracts_datacell(document_id)
            WHERE document_id IS NOT NULL;
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_datacell_document;",
        ),
    ]