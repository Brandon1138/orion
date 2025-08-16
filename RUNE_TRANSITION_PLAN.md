# Transition Plan: Orion → Rune

## Product Naming Recommendation

### **Rune**

_The AI Orchestration Platform_

**Why Rune:**

- **Memorable & Distinctive**: Short, powerful, stands out in the AI tool landscape
- **Conceptual Fit**: "Runes" are your workflows - ancient symbols of power and knowledge
- **Extensible**: Natural terminology (runestone, inscribe, cast, ancient wisdom)
- **Brand Potential**: Can build a unique identity around mystical/knowledge metaphors
- **Domain Available**: rune.ai, rune.dev likely available

**Alternative Names Considered:**

- **Conductor**: Too generic, many existing products
- **Nexus**: Overused in tech
- **Daemon**: Too technical for mainstream
- **Orchestr8**: Too trendy/dated
- **FlowForge**: Conflicts with existing Node-RED product

**Brand Vocabulary:**

- Workflows → "Runes"
- Workflow Library → "Runestone"
- Execute → "Cast"
- Marketplace → "Marketplace"

---

## Executive Summary

Transform Orion's task planning platform into **Rune**, a provider-agnostic AI orchestration platform that enables users to create, share, and monetize multi-AI workflows ("runes"). This transition preserves 80% of existing code while opening a 10x larger market opportunity.

**Author**: Brandon Aron (Ishmael)
**Timeline**: Aggressive development cycle
**Team**: You, me, Cursor, Perplexity
**Initial Cost**: $0 (GitHub free, Vercel free tier)

---

## Development Plan

### Phase 1: Interface First

_Build the visual foundation to guide development_

**Git Setup:**

```bash
# Create new main branch
git checkout -b rune-main
git push -u origin rune-main

# Preserve Orion
git tag orion-final
git branch orion-legacy

# Set new main
git checkout rune-main
# Eventually: git branch -m main orion-legacy && git branch -m rune-main main
```

**Repository Transformation:**

```bash
# Preserve legacy
mkdir archive/orion-legacy
git mv packages/planner-llm archive/orion-legacy/
git mv packages/task-parser archive/orion-legacy/
git mv packages/calendar-parser archive/orion-legacy/

# New Package Structure
mkdir -p packages/rune-core
mkdir -p packages/rune-providers
mkdir -p packages/rune-runtime
mkdir -p packages/rune-marketplace
mkdir -p packages/runestone
mkdir -p packages/rune-web

# Setup New Package Foundations
npm init -w packages/rune-core
npm init -w packages/rune-providers
npm init -w packages/rune-web
# ... etc
```

**Deliverables:**

- [ ] New repository structure
- [ ] Updated package.json with @rune scope
- [ ] Basic project scaffolding

### Phase 2: Web Interface & Design System

_Visual to-do list approach_

**Rune Builder UI:**

```tsx
// packages/rune-web/src/components/RuneBuilder.tsx
export function RuneBuilder() {
	return (
		<div className="rune-builder">
			<RuneCanvas />
			<StageLibrary />
			<ProviderPanel />
			<TestRunner />
		</div>
	);
}
```

**Marketplace Interface:**

```tsx
// packages/rune-web/src/app/marketplace/page.tsx
export default function Marketplace() {
	return (
		<div>
			<RuneSearch />
			<FeaturedRunes />
			<Categories />
			<TopCreators />
		</div>
	);
}
```

**Deliverables:**

- [ ] Complete UI mockups and components
- [ ] Visual workflow editor (non-functional)
- [ ] Marketplace browse interface
- [ ] User dashboard layouts
- [ ] Design system established

### Phase 3: Core Rune System

_Attach functionality to the interface_

**Core Interfaces:**

```typescript
// packages/rune-core/src/types.ts
interface IRune {
	id: string;
	name: string;
	version: string;
	author: string;
	stages: IStage[];
	inputs: IInput[];
	outputs: IOutput[];
}

interface IStage {
	id: string;
	type: 'ai' | 'script' | 'connector';
	provider?: string;
	config: Record<string, any>;
}
```

**Rune Definition Parser:**

```yaml
# Example rune structure
rune:
  id: 'task-orchestrator'
  name: 'Task Orchestrator Pro'
  version: '1.0.0'
  author: 'Brandon Aron'

  inputs:
    - name: tasks
      type: google_tasks
      required: true
    - name: calendar
      type: google_calendar
      required: true

  stages:
    - id: analyze
      type: ai
      provider: openai/gpt-4
      prompt_template: |
        Analyze these tasks and calendar: {{tasks}} {{calendar}}
        Provide strategic recommendations...

    - id: prioritize
      type: ai
      provider: anthropic/claude-3
      prompt_template: |
        Based on analysis: {{analyze.output}}
        Create prioritized action plan...

    - id: schedule
      type: script
      runtime: node
      source: |
        // Orion integration logic here
        // Enhanced with AI recommendations
```

**Deliverables:**

- [ ] YAML rune parser
- [ ] Rune validation system
- [ ] Basic execution engine
- [ ] Orion integration as enhanced rune
- [ ] 3 example runes

### Phase 4: Provider Abstraction

_Make it work with multiple AI providers_

**Provider System:**

```typescript
// packages/rune-providers/src/types.ts
interface IProvider {
	id: string;
	name: string;
	capabilities: ProviderCapability[];
	execute(prompt: string, config: ProviderConfig): Promise<ProviderResponse>;
	validateCredentials(): Promise<boolean>;
}

// packages/rune-providers/src/providers/openai.ts
export class OpenAIProvider implements IProvider {
	// Migrate existing OpenAI code from orion-core
}
```

**Deliverables:**

- [ ] Provider interface specification
- [ ] OpenAI provider (migrated from Orion)
- [ ] Anthropic provider
- [ ] Provider registry system
- [ ] Credential management

### Phase 5: Execution Runtime

_Make runes actually run_

**Runtime Engine:**

```typescript
// packages/rune-runtime/src/executor.ts
export class RuneExecutor {
	async cast(rune: IRune, inputs: Map<string, any>): Promise<ExecutionResult> {
		// Stage-by-stage execution
		// State management between stages
		// Error handling and rollback
	}
}
```

**Deliverables:**

- [ ] Execution engine
- [ ] State management between stages
- [ ] Error handling & retry logic
- [ ] Basic sandboxing for scripts
- [ ] Local testing capabilities

### Phase 6: Cloud Infrastructure

_Scale beyond local development_

**Infrastructure Setup:**

```yaml
# Vercel deployment
# packages/rune-web/vercel.json
{ 'functions': { 'app/api/**/*.ts': { 'runtime': 'nodejs18.x' } } }
```

**Backend Services:**

```typescript
// packages/rune-web/app/api/runes/[id]/cast/route.ts
export async function POST(req: Request, { params }: { params: { id: string } }) {
	const execution = await runeQueue.add({
		runeId: params.id,
		inputs: await req.json(),
		userId: req.user.id,
	});

	return Response.json({ executionId: execution.id });
}
```

**Deliverables:**

- [ ] Vercel deployment configuration
- [ ] API routes for rune operations
- [ ] Database schema (start with SQLite/PostgreSQL)
- [ ] Authentication system
- [ ] Queue system for execution

### Phase 7: Marketplace & Monetization

_Enable sharing and commerce_

**Payment Integration:**

```typescript
// Stripe integration
const session = await stripe.checkout.sessions.create({
	payment_method_types: ['card'],
	line_items: [
		{
			price_data: {
				currency: 'usd',
				product_data: {
					name: rune.name,
				},
				unit_amount: rune.price * 100,
			},
			quantity: 1,
		},
	],
	mode: 'payment',
});
```

**Deliverables:**

- [ ] Stripe integration
- [ ] Rune publishing system
- [ ] Purchase flow
- [ ] Revenue sharing logic
- [ ] Creator analytics

### Phase 8: Polish & Launch

_Make it production ready_

**Launch Preparation:**

- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation
- [ ] 10+ production-ready runes
- [ ] Marketing site

---

## Migration Mapping

### Package Transformation

| Orion Package      | Rune Package                  | Migration Strategy           |
| ------------------ | ----------------------------- | ---------------------------- |
| @orion/core        | @rune/rune-core               | Refactor orchestration logic |
| @orion/planner-llm | @rune/runes/task-orchestrator | Convert to enhanced rune     |
| @orion/task-parser | @rune/connectors/google-tasks | Generalize as connector      |
| @orion/web         | @rune/rune-web                | Complete redesign            |
| @orion/cli         | @rune/rune-cli                | Adapt for rune operations    |
| @orion/mcp-client  | @rune/rune-runtime            | Enhance sandboxing           |

### Data Migration

```sql
-- Migrate Orion users to Rune
INSERT INTO rune.users (id, email, created_at)
SELECT id, email, created_at FROM orion.users;

-- Convert Orion plans to rune components
-- (Note: Will need enhancement to become complete runes)
INSERT INTO rune.rune_components (name, definition, author_id)
SELECT
  'Orion Task Plan - ' || id,
  json_build_object('stages', plan_data),
  user_id
FROM orion.task_plans;
```

### Configuration Migration

```javascript
// orion.config.json → rune.config.json
{
  "platform": {
    "name": "Rune",
    "version": "1.0.0",
    "author": "Brandon Aron"
  },
  "providers": {
    "openai": { /* existing config */ },
    "anthropic": { /* new */ },
    "google": { /* new */ }
  },
  "execution": {
    "sandbox": true,
    "timeout": 300000,
    "maxConcurrent": 10
  },
  "marketplace": {
    "commission": 0.3,
    "minPrice": 0,
    "maxPrice": 999
  }
}
```

---

## Resource Strategy

### Team: You + AI

- **Development**: You + Cursor for coding
- **Research**: Perplexity for quick answers
- **Planning**: This document + iteration

### Infrastructure Evolution

**Phase 1-5**: Free tier everything

- GitHub (free)
- Vercel (free tier)
- Local development databases

**Phase 6+**: Scale as needed

- Vercel Pro if needed ($20/month)
- Database hosting ($0-50/month)
- Domain names ($10-15/year)

### Third-party Services (Later phases)

- Stripe: 2.9% + $0.30 per transaction
- Auth providers: Free tiers initially

---

## Risk Mitigation

### Technical Risks

| Risk                 | Mitigation                               |
| -------------------- | ---------------------------------------- |
| Provider API changes | Version pinning, adapter pattern         |
| Execution scaling    | Start local, move to cloud gradually     |
| Security issues      | Sandboxing, code review, gradual rollout |

### Development Risks

| Risk               | Mitigation                           |
| ------------------ | ------------------------------------ |
| Feature creep      | Interface-first approach keeps focus |
| Over-engineering   | MVP mindset, iterate quickly         |
| Analysis paralysis | Build, test, iterate cycle           |

---

## Success Metrics

### Phase 2 Checkpoint

- [ ] Complete UI mockups functional
- [ ] Visual workflow editor working
- [ ] Design system established

### Phase 4 Checkpoint

- [ ] 2 providers integrated
- [ ] 3 working runes
- [ ] Basic execution working

### Phase 7 Checkpoint

- [ ] Marketplace functional
- [ ] Payment flow working
- [ ] 10+ runes available

### Launch Targets

- [ ] 20+ active users
- [ ] 15+ runes in marketplace
- [ ] First paid transactions
- [ ] Product Hunt ready

---

## Git Strategy

### Branch Management

```bash
# Current state
main (Orion legacy)
└── rune-main (new development)

# Future state (after successful transition)
orion-legacy (archived)
└── main (Rune platform)
```

### Key Commands

```bash
# Start transition
git checkout -b rune-main
git push -u origin rune-main

# Update all imports
find . -type f -name "*.ts" -exec sed -i 's/@orion/@rune/g' {} \;
find . -type f -name "*.json" -exec sed -i 's/orion/rune/g' {} \;

# When ready to promote
git checkout main
git merge rune-main
git branch -m main orion-legacy
git branch -m rune-main main
```

### File Renames

```
orion.config.json → rune.config.json
packages/orion-* → packages/rune-*
ORION_API_KEY → RUNE_API_KEY
.env.orion → .env.rune
```

---

## Launch Strategy

### Soft Launch

- Personal network testing
- Developer community (Discord/Slack)
- AI/automation communities

### Public Launch

- Product Hunt launch
- HackerNews post
- Dev.to article series
- Twitter/X announcements

### Content Strategy

- "Building Rune" development blog
- Tutorial series
- Creator spotlights
- Use case examples

---

_Author: Brandon Aron (Ishmael)_
_Next Review: After Phase 2 completion_
