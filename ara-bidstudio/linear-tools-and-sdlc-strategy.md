# Linear Capabilities Catalog (via Pica MCP) and SDLC Strategy

Generated: 2025-09-09
Scope: What you can automate in Linear using the Pica MCP server, grouped by capability, with SDLC-aligned usage patterns and example requests.

Note on execution
- All examples are executed through Pica MCP (execute_pica_action) with platform "linear" and your connectionKey (live::linear::default::...), not directly against Linear.
- For any action below, fetch the detailed spec first using get_pica_action_knowledge with its action_id.

Legend
- action_id shown as conn_mod_def::<...> (copy/paste into get_pica_action_knowledge / execute endpoints)
- All operations are GraphQL POST to path: "graphql" via Pica passthrough

------------------------------------------------------------

1) Issues (Core Work Items)
Key actions
- Create Issue: conn_mod_def::GEXH2lmAlmQ::xZpKtSjkQQqQ2hd3hzydhQ
- Update Issue: conn_mod_def::GEXH1sI62Sg::W3JjpxCIT9OkX_9gxfRR0w
- Get Specific Issue: conn_mod_def::GEXHtcTK9Ws::PKAz_mwmSKWWtUIJVqZ5KA
- Query Issues: conn_mod_def::GEXHte3S_MU::3uTAiAMWSBGCNiRiEesz4g
- Search Issues: conn_mod_def::GEXHrkpLoio::IVjdtjMFS2i_L-axg07iuQ
- Create Multiple Issues (Batch): conn_mod_def::GEXH0_2vqCE::PjPdM71gRU6MXor2oQZuWA
- Archive/Unarchive Issue: conn_mod_def::GEXH0-ELAbQ::HFrmmXsYRYOU1XxyWhiZZQ / conn_mod_def::GEXH1AWfzf4::nFfIKaOxTkaffPkDdeD6eg
- Add/Remove Label: conn_mod_def::GEXH1MQ0GB4::H3lF-4L1RU-OtJojlSGsQQ / conn_mod_def::GEXMYSxw4oI::Oq_9RMM4Tw2cEmWRvfrlJA
- Update Issue Summary/Description: conn_mod_def::GEXH1irmEJA::FvR8WBZFS_elP6Leo9sc5g / conn_mod_def::GEXH1aer6cY::rgfSVOq3Qfaoz-5rmoWodQ
- Issue Relations: create/update/delete: conn_mod_def::GEXH1qVabHg::DFFULe-sS1mGkhhKsXkAog, conn_mod_def::GEXMVQeCJQE::pMd6RnTHTTKPXLGCxQfJSA, conn_mod_def::GEXH11kED18::ybaL2AzrTh2MLJXfIhsfZA
- Subscribe/Unsubscribe User: conn_mod_def::GEXH1f_POf0::PB2o_CB4QdehWhsmLcsy6A / conn_mod_def::GEXMWyF9SOQ::VuHxy3v_T8GmxDPYFqTlEw

Labels & metadata
- List Labels: conn_mod_def::GEXHttg9mdU::X0WGcLT9TZWWnmCXCM1CoA
- Create/Update/Delete Label: conn_mod_def::GEXH18ov1Lk::aP1Sbt4HTh2XlZMR4kylRw, conn_mod_def::GEXH129-h7k::ZqZAeXBBSa2NottLmPLmSA, conn_mod_def::GEXH2D99SXI::SQu1VEhxQTONDGBLFpA8ZA

Attachments & comments
- Create/Update/Delete Attachment: conn_mod_def::GEXH8vfxU0Y::u_EComa-QVyP391Cdb4Ibw, conn_mod_def::GEXH846b5Jk::Kz20ytPTQcmtUyCYBoT9fg, conn_mod_def::GEXH86NUx5g::uR935ajBS3eM2Ej8sg1JtA
- Create/Update/Delete Comment: conn_mod_def::GEXH7wLPozs::Z--wzh9rRdKp839LB11Prw, conn_mod_def::GEXIjyHMx_4::taZ1HP_lSE2LsXX9xxNj_Q, conn_mod_def::GEXH7kvHHrE::STBPF-P5R--RJtr5KJSZig

SDLC usage
- Backlog intake (batch create, labeling by domain/priority)
- Sprint grooming (update summary/description, relations, estimates)
- Dev & QA flow (subscribe/assign users, comment/attachments)
- Release gate (archive completed items, link PRs)

------------------------------------------------------------

2) Projects & Project Updates
Key actions
- Create Project: conn_mod_def::GEXHzOMMChg::rtNPEDYkTOK8I4d02Ub2pw
- List Projects: conn_mod_def::GEXHsu6BskY::sauKAJTaRwOhcGIYC66WEw
- Get Project: conn_mod_def::GEXHsG05AP0::Rn1SgX8yToOwgUvxcap1yQ
- Update Project: (project fields managed via various update actions—see get_pica_platform_actions)
- Project Status & Relations: create/update/delete: conn_mod_def::GEXHy5GYveo::BCRHi8KYTJqYOa8oKUJ0IA, conn_mod_def::GEXHz46U0nk::ubLVmk0xRyGwAmTYHos_PQ, conn_mod_def::GEXHzQCnGMI::WX2H0tZ4R6e9etkltDUO_Q
- Project Updates (weekly status): create/update/archive/unarchive/reminder: conn_mod_def::GEXHyy1crls::oyRPMYjOR4ObS9mDmgEqAQ, conn_mod_def::GEXHy2oCBwE::Z7Z_WRnGTNGXguoNvoujEw, conn_mod_def::GEXHyaKyrFc::rQvFxk5OTZ-VyYAhzhag0w, conn_mod_def::GEXHysd95cM::x_D0QEEgQtufkDEi7xA7-A, conn_mod_def::GEXHy4aUdKA::9rGSDRD9STuxRtUqC3iT4w
- Milestones: create/update/delete/move: conn_mod_def::GEXHzfrslEU::qP_g5XpRQjWXsQcw2k-BFg, conn_mod_def::GEXHzi873uQ::P16tMKNYSHC_EjBT4zuK5A, conn_mod_def::GEXHzvG4IA4::_YrEX7gATSqw_yPKvk9s8Q, conn_mod_def::GEXHz7gnOSU::pYb0CP1tTDmyk0sG6cQH8w

SDLC usage
- Product planning (create project, define milestones)
- Weekly status (automate project updates/reminders)
- Portfolio reporting (statuses, health, relations)

------------------------------------------------------------

3) Teams, Memberships & Users
Key actions
- Query Teams: conn_mod_def::GEXHrSstTV0::07yKeja4QuKsh0N43KB3ug
- Create/Update Team: conn_mod_def::GEXHySiyuj0::pKswoQ0oQZWojHv2V58-tg, conn_mod_def::GEXHzTIgTyQ::8tJOYggwRR2_FNW7gGIKPQ
- Team Membership: create/update/delete: conn_mod_def::GEXHyH72B8A::8wmcs0UTQn67xfTXXVAJ0g, conn_mod_def::GEXHx5EYofM::dGzujWSlSgeC3pBWBEEYZw, conn_mod_def::GEXHx9U2aBs::w4mC7VbPSVewnc__UhnvbA
- Users: get viewer, update user/settings/flags: conn_mod_def::GEXHqdtOiTM::gZK5greWQ1mv0UIZEhEzNQ, conn_mod_def::GEXM6Zm8Cp8::Kx5VX30TTSqLw1Kojm5OFg, conn_mod_def::GEXM7otpVow::Qk2wLwDSTsmtc-_vtIQdvw, conn_mod_def::GEXHwbD3SS8::OEu38O7HRbGPT4WckdmvQw

SDLC usage
- Access management (team membership automation)
- Personalization (user settings/flags per environment)

------------------------------------------------------------

4) Workflows & Cycles
Key actions
- List workflow states / update state: conn_mod_def::GEXHq20TgSo::K9ng5U2lRKSuCil_Lt9EOQ, conn_mod_def::GEXHwZUI2X8::ThpMZTd9RfWCHkHjUx-caw
- Create/Archive workflow state: conn_mod_def::GEXHwPJ3SOs::sMGxKhReQ-auJzOqXRS1Iw, conn_mod_def::GEXHwQrL860::ywJLkCaFR-24qUCS04kwmg
- Cycles: query/create/archive/shift/start-today: conn_mod_def::GEXHvIeoVfE::mLWKELF4QfCPuGZiTzRxbQ, conn_mod_def::GEXH6iJVdjM::HzCyryaXRMS5r-TESOVvtg, conn_mod_def::GEXH6ksewHc::oEhkel8dR3KVAdsrbnVtQw, conn_mod_def::GEXH6_YAEmA::TAJ7tQ-nSoKNvSxBk1WncQ, conn_mod_def::GEXH6iNvti8::qS5N2HrVTuWg6j3Ogp4Vtw

SDLC usage
- Sprint automation (create/shift cycles, start today)
- State hygiene (auto-transition rules/QA gates)

------------------------------------------------------------

5) Notifications & Subscriptions
Key actions
- Fetch/Archive/Snooze/Unread notifications: conn_mod_def::GEXHte4HYRw::TF1KTOX-T8akTbl6xUpCsQ, conn_mod_def::GEXH0qiAJCQ::tjWHNdJjQp-H77QVfj8iAw, conn_mod_def::GEXH0___icM::Caal2x_GSauEYDVtnIV_WA, conn_mod_def::GEXH0uvdF18::LIZVSiOzT8-G4v2t2Qjv-Q
- Subscription management: create/update/delete: conn_mod_def::GEXH0lqZXqs::ZEPabpxMRNuHHyo_9o2jlA, conn_mod_def::GEXH0YVporM::2pIJWGUjTh6Kr1iLdUvKbQ, conn_mod_def::GEXH0YZpN9w::oIr0H6jsTgSm0KRl5EWMsQ

SDLC usage
- Focus signals (actionable digests by team/role)
- Quiet hours during releases (snooze windows)

------------------------------------------------------------

6) Integrations & Git Automation
Key actions
- Git Automation: create/update/archive: conn_mod_def::GEXH5bpjh_Q::ayFEb5OEThG_ba6Czo8nDQ, conn_mod_def::GEXH5XaVxHw::d-PksR7MTFitb1cbX_rcKw, conn_mod_def::GEXH5Zkw8Z0::hATpqgoOQI-NNOTSSnit2w, conn_mod_def::GEXH5p_mfvU::UQkiRO-tSiaez2TVZNo2Mw, conn_mod_def::GEXH5SrMMqA::tBz7ovxBTQKZezCofDPimQ
- GitHub/GitLab linking: PR/MR/Issue linkage: conn_mod_def::GEXH80_KT7c::dbsbBPRMQhK-QEWSdl2UUQ, conn_mod_def::GEXH85Ozy08::F7S92tkkTu2RsdGCiQxRqg, conn_mod_def::GEXH8mj7qAk::Al_wYITWSRunoEQDrUU9EQ
- Slack/Discord/Sentry/Intercom/PagerDuty/Jira connectors: multiple actions for connect/update/scope

SDLC usage
- Auto-link branches/PRs to issues
- Post build/release notifications to Slack
- Create bugs from Sentry or support tools

------------------------------------------------------------

7) Roadmaps, Initiatives, Customers (Advanced)
Key actions
- Roadmaps: create/update/archive/list: conn_mod_def::GEXHypsvmrE::dvIpkEtYSBuaaAjuuF7IZA, conn_mod_def::GEXHyFjXWt4::hbl30wbwQPqAzwhSpRHPxQ, conn_mod_def::GEXHrVBjhLQ::9hpu6-SITim5FuQWFlI7lA
- Initiatives and relations: create/update/delete/join/query: see actions starting with GEXH5M4G07E, GEXH4uLbcpo, GEXH5JTULmo, GEXH5ClsdMc, GEXH4rdlLwE
- Customers/Needs (Linear Insights): upsert/create/update/delete/tiers/statuses: see actions GEXH7ChKpFE, GEXH7cC6iFY, GEXH6727070, GEXHv0ZjP-0, GEXHvL22p8s

SDLC usage
- Quarterly planning (roadmaps/initiatives)
- Customer-driven prioritization (needs & counts)
- Exec reporting (rollups by initiative)

------------------------------------------------------------

8) Templates, Views & Documents
Key actions
- Templates: create/update/delete/list: GEXHxi6iMBw, GEXHxmLZPo8, GEXHxY06Xa4, GEXHqv2ey_Y
- Custom Views: create/update/delete/check subscribers: GEXH7gI0iZA, GEXH7ej8jLk, GEXH7e-SGBg, GEXHvJYFuao
- Documents: list/get/update/delete (trash)/unarchive: GEXHu8ICBUA, GEXHueMeroM, GEXH7MLHFLw, GEXH6KCtG9g, GEXH6RvjwxY

SDLC usage
- Consistent issue/project templates
- Team dashboards (custom views)
- Playbooks and runbooks in documents

------------------------------------------------------------

9) Organization & Security
Key actions
- Get Organization Information: GEXNrTz6sjQ::gL75VwMCSNK_F-ru_EZZxQ
- Invites & domains: create/update/delete/resend/verify: GEXHz1B9Y24, GEXHz3XGRbk, GEXH0FOsVUY, GEXHz3IbXZw, GEXMbQbYm9g, GEXH0RuaZZo
- User auth sessions & API keys: list/create/delete: GEXHvSi1nxU, GEXHwSro5NY, GEXH9RklgHI, GEXH83CVtk8
- Rate limits: GEXHrUAhnl8::CcHjjyJUQfujIY7IXYbScA

SDLC usage
- Onboarding/offboarding automation
- API key rotation and least-privilege workflows
- Rate-limit aware bulk operations

------------------------------------------------------------

SDLC Strategy (How to use Linear + Pica MCP effectively)

Backlog & Intake
- Use batch issue creation with labels/priority pre-set.
- Auto-route incoming bugs (from Sentry/Support) to specific teams via label+team rules.

Planning & Grooming
- Create projects per epic/initiative and attach milestones.
- Apply templates to standardize acceptance criteria.
- Use custom views for domain slices (backend/frontend/infra).

Execution (Dev & QA)
- Auto-link branches/PRs to issues; transition states on PR merge.
- Enforce required fields via bots before moving to QA/Done.
- Subscribe stakeholders automatically to key issues.

Releases
- Use project updates reminders weekly; push summaries to Slack.
- Tag release issues and archive upon completion.
- Generate CSV exports for audits.

Operations & Metrics
- Query issues/projects to build dashboards (burn-downs, throughput).
- Monitor rate limits to schedule heavy jobs off-peak.

Security & Compliance
- Automate membership changes when people move teams.
- Rotate API keys periodically; log all MCP calls.

------------------------------------------------------------

Pica MCP Usage Patterns (Examples)

1) Discover actions for Linear
- Tool: get_pica_platform_actions { platform: "linear" }

2) Read action documentation
- Tool: get_pica_action_knowledge
  - { action_id: "conn_mod_def::GEXH2lmAlmQ::xZpKtSjkQQqQ2hd3hzydhQ", platform: "linear" }

3) Execute an action (create issue)
- Tool: execute_pica_action
- Params:
  {
    "platform": "linear",
    "connectionKey": "live::linear::default::...",
    "action": { "_id": "conn_mod_def::GEXH2lmAlmQ::xZpKtSjkQQqQ2hd3hzydhQ", "method": "POST", "path": "graphql" },
    "data": {
      "query": "mutation issueCreate($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id title } } }",
      "variables": {
        "input": {
          "teamId": "<TEAM_ID>",
          "title": "Fix auth redirect loop",
          "description": "Steps to reproduce...",
          "priority": 2
        }
      }
    }
  }

4) Execute a read-only query (teams)
- Action id: conn_mod_def::GEXHrSstTV0::07yKeja4QuKsh0N43KB3ug
- Data:
  { "query": "query { teams(first: 20) { nodes { id name key } } }" }

Security notes
- Never log or echo secrets. Pica MCP uses environment-injected credentials.
- Prefer read-only queries for discovery. For writes, use sandbox teams first.
- Respect rate limits (rateLimitStatus) when batching.

------------------------------------------------------------

Appendix: Quick Reference of Frequently Used Action IDs
- Create Issue: GEXH2lmAlmQ::xZpKtSjkQQqQ2hd3hzydhQ
- Query Issues: GEXHte3S_MU::3uTAiAMWSBGCNiRiEesz4g
- Create Project: GEXHzOMMChg::rtNPEDYkTOK8I4d02Ub2pw
- List Projects: GEXHsu6BskY::sauKAJTaRwOhcGIYC66WEw
- Query Teams: GEXHrSstTV0::07yKeja4QuKsh0N43KB3ug
- List Labels: GEXHttg9mdU::X0WGcLT9TZWWnmCXCM1CoA
- Rate Limit Status: GEXHrUAhnl8::CcHjjyJUQfujIY7IXYbScA
- Viewer: GEXHqdtOiTM::gZK5greWQ1mv0UIZEhEzNQ
- Organization: GEXNrTz6sjQ::gL75VwMCSNK_F-ru_EZZxQ

