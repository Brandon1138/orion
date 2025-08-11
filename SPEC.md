## Orion Agent — Agent‑First SPEC (Consolidated)

This document replaces prior planner‑first specs. Orion is an agentic assistant that completes digital tasks end‑to‑end. Planning is a capability the agent uses when helpful, not the product itself.

### Vision and principles

- Help users complete work through conversation: understand intent, choose tools, act safely, and report results.
- Agent‑first loop: Perceive → Understand → Plan (when helpful) → Act → Reflect → Learn
- Safety by design: scopes, approvals, redaction, audit
- Tooling via MCP and native SDKs with uniform schemas and policies
- Cost control: `gpt-5-nano` by default; escalate selectively

## Architecture overview

### Runtime flow

1. Perceive: normalize input, session state, environment, recent history
2. Understand: classify intent + required capabilities, assess risk
3. Plan (optional): build a small ActionGraph when multi‑step or ambiguous
4. Act: execute actions via MCP/SDK tools with approvals; stream progress
5. Reflect: summarize results, produce artifacts, propose next steps
6. Learn: update short‑term memory; optionally write long‑term notes

### Core components (to add/extend in `@orion/core`)

- ToolRegistry: discover MCP servers + register native SDK tools; expose JSON schemas and `policy_tag`s
- IntentRouter: rule + LLM classifier for intent, capability selection, and when to invoke planning
- ActionEngine: execute ActionGraph with retries, approvals, streaming logs, and reflection checks
- MemoryStore: short‑term session buffer; optional long‑term KV/vector later
- PolicyEngine: allow/deny by tool scope, argument validators, rate limits, risk tiers
- Telemetry/Audit: structured events for intent, plan, tool calls, approvals, and costs

### Existing packages leveraged

- `@orion/planner-llm`: planning/scheduling skill with schema‑validated outputs and model‑aware temperature handling
- `@orion/task-parser`: Google Tasks utilities; expand to other sources later
- CLI: primary UX entry point; unify around `orion chat` with previews and approvals

## Data model

- Task: id, title, status, due, context, evidence, actions, result, owner
- Action: toolCall { name, args, expected_output, policy_tag }, result | error, timestamps, tokens, cost
- ActionGraph: nodes = Action[], edges = dependencies (generated when complexity > 1 step)

## Tools and MCP

- Discover MCP servers from config; hot‑register tools at startup
- Wrap native SDKs (calendar/email/github/notion/linear/web) as uniform tools
- Each tool advertises a JSON schema and `policy_tag` like `low:fs.read`, `med:web.fetch`, `high:email.send`

## Safety and approvals

- PolicyEngine gates by scope and args; approvals required for medium/high risk
- `--dry-run` shows ActionGraph and requested approvals; `--approve-low` fast‑path
- Reflection checks output post‑conditions before writes
- Redaction middleware scrubs secrets from logs and responses

## Models and cost controls

- Default model: `gpt-5-nano` for routing, light reasoning, and tool use (temperature omitted for this model)
- Escalation policy: upgrade only for long‑form reasoning or complex drafting; log justification in audit
- Track tokens/cost per action; warn on budget thresholds

## CLI UX (Windows‑friendly)

- Primary: `orion chat [--dry-run] [--approve-low] [--verbose]`
- Planner remains available: `orion plan`, `orion task-plan`
- Status and debug: `orion status`, `orion debug --actions|--session|--conversation`

## Configuration (`orion.config.json`)

- agents: { plannerModel: 'gpt-5-nano', plannerTemperature?: number, fallbackModel, codexEnabled }
- tools: MCP server list, allow/deny globs, command policy
- policies: approval defaults, risk tiers, rate limits
- audit: path, hashing, retention
- memory: shortTerm caps; longTerm off by default

## Actionable roadmap

### Sprint 1 — Agent skeleton and tool discovery (1–2 weeks)

Deliverables

- ToolRegistry with MCP discovery + local tool adapter
- IntentRouter v1 (rule + LLM) using `gpt-5-nano`
- ActionEngine v1: linear list execution, approvals, logs
- CLI `--dry-run` preview and streaming outputs

Steps

1. Create `ToolRegistry` and `ActionEngine` in `@orion/core`
2. Load MCP servers from config; expose `fs.read`, `fs.list`, `fs.search`; add `web.fetch` native tool
3. Implement approvals: `auto` for low, `ask` for med/high; write audit events
4. Wire `orion chat` to IntentRouter → ActionEngine; show action preview before run

Acceptance

- “Summarize top 3 from my tasks” previews file/task reads and summary action, executes successfully, emits audit

### Sprint 2 — Planning as a capability (1–2 weeks)

Deliverables

- Integrate `@orion/planner-llm` when scheduling/multi‑step is detected
- Micro‑plan mode for short action lists (no calendar)
- CLI `--approve-low` approval fast‑path

Steps

1. Add IntentRouter rule to trigger PlannerLLM on scheduling language
2. Convert TaskPlan → ActionGraph; allow partial execution after preview
3. Add debug views for action graph and last tool calls

Acceptance

- “Plan my week from Google Tasks” produces TaskPlan, previews calendar actions, and runs on approval

### Sprint 3 — Connectors that unlock real work (2 weeks)

Deliverables

- Calendar read/write (Google/MS Graph) with scoped approvals
- GitHub: create issue/comment; search PRs
- Notion/Linear: create/update task

Steps

1. Wrap SDKs as tools with JSON schemas and validators
2. Add test fixtures and end‑to‑end demos
3. Expand audit with connector metadata and per‑action cost

Acceptance

- “Create a bug ticket from this log and schedule 90 min tomorrow” drafts ticket, creates on approval, and adds event

### Sprint 4 — Memory, reflection, and quality (1–2 weeks)

Deliverables

- Short‑term memory store with pruning; optional long‑term KV
- Reflection checks before writes; retries with backoff
- Better status/debug surfaces

Steps

1. MemoryStore with TTL and size caps; persist session JSONL
2. Reflection templates in ActionEngine; classify retriable errors
3. `orion debug --session` shows memory and last graph

Acceptance

- Multi‑turn sessions avoid repeated questions; reflection blocks bad writes in tests

## Testing and quality

- Unit: ToolRegistry, IntentRouter, ActionEngine; planner schema validation
- Integration: CLI flows with fixtures; mock MCP servers
- Contract: tool schemas and policy tags; approval prompts
- CI: build workspaces, run tests, forbid lint/type errors

## Security and privacy

- Least privilege; explicit allowlists; session‑scoped approvals
- Secrets in keychain; never printed
- Audit JSONL with hash chaining; redact sensitive arguments

## Developer quickstart (Windows)

1. Node 20.x, npm ≥ 10
2. Set `OPENAI_API_KEY`
3. Build: `npm run build --workspaces`
4. Run: `node orion-cli.js`
5. Try: `orion chat --dry-run` then ask: “Summarize my tasks and block 2×90min tomorrow”

## Migration notes

- Keep `plan`/`task-plan` commands; agent can auto‑invoke planning
- Default model updated to `gpt-5-nano`; temperature omitted for this model

## Success metrics

- Task completion rate without manual steps; approval latency; cost per completed task
- Escalation ratio to larger models; user satisfaction and re‑engagement
