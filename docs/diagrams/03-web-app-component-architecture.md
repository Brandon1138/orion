# Orion - Web App Component Diagram

## Next.js 15 Chat UI Architecture

This diagram illustrates the web application architecture for the Orion chat interface, showing the browser UI, Next.js route handlers, server services, the Orion core, and external integrations.

```mermaid
graph TB
    %% Browser UI
    subgraph "Browser (Next.js 15 UI)"
        ChatPage["Chat Page<br/>(RSC + islands)"]
        MessageList["MessageList<br/>(virtualized)"]
        Composer["Composer<br/>(Send • Use Agent • Dry‑run)"]
        ToolInspector["ToolInspector<br/>(timeline)"]
        ApprovalModal["ApprovalModal"]
        SSEClient["SSE Client"]
    end

    %% Next.js API Routes
    subgraph "Next.js Route Handlers (Node runtime)"
        ChatRoute["POST /api/chat"]
        SessionsRoute["POST /api/sessions"]
        HistoryRoute["GET /api/sessions/:id/history"]
        EventsRoute["GET /api/events<br/>(SSE)"]
        ApprovalsRoute["POST /api/approvals"]
        MemoryRoute["GET /api/memory/:id/recent"]
    end

    %% Server Services
    subgraph "Server Services"
        OrionSingleton["Orion Singleton<br/>(server/orion.ts)"]
        EventBus["Event Bus<br/>(server/events.ts)"]
        ApprovalsRegistry["Approvals Registry<br/>(server/approvals.ts)"]
        Security["Security<br/>(CORS • headers • rate limit)"]
    end

    %% Orion Core
    subgraph "Orion Core (packages/orion-core)"
        OrionCore["OrionCore"]
        ActionEngine["ActionEngine"]
        MemoryStore["MemoryStore<br/>(JSONL snapshots)"]
    end

    %% External Integrations
    subgraph "External Integrations"
        OpenAI["OpenAI API"]
        MCP["MCP / Filesystem (Phase)"]
        GoogleAPIs["Google APIs<br/>(Tasks/Calendar)"]
    end

    %% UI → API
    Composer --> ChatRoute
    SSEClient --> EventsRoute
    ChatPage -->|"create"| SessionsRoute
    ChatPage -->|"load"| HistoryRoute
    ToolInspector -. "subscribe" .- SSEClient
    ApprovalModal -. "subscribe" .- SSEClient
    MessageList -. "subscribe" .- SSEClient

    %% API → Services/Core
    ChatRoute --> OrionSingleton
    SessionsRoute --> OrionSingleton
    HistoryRoute --> OrionSingleton
    MemoryRoute --> MemoryStore
    ApprovalsRoute --> ApprovalsRegistry

    %% Security wrappers
    Security --> ChatRoute
    Security --> SessionsRoute
    Security --> HistoryRoute
    Security --> EventsRoute
    Security --> ApprovalsRoute
    Security --> MemoryRoute

    %% Orion wiring
    OrionSingleton --> OrionCore
    OrionCore --> OpenAI
    OrionCore --> ActionEngine
    OrionCore --> MemoryStore
    OrionCore -. "audit/events" .- EventBus
    EventBus --> EventsRoute

    %% Approvals loop
    ActionEngine -->|"approval request"| ApprovalsRegistry
    ApprovalsRegistry -->|"notify"| EventBus
    ApprovalsRegistry <-->|"resolve"| ApprovalsRoute

    %% Optional future flows
    ActionEngine -. "tools (Phase)" .- MCP
    OrionCore -. "data" .- GoogleAPIs

    %% Styling
    classDef uiStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px,color:#000
    classDef apiStyle fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px,color:#000
    classDef serviceStyle fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px,stroke-dasharray: 5 5,color:#000
    classDef coreStyle fill:#e1f5fe,stroke:#01579b,stroke-width:3px,color:#000
    classDef storageStyle fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px,color:#000
    classDef externalStyle fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000

    class ChatPage,MessageList,Composer,ToolInspector,ApprovalModal,SSEClient uiStyle
    class ChatRoute,SessionsRoute,HistoryRoute,EventsRoute,ApprovalsRoute,MemoryRoute apiStyle
    class OrionSingleton,EventBus,ApprovalsRegistry,Security serviceStyle
    class OrionCore,ActionEngine coreStyle
    class MemoryStore storageStyle
    class OpenAI,MCP,GoogleAPIs externalStyle
```

## Component Descriptions

### Browser (Next.js 15 UI)

- Chat page composed with RSC and island hydration
- Composer with toggles for Use Agent, Dry‑run, Auto‑approve low
- Streaming updates via SSE; inspector and modals subscribe to events

### Next.js Route Handlers

- Node runtime handlers for chat, sessions, history, events (SSE), approvals, and memory
- Validate inputs, enforce CORS and rate limits, and set secure headers

### Server Services

- `server/orion.ts`: Orion singleton and configuration bootstrap
- `server/events.ts`: pub/sub for event fan‑out to SSE clients
- `server/approvals.ts`: pending approval registry and resolution
- `server/security.ts`: CORS, headers, and rate limiting

### Orion Core

- `OrionCore` orchestrates conversation, tools, approvals, and memory
- `ActionEngine` manages tool execution with risk and approvals
- `MemoryStore` provides short‑term memory and JSONL snapshots

### External Integrations

- OpenAI API for chat/planning
- MCP (future) for local capabilities
- Google APIs for tasks/calendar
