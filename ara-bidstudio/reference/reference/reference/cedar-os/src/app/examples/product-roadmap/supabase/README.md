# Product Roadmap Database Setup

## Running Migrations

To enable soft delete functionality, you need to run the migration that adds the `deleted` column to the `nodes` table.

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `migrations/add_deleted_column.sql`
4. Click "Run" to execute the migration

### Option 2: Using Supabase CLI

```bash
supabase db push migrations/add_deleted_column.sql
```

## What the Migration Does

1. **Adds `deleted` column**: Adds a boolean `deleted` column to the `nodes` table with a default value of `false`
2. **Creates an index**: Adds an index on the `deleted` column for better query performance
3. **Creates a view**: Creates an `active_nodes` view that only shows non-deleted nodes
4. **Creates a function**: Adds a `get_active_edges()` function that returns edges connecting only non-deleted nodes

## How Soft Delete Works

- When a node is deleted through the UI, it's marked as `deleted = true` in the database
- The `getNodes()` function only fetches nodes where `deleted = false`
- The `getEdges()` function filters out edges connected to deleted nodes
- This preserves data integrity while hiding deleted content from users

## Restoring Deleted Nodes

To restore a deleted node, you can run:

```sql
UPDATE nodes SET deleted = false WHERE id = 'node-id-here';
```
