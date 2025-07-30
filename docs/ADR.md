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
