# Orion — Technical Specification

> Daily planning copilot + local file/OS agent.
> Built with the OpenAI Agents SDK, wired to MCP tools for file and shell access.
> Primary UX: a conversational plan for the day, with surgical control over files and commands.

---

## 1) Overview

**Mission.** Orion reads the user’s calendars, proposes an actionable day plan, and executes support tasks (searching files, running scripts, opening docs). The tone mirrors a thoughtful colleague.
**Models.** Default: GPT‑4o; upgrade track to GPT‑5 with drop‑in model aliasing.
**Runtime.** Local first. Cloud augmentations optional (OpenAI API for LLM; future vector search).
**I/O.**

- **Calendars:** Google, Outlook (Microsoft Graph), local `.ics`.
- **System:** Files + shells via **MCP** tools.
- **Plans:** Structured JSON (“DayPlan v1”) plus human‑readable summary.
  **Safety.** Permission sandbox, audit log, and manual approval for destructive actions.

---

## 1.1) MVP Development Strategy

**Phased Implementation.** Orion follows a rapid iteration approach with segmented phases for controlled complexity:

**Phase 1A Foundation (Weeks 1-2)**: Minimal viable core with Google Calendar integration, basic conversation loop, and structured plan generation with DayPlan schema. Read-only MCP file operations only. Focus: Prove core concept with real user feedback.

**Phase 1B Enhancement (Weeks 3-4)**: Add approval workflows for safe command execution, expand MCP tool coverage to include basic shell operations, implement user preference learning, and add feedback collection mechanisms. Focus: Build trust through controlled automation.

**Phase 2 Scale (Weeks 5-7)**: Multi-calendar support (Microsoft Graph, .ics), advanced security features, comprehensive audit logging, and production-ready error handling. Focus: Enterprise readiness and reliability.

**Phase 3 Advanced (Weeks 8-10)**: CodexHelper integration, advanced agent patterns, voice I/O capabilities, and ecosystem integrations. Focus: Advanced productivity features and extensibility.

**Phase-Specific Feature Breakdown**:

**Phase 1A Core Features**:

- Google Calendar read-only integration with OAuth2
- Basic conversation loop using OpenAI Agents SDK
- Structured DayPlan generation with JSON schema validation
- Simple MCP file operations (read, list directories)
- Basic error handling and fallback mechanisms
- Foundation audit logging (local JSONL)

**Phase 1B Enhanced Features**:

- Manual approval workflows for shell commands
- Expanded MCP tools: safe shell operations (ls, cat, git status)
- User preference learning and storage
- Feedback collection system with quick ratings
- Context pruning for token efficiency
- Retry strategies with exponential backoff

**Built-in Use Cases**:

- **Morning Briefing Agent**: "What's my day looking like?"
- **Meeting Prep Agent**: "Help me prepare for my 2pm with Sarah"
- **Task Prioritization Agent**: "What should I focus on today?"
- **Schedule Optimization Agent**: "Find me time for deep work"
- **End-of-Day Reflection Agent**: "How did today go?"

---

## 1.2) Complete Technology Stack

## 1.2.1) Dependency Matrix & Version Management

**Critical Dependencies with Exact Version Ranges:**

| Component           | Package                     | Version Range       | Security Update Policy    | Breaking Change Policy     |
| ------------------- | --------------------------- | ------------------- | ------------------------- | -------------------------- |
| **Runtime**         | Node.js                     | `>=20.10.0 <22.0.0` | Auto-patch within minor   | Manual review for major    |
| **Language**        | TypeScript                  | `^5.3.0`            | Auto-patch, manual minor  | Manual review              |
| **Agent Framework** | `@openai/agents`            | `^1.0.0`            | Manual review all updates | Pin major, test minors     |
| **LLM Client**      | `openai`                    | `^4.50.0`           | Auto-patch, manual minor  | API compatibility layer    |
| **LLM Fallback**    | `@anthropic-ai/sdk`         | `^0.24.0`           | Manual patch review       | Abstraction layer required |
| **MCP Protocol**    | `@modelcontextprotocol/sdk` | `^1.0.0`            | Manual review all updates | Fallback implementation    |
| **Database**        | PostgreSQL                  | `>=15.4 <17.0`      | Auto-patch, manual minor  | Migration scripts required |
| **Cache**           | Redis                       | `^7.2.0`            | Auto-patch within major   | Graceful degradation       |
| **Calendar APIs**   | `googleapis`                | `^126.0.0`          | Auto-patch, manual minor  | Version detection layer    |
| **Calendar APIs**   | `@azure/msal-node`          | `^2.6.0`            | Auto-patch, manual minor  | OAuth abstraction layer    |
| **Security**        | `node-keytar`               | `^7.9.0`            | Manual patch review       | OS keychain fallbacks      |
| **Testing**         | `vitest`                    | `^1.6.0`            | Auto-patch within major   | Test compatibility matrix  |
| **Build**           | `vite`                      | `^5.0.0`            | Auto-patch, manual minor  | Build process isolation    |

**Compatibility Matrix:**

```json
{
	"compatibilityMatrix": {
		"node": {
			"20.10": { "supported": true, "tested": true, "recommended": true },
			"20.11": { "supported": true, "tested": true, "recommended": true },
			"21.x": { "supported": true, "tested": false, "recommended": false },
			"22.x": { "supported": false, "tested": false, "recommended": false }
		},
		"openai": {
			"4.50.x": {
				"agents": "^1.0.0",
				"features": ["structured_outputs", "streaming"]
			},
			"4.51.x": {
				"agents": "^1.0.0",
				"features": ["structured_outputs", "streaming", "tools_v2"]
			}
		},
		"mcp": {
			"1.0.x": { "servers": ["filesystem", "shell"], "protocol": "stdio|http" },
			"1.1.x": {
				"servers": ["filesystem", "shell", "web"],
				"protocol": "stdio|http|websocket"
			}
		}
	}
}
```

**Security Update Strategy:**

1. **Automatic Patch Updates** (within 24 hours):
   - Patch versions of runtime dependencies
   - Security patches with CVE scores < 7.0
   - Non-breaking dependency updates

2. **Manual Review Updates** (within 1 week):
   - Minor version updates of critical dependencies
   - Security patches with CVE scores >= 7.0
   - Updates affecting OpenAI Agents SDK or MCP protocol

3. **Planned Major Updates** (quarterly review):
   - Major version updates with breaking changes
   - New feature adoption requiring architecture changes
   - End-of-life migration planning

**Backwards Compatibility Guarantees:**

```typescript
interface CompatibilityPolicy {
	// Configuration file format
	configSchema: {
		supportedVersions: ['v1', 'v2']; // Always support previous major version
		migrationPath: AutomaticUpgrade | ManualMigration;
		deprecationNotice: '90 days minimum';
	};

	// API interfaces
	publicAPI: {
		semverCompliance: true;
		breakingChangePolicy: 'major version only';
		deprecationCycle: '2 minor versions';
	};

	// Data formats
	dataFormats: {
		dayPlanSchema: 'backwards compatible within major version';
		auditLogFormat: 'append-only, never breaking';
		preferenceStorage: 'migration scripts provided';
	};
}
```

**Dependency Management Process:**

1. **Lock File Strategy:**

   ```bash
   # Use npm ci for deterministic installs
   npm ci --only=production

   # Lock file verification in CI
   npm audit --audit-level high
   npm outdated --long
   ```

2. **Vulnerability Management:**
   - **Automated Scanning**: GitHub Dependabot + `npm audit` in CI/CD
   - **Critical CVEs**: Emergency patches within 4 hours
   - **High CVEs**: Patches within 24 hours
   - **Medium/Low CVEs**: Planned updates within 1 week

3. **Update Automation:**

   ```yaml
   # dependabot.yml
   version: 2
   updates:
     - package-ecosystem: 'npm'
       directory: '/'
       schedule:
         interval: 'weekly'
         day: 'monday'
       open-pull-requests-limit: 5
       reviewers:
         - 'security-team'
       allow:
         - dependency-type: 'direct'
         - dependency-type: 'indirect'
       ignore:
         - dependency-name: '@openai/agents'
           update-types: ['version-update:semver-major']
   ```

4. **Testing Matrix for Updates:**

   ```typescript
   interface DependencyTestSuite {
   	unitTests: 'full test suite required';
   	integrationTests: 'calendar + MCP + LLM integration';
   	e2eTests: 'complete user workflow';
   	performanceTests: 'latency + memory benchmarks';
   	securityTests: 'penetration testing for auth flows';
   }
   ```

5. **Rollback Strategy:**
   - **Immediate Rollback**: Any production issue within 1 hour
   - **Canary Deployment**: 5% traffic for 24 hours before full rollout
   - **Database Migrations**: Always backwards compatible with rollback scripts
   - **Configuration Changes**: Feature flags for instant disable

**Phase-Specific Dependency Policies:**

- **Phase 1A**: Pin all dependencies, manual updates only
- **Phase 1B**: Enable automated patch updates for non-critical dependencies
- **Phase 2**: Full automated security patching with 24-hour canary period
- **Phase 3**: Automated minor updates for stable, well-tested dependencies

**Reference package.json Template:**

```json
{
	"name": "orion",
	"version": "1.0.0",
	"engines": {
		"node": ">=20.10.0 <22.0.0",
		"npm": ">=10.0.0"
	},
	"dependencies": {
		"@openai/agents": "1.0.0",
		"openai": "^4.50.0",
		"@anthropic-ai/sdk": "^0.24.0",
		"@modelcontextprotocol/sdk": "1.0.0",
		"googleapis": "^126.0.0",
		"@azure/msal-node": "^2.6.0",
		"node-keytar": "^7.9.0",
		"pg": "^8.11.0",
		"redis": "^4.6.0"
	},
	"devDependencies": {
		"typescript": "^5.3.0",
		"vitest": "^1.6.0",
		"vite": "^5.0.0",
		"@types/node": "^20.10.0"
	},
	"overrides": {
		"@openai/agents": "1.0.0",
		"@modelcontextprotocol/sdk": "1.0.0"
	},
	"scripts": {
		"audit:security": "npm audit --audit-level high",
		"audit:outdated": "npm outdated --long",
		"update:check": "npm-check-updates --interactive",
		"dependency:matrix": "node scripts/check-compatibility.js"
	}
}
```

**Dependency Validation Script:**

```typescript
// scripts/check-compatibility.js
interface CompatibilityCheck {
	validateNodeVersion(): boolean;
	checkCriticalDependencies(): CompatibilityReport;
	verifyMCPProtocolCompatibility(): boolean;
	testOpenAIAgentsIntegration(): boolean;
}

const compatibilityMatrix = {
	'@openai/agents': {
		'1.0.0': { openai: '^4.50.0', supportedFeatures: ['structured_outputs'] },
		'1.1.0': {
			openai: '^4.51.0',
			supportedFeatures: ['structured_outputs', 'tools_v2'],
		},
	},
	'@modelcontextprotocol/sdk': {
		'1.0.0': { protocols: ['stdio', 'http'], servers: ['filesystem', 'shell'] },
		'1.1.0': {
			protocols: ['stdio', 'http', 'websocket'],
			servers: ['filesystem', 'shell', 'web'],
		},
	},
};
```

**Dependency Monitoring & Alerting:**

1. **Security Monitoring:**

   ```yaml
   # .github/workflows/security-scan.yml
   name: Security Scan
   on:
     schedule:
       - cron: '0 6 * * *' # Daily at 6 AM UTC
     push:
       branches: [main]

   jobs:
     security:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - name: Run security audit
           run: |
             npm audit --audit-level high --production
             npm audit --json > audit-results.json
         - name: Security alert
           if: failure()
           uses: 8398a7/action-slack@v3
           with:
             status: failure
             text: '🚨 Security vulnerability detected in dependencies'
   ```

2. **Dependency Health Dashboard:**

   ```typescript
   interface DependencyHealthMetrics {
   	lastUpdated: Date;
   	vulnerabilityCount: {
   		critical: number;
   		high: number;
   		medium: number;
   		low: number;
   	};
   	outdatedPackages: { major: number; minor: number; patch: number };
   	licenseCompliance: { compatible: number; review: number; blocked: number };
   	performanceImpact: { size: string; loadTime: number };
   }
   ```

3. **Alert Thresholds:**
   - **Critical CVE**: Immediate PagerDuty alert + Slack notification
   - **High CVE**: Slack alert within 1 hour + GitHub issue creation
   - **Dependency end-of-life**: 90-day advance warning + migration planning
   - **Major version releases**: Weekly digest with impact assessment

4. **Compliance Reporting:**
   ```bash
   # Monthly dependency report generation
   npm audit --json | jq '.vulnerabilities' > monthly-security-report.json
   npm ls --depth=0 --json | jq '.dependencies' > dependency-inventory.json
   license-checker --onlyAllow 'MIT;Apache-2.0;BSD-3-Clause' --json > license-report.json
   ```

**Core Infrastructure**:

- **Agent Framework**: OpenAI Agents SDK with structured outputs and handoffs
- **Language Models**: GPT-4o (primary), GPT-5 (future), Claude 3.5 Sonnet (fallback)
- **Integration Protocol**: Anthropic Model Context Protocol (MCP) (latest)
- **Runtime**: Node.js 20+ with TypeScript 5+

**Data & Storage**:

- **Primary Database**: PostgreSQL 15+ with vector extensions (pgvector)
- **Cache Layer**: Redis 7+ for session state and MCP tool results
- **File Storage**: Local filesystem with optional S3-compatible backup
- **Vector Database**: Integrated pgvector for semantic search and context retrieval

**Security & Authentication**:

- **Secrets Management**: OS keychain integration (Windows Credential Manager, macOS Keychain, libsecret)
- **Authentication**: OAuth 2.0 for calendar providers, local API keys for LLM services
- **Audit Logging**: Structured JSONL with cryptographic hashing chain
- **Sandboxing**: OS-level process isolation with configurable resource limits

**APIs & Integrations**:

- **Calendar APIs**: Google Calendar API v3, Microsoft Graph Calendar API
- **MCP Servers**: Built-in filesystem, shell, and web browsing servers
- **Monitoring**: OpenTelemetry with optional cloud exporters
- **Health Checks**: Custom health check endpoints with service dependency monitoring

**Development & Deployment**:

- **Package Manager**: npm/yarn with workspace configuration
- **Build System**: Vite for frontend, esbuild for backend
- **Testing**: Vitest for unit tests, Playwright for E2E
- **Containerization**: Docker with multi-stage builds
- **Process Management**: PM2 for production deployment
- **Configuration**: Environment-based config with validation schemas

**Frontend & UI** (if web interface needed):

- **Framework**: React 18+ with TypeScript
- **State Management**: Zustand for client state
- **UI Components**: Radix UI primitives with custom design system
- **Real-time Updates**: Server-Sent Events (SSE) for agent status

---

## 1.3) Risk Mitigation & Implementation Safeguards

**Dependency Management Strategy**:

- **OpenAI Agents SDK**: Build abstraction layer `AgentOrchestrator` to enable model switching (GPT-4o → Claude 3.5 Sonnet fallback)
- **MCP Protocol**: Implement graceful degradation to direct filesystem/shell access if MCP servers fail
- **Calendar APIs**: Rate limiting with exponential backoff, circuit breakers for API failures
- **Context Window**: Conservative token budgeting with 20% safety margin, user-visible indicators

**Error Handling & Recovery**:

```typescript
interface ErrorRecoveryStrategy {
	// Calendar API failures
	handleCalendarUnavailable(): OfflinePlanningMode;

	// LLM service issues
	handleLLMTimeout(): FallbackToTemplate | RetryWithBackoff;

	// MCP tool failures
	handleMCPFailure(toolName: string): DirectToolAccess | GracefulSkip;

	// Context overflow
	handleTokenLimitExceeded(): IntelligentPruning | NewConversation;
}
```

**Implementation Safeguards**:

- **Feature Flags**: Gradual rollout with killswitches for problematic features
- **Comprehensive Mocking**: Full test suite with mocked external dependencies
- **Circuit Breakers**: Automatic service degradation on repeated failures
- **Audit Everything**: Every action logged with cryptographic verification chain
- **Conservative Defaults**: Read-only operations preferred, explicit user consent for modifications

---

## 2) Architecture Diagram (described)

Picture a **hub‑and‑spokes**:

- **OrionCore (hub).** Conversation loop, tool orchestration, memory, approvals, audit.
- **PlannerLLM (spoke).** Generates the plan from calendar context and preferences.
- **CalendarParser (spoke).** Normalises events from Google, Microsoft Graph, and `.ics`.
- **MCPClient (spoke).** Bridges to file and shell tools; enforces scopes.
- **CommandRouter (spoke).** Classifies LLM intents to MCP tools; gates approvals.
- **CodexHelper (spoke, optional).** Codegen, refactors, and sandbox execution.
- **Secure Store (below hub).** API keys, tokens, per‑tool scopes, salts.
- **Audit Log (sidecar).** Append‑only event journal (JSONL).

Data flow:

1. **Ingest** calendars → **CalendarParser** → **OrionCore** context.
2. **Plan** request → **PlannerLLM** (JSON structured output) → **OrionCore**.
3. **Clarify** loop when events look ambiguous.
4. **Act**: **CommandRouter** → **MCPClient** tools (fs/shell).
5. **Write‑back** (optional): create/adjust events via provider APIs.
6. **Persist** preferences, scopes, and logs.

---

## 3) Modules

### 3.1 CalendarParser

**Purpose.** Unify calendar inputs and lift them into a typed model.

**Inputs.**

- Google Calendar API (OAuth2).
- Microsoft Graph Calendar.
- Local `.ics` files (RFC 5545).

**Outputs.** `Event[]` with fields:

```ts
type Event = {
	id: string; // provider id or synthetic
	provider: 'google' | 'msgraph' | 'ics';
	title: string;
	description?: string;
	start: string; // ISO 8601 with timezone
	end: string; // ISO 8601 with timezone
	allDay: boolean;
	location?: string;
	attendees?: { email: string; response?: 'yes' | 'no' | 'maybe' }[];
	recurrence?: string; // RRULE string if present
	transparency?: 'busy' | 'free';
	sensitivity?: 'normal' | 'private' | 'confidential';
	sourceUri?: string; // event htmlLink or file path
	raw?: unknown; // original payload
};
```

**Functions.**

- `loadSources(config: CalendarConfig): Promise<Event[]>`
- `diff(local: Event[], proposed: Event[]): ChangeSet`
- `writeChanges(changes: ChangeSet): Promise<WriteResult>` (guarded by approval policy)

**Edge cases.**

- Timezone rules → canonicalise to user’s primary TZ, keep source offsets.
- Recurrence expansion window (e.g., today ±7 days).
- Private/limited events → mask fields until user opts in.

### 3.2 PlannerLLM

**Purpose.** Turn events + preferences + constraints into a crisp day plan.

**Contract.** Structured output must follow `DayPlan v1`:

```ts
type DayPlan = {
	date: string; // YYYY-MM-DD
	summary: string; // 2–3 sentences
	blocks: {
		start: string; // ISO
		end: string; // ISO
		label: string; // "Deep work: feature X"
		type: 'meeting' | 'focus' | 'break' | 'admin' | 'commute' | 'exercise' | 'Errand' | 'sleep';
		dependsOn?: string[]; // ids of other blocks
		linkedEvents?: string[]; // Event.id references
		filesToOpen?: string[]; // paths
		commands?: string[]; // shell snippets, never executed without approval
		risk?: 'low' | 'medium' | 'high'; // schedule risk
	}[];
	ambiguities?: {
		eventId?: string;
		question: string;
		options?: string[];
		required: boolean;
	}[];
	suggestions?: string[]; // small optimisations
};
```

**Prompting.** System prompt steers style and structure. Example:

- “Speak like a colleague. Output `DayPlan` JSON then a short human summary. Avoid rescheduling external attendees unless asked. Ask targeted questions when context looks thin.”

**Behaviours.**

- Multi‑turn: if `ambiguities[].required = true`, Orion pauses to clarify.
- Tool hints: blocks may include `filesToOpen` or `commands`, which flow to CommandRouter.
- Determinism: set `response_format` with JSON schema; pin a **planning template** to reduce drift.
- Model alias: `orion-planner` → maps to `gpt-4o` initially; configurable.

### 3.3 MCPClient (file/terminal access)

**Purpose.** Single gateway to local capabilities via MCP servers with phased capability rollout.

**Phase 1A Supported Tools (Read-Only Focus):**

- `fs.read`, `fs.list`, `fs.search` (read-only file operations)
- Basic error handling with graceful degradation to direct filesystem access

**Phase 1B Expanded Tools:**

- `fs.write` (with explicit approval workflows)
- `shell.cmd`, `shell.powershell`, `shell.sh` (safe commands only: ls, cat, pwd, git status)
- `editor.applyPatch` (optional, via code tool)

**Phase 2+ Full Capability:**

- Unrestricted shell access with comprehensive approval flows
- Advanced file operations with diff previews

**Policy overlay.**

- Allowlist of roots (e.g., `~/Projects`, `~/Documents`); glob denylist.
- Max file size per read (1MB Phase 1A, 10MB Phase 1B+); line‑range reads for big files.
- Execution budgets: time limit (30s Phase 1A, 5min Phase 1B+), memory limit, concurrent process cap.
- **Rate Limiting**: Max 10 operations/minute Phase 1A, 30 operations/minute Phase 1B+

**Interface.**

```ts
type MCPToolCall = {
	serverId: string; // e.g., 'local-fs', 'local-shell'
	tool: string; // 'fs.read'|'shell.sh'|...
	args: Record<string, unknown>;
};
type MCPResult = {
	ok: boolean;
	stdout?: string;
	stderr?: string;
	data?: unknown;
};
```

### 3.4 CommandRouter

**Purpose.** Decide **if** and **how** to run `filesToOpen` and `commands` from the plan or chat with phased complexity.

**Phase 1A Simplified Pipeline:**

1. **Allowlist Check.** Only predefined safe operations (file reads, directory listings)
2. **Execute** immediately via MCPClient with basic logging
3. **No approval required** for read-only operations within allowed directories

**Phase 1B Enhanced Pipeline:**

1. **Classifier.** Rules-based mapping of intent → {fs|shell|editor} (defer LLM classification to Phase 2)
2. **Risk scoring.** Simple heuristics: read operations = low, write operations = medium, shell commands = high
3. **Policy check.** Compare against phase-appropriate scopes; require approval for write/shell operations
4. **Dry‑run preview.** Show command and expected effects before execution
5. **Execute** via MCPClient with comprehensive audit logging

**Phase 2+ Full Pipeline:**

1. **LLM-powered Classifier** for complex intent analysis
2. **Advanced Risk Scoring** with context-aware heuristics
3. **Sophisticated Approval Workflows** with batch approvals and session scoping

**Approval modes (Phase 1B+):**

- `auto` (read operations within allowlist)
- `ask` (default for write operations and shell commands)
- `block` (disallowed verbs, paths, or operations outside phase capabilities)

### 3.5 OrionCore (main orchestration)

**Responsibilities.**

- Conversation loop using Agents SDK with dynamic pattern detection.
- Context assembly per task (calendar slices, file summaries) with intelligent pruning.
- Tool invocations, retries with exponential back‑off.
- Plan lifecycle: generate → clarify → confirm → apply changes → summarise.
- Memory: short‑term thread state; long‑term user preferences; conversation history.
- Audit: append events; expose `/audit tail` in CLI.
- Metrics: counters for tool use, approvals, failures, user satisfaction.
- Feedback collection: real-time iteration metrics and user experience data.

**Enhanced Context Management.**

```typescript
interface ContextManager {
	// Intelligent context pruning for token efficiency
	pruneContext(currentContext: any[], maxTokens: number): any[];
	prioritizeContext(contexts: ContextWindow[]): ContextWindow[];

	// Conversation history with smart summarization
	saveConversationContext(sessionId: string, context: ConversationHistory): void;
	loadRelevantContext(userId: string, currentDate: Date): ConversationHistory[];
	suggestNewChat(currentTokenCount: number, maxTokens: number): boolean;
}

type ContextWindow = {
	priority: 'high' | 'medium' | 'low';
	timeRelevance: Date;
	userPreferences: UserPreferences;
	environmentalContext: {
		location?: string;
		timeZone: string;
		workingHours: TimeRange;
		currentFocus?: string;
	};
};
```

**Conversation Pattern Detection.**

```typescript
type ConversationPattern =
	| 'quick-question' // Single response needed
	| 'planning-session' // Multi-turn planning
	| 'clarification-loop' // Iterative refinement
	| 'execution-mode' // Following through on plan
	| 'reflection-mode'; // Learning from outcomes

interface ConversationManager {
	detectPattern(messages: Message[]): ConversationPattern;
	adaptResponseStyle(pattern: ConversationPattern): ResponseConfig;
	trackPatternTransitions(): PatternMetrics;
}
```

**State machine.**

```
IDLE → CONTEXT_BUILD → PLAN_DRAFT → CLARIFY? → {APPLY, REVIEW}
APPLY → COMMANDS? → {APPROVE, SKIP} → EXECUTE → REPORT → IDLE
REVIEW → user edits → APPLY
```

**Enhanced Error Recovery.**

```typescript
type RecoveryStrategy = {
	errorType: 'calendar-access' | 'llm-timeout' | 'tool-failure' | 'ambiguous-input';
	userMessage: string;
	suggestedActions: string[];
	fallbackBehavior: 'retry' | 'simplify' | 'ask-user' | 'graceful-degradation';
};

interface GracefulDegradation {
	handleCalendarUnavailable(): BasicPlanningMode;
	handleLLMFailure(): TemplateBasedPlanning;
	handleToolFailure(toolName: string): AlternativeApproach;
	handleContextOverflow(): ContextPruningStrategy;
}
```

**Iteration Metrics Collection.**

```typescript
interface IterationMetrics {
	planGenerationTime: number;
	userSatisfactionScore: 1 | 2 | 3 | 4 | 5;
	planAcceptanceRate: number;
	mostUsedTools: string[];
	commonFailurePoints: string[];
	contextSwitchFrequency: number;
}

interface FeedbackCollector {
	collectQuickFeedback(planId: string, rating: number, comment?: string): void;
	generateIterationInsights(): IterationReport;
	trackFeatureUsage(feature: string, success: boolean): void;
}
```

**Pseudocode (enhanced).**

```python
while session.active:
    try:
        pattern = detect_conversation_pattern(session.messages)
        ctx = build_context_with_pruning(today(), prefs, calendars, pattern)
        plan = planner_llm(ctx)

        if plan.ambiguities_required():
            questions = plan.required_questions()
            answers = ask_user(questions)
            plan = planner_llm(ctx.merge(answers))

        present(plan)
        collect_quick_feedback(plan.id, "plan_quality")

        if user_confirms():
            apply_calendar_changes(plan)
            for task in plan_to_actions(plan):
                if requires_approval(task):
                    approval = request_approval_with_preview(task)
                    if not approval: continue

                try:
                    result = mcp_exec(task)
                    track_tool_success(task.tool, True)
                except ToolFailure as e:
                    handle_tool_failure(task, e)
                    track_tool_success(task.tool, False)

        summarize_and_log(plan, actions)
        save_conversation_context(session.id, session.context)

    except LLMTimeout:
        switch_to_template_planning()
    except CalendarUnavailable:
        offer_offline_planning_mode()
    except ContextOverflow:
        suggest_new_conversation()
```

### 3.6 CodexHelper (optional)

**Purpose.** Developer workflows: generate scripts, patch code, run tests in sandbox.

**Features.**

- Context chunking over large repos (ripgrep + tree‑sitter indexing).
- Deterministic prompts; temperature close to zero; reproducible seeds.
- **Sandbox:** run code inside a constrained shell (`chroot`/container or Firejail).
- Patch workflow: propose → unified diff → approval → apply via MCP editor tool.
- Unit test runner adapters (pytest, jest, go test).

---

## 4) External Dependencies

- **OpenAI Agents SDK** for agent orchestration, tools, and structured outputs. ([OpenAI Platform][1], [OpenAI GitHub][2], [OpenAI GitHub][3])
- **Model Context Protocol (MCP)** for local file/shell access via standardised tools. ([Model Context Protocol][4], [Model Context Protocol][5], [Model Context Protocol][6])
- **Google Calendar API** for events read/write. ([Google for Developers][7], [Google for Developers][8])
- **Microsoft Graph Calendar API** for Outlook/Exchange calendars. ([Microsoft Learn][9], [Microsoft Learn][10], [Microsoft Learn][11])
- **iCalendar RFC 5545** for `.ics` parsing. ([IETF Datatracker][12], [icalendar.org][13])
- **Secure storage**: OS keychains (Windows Credential Manager, macOS Keychain, libsecret/gnome‑keyring), or cross‑platform vault libs.

---

## 5) Security Considerations

**Principles.**

- Least privilege. Scopes are explicit and rotated.
- Human‑in‑the‑loop for risky actions.
- Everything leaves a trail.

**Mechanisms.**

- **Permission sandbox.**
  - Allowlist directories and file patterns.
  - Command verb allow/deny lists.
  - Time, CPU, and memory ceilings per command.

- **Audit log.** JSONL, append‑only, hashed chain:

```json
{
	"ts": "2025-07-30T08:12:45Z",
	"actor": "orion",
	"user": "brandon",
	"action": "shell.sh",
	"args": { "cmd": "ls -la", "cwd": "~/Projects" },
	"result": { "ok": true, "bytes": 1248 },
	"prevHash": "...",
	"hash": "..."
}
```

- **Manual approval flow.**
  - Diff view for file writes.
  - Dry‑run for `rm`, `move`, `git push`, package managers, network calls.
  - One‑shot or session‑scoped approvals with expiry.

- **Secrets.**
  - Store tokens in keychain; never echo in logs.
  - Redaction middleware scrubs outputs.

- **Network policy.**
  - Offline‑first paths for local `.ics` and file tasks.
  - Proxy settings optional for enterprise.

---

## 6) Configuration Schema

### 6.1 JSON Schema (v0)

```json
{
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"title": "OrionConfig",
	"type": "object",
	"properties": {
		"profile": {
			"type": "object",
			"properties": {
				"timezone": { "type": "string" },
				"workday": {
					"type": "object",
					"properties": {
						"start": { "type": "string", "pattern": "^\\d{2}:\\d{2}$" },
						"end": { "type": "string", "pattern": "^\\d{2}:\\d{2}$" },
						"focusBlockMins": { "type": "integer", "minimum": 15 }
					}
				},
				"style": { "type": "string", "enum": ["concise", "chatty", "bullet"] }
			},
			"required": ["timezone"]
		},
		"calendars": {
			"type": "object",
			"properties": {
				"google": {
					"type": "object",
					"properties": {
						"enabled": { "type": "boolean" },
						"calendarIds": { "type": "array", "items": { "type": "string" } },
						"readOnly": { "type": "boolean" }
					}
				},
				"msgraph": {
					"type": "object",
					"properties": {
						"enabled": { "type": "boolean" },
						"mailbox": { "type": "string" },
						"readOnly": { "type": "boolean" }
					}
				},
				"ics": { "type": "array", "items": { "type": "string" } }
			}
		},
		"mvp": {
			"type": "object",
			"properties": {
				"mode": {
					"type": "string",
					"enum": ["development", "staging", "production"]
				},
				"phase": {
					"type": "string",
					"enum": ["1A", "1B", "2", "3"],
					"default": "1A"
				},
				"quickStart": { "type": "boolean", "default": true },
				"enabledFeatures": { "type": "array", "items": { "type": "string" } },
				"skipApprovals": { "type": "array", "items": { "type": "string" } },
				"autoAcceptPlans": { "type": "boolean", "default": false },
				"debugMode": { "type": "boolean", "default": true },
				"maxContextTokens": { "type": "integer", "default": 32000 },
				"phaseEnforcement": { "type": "boolean", "default": true },
				"circuitBreakers": { "type": "boolean", "default": true },
				"rateLimiting": { "type": "boolean", "default": true }
			}
		},
		"iteration": {
			"type": "object",
			"properties": {
				"collectFeedback": { "type": "boolean", "default": true },
				"metricsEnabled": { "type": "boolean", "default": true },
				"feedbackFrequency": {
					"type": "string",
					"enum": ["after_plan", "daily", "weekly"]
				},
				"performanceProfiling": { "type": "boolean", "default": false },
				"errorReporting": {
					"type": "string",
					"enum": ["minimal", "standard", "detailed"]
				}
			}
		},
		"agents": {
			"type": "object",
			"properties": {
				"plannerModel": { "type": "string", "default": "gpt-4o" },
				"plannerTemperature": {
					"type": "number",
					"minimum": 0,
					"maximum": 1,
					"default": 0.2
				},
				"fallbackModel": { "type": "string", "default": "claude-3-5-sonnet" },
				"codexEnabled": { "type": "boolean", "default": false },
				"conversationPatterns": {
					"type": "object",
					"properties": {
						"enabled": { "type": "boolean", "default": true },
						"adaptResponseStyle": { "type": "boolean", "default": true }
					}
				}
			}
		},
		"contextManagement": {
			"type": "object",
			"properties": {
				"enablePruning": { "type": "boolean", "default": true },
				"prioritizeRecent": { "type": "boolean", "default": true },
				"maxHistoryDays": { "type": "integer", "default": 30 },
				"intelligentSummarization": { "type": "boolean", "default": true }
			}
		},
		"mcp": {
			"type": "object",
			"properties": {
				"servers": {
					"type": "array",
					"items": {
						"type": "object",
						"properties": {
							"id": { "type": "string" },
							"endpoint": { "type": "string" },
							"scopes": { "type": "array", "items": { "type": "string" } }
						},
						"required": ["id", "endpoint"]
					}
				},
				"fsAllow": { "type": "array", "items": { "type": "string" } },
				"fsDeny": { "type": "array", "items": { "type": "string" } },
				"commandPolicy": {
					"type": "object",
					"properties": {
						"allow": { "type": "array", "items": { "type": "string" } },
						"deny": { "type": "array", "items": { "type": "string" } },
						"default": "ask"
					}
				}
			}
		},
		"keys": {
			"type": "object",
			"properties": {
				"openaiKeyRef": { "type": "string" },
				"googleKeyRef": { "type": "string" },
				"msgraphKeyRef": { "type": "string" }
			}
		},
		"audit": {
			"type": "object",
			"properties": {
				"path": { "type": "string" },
				"hashing": { "type": "boolean", "default": true },
				"includeMetrics": { "type": "boolean", "default": true },
				"retentionDays": { "type": "integer", "default": 90 }
			}
		},
		"gracefulDegradation": {
			"type": "object",
			"properties": {
				"enableFallbacks": { "type": "boolean", "default": true },
				"offlinePlanningMode": { "type": "boolean", "default": true },
				"templateBasedBackup": { "type": "boolean", "default": true }
			}
		}
	},
	"required": ["profile", "agents", "mcp"]
}
```

### 6.2 Example `orion.config.json`

```json
{
	"profile": {
		"timezone": "Europe/Bucharest",
		"workday": { "start": "09:00", "end": "18:00", "focusBlockMins": 90 },
		"style": "concise"
	},
	"mvp": {
		"mode": "development",
		"phase": "1A",
		"quickStart": true,
		"enabledFeatures": ["calendar-read", "planning", "file-read"],
		"skipApprovals": ["read-operations"],
		"autoAcceptPlans": false,
		"debugMode": true,
		"maxContextTokens": 24000,
		"phaseEnforcement": true,
		"circuitBreakers": true,
		"rateLimiting": true
	},
	"iteration": {
		"collectFeedback": true,
		"metricsEnabled": true,
		"feedbackFrequency": "after_plan",
		"performanceProfiling": true,
		"errorReporting": "detailed"
	},
	"calendars": {
		"google": { "enabled": true, "calendarIds": ["primary"], "readOnly": true },
		"msgraph": { "enabled": false },
		"ics": ["~/Calendars/personal.ics"]
	},
	"agents": {
		"plannerModel": "gpt-4o",
		"plannerTemperature": 0.2,
		"fallbackModel": "claude-3-5-sonnet",
		"codexEnabled": true,
		"conversationPatterns": {
			"enabled": true,
			"adaptResponseStyle": true
		}
	},
	"contextManagement": {
		"enablePruning": true,
		"prioritizeRecent": true,
		"maxHistoryDays": 30,
		"intelligentSummarization": true
	},
	"mcp": {
		"servers": [
			{
				"id": "local-fs",
				"endpoint": "http://localhost:8001",
				"scopes": ["fs.read", "fs.list", "fs.search"]
			}
		],
		"fsAllow": ["~/Projects/**", "~/Documents/**"],
		"fsDeny": ["~/Secrets/**", "/etc/**", "~/.ssh/**"],
		"commandPolicy": {
			"allow": [],
			"deny": ["rm", "del", "format", "mkfs", "sudo", "curl", "wget"],
			"default": "block"
		},
		"rateLimits": {
			"operationsPerMinute": 10,
			"maxFileSize": "1MB",
			"timeoutSeconds": 30
		}
	},
	"keys": {
		"openaiKeyRef": "keychain:OPENAI_API_KEY",
		"googleKeyRef": "keychain:GOOGLE_OAUTH_REFRESH",
		"msgraphKeyRef": "keychain:MSGRAPH_REFRESH"
	},
	"audit": {
		"path": "~/.orion/audit.jsonl",
		"hashing": true,
		"includeMetrics": true,
		"retentionDays": 90
	},
	"gracefulDegradation": {
		"enableFallbacks": true,
		"offlinePlanningMode": true,
		"templateBasedBackup": true
	}
}
```

---

## 6.3) User Experience Patterns

**User Journey Mapping.**

```
Morning Flow:
User: "What's my day looking like?"
→ Orion scans calendar, identifies focus blocks and conflicts
→ Presents structured day plan with time blocks
→ User accepts/modifies plan
→ Orion sets up workspace and reminders

Mid-Day Adaptation:
User: "My 2pm got cancelled, what should I do with that time?"
→ Orion evaluates current context and pending tasks
→ Suggests optimal use of freed time (deep work, prep for next meeting)
→ User approves and Orion adjusts plan

End-of-Day Reflection:
System: "How did today go? (quick 1-5 rating)"
→ User provides feedback
→ Orion learns preferences and adjusts future planning
→ Brief next-day preview if requested
```

**Conversation Flow Patterns.**

- **Progressive Disclosure**: Start with high-level plan, drill down on request
- **Context Awareness**: Reference previous conversations and established preferences
- **Graceful Interruption**: Handle mid-conversation topic switches naturally
- **Error Recovery**: Provide clear next steps when tasks fail
- **Confirmation Loops**: Verify understanding before taking actions

**Feedback Integration Points.**

```typescript
type FeedbackTrigger =
	| 'after_plan_generation' // "How does this plan look? (👍/👎)"
	| 'after_task_completion' // "Did that work as expected?"
	| 'daily_wrap_up' // "Rate today's planning (1-5)"
	| 'feature_discovery' // "Try this new capability?"
	| 'error_recovery'; // "What would you prefer instead?"

interface UserExperience {
	collectMicroFeedback(trigger: FeedbackTrigger, context: any): void;
	adaptToneAndStyle(userPreferences: StylePreferences): void;
	suggestWorkflowImprovements(): WorkflowSuggestion[];
}
```

---

## 6.4) Implementation Timeline & Risk Assessment

**Realistic Timeline Estimates Based on Evaluation Feedback:**

**Phase 1A Foundation (Weeks 1-3, was 1-2):**

- Week 1: Google Calendar OAuth integration + basic event parsing
- Week 2: OpenAI Agents SDK setup + DayPlan schema validation
- Week 3: Read-only MCP file operations + basic conversation loop
- **Risk Mitigation**: Start with comprehensive mocking framework, build offline development environment

**Phase 1B Enhancement (Weeks 4-6, was 3-4):**

- Week 4: Manual approval workflows + basic shell command execution
- Week 5: User preference learning + feedback collection system
- Week 6: Context pruning + retry strategies with exponential backoff
- **Risk Mitigation**: Feature flags for gradual rollout, extensive error handling

**Phase 2 Scale (Weeks 7-10, was 5-7):**

- Week 7-8: Microsoft Graph + .ics calendar support
- Week 9: Advanced security features + comprehensive audit logging
- Week 10: Production deployment + monitoring dashboard
- **Risk Mitigation**: Load testing with real calendar data, security review

**Phase 3 Advanced (Weeks 11-14, was 8-10):**

- Week 11-12: CodexHelper integration
- Week 13: Advanced agent patterns
- Week 14: Documentation + community handoff
- **Risk Mitigation**: Gradual feature rollout, extensive user testing

**Critical Dependencies & Mitigation:**

1. **OpenAI Agents SDK Stability**: Build `AgentOrchestrator` abstraction layer immediately
2. **MCP Protocol Maturity**: Implement direct filesystem/shell fallbacks for all MCP operations
3. **Calendar API Rate Limits**: Implement aggressive caching + offline mode from Phase 1A
4. **Context Window Management**: Conservative token budgeting with 30% safety margin built-in

**Development Process Safeguards:**

- **Daily Integration Testing**: Automated tests with real (mocked) external APIs
- **Weekly User Testing**: Real user feedback from Phase 1A onward
- **Bi-weekly Architecture Review**: Ensure technical debt doesn't accumulate
- **Monthly Security Review**: Audit logs, permission scopes, data handling

---

## 7) Dev/Test Strategy

**Model for testing.** GPT‑4o with response format enforcing the `DayPlan` schema. ([OpenAI Platform][1])

**Suggested test events.**

- Overlapping meetings; one marked **private** with masked details.
- Recurring event with exception (skip one instance).
- Travel block with timezone change.
- An ambiguous calendar entry: “Catch‑up with Sam” (no agenda, no location).
- “Focus” window to fit 2×90 min blocks.

**Mocking.**

- **Calendar.** JSON fixtures mirroring Google and Graph responses; `.ics` samples for RRULEs.
- **Files.** In‑repo test workspace with nested dirs, symlinks, and large files for pagination checks.
- **MCP.** Fake servers that echo inputs and simulate errors (timeout, EACCES).

**CLI harness.**

```
orion plan --date 2025-07-31 --dry-run
orion clarify --from fixtures/ambiguous.json
orion exec --cmd "git status" --cwd ~/Projects/demo --ask
orion audit --tail
orion mcp test --server local-fs
```

**Checks.**

- Schema validation for `DayPlan`.
- Golden files for plan generation (snapshot with tolerances).
- Mutation tests on CommandRouter risk scoring.
- Race tests for concurrent shell calls (cap concurrency = 2).
- Telemetry smoke: counters increment as expected.

---

## 8) Extensibility

**Composition.** Each module is a package with a clean interface. OrionCore wires them through dependency injection. New modules register capabilities and config blocks.

**Planned expansions.**

- **Voice I/O.** Local VAD + streaming TTS; push‑to‑talk in CLI.
- **Email summarisation.** Graph and Gmail integrations for a “morning brief”.
- **Web browsing.** Safe, provider‑aware fetcher with source pinning and quote limits.
- **Team mode.** Shared plan with task assignments per attendee.
- **Local vector index.** Cache code and docs for CodexHelper context.
- **Mobile shell.** Limited, read‑only quick actions on phone with push notifications.

**Advanced Agent Patterns.**

- **Multi-Agent Orchestration**: Specialized sub-agents for research, planning, and execution
- **Agent Handoffs**: Seamless task delegation between planning, execution, and reflection agents
- **Autonomous Learning**: Self-improving agents that adapt based on user feedback and outcomes
- **Collaborative Agents**: Multiple Orion instances sharing insights across team members
- **Proactive Agents**: Anticipatory planning based on patterns and environmental changes

**Integration Ecosystem.**

- **MCP Server Marketplace**: Community-contributed connectors for business tools
- **Plugin Architecture**: Third-party extensions following OpenAI Agents SDK patterns
- **Workflow Templates**: Pre-built agent workflows for common use cases
- **Enterprise Connectors**: Deep integrations with CRM, project management, and communication tools
- **API Gateway**: RESTful API for external applications to interact with Orion

**Future Technology Integration.**

- **Multi-Modal Capabilities**: Image, document, and video analysis for comprehensive context
- **Real-time Collaboration**: Live editing and planning with multiple users
- **Advanced Reasoning**: Integration with specialized reasoning models for complex problem-solving
- **Federated Learning**: Privacy-preserving model improvements across user base
- **Edge Computing**: Local model inference for improved privacy and reduced latency

---

## 9) API & Interfaces

### 9.1 Agents SDK — Agent definition (TypeScript‑like)

```ts
const orion = new Agent({
	name: 'Orion',
	instructions: systemPrompt(),
	tools: [
		plannerTool(), // invokes PlannerLLM with schema
		calendarReadTool(), // CalendarParser.loadSources
		calendarWriteTool(), // guarded by approvals
		mcpTool(localFs), // fs.*
		mcpTool(localShell), // shell.*
		codexTool(), // optional
	],
	memory: sessionMemory(),
	response_format: DayPlanSchema, // JSON first, then human summary
});
```

### 9.2 Planner tool I/O

**Input.**

```json
{
	"date": "2025-07-31",
	"events": [
		/* Event[] */
	],
	"preferences": { "focusBlockMins": 90, "style": "concise" },
	"context": { "openPRs": 2, "pendingDocs": 1 }
}
```

**Output.** `DayPlan` JSON + natural summary.

### 9.3 MCP tool call envelope

```json
{
	"serverId": "local-shell",
	"tool": "shell.sh",
	"args": { "cmd": "pytest -q", "cwd": "~/Projects/acme" }
}
```

### 9.4 Approval request envelope

```json
{
	"kind": "approval-request",
	"risk": "high",
	"preview": {
		"command": "rm -rf ~/Projects/acme/build",
		"effects": ["delete 153 files under ~/Projects/acme/build"]
	},
	"expiresAt": "2025-07-31T10:00:00+03:00"
}
```

---

## 10) Implementation Notes

**Timezone handling.** Use IANA TZ database; always carry offsets; display in user TZ.

**Recurrence.** Expand RRULEs within a window (±7 days), preserve `UID` and instance `RECURRENCE-ID`.

**Large repos.** Chunk by path + token budget; summarise via MCP `fs.read` ranges.

**Streaming.** Stream plan summary to UI; keep JSON intact by sending it first as a single message part.

**Retries.** Tool calls: 3 attempts with jitter; classify retriable errors (EAGAIN, timeouts).

**Logging.** INFO for flow, DEBUG for tool args (with redaction), WARN for policy hits, ERROR for failures.

**OS shells.**

- Windows: `cmd.exe` and `powershell.exe`.
- POSIX: `/bin/sh` default; respect `$SHELL` when allowed.

**Write‑back rules.**

- Only adjust events owned by the user unless explicit approval.
- Never auto‑email attendees unless asked.

---

## 11) Sample System Prompt (PlannerLLM)

```
You are Orion, a daily planning copilot.
Voice: friendly, competent, natural.
Given events and preferences, create a pragmatic schedule for today.

Requirements:
- First emit valid JSON for schema DayPlan v1. Then provide a short human summary.
- Add focus blocks around meetings; keep breaks.
- Ask precise questions when information is missing (set ambiguities[].required=true).
- When proposing commands or files, include them in blocks[].commands/filesToOpen.
- Avoid rescheduling meetings with external attendees unless the user asks.
```

---

## 12) Risks & Mitigations

- **Over‑eager command execution.** → Default to `ask`, strong denylist, dry‑runs.
- **Calendar drift.** → Diff view and explicit confirmation before writes.
- **Prompt drift.** → Structured output schema, temperature near zero, golden tests.
- **Secrets leakage.** → Output redaction, never store secrets in config, keychain only.
- **Ambiguity fatigue.** → Batch questions; cap at three per plan by default.

---

## 13) Build & Ops

**Packaging.** Monorepo with packages: `orion-core`, `calendar-parser`, `planner-llm`, `mcp-client`, `command-router`, `codex-helper`, `cli`.

**Env vars.**

- `OPENAI_API_KEY` (or keychain ref)
- `ORION_CONFIG` (path)
- `GOOGLE_OAUTH_REFRESH`, `MSGRAPH_REFRESH` (keychain refs)

**Local dev.**

- `make dev` brings up fake MCP servers and watches code.
- `make e2e` spins a headless run over fixtures.

**Telemetry.** Optional OpenTelemetry exporters; local JSON sink by default.

---

## 14) Test Data Snippets

### 14.1 Ambiguous meeting

```json
{
	"id": "g-123",
	"title": "Catch-up with Sam",
	"start": "2025-07-31T11:00:00+03:00",
	"end": "2025-07-31T11:30:00+03:00",
	"attendees": [{ "email": "sam@example.com" }]
}
```

Expected questions:

- “Sam from project Alpha or recruiter Sam?”
- “Video or on‑site?”
- “Goal in one line?”

### 14.2 Recurring with exception

`.ics` with weekly RRULE and one `EXDATE`; verify correct expansion for the week.

---

## 15) Folder Layout

```
/orion
  /packages
    /orion-core
    /planner-llm
    /calendar-parser
    /mcp-client
    /command-router
    /codex-helper
    /cli
  /fixtures
    google-events.json
    msgraph-events.json
    sample.ics
  /scripts
    start-dev.sh
  orion.config.json
```

---

## 16) Acceptance Criteria

- Generates a `DayPlan` for any day with ≥1 event or free day blocks.
- Asks at most three targeted questions per plan unless the user requests more.
- Executes low‑risk commands without friction; seeks approval for risky ones.
- Writes calendar changes only after explicit confirmation.
- Produces a signed audit trail for every action.
- Passes e2e tests on Windows, macOS, and Linux (POSIX shell path configurable).

## 16.1) MVP Success Metrics

**Phase 1A Success Criteria (Weeks 1-2) - Foundation:**

- Successfully generates basic day plans from Google Calendar data with 95% uptime
- User can complete end-to-end read-only planning workflow without errors
- System responds to planning requests within 5 seconds for 90% of interactions
- Zero data loss incidents during calendar integration
- Basic structured DayPlan JSON output validates against schema 100% of the time
- Error recovery mechanisms functional (graceful degradation to offline mode)

**Phase 1B Success Criteria (Weeks 3-4) - Enhancement:**

- User satisfaction score >3.5/5.0 for generated plans
- Plan acceptance rate >60% without major modifications
- Successful MCP tool execution rate >90% for approved commands
- Manual approval workflow operational with <10 second response time for simple operations
- User retention >50% after first week of use
- Feedback collection system operational with >70% response rate
- Context pruning reduces token usage by 20% while maintaining plan quality

**Phase 2 Success Criteria (Weeks 5-7) - Scale:**

- Multi-calendar support operational without data conflicts
- Advanced security features pass basic security review
- System handles 5+ concurrent users without performance degradation
- Plan acceptance rate improves to >70% through preference learning
- User retention improves to >60% after first week

**Phase 3 Success Criteria (Weeks 8-10) - Advanced:**

- CodexHelper integration operational for development workflows
- Advanced agent patterns demonstrate measurable productivity improvements
- System handles 15+ concurrent users with sub-3 second response times
- Documentation complete for developer handoff and community contributions

**Key Performance Indicators (KPIs):**

- **User Engagement**: Daily active usage, session duration, feature adoption
- **Plan Quality**: Acceptance rate, modification frequency, user satisfaction scores
- **System Reliability**: Uptime percentage, error rates, response times
- **Learning Effectiveness**: Improvement in plan relevance over time, reduced clarification needs
- **Security Posture**: Zero security incidents, successful audit log integrity checks

**Iteration Feedback Loops:**

- Daily: Automated metrics collection and error monitoring
- Weekly: User feedback analysis and feature usage reports
- Bi-weekly: Plan quality assessment and user interview insights
- Monthly: Technical debt review and architecture evolution planning

---

## References & URLs

```text
OpenAI Agents SDK guide:
https://platform.openai.com/docs/guides/agents-sdk
Python SDK docs:
https://openai.github.io/openai-agents-python/
Agents overview:
https://platform.openai.com/docs/guides/agents

Model Context Protocol:
https://modelcontextprotocol.io/introduction
MCP specification (2025-06-18):
https://modelcontextprotocol.io/specification/2025-06-18

Google Calendar API reference:
https://developers.google.com/workspace/calendar/api/v3/reference
Events resource:
https://developers.google.com/workspace/calendar/api/v3/reference/events

Microsoft Graph Calendar overview:
https://learn.microsoft.com/en-us/graph/api/resources/calendar-overview
List events:
https://learn.microsoft.com/en-us/graph/api/calendar-list-events
Create event:
https://learn.microsoft.com/en-us/graph/api/calendar-post-events

iCalendar RFC 5545:
https://datatracker.ietf.org/doc/html/rfc5545
```

---

## Further reading

- CalConnect developer guide on calendaring standards. ([devguide.calconnect.org][14])
- Agents SDK examples on GitHub (patterns worth copying). ([GitHub][15])
- MCP org on GitHub for reference servers and tools. ([GitHub][16])

---

[1]: https://platform.openai.com/docs/guides/agents-sdk?utm_source=chatgpt.com 'Agents SDK Guide - OpenAI Platform'
[2]: https://openai.github.io/openai-agents-python/agents/?utm_source=chatgpt.com 'Agents - OpenAI Agents SDK'
[3]: https://openai.github.io/openai-agents-python/?utm_source=chatgpt.com 'OpenAI Agents SDK'
[4]: https://modelcontextprotocol.io/introduction?utm_source=chatgpt.com 'Introduction - Model Context Protocol'
[5]: https://modelcontextprotocol.io/specification/2025-06-18?utm_source=chatgpt.com 'Specification - Model Context Protocol'
[6]: https://modelcontextprotocol.io/?utm_source=chatgpt.com 'Model Context Protocol'
[7]: https://developers.google.com/workspace/calendar/api/v3/reference?utm_source=chatgpt.com 'API Reference | Google Calendar'
[8]: https://developers.google.com/workspace/calendar/api/v3/reference/events?utm_source=chatgpt.com 'Events | Google Calendar'
[9]: https://learn.microsoft.com/en-us/graph/api/resources/calendar-overview?view=graph-rest-1.0&utm_source=chatgpt.com 'Working with calendars and events using the Microsoft Graph API'
[10]: https://learn.microsoft.com/en-us/graph/api/calendar-list-events?view=graph-rest-1.0&utm_source=chatgpt.com 'List events - Microsoft Graph v1.0'
[11]: https://learn.microsoft.com/en-us/graph/api/calendar-post-events?view=graph-rest-1.0&utm_source=chatgpt.com 'Create event - Microsoft Graph v1.0'
[12]: https://datatracker.ietf.org/doc/html/rfc5545?utm_source=chatgpt.com 'RFC 5545 - Internet Calendaring and Scheduling Core ... - Datatracker'
[13]: https://icalendar.org/iCalendar-RFC-5545?utm_source=chatgpt.com 'RFC Specifications - iCalendar.org'
[14]: https://devguide.calconnect.org/Appendix/Standards/?utm_source=chatgpt.com 'Standards - Introduction - CalConnect'
[15]: https://github.com/openai/openai-agents-python?utm_source=chatgpt.com 'openai/openai-agents-python: A lightweight, powerful ... - GitHub'
[16]: https://github.com/modelcontextprotocol?utm_source=chatgpt.com 'Model Context Protocol - GitHub'
