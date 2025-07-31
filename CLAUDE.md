# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Build all packages
npm run build

# Lint and format code
npm run lint          # Check for issues
npm run lint:fix      # Fix auto-fixable issues
npm run format        # Format with Prettier
npm run format:check  # Check formatting only
npm run fix           # Format + lint fix

# Testing
npm test              # Run tests with Vitest
npm run test:e2e      # Run end-to-end tests

# Development
npm run dev           # Start development environment
node demo.js          # Run the demo script

# Security and maintenance
npm run audit:security    # Check for security vulnerabilities
npm run audit:outdated    # Check for outdated packages
npm run update:check      # Interactive dependency updates
```

## Architecture Overview

Orion is a **daily planning copilot** built with a TypeScript monorepo architecture using npm workspaces. The system follows a **task-proactive planning approach** where users import tasks from Google Tasks, engage in conversational interviews about priorities, and receive structured task plans with calendar suggestions.

### Core Architecture Pattern

**Hub-and-Spokes Architecture:**
- **OrionCore (hub)**: Main orchestration, conversation loop, session management
- **Specialized Packages (spokes)**: Each handles a specific domain with clear interfaces

### Key Packages

- `@orion/core` - Main orchestration and conversation loop with OpenAI Agents SDK integration
- `@orion/planner-llm` - LLM-based task planning with structured outputs (TaskPlan v1 schema)
- `@orion/task-parser` - Google Tasks API integration with OAuth2 authentication  
- `@orion/mcp-client` - Model Context Protocol client for file/shell operations
- `@orion/command-router` - Command classification and approval workflows
- `@orion/cli` - Command-line interface with interactive chat and task commands
- `@orion/calendar-parser` - Calendar integration (Google, Microsoft Graph, .ics)

### Workflow Patterns

**Primary User Flow (Task-Proactive Planning):**
1. **Task Reading**: Load tasks from Google Tasks API via TaskParser
2. **Conversational Interview**: Multi-turn conversation via PlannerLLM to understand priorities, complexity, scheduling preferences
3. **Task Plan Generation**: Structured TaskPlan v1 JSON with task analysis, questions, calendar suggestions
4. **Execution Planning**: Optional calendar entry creation based on task plan

**Key Data Structures:**
- `TaskPlan` - Structured output from conversational planning (primary schema)
- `TaskInterviewInput` - Input for conversational task interviews
- `Task` - Normalized task representation from Google Tasks
- `DayPlan` - Legacy calendar-based planning (maintained for backward compatibility)

## Development Practices

### TypeScript Configuration
- Strict type checking enabled across all packages
- ES2022 target with ESNext modules
- Type imports enforced via ESLint rules
- Project references for efficient builds

### Code Quality Standards
- **ESLint**: TypeScript-specific rules with strict checking
- **Prettier**: Consistent formatting (tabs, single quotes, 100 char width)
- **Consistent Type Imports**: Use `import type` for type-only imports
- **Error Handling**: Comprehensive try/catch with meaningful error messages
- **Audit Logging**: All operations logged with structured data

### Phase-Based Development
Currently in **Phase 1A** with specific constraints:
- **Read-only operations only** - No file writes, shell commands, or calendar modifications
- **Google Tasks integration** - OAuth2 authentication for task reading
- **Conversational planning** - Multi-turn interviews for task prioritization
- **Structured outputs** - TaskPlan v1 JSON schema validation

## Configuration

Main configuration in `orion.config.json`:
- **Phase enforcement** - Ensures operations stay within phase limitations
- **LLM models** - OpenAI GPT-4o primary, Claude 3.5 Sonnet fallback
- **MCP security** - File system allowlists, command restrictions
- **Rate limiting** - API call throttling and timeout management

## Testing Strategy

- **Unit tests** with Vitest for individual package testing
- **Integration tests** for cross-package communication
- **Mock-based testing** for external API dependencies (Google Tasks, OpenAI)
- **Schema validation** for structured outputs (TaskPlan, DayPlan)
- **CLI testing** with command verification

## Security Considerations

- **OAuth2 Implementation** - Secure Google Tasks authentication with token refresh
- **MCP Security Policy** - Filesystem allowlists and command restrictions in Phase 1A
- **Read-only constraints** - No write operations or shell commands in current phase
- **Audit logging** - All operations tracked with cryptographic hashing
- **API key management** - Environment variables and keychain integration

## Common Issues and Solutions

### Google Tasks Authentication
- Use `orion-cli auth` commands for OAuth2 setup
- Tokens stored securely in system keychain
- Automatic refresh token handling

### Package Dependencies
- Use `npm run build` to rebuild all packages after changes
- Inter-package dependencies use `file:` protocol for local development
- Run `npm run lint:workspaces` to check all packages

### LLM Integration
- Structured outputs with JSON schema validation
- Fallback mechanisms for API failures
- Temperature adjustment based on conversation phase

## Key Files to Understand

- `packages/orion-core/src/index.ts` - Main orchestration and session management
- `packages/planner-llm/src/index.ts` - Conversational task interviewing logic
- `packages/task-parser/src/index.ts` - Google Tasks API integration
- `packages/cli/src/index.ts` - Command-line interface and user interaction
- `orion.config.json` - Main configuration with phase settings
- `SPEC.md` - Complete technical specification and requirements

## Architecture Evolution

The system evolved from **calendar-reactive** to **task-proactive** planning (see `docs/ADR.md`):
- **Original**: Parse calendars → fill gaps → generate day plans
- **Current**: Read tasks → conversational interview → task plans → calendar suggestions

This shift enables more user-centric planning focused on task priorities and conversational interaction rather than passive calendar optimization.