# Orion - Architectural Decision Records

## ADR-001: Adopt TypeScript Monorepo Architecture for Orion Daily Planning Copilot

### Status:

Accepted

### Context:

Orion is a daily planning copilot that integrates multiple complex systems: OpenAI Agents SDK for LLM orchestration, Model Context Protocol (MCP) for local file/shell access, calendar parsing for multiple providers (Google, Microsoft Graph, .ics), and a CLI interface. The system requires:

- **Clear separation of concerns** between different functional domains (calendar parsing, LLM planning, MCP operations, command routing, core orchestration)
- **Strong type safety** across all inter-package communications to prevent runtime errors in a system that handles user data and file operations
- **Shared configuration and build tooling** to maintain consistency across the entire codebase
- **Independent deployability** of packages for future extensibility (e.g., running planner-llm as a separate service)
- **Developer productivity** with unified dependency management and coordinated builds

The application architecture follows a hub-and-spokes pattern with OrionCore as the central orchestrator and specialized packages for each major concern. Given the complexity of integrating external APIs (OpenAI, Google Calendar, Microsoft Graph) with local system operations (MCP file/shell access), we need strong typing and clear interfaces to prevent integration failures.

The choice was between:

1. **Monolithic TypeScript application** - Single codebase, simpler initially
2. **TypeScript monorepo with discrete packages** - More complex setup, better long-term maintainability
3. **Polyglot microservices** - Maximum flexibility, highest operational complexity

### Decision:

We will adopt a **TypeScript monorepo architecture** with separate packages for each major functional domain:

- `@orion/core` - Main orchestration and conversation loop
- `@orion/planner-llm` - LLM-based day planning with structured outputs
- `@orion/calendar-parser` - Unified calendar parsing (Google, Microsoft Graph, .ics)
- `@orion/mcp-client` - Model Context Protocol client for file/shell operations
- `@orion/command-router` - Command classification and approval workflows
- `@orion/cli` - Command-line interface
- `@orion/codex-helper` - Code generation and developer workflows (Phase 3)

**Architecture Implementation:**

- **Shared base TypeScript configuration** (`tsconfig.json`) with package-specific extensions
- **Inter-package dependencies** using `file:` protocol for local development
- **Unified build system** with npm workspaces for coordinated compilation
- **Consistent dependency management** across all packages
- **Shared types and interfaces** exported from each package for strong contract enforcement

### Consequences:

**Pros:**

- **Strong Type Safety**: TypeScript across all packages prevents integration errors between calendar parsing, LLM responses, and file operations
- **Clear Domain Boundaries**: Each package has a single responsibility, making the codebase easier to understand and maintain
- **Reusability**: Individual packages can be reused in other projects (e.g., `calendar-parser` in other scheduling tools)
- **Independent Evolution**: Packages can be developed, tested, and versioned independently while maintaining integration
- **Shared Infrastructure**: Common build tools, linting, and configuration reduce maintenance overhead
- **Future Microservices Path**: Clean package boundaries enable future extraction to separate services if needed
- **Developer Experience**: Single repository checkout with unified dependency management and build commands
- **Testing Isolation**: Each package can have its own test suite while supporting integration testing

**Cons:**

- **Initial Complexity**: More complex setup compared to a monolithic application, requiring proper tooling configuration
- **Build Coordination**: Inter-package dependencies require careful build ordering and can complicate CI/CD pipelines
- **Dependency Management**: Risk of version conflicts between packages, requiring careful dependency resolution
- **Learning Curve**: Developers need to understand the monorepo structure and inter-package relationships
- **Tooling Requirements**: Requires sophisticated tooling (npm workspaces, TypeScript project references) that may have limitations

**Risk Mitigation:**

- **Phase-based Implementation**: Starting with basic monorepo in Phase 1A, adding complexity gradually
- **Conservative Dependency Policies**: Pinning critical dependencies (`@openai/agents`, `@modelcontextprotocol/sdk`) to avoid breaking changes
- **Comprehensive Build Scripts**: Automated build orchestration with proper dependency ordering
- **Clear Documentation**: Extensive documentation of package relationships and development workflows

**Technical Debt Considerations:**

- **Package Boundaries**: May need to refactor package boundaries as domain understanding evolves
- **Shared Code**: Risk of code duplication if shared utilities aren't properly factored into common packages
- **Version Management**: Complex version coordination if packages need to be published independently

---

_Created: July 30, 2025_
_Author: Brandon Aron_
_Version: 1.0_
_Next Review: Phase 1B completion_

## ADR-002: Shift from Calendar-Reactive to Task-Proactive Planning Architecture

### Status:

Accepted

### Context:

The original Orion architecture (ADR-001) was designed around a **calendar-reactive** planning approach where the system would:

1. Parse existing calendar events from multiple providers (Google Calendar, Microsoft Graph, .ics files)
2. Generate day plans by filling gaps between calendar events with focus blocks
3. Optimize around existing calendar commitments

However, during Phase 1A implementation and user research, several critical limitations emerged:

- **Limited User Control**: Users couldn't express task priorities or preferences that should influence scheduling
- **Passive Planning**: The system reacted to calendars instead of helping users proactively manage their tasks
- **Missing Context**: No visibility into user's actual work tasks, deadlines, or project dependencies
- **Poor Task Management Integration**: Most users manage tasks in dedicated systems (Google Tasks, Todoist, etc.) separate from calendars
- **Inflexible Workflow**: Users wanted conversational planning where they could discuss priorities and get scheduling recommendations

The existing `@orion/calendar-parser` package provided excellent calendar integration but didn't address the core user need: **"Help me understand what tasks I should work on and when."**

Research indicated users prefer a **task-proactive** approach:

1. Import tasks from task management systems (Google Tasks initially)
2. Conduct conversational interviews to understand priorities, complexity, and constraints
3. Generate task plans with specific scheduling recommendations
4. Optionally create calendar entries based on the task plan

### Decision:

We will **pivot from calendar-reactive to task-proactive planning architecture** with the following changes:

**Package Changes:**

- **Rename** `@orion/calendar-parser` → `@orion/task-parser` with Google Tasks integration
- **Update** `@orion/planner-llm` to use TaskPlan v1 schema instead of DayPlan schema
- **Implement** conversational interview-first planning in PlannerLLM
- **Maintain** calendar integration as Phase 1B feature for task scheduling execution

**Core Workflow Changes:**

1. **Task Reading**: TaskParser loads tasks from Google Tasks API with OAuth2 authentication
2. **Conversational Interview**: PlannerLLM conducts multi-turn conversations to understand:
   - Task priorities and urgency levels
   - Time estimates and complexity assessment
   - Dependencies between tasks
   - Scheduling preferences and constraints
   - Context about deadlines and blockers
3. **Task Plan Generation**: Structured TaskPlan v1 JSON output with:
   - Task analysis (priority, duration, complexity)
   - Follow-up questions for clarification
   - Calendar suggestions for scheduling
   - Next steps for assistant actions
4. **Calendar Suggestions**: Recommend specific calendar entries instead of reactive planning

**Technical Implementation:**

- **TaskPlan v1 Schema**: New structured output format optimized for conversational task planning
- **Interview-First System Prompt**: Sophisticated LLM prompting for task prioritization discussions
- **Google Tasks API Integration**: OAuth2 authentication with tasks.readonly scope
- **State Management**: Conversation history tracking for multi-turn interviews
- **Fallback Systems**: Graceful degradation when APIs are unavailable

### Consequences:

**Pros:**

- **User-Centric Planning**: Focuses on what users actually need to accomplish rather than working around existing calendars
- **Conversational Interface**: Natural interaction pattern that helps users think through priorities
- **Task Management Integration**: Leverages existing user workflows in task management systems
- **Flexible Scheduling**: Users can discuss and adjust task scheduling recommendations
- **Better Context**: Rich task information (notes, due dates, subtasks) informs better planning decisions
- **Proactive Approach**: Helps users identify what they should work on, not just when they're free
- **Extensible**: Foundation for integrating additional task sources (Todoist, Asana, etc.)

**Cons:**

- **Breaking Change**: Requires updating all existing integrations and CLI commands
- **Increased Complexity**: Conversational state management and multi-turn interviews add complexity
- **API Dependencies**: Reliance on Google Tasks API introduces additional failure points
- **User Onboarding**: Users need to connect task management accounts and learn new interaction patterns
- **Limited Calendar Integration**: Less sophisticated calendar parsing in initial implementation

**Migration Strategy:**

- **Phase 1A**: Complete task-proactive implementation with Google Tasks
- **Phase 1B**: Add calendar integration as execution layer (create calendar entries from task plans)
- **Backward Compatibility**: Maintain legacy DayPlan types for gradual migration
- **Documentation**: Update all specifications and user guides for new workflow

**Risk Mitigation:**

- **Fallback Planning**: Generate basic task plans when LLM services are unavailable
- **OAuth2 Implementation**: Robust authentication handling with token refresh
- **Gradual Migration**: Maintain existing functionality while introducing new workflow
- **Comprehensive Testing**: Mock conversations and edge case handling

**Technical Debt Considerations:**

- **Legacy Code**: Existing calendar-parser code may need gradual deprecation
- **Type System**: Dual support for both DayPlan and TaskPlan schemas temporarily increases complexity
- **CLI Commands**: Need to update all commands to support new task-based workflow

---

_Created: January 31, 2025_
_Author: System Architect_
_Version: 1.0_
_Next Review: Phase 1B completion_
