/**
 * Orion Core - Phase 1A Implementation with OpenAI Agents SDK Integration (Chunk 3.2)
 * Task interviewing workflow with Google Tasks integration
 */
import 'dotenv/config';
import { mkdir, appendFile } from 'fs/promises';
import { dirname } from 'path';
import OpenAI from 'openai';
import { CalendarParser } from '@orion/calendar-parser';
import { TaskParser } from '@orion/task-parser';
import { PlannerLLM } from '@orion/planner-llm';
import { MCPClient } from '@orion/mcp-client';
import { ToolRegistry } from './tools.js';
import MemoryStore from './memory.js';
import { IntentRouter } from './intent.js';
import { ActionEngine } from './action-engine.js';
import { CommandRouter } from '@orion/command-router';
import { createOrionAgent, createOrionContext, runOrionAgent } from './agent.js';
export * from './types.js';
export class OrionCore {
    config;
    calendarParser;
    taskParser;
    plannerLLM;
    mcpClient;
    commandRouter;
    toolRegistry;
    intentRouter;
    actionEngine;
    openai;
    sessions = new Map();
    approvalHandler;
    memory;
    auditListener;
    // OpenAI Agents SDK Integration (Chunk 3.2)
    orionAgent;
    agentContext;
    constructor(config) {
        this.config = config;
        this.calendarParser = new CalendarParser(config.calendars);
        this.taskParser = new TaskParser({
            google: {
                taskListIds: undefined, // Will use all task lists by default
                includeCompleted: false,
                maxResults: 100,
            },
        });
        this.plannerLLM = new PlannerLLM({
            model: config.agents.plannerModel,
            temperature: config.agents.plannerTemperature ?? 1, // Default to 1 if not specified
            fallbackModel: config.agents.fallbackModel,
        });
        // Initialize MCP client with policy (prefer config overrides)
        const mcp = config.mcp ?? {
            servers: [{ id: 'local-fs', endpoint: 'stdio', scopes: ['fs.read', 'fs.list', 'fs.search'] }],
            fsAllow: ['./fixtures/**', './packages/**', './docs/**'],
            fsDeny: ['./node_modules/**', './.git/**'],
            commandPolicy: {
                allow: [],
                deny: ['rm', 'del', 'format', 'mkfs', 'sudo'],
                default: 'block',
            },
            rateLimits: { operationsPerMinute: 10, maxFileSize: '1MB', timeoutSeconds: 30 },
        };
        this.mcpClient = new MCPClient(mcp.servers, {
            fsAllow: mcp.fsAllow,
            fsDeny: mcp.fsDeny,
            commandPolicy: mcp.commandPolicy,
            rateLimits: mcp.rateLimits,
        });
        this.commandRouter = new CommandRouter(this.mcpClient);
        // Sprint 1: Tool registry, intent router, and action engine
        this.toolRegistry = new ToolRegistry({
            allowlist: config.web?.allowlist ?? ['https://example.com'],
        });
        this.intentRouter = new IntentRouter();
        this.memory = new MemoryStore({
            ttlSeconds: 3600,
            maxItems: 200,
            snapshotPath: './logs/memory',
        });
        this.actionEngine = new ActionEngine(async (tool, args) => this.executeTool(tool, args), async (action) => this.requestApproval(action), (event, payload) => this.auditLog(event, payload), {
            guard: async (action) => this.reflectBeforeWrite(action),
            retry: { maxAttempts: 3, baseDelayMs: 300, jitterMs: 200 },
        });
        // Initialize OpenAI client for conversation management
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        // Initialize OpenAI Agents SDK components (Chunk 3.2)
        this.orionAgent = createOrionAgent(config);
        this.agentContext = createOrionContext(config);
    }
    /**
     * Restore a session from persisted storage (web host).
     * Does not emit audit; intended for process boot or lazy hydration.
     */
    restoreSession(session) {
        const restored = {
            sessionId: session.sessionId,
            userId: session.userId,
            state: session.state,
            pattern: session.pattern,
            messages: [...session.messages],
            events: [],
            preferences: session.preferences ?? this.config.profile,
            startTime: session.startTime,
        };
        this.sessions.set(session.sessionId, restored);
    }
    /**
     * Allow host (web/CLI) to subscribe to audit events
     */
    onAudit(listener) {
        this.auditListener = listener;
    }
    /**
     * Sprint 2: Convert a TaskPlan into an executable Action list (ActionGraph v0: linear)
     * - calendarSuggestions → calendar.create_event (medium risk)
     * - nextSteps → journal.add_entry (medium risk)
     */
    convertTaskPlanToActions(plan) {
        const actions = [];
        // Calendar suggestions → event creations
        if (Array.isArray(plan.calendarSuggestions)) {
            for (const s of plan.calendarSuggestions) {
                actions.push({
                    tool: 'calendar.create_event',
                    risk: 'medium',
                    args: {
                        title: s.eventTitle,
                        date: s.suggestedDate,
                        time: s.suggestedTime,
                        durationMins: s.duration,
                        description: s.description,
                        sourceTaskId: s.taskId,
                    },
                });
            }
        }
        // Next steps → journal entries (placeholder write op)
        if (Array.isArray(plan.nextSteps)) {
            for (const step of plan.nextSteps) {
                actions.push({
                    tool: 'journal.add_entry',
                    risk: 'medium',
                    args: {
                        text: step,
                        planDate: plan.planDate,
                        category: 'planning-next-step',
                    },
                });
            }
        }
        return actions;
    }
    /**
     * Start a new conversation session
     */
    startSession(userId) {
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const session = {
            sessionId,
            userId,
            state: 'idle',
            pattern: 'quick-question',
            messages: [],
            events: [],
            preferences: this.config.profile,
            startTime: new Date(),
        };
        this.sessions.set(sessionId, session);
        void this.memory.remember(sessionId, {
            ts: new Date().toISOString(),
            kind: 'event',
            data: { type: 'session_start', userId },
        });
        this.auditLog('session_start', { sessionId, userId });
        return sessionId;
    }
    /**
     * Sprint 1: Discover tools
     */
    listTools() {
        return this.toolRegistry.listTools();
    }
    /**
     * Sprint 1: Preview and optionally execute inferred actions from a message
     */
    async previewActions(message) {
        const route = this.intentRouter.route(message);
        return { intent: route.intent, actions: route.actions };
    }
    async runActions(actions) {
        return await this.actionEngine.run(actions);
    }
    /**
     * Sprint 3: Allow host (CLI/UI) to supply an approval handler
     */
    setApprovalHandler(handler) {
        this.approvalHandler = handler;
    }
    /**
     * Handle user message with OpenAI Agents SDK (Chunk 3.2)
     * This is the new preferred method for task interviewing workflow
     */
    async handleUserMessageWithAgent(message, sessionId, userId) {
        try {
            // Update agent context with session information
            this.agentContext.sessionId = sessionId;
            this.agentContext.userId = userId;
            // Run the agent with the user message
            const { taskPlan, response } = await runOrionAgent(this.orionAgent, this.agentContext, message);
            // Update session with TaskPlan if available
            if (sessionId && taskPlan) {
                const session = this.sessions.get(sessionId);
                if (session) {
                    session.currentTaskPlan = taskPlan;
                    session.state = 'plan_draft';
                    session.pattern = 'planning-session';
                    // Add conversation to session messages
                    session.messages.push({
                        role: 'user',
                        content: message,
                        timestamp: new Date(),
                    }, {
                        role: 'assistant',
                        content: response,
                        timestamp: new Date(),
                    });
                }
            }
            this.auditLog('handleUserMessageWithAgent_success', {
                sessionId,
                userId,
                messageLength: message.length,
                responseLength: response.length,
                hasTaskPlan: !!taskPlan,
            });
            return response;
        }
        catch (error) {
            const errorMessage = `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            this.auditLog('handleUserMessageWithAgent_error', {
                sessionId,
                userId,
                message,
                error: errorMessage,
            });
            return errorMessage;
        }
    }
    /**
     * Handle user message with task interviewing workflow (Chunk 3.1) - Legacy method
     */
    async handleUserMessage(message, sessionId) {
        const session = sessionId ? this.sessions.get(sessionId) : null;
        try {
            // Build task context from Google Tasks
            const taskContext = await this.buildTaskContext();
            // If this is a task planning request, conduct interview
            if (this.isTaskPlanningRequest(message)) {
                const taskPlan = await this.conductTaskInterview(taskContext, message, session);
                // Handle follow-up questions if needed
                if (taskPlan.questions && taskPlan.questions.length > 0) {
                    return this.formatTaskPlanWithQuestions(taskPlan);
                }
                return this.formatTaskPlan(taskPlan);
            }
            // For non-planning messages, use existing conversation flow
            if (session) {
                return await this.processMessage(session.sessionId, message);
            }
            // Create temporary session for one-off messages
            const tempSessionId = this.startSession('anonymous');
            return await this.processMessage(tempSessionId, message);
        }
        catch (error) {
            const errorMessage = `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            this.auditLog('handleUserMessage_error', { message, error: errorMessage });
            return errorMessage;
        }
    }
    /**
     * Build task context from Google Tasks (Chunk 3.1)
     */
    async buildTaskContext() {
        try {
            return await this.taskParser.loadTasks();
        }
        catch (error) {
            this.auditLog('buildTaskContext_error', { error: String(error) });
            // Return empty context on failure
            return {
                tasks: [],
                taskLists: [],
                totalTasks: 0,
                lastUpdated: new Date(),
                source: 'TaskParser (failed)',
            };
        }
    }
    /**
     * Conduct task interview using PlannerLLM (Chunk 3.1)
     */
    async conductTaskInterview(taskContext, userMessage, session) {
        try {
            const interviewInput = {
                tasks: taskContext.tasks.map(task => ({
                    id: task.id,
                    provider: 'google-tasks',
                    title: task.title,
                    notes: task.notes,
                    status: task.status,
                    due: task.due?.toISOString().split('T')[0],
                    completed: task.completed?.toISOString(),
                    parent: task.parent,
                    position: task.position || '0',
                    taskList: {
                        id: task.listId,
                        title: task.listTitle,
                    },
                    links: task.links,
                    sourceUri: task.source === 'google' ? `https://tasks.google.com/task/${task.id}` : undefined,
                })),
                userPreferences: session?.preferences
                    ? {
                        focusBlockMinimum: session.preferences.focusBlockMins || 90,
                        conversationStyle: 'collaborative',
                        prioritizationApproach: 'hybrid',
                    }
                    : undefined,
                conversationHistory: session?.messages.map(m => `${m.role}: ${m.content}`) || [userMessage],
                context: {
                    currentDate: new Date().toISOString().split('T')[0],
                    timeZone: this.config.profile.timezone,
                    workingHours: {
                        start: this.config.profile.workday.start,
                        end: this.config.profile.workday.end,
                    },
                },
            };
            const taskPlan = await this.plannerLLM.conductTaskInterview(interviewInput, session?.sessionId);
            this.auditLog('conductTaskInterview_success', {
                sessionId: session?.sessionId,
                tasksCount: taskContext.tasks.length,
                questionsGenerated: taskPlan.questions?.length || 0,
            });
            return taskPlan;
        }
        catch (error) {
            this.auditLog('conductTaskInterview_error', { error: String(error) });
            throw error;
        }
    }
    /**
     * Handle follow-up questions in task interview (Chunk 3.1)
     */
    async handleFollowUpQuestions(plan, userResponse) {
        // This will be enhanced in future iterations
        // For now, return the original plan with user response noted
        const updatedPlan = { ...plan };
        updatedPlan.conversationSummary += ` User provided additional context: ${userResponse}`;
        // Remove questions since user has responded
        delete updatedPlan.questions;
        return updatedPlan;
    }
    /**
     * Check if message is a task planning request
     */
    isTaskPlanningRequest(message) {
        const taskPlanningKeywords = [
            'tasks',
            'task',
            'plan',
            'schedule',
            'priority',
            'priorities',
            'organize',
            'interview',
            'help me plan',
            'what should i do',
            'todo',
            'to-do',
        ];
        const lowerMessage = message.toLowerCase();
        return taskPlanningKeywords.some(keyword => lowerMessage.includes(keyword));
    }
    /**
     * Format TaskPlan with questions for user
     */
    formatTaskPlanWithQuestions(plan) {
        let response = `**Task Analysis Summary**\n\n${plan.conversationSummary}\n\n`;
        if (plan.taskAnalysis.length > 0) {
            response += '**Your Tasks:**\n';
            plan.taskAnalysis.forEach(analysis => {
                response += `• **${analysis.title}** (${analysis.priority} priority, ~${analysis.estimatedDuration}min)\n`;
            });
            response += '\n';
        }
        if (plan.questions && plan.questions.length > 0) {
            response += '**I have some questions to help you plan better:**\n';
            plan.questions.forEach((q, index) => {
                response += `${index + 1}. ${q.question}\n`;
                if (q.options && q.options.length > 0) {
                    response += `   Options: ${q.options.join(', ')}\n`;
                }
                response += '\n';
            });
        }
        return response;
    }
    /**
     * Format final TaskPlan for user
     */
    formatTaskPlan(plan) {
        let response = `**Task Plan for ${plan.planDate}**\n\n${plan.conversationSummary}\n\n`;
        if (plan.taskAnalysis.length > 0) {
            response += '**Prioritized Tasks:**\n';
            plan.taskAnalysis
                .sort((a, b) => {
                const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            })
                .forEach(analysis => {
                response += `• **${analysis.title}** (${analysis.priority} priority)\n`;
                response += `  Duration: ~${analysis.estimatedDuration} minutes\n`;
                response += `  Complexity: ${analysis.complexity}\n`;
                if (analysis.suggestedSchedule.preferredTimeSlot) {
                    response += `  Best time: ${analysis.suggestedSchedule.preferredTimeSlot}\n`;
                }
                response += '\n';
            });
        }
        if (plan.calendarSuggestions && plan.calendarSuggestions.length > 0) {
            response += '**Calendar Suggestions:**\n';
            plan.calendarSuggestions.forEach(suggestion => {
                response += `• ${suggestion.eventTitle} on ${suggestion.suggestedDate}`;
                if (suggestion.suggestedTime) {
                    response += ` at ${suggestion.suggestedTime}`;
                }
                response += ` (${suggestion.duration} minutes)\n`;
            });
            response += '\n';
        }
        if (plan.nextSteps.length > 0) {
            response += '**Next Steps:**\n';
            plan.nextSteps.forEach(step => {
                response += `• ${step}\n`;
            });
        }
        return response;
    }
    /**
     * Process a user message in the conversation using OpenAI client with function calling
     */
    async processMessage(sessionId, userMessage) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        try {
            // Add user message to session
            session.messages.push({
                role: 'user',
                content: userMessage,
                timestamp: new Date(),
            });
            void this.memory.remember(sessionId, {
                ts: new Date().toISOString(),
                kind: 'message',
                data: { role: 'user', content: userMessage },
            });
            // Build conversation history for OpenAI
            const messages = this.buildConversationHistory(session);
            // Use OpenAI with function calling for tool integration
            const response = await this.openai.chat.completions.create({
                model: this.config.agents.plannerModel,
                temperature: this.config.agents.plannerTemperature,
                messages,
                tools: this.getToolDefinitions(),
                tool_choice: 'auto',
            });
            const responseMessage = response.choices[0]?.message;
            if (!responseMessage) {
                throw new Error('No response from OpenAI');
            }
            // Handle tool calls if present
            if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                const toolResults = await this.handleToolCalls(responseMessage.tool_calls);
                // Add tool call results to conversation and get final response
                messages.push(responseMessage);
                messages.push(...toolResults);
                const finalResponse = await this.openai.chat.completions.create({
                    model: this.config.agents.plannerModel,
                    temperature: this.config.agents.plannerTemperature,
                    messages,
                });
                const finalMessage = finalResponse.choices[0]?.message?.content ||
                    'I apologize, but I had trouble processing your request.';
                // Update session state and add response
                session.state = this.determineSessionState(finalMessage, session);
                session.pattern = this.detectConversationPattern(session.messages);
                session.messages.push({
                    role: 'assistant',
                    content: finalMessage,
                    timestamp: new Date(),
                });
                void this.memory.remember(sessionId, {
                    ts: new Date().toISOString(),
                    kind: 'message',
                    data: { role: 'assistant', content: finalMessage },
                });
                this.auditLog('message_processed', {
                    sessionId,
                    pattern: session.pattern,
                    state: session.state,
                    toolCallsUsed: responseMessage.tool_calls.length,
                    responseLength: finalMessage.length,
                });
                return finalMessage;
            }
            else {
                // Direct response without tool calls
                const content = responseMessage.content || 'I apologize, but I had trouble processing your request.';
                session.state = this.determineSessionState(content, session);
                session.pattern = this.detectConversationPattern(session.messages);
                session.messages.push({
                    role: 'assistant',
                    content,
                    timestamp: new Date(),
                });
                void this.memory.remember(sessionId, {
                    ts: new Date().toISOString(),
                    kind: 'message',
                    data: { role: 'assistant', content },
                });
                this.auditLog('message_processed', {
                    sessionId,
                    pattern: session.pattern,
                    state: session.state,
                    responseLength: content.length,
                });
                return content;
            }
        }
        catch (error) {
            const errorMessage = `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            this.auditLog('message_error', { sessionId, error: errorMessage });
            return errorMessage;
        }
    }
    /**
     * Generate a day plan
     */
    async generatePlan(sessionId, request) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        try {
            session.state = 'plan_draft';
            // Load calendar events if not provided
            let events = request.events;
            events ??= await this.calendarParser.loadSources();
            // Build planning context with proper preferences type
            const planningContext = {
                date: request.date ?? new Date().toISOString().split('T')[0],
                events,
                preferences: {
                    focusBlockMins: this.config.profile.workday.focusBlockMins,
                    style: this.config.profile.style,
                    ...session.preferences,
                    ...(request.preferences ?? {}),
                },
                context: request.context,
            };
            // Generate plan using LLM
            const plan = await this.plannerLLM.generatePlan(planningContext);
            session.currentPlan = plan;
            const response = {
                plan,
                confidence: 0.8, // Phase 1A: static confidence
                needsClarification: (plan.ambiguities?.length ?? 0) > 0,
                questions: plan.ambiguities?.map(a => a.question) ?? [],
            };
            this.auditLog('plan_generated', {
                sessionId,
                date: planningContext.date,
                blocksCount: plan.blocks.length,
                hasAmbiguities: response.needsClarification,
            });
            return response;
        }
        catch (error) {
            this.auditLog('plan_generation_error', { sessionId, error: String(error) });
            throw error;
        }
    }
    /**
     * Get session information
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * Set Google Tasks authentication tokens
     */
    setGoogleTasksTokens(tokens) {
        this.taskParser.setGoogleTokens(tokens);
        // Also update the agent context with the authenticated task parser
        this.agentContext.taskParser.setGoogleTokens(tokens);
        this.auditLog('google_tasks_tokens_set', { hasRefreshToken: !!tokens.refresh_token });
    }
    /**
     * Get Google Tasks OAuth authorization URL
     */
    async getGoogleTasksAuthUrl() {
        try {
            const authUrl = await this.taskParser.getGoogleAuthUrl();
            this.auditLog('google_tasks_auth_url_generated', { success: true });
            return authUrl;
        }
        catch (error) {
            this.auditLog('google_tasks_auth_url_error', { error: String(error) });
            throw error;
        }
    }
    /**
     * Exchange Google Tasks authorization code for tokens
     */
    async exchangeGoogleTasksAuthCode(code) {
        try {
            const tokens = await this.taskParser.exchangeGoogleAuthCode(code);
            this.auditLog('google_tasks_tokens_exchanged', { success: true });
            return tokens;
        }
        catch (error) {
            this.auditLog('google_tasks_auth_exchange_error', { error: String(error) });
            throw error;
        }
    }
    /**
     * Build system instructions for the OpenAI Agent (Task Interviewing Workflow)
     */
    buildSystemInstructions() {
        return `You are Orion, a conversational task planning assistant. Your role is to help users understand and prioritize their tasks through thoughtful interviewing, then provide structured scheduling recommendations.

**Core Capabilities:**
- Read and analyze tasks from Google Tasks
- Conduct conversational interviews about task priorities and scheduling
- Generate structured TaskPlan outputs with priority analysis
- Access files (read-only) to understand project context
- Provide intelligent follow-up questions for better planning

**Voice & Style:**
- Curious, helpful colleague who asks thoughtful questions
- Engage in natural conversation to understand task context
- Be genuinely interested in helping users clarify their priorities
- Ask specific, actionable questions rather than generic ones

**Task Interviewing Approach:**
1. **Start with Understanding**: Ask about task urgency, deadlines, and complexity
2. **Gather Context**: Understand dependencies, blockers, and related projects
3. **Explore Scheduling**: Discuss preferred times, duration estimates, and flexibility
4. **Prioritize Thoughtfully**: Help users understand the "why" behind priorities
5. **Suggest Scheduling**: Recommend specific time blocks and calendar entries

**Phase 1A Constraints:**
- READ-ONLY operations only (no task modifications, calendar writes, or shell commands)
- Focus on understanding and recommending, not executing
- Generate structured TaskPlan JSON outputs with schema validation
- Respect user's existing commitments and preferences

**Tools Available:**
- conduct_task_interview: Interview user about their tasks and generate TaskPlan
- read_tasks: Fetch Google Tasks for analysis
- read_file: Access project files for context (read-only)
- list_directory: Browse project structure
- search_files: Find relevant files for planning context

**Interview Guidelines:**
- Ask follow-up questions to understand task context better
- Help users think through dependencies and blockers
- Suggest realistic time estimates based on task complexity
- Identify scheduling conflicts and suggest alternatives
- Be specific in your questions (not just "tell me more")

When conducting interviews, always:
- Generate valid TaskPlan JSON with proper schema
- Include specific, actionable next steps
- Ask clarifying questions for ambiguous situations
- Provide calendar suggestions when appropriate

Remember: You're conducting conversational interviews to help users plan their tasks thoughtfully and systematically.`;
    }
    /**
     * Get tool definitions for OpenAI function calling (Task Interviewing Workflow)
     */
    getToolDefinitions() {
        return [
            {
                type: 'function',
                function: {
                    name: 'conduct_task_interview',
                    description: 'Interview user about their tasks and generate structured TaskPlan with scheduling recommendations',
                    parameters: {
                        type: 'object',
                        properties: {
                            userMessage: {
                                type: 'string',
                                description: 'User message about their tasks or planning needs',
                            },
                            includeContext: {
                                type: 'boolean',
                                description: 'Whether to include project context from files',
                                default: true,
                            },
                        },
                        required: ['userMessage'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'read_tasks',
                    description: 'Fetch tasks from Google Tasks for analysis and planning',
                    parameters: {
                        type: 'object',
                        properties: {
                            taskListIds: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Specific task list IDs to fetch (optional, defaults to all)',
                            },
                            includeCompleted: {
                                type: 'boolean',
                                description: 'Whether to include completed tasks',
                                default: false,
                            },
                        },
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'generate_day_plan',
                    description: 'Generate a structured day plan from calendar events and context (legacy)',
                    parameters: {
                        type: 'object',
                        properties: {
                            date: {
                                type: 'string',
                                description: 'Target date for the plan (YYYY-MM-DD format)',
                            },
                            includeEvents: {
                                type: 'boolean',
                                description: 'Whether to include calendar events in the plan',
                                default: true,
                            },
                            context: {
                                type: 'object',
                                description: 'Additional context for planning (priorities, constraints, etc.)',
                            },
                        },
                        required: ['date'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'read_calendar',
                    description: 'Fetch calendar events for a specific date range',
                    parameters: {
                        type: 'object',
                        properties: {
                            startDate: {
                                type: 'string',
                                description: 'Start date (YYYY-MM-DD)',
                            },
                            endDate: {
                                type: 'string',
                                description: 'End date (YYYY-MM-DD)',
                            },
                        },
                        required: ['startDate'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'read_file',
                    description: 'Read the contents of a file (read-only access)',
                    parameters: {
                        type: 'object',
                        properties: {
                            path: {
                                type: 'string',
                                description: 'File path to read',
                            },
                        },
                        required: ['path'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'list_directory',
                    description: 'List the contents of a directory',
                    parameters: {
                        type: 'object',
                        properties: {
                            path: {
                                type: 'string',
                                description: 'Directory path to list',
                            },
                        },
                        required: ['path'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'search_files',
                    description: 'Search for files matching a pattern',
                    parameters: {
                        type: 'object',
                        properties: {
                            pattern: {
                                type: 'string',
                                description: 'Search pattern (glob format)',
                            },
                            rootPath: {
                                type: 'string',
                                description: 'Root directory to search from',
                                default: '.',
                            },
                        },
                        required: ['pattern'],
                    },
                },
            },
        ];
    }
    /**
     * Build conversation history for OpenAI API
     */
    buildConversationHistory(session) {
        const messages = [
            {
                role: 'system',
                content: this.buildSystemInstructions(),
            },
        ];
        // Add recent messages (keep last 10 for context management)
        const recentMessages = session.messages.slice(-10);
        for (const msg of recentMessages) {
            messages.push({
                role: msg.role,
                content: msg.content,
            });
        }
        return messages;
    }
    /**
     * Handle tool calls and return results
     */
    async handleToolCalls(toolCalls) {
        const results = [];
        for (const toolCall of toolCalls) {
            const toolName = toolCall.function.name;
            const start = Date.now();
            // Emit start event (no args to avoid leaking sensitive values)
            this.auditLog('tool_called', { tool: toolName, sessionId: this.agentContext.sessionId });
            try {
                let result;
                const args = JSON.parse(toolCall.function.arguments);
                switch (toolName) {
                    case 'conduct_task_interview':
                        result = await this.handleConductTaskInterview(args);
                        break;
                    case 'read_tasks':
                        result = await this.handleReadTasks(args);
                        break;
                    case 'generate_day_plan':
                        result = await this.handleGenerateDayPlan(args);
                        break;
                    case 'read_calendar':
                        result = await this.handleReadCalendar(args);
                        break;
                    case 'read_file':
                        result = await this.handleReadFile(args);
                        break;
                    case 'list_directory':
                        result = await this.handleListDirectory(args);
                        break;
                    case 'search_files':
                        result = await this.handleSearchFiles(args);
                        break;
                    default:
                        result = { success: false, error: `Unknown tool: ${toolCall.function.name}` };
                }
                // Emit completion event (assume ok=true on successful execution path)
                this.auditLog('completed', {
                    tool: toolName,
                    durationMs: Date.now() - start,
                    sessionId: this.agentContext.sessionId,
                });
                results.push({
                    role: 'tool',
                    content: JSON.stringify(result),
                    tool_call_id: toolCall.id,
                });
            }
            catch (error) {
                // Emit error completion
                this.auditLog('error', {
                    tool: toolName,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    durationMs: Date.now() - start,
                    sessionId: this.agentContext.sessionId,
                });
                results.push({
                    role: 'tool',
                    content: JSON.stringify({
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    }),
                    tool_call_id: toolCall.id,
                });
            }
        }
        return results;
    }
    /**
     * Tool handler: Conduct task interview (Chunk 3.1)
     */
    async handleConductTaskInterview(params) {
        try {
            const { userMessage, includeContext = true } = params;
            // Build task context
            const taskContext = await this.buildTaskContext();
            // Conduct interview
            const taskPlan = await this.conductTaskInterview(taskContext, userMessage);
            if (this.agentContext.sessionId) {
                void this.memory.remember(this.agentContext.sessionId, {
                    ts: new Date().toISOString(),
                    kind: 'note',
                    data: { type: 'task_plan_generated', tasksCount: taskContext.tasks.length },
                });
            }
            return {
                success: true,
                taskPlan,
                tasksCount: taskContext.tasks.length,
                questionsGenerated: taskPlan.questions?.length || 0,
                hasCalendarSuggestions: (taskPlan.calendarSuggestions?.length || 0) > 0,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Tool handler: Read tasks from Google Tasks
     */
    async handleReadTasks(params) {
        try {
            const { taskListIds, includeCompleted = false } = params;
            // Update config for this request
            if (includeCompleted !== undefined) {
                this.taskParser = new TaskParser({
                    ...this.taskParser['config'], // Access private config
                    google: {
                        ...this.taskParser['config'].google,
                        includeCompleted,
                    },
                });
            }
            // Load tasks
            const taskResult = await this.taskParser.loadGoogleTasks(taskListIds);
            return {
                success: true,
                tasks: taskResult.tasks,
                taskLists: taskResult.taskLists,
                totalTasks: taskResult.tasks.length,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Tool handler: Generate day plan
     */
    async handleGenerateDayPlan(params) {
        try {
            const { date, includeEvents = true, context = {} } = params;
            // Load calendar events if requested
            let events = [];
            if (includeEvents) {
                const startDate = new Date(date);
                const endDate = new Date(date);
                endDate.setHours(23, 59, 59, 999);
                events = await this.calendarParser.loadSources({
                    start: startDate,
                    end: endDate,
                });
            }
            // Build planning context
            const planningContext = {
                date,
                events,
                preferences: {
                    focusBlockMins: this.config.profile.workday.focusBlockMins,
                    style: this.config.profile.style,
                },
                context,
            };
            // Generate plan
            const plan = await this.plannerLLM.generatePlan(planningContext);
            return {
                success: true,
                plan,
                eventsCount: events.length,
                blocksCount: plan.blocks.length,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Tool handler: Read calendar
     */
    async handleReadCalendar(params) {
        try {
            const { startDate, endDate } = params;
            const start = new Date(startDate);
            const end = endDate ? new Date(endDate) : new Date(startDate);
            // If endDate not provided, set to end of startDate
            if (!endDate) {
                end.setHours(23, 59, 59, 999);
            }
            const events = await this.calendarParser.loadSources({ start, end });
            return {
                success: true,
                events,
                count: events.length,
                dateRange: { startDate, endDate: endDate || startDate },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Tool handler: Read file
     */
    async handleReadFile(params) {
        const { path } = params;
        const toolCall = {
            serverId: 'local-fs',
            tool: 'fs.read',
            args: { path },
        };
        return await this.mcpClient.execute(toolCall);
    }
    // Sprint 1: minimal tool executor bridging to MCP and native tools
    async executeTool(tool, args) {
        if (tool.startsWith('fs.')) {
            const result = await this.mcpClient.execute({ serverId: 'local-fs', tool, args });
            return { ok: result.ok, data: result.stdout ?? result['data'], error: result.error };
        }
        // Sprint 3: Connectors — dry-run by default with config checks
        if (tool === 'calendar.create_event' || tool === 'calendar.update_event') {
            const hasGoogle = this.config.calendars?.google?.enabled === true;
            const hasMsGraph = this.config.calendars?.msgraph?.enabled === true;
            const provider = hasGoogle ? 'google' : hasMsGraph ? 'msgraph' : 'none';
            if (provider === 'none') {
                return {
                    ok: false,
                    error: 'needs_configuration',
                    data: {
                        providerHint: 'Enable google or msgraph in orion.config.json.calendars',
                        instructions: 'Set calendars.google.enabled=true or calendars.msgraph.enabled=true and provide key refs under keys.googleKeyRef/msgraphKeyRef.',
                    },
                };
            }
            // Check key presence
            const missing = [];
            if (provider === 'google' && !this.resolveKeyRef(this.config.keys?.googleKeyRef))
                missing.push('googleKeyRef');
            if (provider === 'msgraph' && !this.resolveKeyRef(this.config.keys?.msgraphKeyRef))
                missing.push('msgraphKeyRef');
            if (missing.length > 0) {
                return {
                    ok: false,
                    error: 'needs_configuration',
                    data: {
                        missing,
                        instructions: 'Add the missing key refs in orion.config.json.keys and ensure the referenced secret exists (env:VAR or keychain:NAME).',
                    },
                };
            }
            // Dry-run only
            return {
                ok: true,
                data: {
                    kind: 'preview',
                    message: `Would ${tool.includes('update') ? 'update' : 'create'} calendar event (${provider})`,
                    args,
                },
            };
        }
        if (tool === 'journal.add_entry') {
            return {
                ok: true,
                data: { kind: 'preview', message: 'Would append journal entry (dry-run preview).', args },
            };
        }
        if (tool === 'web.fetch') {
            const url = String(args['url'] ?? '');
            if (!this.toolRegistry.isUrlAllowed(url)) {
                return { ok: false, error: 'URL not allowed by allowlist' };
            }
            try {
                const res = await fetch(url);
                const text = await res.text();
                return { ok: true, data: { status: res.status, body: text } };
            }
            catch (err) {
                return { ok: false, error: err instanceof Error ? err.message : 'Fetch failed' };
            }
        }
        // GitHub
        if (tool === 'github.issue.create' ||
            tool === 'github.comment.create' ||
            tool === 'github.search_prs') {
            const token = this.resolveKeyRef(this.config.keys?.githubKeyRef) || process.env.GITHUB_TOKEN;
            if (!token) {
                return {
                    ok: false,
                    error: 'needs_configuration',
                    data: {
                        missing: ['githubKeyRef or GITHUB_TOKEN'],
                        instructions: 'Set env GITHUB_TOKEN or add keys.githubKeyRef in orion.config.json.',
                    },
                };
            }
            // Dry-run only
            return { ok: true, data: { kind: 'preview', message: `Would call ${tool} on GitHub`, args } };
        }
        // Notion
        if (tool === 'notion.task.create' || tool === 'notion.task.update') {
            const token = this.resolveKeyRef(this.config.keys?.notionKeyRef) || process.env.NOTION_TOKEN;
            if (!token) {
                return {
                    ok: false,
                    error: 'needs_configuration',
                    data: {
                        missing: ['notionKeyRef or NOTION_TOKEN'],
                        instructions: 'Set env NOTION_TOKEN or add keys.notionKeyRef in orion.config.json.',
                    },
                };
            }
            return { ok: true, data: { kind: 'preview', message: `Would call ${tool} on Notion`, args } };
        }
        // Linear
        if (tool === 'linear.issue.create' || tool === 'linear.issue.update') {
            const token = this.resolveKeyRef(this.config.keys?.linearKeyRef) || process.env.LINEAR_TOKEN;
            if (!token) {
                return {
                    ok: false,
                    error: 'needs_configuration',
                    data: {
                        missing: ['linearKeyRef or LINEAR_TOKEN'],
                        instructions: 'Set env LINEAR_TOKEN or add keys.linearKeyRef in orion.config.json.',
                    },
                };
            }
            return { ok: true, data: { kind: 'preview', message: `Would call ${tool} on Linear`, args } };
        }
        if (tool === 'conduct_task_interview') {
            try {
                const result = await this.handleConductTaskInterview(args);
                return { ok: true, data: result };
            }
            catch (error) {
                return { ok: false, error: error instanceof Error ? error.message : 'Interview failed' };
            }
        }
        // Synthetic summarize tools for preview mode only
        if (tool === 'summarize.tasks' || tool === 'summarize.text') {
            return { ok: true, data: 'Summary generated (dry-run synthetic result).' };
        }
        return { ok: false, error: `Unknown tool: ${tool}` };
    }
    resolveKeyRef(ref) {
        if (!ref)
            return undefined;
        if (ref.startsWith('env:'))
            return process.env[ref.slice(4)];
        // keychain:NAME not implemented in Phase 1A; return undefined to signal missing
        return undefined;
    }
    async requestApproval(action) {
        if (this.approvalHandler) {
            return this.approvalHandler(action);
        }
        return false;
    }
    /**
     * Sprint 4: Reflection guard before writes
     * - Validate args against tool schema when available
     * - Enforce Phase 1A read-only policy for disallowed writes
     */
    async reflectBeforeWrite(action) {
        // Enforce read-only in Phase 1A when config enforces phase
        const isWrite = action.tool.includes('create') ||
            action.tool.includes('update') ||
            action.tool.includes('delete');
        if (this.config.mvp.phase === '1A' && isWrite) {
            return { ok: false, reason: 'Phase 1A: write operations blocked (dry-run previews only)' };
        }
        // Schema validation if we have a registered tool schema
        const def = this.toolRegistry.getTool(action.tool);
        if (def && def.schema) {
            const reason = this.validateArgsAgainstSchema(action.args, def.schema);
            if (reason) {
                return { ok: false, reason: `schema_validation_failed: ${reason}` };
            }
        }
        return { ok: true };
    }
    validateArgsAgainstSchema(args, schema) {
        try {
            if (schema?.type !== 'object')
                return null;
            if (Array.isArray(schema.required)) {
                for (const key of schema.required) {
                    if (!(key in args))
                        return `missing required: ${key}`;
                }
            }
            if (schema?.properties) {
                for (const [key, def] of Object.entries(schema.properties)) {
                    if (!(key in args))
                        continue;
                    const val = args[key];
                    if (def.type === 'number' && typeof val !== 'number')
                        return `invalid type for ${key}`;
                    if (def.type === 'string' && typeof val !== 'string')
                        return `invalid type for ${key}`;
                    if (def.type === 'array' && !Array.isArray(val))
                        return `invalid type for ${key}`;
                    if (def.minimum !== undefined && typeof val === 'number' && val < def.minimum)
                        return `${key} below minimum`;
                }
            }
            return null;
        }
        catch {
            return 'schema_check_error';
        }
    }
    // Expose memory for debug commands
    getRecentMemory(sessionId, limit = 20) {
        return this.memory.getRecent(sessionId, limit);
    }
    /**
     * Tool handler: List directory
     */
    async handleListDirectory(params) {
        const { path } = params;
        const toolCall = {
            serverId: 'local-fs',
            tool: 'fs.list',
            args: { path },
        };
        return await this.mcpClient.execute(toolCall);
    }
    /**
     * Tool handler: Search files
     */
    async handleSearchFiles(params) {
        const { pattern, rootPath = '.' } = params;
        const toolCall = {
            serverId: 'local-fs',
            tool: 'fs.search',
            args: { pattern, path: rootPath },
        };
        return await this.mcpClient.execute(toolCall);
    }
    /**
     * Build session context for the agent
     */
    async buildSessionContext(session) {
        return {
            sessionId: session.sessionId,
            userId: session.userId,
            state: session.state,
            pattern: session.pattern,
            currentPlan: session.currentPlan,
            currentTaskPlan: session.currentTaskPlan,
            preferences: session.preferences,
            recentEvents: session.events.slice(-5), // Last 5 events for context
            messageCount: session.messages.length,
            phase: this.config.mvp.phase,
            debugMode: this.config.mvp.debugMode,
        };
    }
    /**
     * Determine session state based on agent response (Task Interviewing Workflow)
     */
    determineSessionState(response, session) {
        // Task interviewing state determination
        if (response.includes('taskplan') ||
            response.includes('task plan') ||
            response.includes('prioritized tasks')) {
            return 'plan_draft';
        }
        if (response.includes('question') ||
            response.includes('clarify') ||
            response.includes('i have some questions')) {
            return 'clarify';
        }
        if (response.includes('tasks') ||
            response.includes('google tasks') ||
            response.includes('task analysis')) {
            return 'context_build';
        }
        // Legacy calendar-based detection
        if (response.includes('plan') && response.includes('blocks')) {
            return 'plan_draft';
        }
        if (response.includes('calendar') || response.includes('events')) {
            return 'context_build';
        }
        // Default to current state if no clear transition
        return session.state;
    }
    /**
     * Detect conversation pattern from message history (Task Interviewing Workflow)
     */
    detectConversationPattern(messages) {
        if (messages.length <= 2) {
            return 'quick-question';
        }
        const lastMessage = messages[messages.length - 1];
        // Check for task interviewing patterns
        if (this.isTaskPlanningRequest(lastMessage.content)) {
            return 'planning-session';
        }
        // Check for clarification patterns
        if (lastMessage.content.toLowerCase().includes('question') ||
            lastMessage.content.toLowerCase().includes('clarify') ||
            lastMessage.content.toLowerCase().includes('priority')) {
            return 'clarification-loop';
        }
        // Legacy calendar planning detection
        if (this.isPlanningRequest(lastMessage.content)) {
            return 'planning-session';
        }
        // Simple pattern detection for Phase 1A
        return 'quick-question';
    }
    /**
     * Check if message is a planning request
     */
    isPlanningRequest(message) {
        const planningKeywords = [
            'plan',
            'schedule',
            'day',
            'today',
            'tomorrow',
            'meetings',
            'calendar',
            'organize',
            'time',
        ];
        const lowerMessage = message.toLowerCase();
        return planningKeywords.some(keyword => lowerMessage.includes(keyword));
    }
    /**
     * Handle planning-related requests
     */
    async handlePlanningRequest(session, _message) {
        try {
            const planResponse = await this.generatePlan(session.sessionId, {});
            let response = `Here's your plan for ${planResponse.plan.date}:\n\n`;
            response += `**${planResponse.plan.summary}**\n\n`;
            response += '**Schedule:**\n';
            planResponse.plan.blocks.forEach((block) => {
                response += `• ${block.start}-${block.end}: ${block.label} (${block.type})\n`;
            });
            if (planResponse.needsClarification) {
                response += '\n**Questions for you:**\n';
                planResponse.questions.forEach(q => {
                    response += `• ${q}\n`;
                });
            }
            if (planResponse.plan.suggestions?.length) {
                response += '\n**Suggestions:**\n';
                planResponse.plan.suggestions.forEach((s) => {
                    response += `• ${s}\n`;
                });
            }
            return response;
        }
        catch (error) {
            return `I couldn't generate a plan right now. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
    /**
     * Handle general queries (Task Interviewing Workflow)
     */
    handleGeneralQuery(session, message) {
        // Phase 1A: Simple responses for non-planning queries
        if (message.toLowerCase().includes('help')) {
            return this.getHelpMessage();
        }
        if (message.toLowerCase().includes('status')) {
            return this.getStatusMessage(session);
        }
        return "I'm Orion, your conversational task planning assistant! I can help you understand and prioritize your tasks through thoughtful interviewing. Try asking me 'Help me plan my tasks' or 'What should I work on today?'.";
    }
    /**
     * Get help message (Task Interviewing Workflow with OpenAI Agents SDK)
     */
    getHelpMessage() {
        return `**Orion - Conversational Task Planning Assistant (Phase 1A + Chunk 3.2)**

I can help you with:
• **Task Interviewing**: "Help me plan my tasks" or "What should I work on?"
• **Priority Analysis**: "Help me prioritize my Google Tasks"
• **Task Review**: "Show me my tasks" or "What's on my task list?"
• **Status Check**: "What's my status?"

**Phase 1A Features + OpenAI Agents SDK Integration:**
• Google Tasks integration with OAuth2 authentication
• **OpenAI Agents SDK**: Advanced agent orchestration with structured outputs
• **Tool Handoffs**: Seamless coordination between TaskParser and PlannerLLM
• **Structured Outputs**: TaskPlan JSON schema enforcement
• Conversational task interviewing and priority analysis
• Read-only file operations for project context via MCP tools
• Multi-turn conversation support with follow-up questions

**Task Interviewing Process (Enhanced with Agents SDK):**
1. Agent reads your Google Tasks via task tools
2. Conducts structured interviews with tool handoffs
3. Generates validated TaskPlan with structured output schema
4. Provides calendar entry recommendations
5. Supports agent handoffs for specialized tasks

**OpenAI Agents SDK Features:**
• Agent-based tool orchestration
• Structured output validation
• Tool handoffs between components
• Enhanced error handling and recovery
• Advanced conversation management

**Coming in Phase 1B:**
• Calendar write operations for task scheduling
• Advanced approval workflows with agent guardrails
• User preference learning via agent memory
• Enhanced context management with agent handoffs

Type your request and I'll help you understand and plan your tasks using advanced agent workflows!`;
    }
    /**
     * Get status message (Task Interviewing Workflow with OpenAI Agents SDK)
     */
    getStatusMessage(session) {
        return `**Session Status**
• Session ID: ${session.sessionId}
• State: ${session.state}
• Pattern: ${session.pattern}
• Messages: ${session.messages.length}
• Current DayPlan: ${session.currentPlan ? '✓ Generated' : '✗ None'}
• Current TaskPlan: ${session.currentTaskPlan ? '✓ Generated' : '✗ None'}
• Started: ${session.startTime.toLocaleTimeString()}

**Orion Configuration (Chunk 3.2 Enhanced):**
• Phase: ${this.config.mvp.phase}
• Mode: ${this.config.mvp.mode}
• Debug: ${this.config.mvp.debugMode ? 'ON' : 'OFF'}
• Workflow: Task Interviewing (Google Tasks)
• **OpenAI Agents SDK**: ✓ Integrated
• **Agent Model**: ${this.config.agents.plannerModel}
• **Structured Outputs**: TaskPlan JSON Schema
• **Tool Handoffs**: TaskParser ↔ PlannerLLM
• **Agent Context**: ${this.agentContext.sessionId ? 'Session Active' : 'No Session'}`;
    }
    /**
     * Log audit events
     */
    auditLog(action, args) {
        const event = {
            ts: new Date().toISOString(),
            actor: 'orion-core',
            user: 'system',
            action,
            args,
            result: { ok: true },
            hash: this.generateHash(action + JSON.stringify(args)),
        };
        // Console logging for visibility in development
        if (this.config.mvp.debugMode) {
            console.warn(`[AUDIT] ${event.ts} - ${action}:`, args);
        }
        // Append audit event to file (JSONL). Best-effort; do not throw.
        try {
            const logPath = this.config.audit?.path || './logs/audit.jsonl';
            const dir = dirname(logPath);
            // Fire-and-forget to avoid blocking critical paths
            void mkdir(dir, { recursive: true }).then(() => appendFile(logPath, `${JSON.stringify(event)}\n`).catch(() => { }));
        }
        catch {
            // ignore audit file errors
        }
        // Notify host listener (web SSE bridge)
        try {
            this.auditListener?.(action, args);
        }
        catch { }
    }
    /**
     * Generate simple hash for audit chain
     */
    generateHash(data) {
        // Phase 1A: Simple hash, cryptographic hashing in later phases
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
}
export default OrionCore;
