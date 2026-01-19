-- Omn1-ACE Database Schema
-- PostgreSQL multi-tenant database for cloud deployment

-- ============================================================================
-- Users & Authentication
-- ============================================================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    api_key_hash VARCHAR(64) UNIQUE NOT NULL,  -- SHA256 hash
    tier VARCHAR(20) NOT NULL DEFAULT 'free',  -- 'free', 'pro', 'team'
    team_id UUID,  -- NULL for free/pro, set for team tier
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,  -- NULL = never expires
    last_activity TIMESTAMP,

    CONSTRAINT valid_tier CHECK (tier IN ('free', 'pro', 'team', 'admin'))
);

CREATE INDEX idx_users_api_key ON users(api_key_hash);
CREATE INDEX idx_users_team ON users(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_users_tier ON users(tier);

-- ============================================================================
-- Teams (for team tier)
-- ============================================================================

CREATE TABLE teams (
    team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name VARCHAR(255) NOT NULL,
    owner_user_id UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    member_limit INT NOT NULL DEFAULT 10,

    -- Team settings
    shared_cache_enabled BOOLEAN DEFAULT TRUE,
    collective_learning_enabled BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_teams_owner ON teams(owner_user_id);

-- ============================================================================
-- Usage Tracking (for rate limiting and billing)
-- ============================================================================

CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    operation_type VARCHAR(50) NOT NULL,  -- 'embed', 'search', 'predict'
    tokens_used INT NOT NULL DEFAULT 0,
    tokens_saved INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Performance metrics
    response_time_ms FLOAT,
    cache_hit BOOLEAN DEFAULT FALSE,
    cache_tier VARCHAR(10),  -- 'L1', 'L2', 'L3'

    -- Context
    file_path VARCHAR(512),
    team_benefit BOOLEAN DEFAULT FALSE  -- Did this help team?
);

CREATE INDEX idx_usage_user_date ON usage_logs(user_id, DATE(created_at));
CREATE INDEX idx_usage_created ON usage_logs(created_at DESC);
CREATE INDEX idx_usage_team_benefit ON usage_logs(team_benefit) WHERE team_benefit = TRUE;

-- ============================================================================
-- Embeddings (embedding-first storage)
-- ============================================================================

CREATE TABLE embeddings (
    embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path VARCHAR(512) NOT NULL,
    content_hash VARCHAR(64) NOT NULL,  -- SHA256 of content

    -- Embedding data
    embedding VECTOR(768),  -- pgvector extension

    -- Metadata (NOT full content!)
    structure JSONB,  -- {classes: [...], functions: [...], imports: [...]}
    facts JSONB,  -- Extracted facts for structural search

    -- Token metrics
    tokens_original INT NOT NULL,
    tokens_compressed INT NOT NULL,

    -- Ownership
    created_by_user_id UUID NOT NULL REFERENCES users(user_id),
    team_id UUID REFERENCES teams(team_id),  -- NULL = personal, set = team-shared

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_accessed TIMESTAMP NOT NULL DEFAULT NOW(),
    access_count INT DEFAULT 0,

    UNIQUE(file_path, content_hash)  -- Same file version = one embedding
);

CREATE INDEX idx_embeddings_file ON embeddings(file_path);
CREATE INDEX idx_embeddings_hash ON embeddings(content_hash);
CREATE INDEX idx_embeddings_team ON embeddings(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops);

-- ============================================================================
-- Predictions (track prediction accuracy)
-- ============================================================================

CREATE TABLE predictions (
    prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    -- Prediction details
    current_file VARCHAR(512) NOT NULL,
    predicted_file VARCHAR(512) NOT NULL,
    confidence FLOAT NOT NULL,
    strategy VARCHAR(50) NOT NULL,  -- 'session_history', 'import_graph', etc.

    -- Outcome (NULL = pending, TRUE = used, FALSE = not used)
    was_used BOOLEAN,
    time_to_use_seconds INT,  -- How long until user accessed predicted file

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_accuracy ON predictions(was_used) WHERE was_used IS NOT NULL;
CREATE INDEX idx_predictions_strategy ON predictions(strategy);

-- ============================================================================
-- Team Patterns (collective learning - UNIQUE TO US)
-- ============================================================================

CREATE TABLE team_patterns (
    pattern_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,

    -- Pattern data
    file1 VARCHAR(512) NOT NULL,
    file2 VARCHAR(512) NOT NULL,
    cooccurrence_count INT NOT NULL DEFAULT 1,
    avg_time_gap_seconds INT,  -- Average time between accessing file1 and file2

    -- Success metrics
    success_rate FLOAT,  -- % of times pattern was useful

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_observed TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(team_id, file1, file2)
);

CREATE INDEX idx_team_patterns_team ON team_patterns(team_id);
CREATE INDEX idx_team_patterns_success ON team_patterns(success_rate DESC);

-- ============================================================================
-- Workflow Patterns (from omnimemory-procedural)
-- ============================================================================

CREATE TABLE workflow_patterns (
    pattern_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(team_id) ON DELETE CASCADE,

    -- Pattern sequence
    command_sequence JSONB NOT NULL,  -- ["open:auth.py", "edit:user.py", "test:run"]

    -- Success metrics
    success_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,
    confidence FLOAT GENERATED ALWAYS AS (
        CASE WHEN success_count + failure_count > 0
        THEN success_count::FLOAT / (success_count + failure_count)
        ELSE 0.0 END
    ) STORED,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflow_user ON workflow_patterns(user_id);
CREATE INDEX idx_workflow_team ON workflow_patterns(team_id);
CREATE INDEX idx_workflow_confidence ON workflow_patterns(confidence DESC);

-- ============================================================================
-- Competitive Benchmarks (track our dominance)
-- ============================================================================

CREATE TABLE benchmark_results (
    benchmark_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor VARCHAR(50) NOT NULL,  -- 'supermemory', 'openmemory', 'mem0', 'zep'

    -- Metrics
    metric_name VARCHAR(50) NOT NULL,  -- 'response_time', 'throughput', 'cost'
    omn1_value FLOAT NOT NULL,
    competitor_value FLOAT NOT NULL,
    advantage_factor FLOAT GENERATED ALWAYS AS (competitor_value / NULLIF(omn1_value, 0)) STORED,

    -- Benchmark details
    test_scenario VARCHAR(255),
    sample_size INT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_benchmarks_competitor ON benchmark_results(competitor);
CREATE INDEX idx_benchmarks_advantage ON benchmark_results(advantage_factor DESC);

-- ============================================================================
-- Views for Analytics
-- ============================================================================

-- Team savings summary
CREATE VIEW team_savings_summary AS
SELECT
    t.team_id,
    t.team_name,
    COUNT(DISTINCT ul.user_id) as active_members,
    SUM(ul.tokens_saved) as total_tokens_saved,
    SUM(ul.tokens_saved) * 0.000015 as cost_saved_usd,
    AVG(CASE WHEN ul.cache_hit THEN 1.0 ELSE 0.0 END) as cache_hit_rate
FROM teams t
JOIN users u ON u.team_id = t.team_id
JOIN usage_logs ul ON ul.user_id = u.user_id
WHERE ul.created_at > NOW() - INTERVAL '30 days'
GROUP BY t.team_id, t.team_name;

-- User efficiency summary
CREATE VIEW user_efficiency_summary AS
SELECT
    u.user_id,
    u.email,
    u.tier,
    COUNT(*) as operations,
    SUM(ul.tokens_saved) as tokens_saved,
    SUM(ul.tokens_saved) * 0.000015 as cost_saved_usd,
    AVG(ul.response_time_ms) as avg_response_ms
FROM users u
JOIN usage_logs ul ON ul.user_id = u.user_id
WHERE ul.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.user_id, u.email, u.tier;

-- Prediction accuracy by strategy
CREATE VIEW prediction_accuracy AS
SELECT
    strategy,
    COUNT(*) as total_predictions,
    SUM(CASE WHEN was_used THEN 1 ELSE 0 END) as successful,
    AVG(CASE WHEN was_used THEN 1.0 ELSE 0.0 END) as accuracy,
    AVG(time_to_use_seconds) FILTER (WHERE was_used) as avg_time_to_use
FROM predictions
WHERE was_used IS NOT NULL
GROUP BY strategy
ORDER BY accuracy DESC;
