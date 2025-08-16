# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Build all packages
npm run build
npm run build:web        # Build web package only

# Development servers
npm run dev              # Start development environment  
npm run dev:web          # Start web development server
npm start:web            # Start web production server

# Lint and format code
npm run lint             # Check for issues across all packages
npm run lint:fix         # Fix auto-fixable issues
npm run lint:workspaces  # Check all workspace packages
npm run format           # Format with Prettier
npm run format:check     # Check formatting only
npm run fix              # Format + lint fix combined
npm run check            # Check format and lint together

# Testing
npm test                 # Run tests with Vitest
npm run test:e2e         # Run end-to-end tests across packages
# Individual package testing:
# cd packages/[package-name] && npm test

# Security and maintenance
npm run audit:security       # Check for security vulnerabilities
npm run audit:outdated       # Check for outdated packages
npm run update:check         # Interactive dependency updates
npm run dependency:matrix    # Check workspace compatibility

# Demo and verification
node demo.js                 # Run Phase 1A verification demo
node packages/cli/dist/cli.js status  # Check CLI status
```

## Architecture Overview

Orion is a **daily planning copilot** built with a TypeScript monorepo architecture using npm workspaces. The system follows a **task-proactive planning approach** where users import tasks from Google Tasks, engage in conversational interviews about priorities, and receive structured task plans with calendar suggestions.

### Core Architecture Pattern

**Hub-and-Spokes Architecture:**
- **OrionCore (hub)**: Main orchestration, conversation loop, session management
- **Specialized Packages (spokes)**: Each handles a specific domain with clear interfaces

### Key Packages

**Core Packages:**
- `@orion/core` - Main orchestration and conversation loop with OpenAI Agents SDK integration
- `@orion/planner-llm` - LLM-based task planning with structured outputs (TaskPlan v1 schema)
- `@orion/task-parser` - Google Tasks API integration with OAuth2 authentication  

**Interface Packages:**
- `@orion/web` - Next.js web interface with React components and API routes
- `@orion/cli` - Command-line interface with interactive chat and task commands

**Integration Packages:**
- `@orion/mcp-client` - Model Context Protocol client for file/shell operations
- `@orion/command-router` - Command classification and approval workflows
- `@orion/calendar-parser` - Calendar integration (Google, Microsoft Graph, .ics)
- `@orion/codex-helper` - CodexHelper integration package

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
- **OpenAI Agents SDK** - Agent orchestration with tool handoffs and structured responses
- **Web Interface** - Next.js application with React components for task management

## Configuration

Main configuration in `orion.config.json`:
- **Phase enforcement** - Ensures operations stay within phase limitations (`mvp.phase`)
- **LLM models** - OpenAI GPT-5-nano primary, Claude 3.5 Sonnet fallback (`agents.plannerModel`)
- **MCP security** - File system allowlists, command restrictions (`mcp.fsAllow/fsDeny`)
- **Rate limiting** - API call throttling and timeout management (`mcp.rateLimits`)
- **Calendar integration** - Google Calendar, Microsoft Graph configuration (`calendars`)
- **Audit logging** - Structured logging with file output (`audit.path`)

## Testing Strategy

- **Unit tests** with Vitest for individual package testing
- **End-to-end tests** with Playwright for web interface (`npm run test:e2e`)
- **Integration tests** for cross-package communication
- **Mock-based testing** for external API dependencies (Google Tasks, OpenAI)
- **Schema validation** for structured outputs (TaskPlan, DayPlan)
- **CLI testing** with command verification
- **API route testing** with Supertest for web endpoints

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

**Core Architecture:**
- `packages/orion-core/src/index.ts` - Main OrionCore class with OpenAI Agents SDK integration
- `packages/orion-core/src/agent.js` - OpenAI Agents SDK orchestration and tool handoffs
- `packages/planner-llm/src/index.ts` - Conversational task interviewing logic
- `packages/task-parser/src/index.ts` - Google Tasks API integration with OAuth2

**Web Interface:**
- `packages/web/src/app/` - Next.js app router with API routes
- `packages/web/src/components/` - React components for task management UI
- `packages/web/src/server/` - Backend integration with OrionCore

**Configuration & Entry Points:**
- `orion.config.json` - Main configuration with phase settings and LLM models
- `packages/cli/src/index.ts` - Command-line interface and user interaction
- `demo.js` - Phase 1A verification and testing script
- `SPEC.md` - Complete technical specification and requirements

## Architecture Evolution

The system evolved from **calendar-reactive** to **task-proactive** planning (see `docs/ADR.md`):
- **Original**: Parse calendars → fill gaps → generate day plans
- **Current**: Read tasks → conversational interview → task plans → calendar suggestions

This shift enables more user-centric planning focused on task priorities and conversational interaction rather than passive calendar optimization.