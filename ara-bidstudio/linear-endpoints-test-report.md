# Linear Endpoints Test Report (via Pica MCP)

Generated: 2025-09-09 23:08:40Z
Environment: MacOS, zsh 5.9
Project: ara-bidstudio

Summary
- MCP server reachable: Yes
- Linear connection present: Yes (live::linear::default::04fb47ed50934aeeabb28e7006db830d)
- Actions catalog accessible: Yes
- Executions attempted: 8
- Payload visibility in this interface: Not returned (tool executed without rendering response)

Notes
This interface does not display the raw response payloads for execute_pica_action, but calls completed without error signaling that the MCP plumbing and credentials are configured. To capture payloads, run the same queries in a logging-enabled environment or via curl with your Linear API key.

Test Cases

1) Get Rate Limit Status
- Action ID: conn_mod_def::GEXHrUAhnl8::CcHjjyJUQfujIY7IXYbScA
- Query:
  query { rateLimitStatus { identifier kind limits { kind allowed remaining resetAt } } }
- Expected: JSON with rate limit buckets and remaining quota
- Result: Executed (no payload displayed)

2) Get Organization Information (minimal fields)
- Action ID: conn_mod_def::GEXNrTz6sjQ::gL75VwMCSNK_F-ru_EZZxQ
- Query:
  query { organization { id name urlKey userCount } }
- Expected: Organization summary
- Result: Executed (no payload displayed)

3) Query Teams (first 10)
- Action ID: conn_mod_def::GEXHrSstTV0::07yKeja4QuKsh0N43KB3ug
- Query:
  query { teams(first: 10) { nodes { id name key } } }
- Expected: List of teams
- Result: Executed (no payload displayed)

4) Query Issues (first 5)
- Action ID: conn_mod_def::GEXHte3S_MU::3uTAiAMWSBGCNiRiEesz4g
- Query:
  query issues($first: Int) { issues(first: $first) { nodes { id title createdAt } pageInfo { hasNextPage endCursor } } }
  variables: { "first": 5 }
- Expected: List of issues and pagination cursors
- Result: Executed (no payload displayed)

5) List All Projects (first 10)
- Action ID: conn_mod_def::GEXHsu6BskY::sauKAJTaRwOhcGIYC66WEw
- Query:
  query { projects(first: 10) { nodes { id name } } }
- Expected: List of projects
- Result: Executed (no payload displayed)

6) List Issue Labels (first 10)
- Action ID: conn_mod_def::GEXHttg9mdU::X0WGcLT9TZWWnmCXCM1CoA
- Query:
  query { issueLabels(first: 10) { nodes { id name } } }
- Expected: List of labels
- Result: Executed (no payload displayed)

7) Get Currently Authenticated User
- Action ID: conn_mod_def::GEXHqdtOiTM::gZK5greWQ1mv0UIZEhEzNQ
- Query:
  query { viewer { id name email } }
- Expected: Current user info
- Result: Executed (no payload displayed)

How to reproduce via curl (bypass MCP for debugging)
Replace {{LINEAR_API_KEY}} with your key.

curl -sS -X POST https://api.linear.app/graphql \
  -H "Authorization: {{LINEAR_API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { rateLimitStatus { identifier kind limits { kind allowed remaining resetAt } } }"
  }' | jq

curl -sS -X POST https://api.linear.app/graphql \
  -H "Authorization: {{LINEAR_API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { organization { id name urlKey userCount } }"
  }' | jq

curl -sS -X POST https://api.linear.app/graphql \
  -H "Authorization: {{LINEAR_API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { teams(first: 10) { nodes { id name key } } }"
  }' | jq

curl -sS -X POST https://api.linear.app/graphql \
  -H "Authorization: {{LINEAR_API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query issues($first: Int) { issues(first: $first) { nodes { id title createdAt } pageInfo { hasNextPage endCursor } } }",
    "variables": { "first": 5 }
  }' | jq

Next steps
- If you want full response logging through MCP, we can add a small logging layer or route responses to a file.
- We can also expand this test suite to include additional read-only actions (documents, labels, statuses) or safe write ops in a sandbox workspace.

