# Implementation Guide - Google Tasks Conversational Workflow

> **Status**: Specifications completed ✅ | Implementation Phase next 🚀
> **Last Updated**: 2025-01-31
> **Next Session Goal**: Begin Phase 1A implementation with Google Tasks integration

---

## 📋 **What's Been Completed**

### ✅ **Specification Updates (100% Complete)**

- **SPEC.md**: Fully updated for Google Tasks conversational workflow
- **SPEC-1A-DETAIL.md**: Implementation plan updated with task interviewing approach
- **Architecture Diagrams**: Updated hub-and-spokes with TaskParser and Google Tasks API
- **TypeScript Schemas**: TaskPlan v1 schema completed in `packages/planner-llm/src/types.ts`
- **Workflow Design**: Conversational interview patterns defined

### ✅ **Key Conceptual Shifts Implemented**

- **FROM**: Calendar-reactive day planning
- **TO**: Task-proactive conversational interviewing + calendar suggestions
- **Core Flow**: Read Google Tasks → Interview User → Generate TaskPlan → Suggest Calendar Entries

---

## 🎯 **Next Implementation Priority (Chunked)**

### **CHUNK 1: Google Tasks API Integration (Days 1-3)** ✅ **COMPLETE**

**Goal**: Get Google Tasks reading working with OAuth2

#### **1.1 Google Tasks API Setup**

- [x] **Research Google Tasks API v1**: Study the API documentation and authentication flow
- [x] **Create Google Cloud Project**: Set up OAuth2 credentials for Google Tasks scope
- [x] **Test API Access**: Create a simple script to authenticate and read task lists

#### **1.2 TaskParser Implementation**

- [x] **Create packages/task-parser/**: New package structure (rename from calendar-parser)
  ```bash
  mkdir -p packages/task-parser/src
  cp packages/calendar-parser/package.json packages/task-parser/
  # Update package.json name and dependencies
  ```
- [x] **Implement TaskParser class**: Based on updated SPEC.md Module 3.1
  ```typescript
  // packages/task-parser/src/index.ts
  class TaskParser {
  	async loadGoogleTasks(taskListIds?: string[]): Promise<Task[]>;
  	private normalizeGoogleTask(rawTask: any, taskList: any): Task;
  	private buildTaskHierarchy(tasks: Task[]): Task[];
  }
  ```
- [x] **OAuth2 Integration**: Update google-auth.ts for Tasks API scope
- [x] **Create Test Fixtures**: `fixtures/google-tasks.json` with sample data

#### **1.3 Integration Testing**

- [x] **Unit Tests**: TaskParser with mocked Google Tasks API responses
- [x] **Manual Testing**: Connect to real Google Tasks account and verify data parsing
- [x] **Error Handling**: Network failures, empty task lists, malformed data

---

### **CHUNK 2: Conversational Planning Engine (Days 4-6)**

**Goal**: Implement the conversational interview logic

#### **2.1 Update PlannerLLM for Conversations** ✅ **COMPLETE**

- [x] **Update packages/planner-llm/src/index.ts**:
  ```typescript
  class PlannerLLM {
  	async conductTaskInterview(input: TaskInterviewInput): Promise<TaskPlan>;
  	private buildConversationalPrompt(): string;
  	private validateTaskPlan(plan: unknown): TaskPlan;
  }
  ```
- [x] **System Prompt Development**: Create interview-style prompts based on SPEC.md
- [x] **JSON Schema Validation**: Ensure TaskPlan v1 schema enforcement
- [x] **Conversation State Management**: Track multi-turn interview context

#### **2.2 Interview Logic** ✅ **COMPLETE**

- [x] **Priority Assessment**: Logic for asking about task urgency/importance
- [x] **Context Gathering**: Questions about deadlines, complexity, dependencies
- [x] **Scheduling Preferences**: Time-of-day, duration estimates, flexibility
- [x] **Follow-up Generation**: Dynamic question generation based on responses

#### **2.3 Testing Conversational Flow**

- [x] **Mock Conversations**: Test various interview scenarios
- [x] **Schema Validation**: Ensure all TaskPlan outputs are valid
- [x] **Edge Cases**: Handle incomplete information, conflicting priorities

---

### **CHUNK 3: Core Orchestration (Days 7-9)**

**Goal**: Wire TaskParser + PlannerLLM + basic conversation loop

#### **3.1 Update OrionCore**

- [x] **packages/orion-core/src/orchestrator.ts**: Update based on SPEC-1A-DETAIL.md
  ```typescript
  class OrionCore {
  	async handleUserMessage(message: string): Promise<string>;
  	private buildTaskContext(): Promise<TaskContext>;
  	private conductTaskInterview(): Promise<TaskPlan>;
  	private handleFollowUpQuestions(plan: TaskPlan): Promise<TaskPlan>;
  }
  ```
- [x] **Tool Registration**: Update tools for task interviewing (from SPEC-1A-DETAIL.md)
- [x] **Session Memory**: Basic conversation history tracking
- [x] **Error Recovery**: Fallback mechanisms for API failures

#### **3.2 OpenAI Agents SDK Integration**

- [x] **Update Agent Definition**: Based on SPEC.md Section 9.1
  ```typescript
  const orion = new Agent({
  	name: 'Orion',
  	instructions: conversationalSystemPrompt(),
  	tools: [taskInterviewTool(), taskReadTool(), mcpReadTool()],
  	response_format: TaskPlanSchema,
  });
  ```
- [x] **Structured Outputs**: Ensure TaskPlan JSON compliance
- [x] **Tool Handoffs**: Coordinate between TaskParser and PlannerLLM

#### **3.3 Basic CLI Interface**

- [x] **packages/cli/src/index.ts**: Update commands for new workflow
  ```bash
  orion interview-tasks  # Start conversational interview
  orion read-tasks       # Display parsed Google Tasks
  orion plan --date YYYY-MM-DD  # Generate TaskPlan
  ```
- [x] **CLI Output Formatting**: Human-readable TaskPlan display
- [x] **Debug Commands**: View conversation history, task analysis

---

### **CHUNK 4: Integration & Testing (Days 10-12)**

**Goal**: End-to-end workflow testing

#### **4.1 Complete Integration**

- [ ] **End-to-End Flow**: User message → Task reading → Interview → TaskPlan → Response
- [ ] **Error Handling**: Comprehensive error recovery at each step
- [ ] **Performance**: Response times within 5-second target from SPEC-1A-DETAIL.md
- [ ] **Token Management**: Efficient context pruning for long conversations

#### **4.2 Real-World Testing**

- [ ] **Live Google Tasks**: Test with actual user task data
- [ ] **Conversation Quality**: Evaluate interview effectiveness
- [ ] **TaskPlan Accuracy**: Verify scheduling recommendations make sense
- [ ] **User Experience**: Test conversation flow naturalness

#### **4.3 Documentation & Validation**

- [ ] **Update README**: Quick start guide for new workflow
- [ ] **API Documentation**: Document TaskPlan schema and interview flow
- [ ] **Validate Success Criteria**: Check against SPEC-1A-DETAIL.md metrics:
  - [ ] Conversational task interviews working 95% uptime
  - [ ] TaskPlan JSON validation 100% success rate
  - [ ] Response times <5 seconds for 90% of interactions

---

## 🚀 **Implementation Entry Points**

### **Start Here in Next Session:**

1. **Read SPEC-1A-DETAIL.md Lines 129-200**: Google Tasks integration plan
2. **Review packages/planner-llm/src/types.ts**: Updated TaskPlan schema
3. **Check demo.js output**: Confirm current system still works
4. **Begin CHUNK 1.1**: Google Tasks API research and setup

### **Key Reference Files:**

- `SPEC.md` - Complete specification with TaskPlan schema (Lines 519-557)
- `SPEC-1A-DETAIL.md` - Implementation timeline and technical details
- `packages/planner-llm/src/types.ts` - TaskPlan v1 schema and interfaces
- `docs/diagrams/01-component-hub-spokes-architecture.md` - Updated architecture

### **Current System State:**

- ✅ **Working**: OpenAI API integration via demo.js
- ✅ **Working**: Basic package structure and builds
- ✅ **Working**: Configuration system
- 🚧 **Needs Update**: All packages currently use calendar-based approach
- 🚧 **Missing**: Google Tasks API integration
- 🚧 **Missing**: Conversational interview logic

---

## 💡 **Quick Reference: New Workflow**

```
User: "Help me plan my tasks"
     ↓
1. TaskParser.loadGoogleTasks() → Task[]
     ↓
2. PlannerLLM.conductTaskInterview() → TaskPlan with questions
     ↓
3. User answers priority/context questions (multi-turn)
     ↓
4. Updated TaskPlan with calendarSuggestions
     ↓
5. [Phase 1B] Create calendar entries via MCP tools
```

**Key Success Metric**: Natural conversational flow that helps users understand their task priorities and recommends specific time blocks for scheduling.

---

## ⚠️ **Important Notes**

- **Google Tasks API Scope**: `https://www.googleapis.com/auth/tasks.readonly` for Phase 1A
- **Conversation Style**: Curious, helpful colleague who asks thoughtful follow-up questions
- **Schema Enforcement**: Always validate TaskPlan JSON output
- **Error Fallbacks**: Graceful degradation when APIs fail
- **Token Efficiency**: Conservative context management with 20% safety margin

**Next session should start with CHUNK 1.1 - Google Tasks API research and setup.**
