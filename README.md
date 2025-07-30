# Orion - Daily Planning Copilot

> **Phase 1A Foundation** - Basic environment setup with read-only operations

Orion is a daily planning copilot built with the OpenAI Agents SDK and Model Context Protocol (MCP) tools for file and shell access. The primary UX is a conversational plan for the day, with surgical control over files and commands.

## 🎯 Current Status: Phase 1A Complete

### ✅ Phase 1A Completed Features

- **✅ Monorepo Structure**: Complete package architecture
- **✅ TypeScript Build System**: All packages compile successfully
- **✅ Core Dependencies**: OpenAI, Anthropic, Google APIs, iCal parsing
- **✅ Basic Architecture**: Calendar parser, Planner LLM, MCP client, Command router, Core orchestration
- **✅ CLI Interface**: Basic command-line interaction
- **✅ Configuration System**: JSON-based configuration with Phase 1A settings
- **✅ Development Environment**: Build scripts and development tooling

### 🔄 Phase 1A Current Capabilities

- **Planning Framework**: Structured DayPlan generation (schema-ready)
- **Calendar Integration**: Google Calendar, Microsoft Graph, and .ics parsing structure
- **File Operations**: Read-only MCP file operations (fs.read, fs.list, fs.search)
- **Conversation Loop**: Basic session management and message processing
- **Safety First**: Read-only mode with policy enforcement

### ⏳ Coming in Phase 1B (Weeks 3-4)

- **🔑 OpenAI Integration**: Live LLM plan generation (requires API key)
- **📅 Google Calendar OAuth**: Real calendar event fetching
- **🛡️ Approval Workflows**: Manual approval for write operations
- **🧠 User Preferences**: Learning and adaptation system
- **⚡ Enhanced MCP**: Basic shell command execution

## 🚀 Quick Start

### Prerequisites

- **Node.js**: >= 20.10.0 < 22.0.0 ✅
- **npm**: >= 10.0.0 ✅
- **OpenAI API Key**: For LLM functionality (Phase 1B+)

### Installation

```powershell
# Clone and setup
git clone <your-repo-url>
cd orion

# Dependencies are already installed ✅
# All packages built successfully ✅

# Run the demo to verify setup
node demo.js

# Check status
node packages/cli/dist/cli.js status
```

### Development Commands

```powershell
# Start development environment (Phase 1B+)
npm run dev

# Build all packages
npm run build

# Run tests (Phase 1B+)
npm test

# Security audit
npm run audit:security
```

## 📁 Project Structure

```
orion/
├── packages/
│   ├── orion-core/          # Main orchestration and conversation loop
│   ├── planner-llm/         # LLM-based day planning
│   ├── calendar-parser/     # Unified calendar event parsing
│   ├── mcp-client/          # Model Context Protocol client
│   ├── command-router/      # Command classification and approval
│   └── cli/                 # Command line interface
├── fixtures/                # Test data and examples
│   ├── google-events.json   # Sample Google Calendar events
│   ├── msgraph-events.json  # Sample Microsoft Graph events
│   └── sample.ics           # Sample iCalendar file
├── scripts/                 # Development and build scripts
├── orion.config.json        # Main configuration file
└── demo.js                  # Phase 1A verification demo
```

## 🔧 Configuration

The main configuration is in `orion.config.json`:

```json
{
	"mvp": {
		"phase": "1A",
		"mode": "development",
		"enabledFeatures": ["calendar-read", "planning", "file-read"],
		"phaseEnforcement": true
	},
	"profile": {
		"timezone": "America/New_York",
		"workday": { "start": "09:00", "end": "18:00", "focusBlockMins": 90 }
	},
	"agents": {
		"plannerModel": "gpt-4o",
		"plannerTemperature": 0.2,
		"fallbackModel": "claude-3-5-sonnet"
	}
}
```

## 🎯 Usage Examples (Phase 1A)

### CLI Status Check

```powershell
node packages/cli/dist/cli.js status
```

### Basic Planning (Phase 1B+)

```powershell
# Generate a day plan
node packages/cli/dist/cli.js plan --date 2025-07-31

# Interactive chat mode
node packages/cli/dist/cli.js chat
```

## 🛡️ Security & Safety

**Phase 1A Safety Measures:**

- **Read-Only Mode**: No write operations allowed
- **Path Restrictions**: Limited to allowed directories only
- **Policy Enforcement**: All operations checked against security policy
- **Audit Logging**: All actions logged for review
- **Rate Limits**: Built-in operation limits

## 📈 Roadmap

### Phase 1A ✅ (Weeks 1-3) - **COMPLETE**

- [x] Basic project setup and architecture
- [x] Core package structure
- [x] Read-only file operations
- [x] Configuration system
- [x] CLI foundation

### Phase 1B 🔄 (Weeks 4-6) - **NEXT**

- [ ] OpenAI LLM integration
- [ ] Google Calendar OAuth
- [ ] Manual approval workflows
- [ ] User preference learning
- [ ] Basic shell commands

### Phase 2 📋 (Weeks 7-10)

- [ ] Microsoft Graph + .ics support
- [ ] Advanced security features
- [ ] Production deployment
- [ ] Performance optimization

### Phase 3 🚀 (Weeks 11-14)

- [ ] CodexHelper integration
- [ ] Advanced agent patterns
- [ ] Voice I/O capabilities
- [ ] Ecosystem integrations

## 🧪 Testing

### Phase 1A Verification

```powershell
# Run the complete demo
node demo.js

# Check individual package builds
cd packages/orion-core && npm run build
cd packages/calendar-parser && npm run build
# ... etc
```

### Test Cases Implemented

- ✅ Configuration loading and validation
- ✅ Package dependency resolution
- ✅ TypeScript compilation for all packages
- ✅ Basic CLI functionality
- ✅ Fixture data loading

## 🤝 Contributing

**Phase 1A Foundation**: The basic architecture is now stable and ready for Phase 1B development.

### Development Setup

1. All dependencies installed ✅
2. All packages building successfully ✅
3. Development scripts ready ✅
4. Configuration validated ✅

### Next Development Focus (Phase 1B)

1. **OpenAI Integration**: Connect live LLM planning
2. **Calendar OAuth**: Real Google Calendar access
3. **Approval Workflows**: Safe command execution
4. **User Experience**: Enhanced CLI and conversation flow

## 📝 License

MIT License - See LICENSE file for details.

## 🔗 Links

- **SPEC.md**: Complete technical specification
- **Architecture Diagrams**: `docs/diagrams/`
- **Phase Documentation**: `docs/ADR.md`

---

**Status**: Phase 1A Complete ✅ | **Next**: Phase 1B Development 🔄
