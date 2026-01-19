# Pica Connected Platforms Action Catalogs

Generated: 2025-09-09

This index lists all currently connected Pica integrations and the corresponding action catalogs saved in this repository.

Connected platforms (16):

- google-docs → pica-actions-google-docs.md
- google-places → pica-actions-google-places.md
- clerk → pica-actions-clerk.md
- airtable → pica-actions-airtable.md
- google-calendar → pica-actions-google-calendar.md
- google-sheets → pica-actions-google-sheets.md
- gmail → pica-actions-gmail.md
- google-drive → pica-actions-google-drive.md
- github → pica-actions-github.md
- agent-ql → pica-actions-agent-ql.md
- vercel → pica-actions-vercel.md
- exa → pica-actions-exa.md
- linear → linear-actions-full.md (see also linear-actions-by-category.md)
- deck-co → pica-actions-deck-co.md
- elevenlabs → pica-actions-elevenlabs.md
- supabase → pica-actions-supabase.md

Usage
- For any platform file, copy an action_id and load docs with get_pica_action_knowledge.
- Execute via execute_pica_action with platform=<name>, connectionKey=<your key>, path="graphql" or REST path as required.

Security
- Do not echo secrets. Pica MCP injects credentials.
- Prefer read-only actions for discovery; test write actions in sandbox resources.
