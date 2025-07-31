/**
 * Orion Core - Phase 1A Implementation with OpenAI Agents SDK Integration (Chunk 3.2)
 * Task interviewing workflow with Google Tasks integration
 */

import 'dotenv/config';
import OpenAI from 'openai';
import { Agent } from '@openai/agents';
import { CalendarParser } from '@orion/calendar-parser';
import { TaskParser } from '@orion/task-parser';
import { PlannerLLM } from '@orion/planner-llm';
import { MCPClient } from '@orion/mcp-client';
import { CommandRouter } from '@orion/command-router';
import type { Event } from '@orion/calendar-parser';
import type { Task, TaskContext } from '@orion/task-parser';
import type { TaskPlan, TaskInterviewInput } from '@orion/planner-llm';
import type { MCPToolCall } from '@orion/mcp-client';
import type {
	AuditEvent,
	ConversationPattern,
	Message,
	OrionConfig,
	PlanRequest,
	PlanResponse,
	SessionContext,
	SessionState,
} from './types.js';
import { createOrionAgent, createOrionContext, runOrionAgent, type OrionContext } from './agent.js';

export * from './types.js';

// Local interface definitions for backward compatibility
interface DayPlan {
	date: string;
	summary: string;
	blocks: PlanBlock[];
	ambiguities?: Ambiguity[];
	suggestions?: string[];
}

interface PlanBlock {
	start: string;
	end: string;
	label: string;
	type: 'meeting' | 'focus' | 'break' | 'admin' | 'commute' | 'exercise' | 'errand' | 'sleep';
	dependsOn?: string[];
	linkedEvents?: string[];
	filesToOpen?: string[];
	commands?: string[];
	risk?: 'low' | 'medium' | 'high';
}

interface Ambiguity {
	eventId?: string;
	question: string;
	options?: string[];
	required: boolean;
}

interface PlanningContext {
	date: string;
	events?: Event[];
	preferences?: {
		focusBlockMins?: number;
		style?: string;
	};
	context?: Record<string, unknown>;
}

export class OrionCore {
	private calendarParser: CalendarParser;
	private taskParser: TaskParser;
	private plannerLLM: PlannerLLM;
	private mcpClient: MCPClient;
	private commandRouter: CommandRouter;
	private openai: OpenAI;
	private sessions = new Map<string, SessionContext>();

	// OpenAI Agents SDK Integration (Chunk 3.2)
	private orionAgent: { name: string; instructions: string; model: string; orchestrator: any };
	private agentContext: OrionContext;

	constructor(private config: OrionConfig) {
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
			temperature: config.agents.plannerTemperature,
			fallbackModel: config.agents.fallbackModel,
		});

		// Initialize MCP client with policy
		this.mcpClient = new MCPClient(
			[{ id: 'local-fs', endpoint: 'stdio', scopes: ['fs.read', 'fs.list', 'fs.search'] }],
			{
				fsAllow: ['./fixtures/**', './packages/**', './docs/**'],
				fsDeny: ['./node_modules/**', './.git/**'],
				commandPolicy: {
					allow: [],
					deny: ['rm', 'del', 'format', 'mkfs', 'sudo'],
					default: 'block',
				},
				rateLimits: {
					operationsPerMinute: 10,
					maxFileSize: '1MB',
					timeoutSeconds: 30,
				},
			}
		);

		this.commandRouter = new CommandRouter(this.mcpClient);

		// Initialize OpenAI client for conversation management
		this.openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});

		// Initialize OpenAI Agents SDK components (Chunk 3.2)
		this.orionAgent = createOrionAgent(config);
		this.agentContext = createOrionContext(config);
	}

	/**
	 * Start a new conversation session
	 */
	startSession(userId: string): string {
		const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		const session: SessionContext = {
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
		this.auditLog('session_start', { sessionId, userId });

		return sessionId;
	}

	/**
	 * Handle user message with OpenAI Agents SDK (Chunk 3.2)
	 * This is the new preferred method for task interviewing workflow
	 */
	async handleUserMessageWithAgent(
		message: string,
		sessionId?: string,
		userId?: string
	): Promise<string> {
		try {
			// Update agent context with session information
			this.agentContext.sessionId = sessionId;
			this.agentContext.userId = userId;

			// Run the agent with the user message
			const { taskPlan, response } = await runOrionAgent(
				this.orionAgent,
				this.agentContext,
				message
			);

			// Update session with TaskPlan if available
			if (sessionId && taskPlan) {
				const session = this.sessions.get(sessionId);
				if (session) {
					session.currentTaskPlan = taskPlan;
					session.state = 'plan_draft';
					session.pattern = 'planning-session';

					// Add conversation to session messages
					session.messages.push(
						{
							role: 'user',
							content: message,
							timestamp: new Date(),
						},
						{
							role: 'assistant',
							content: response,
							timestamp: new Date(),
						}
					);
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
		} catch (error) {
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
	async handleUserMessage(message: string, sessionId?: string): Promise<string> {
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
		} catch (error) {
			const errorMessage = `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`;
			this.auditLog('handleUserMessage_error', { message, error: errorMessage });
			return errorMessage;
		}
	}

	/**
	 * Build task context from Google Tasks (Chunk 3.1)
	 */
	private async buildTaskContext(): Promise<TaskContext> {
		try {
			return await this.taskParser.loadTasks();
		} catch (error) {
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
	private async conductTaskInterview(
		taskContext: TaskContext,
		userMessage: string,
		session?: SessionContext | null
	): Promise<TaskPlan> {
		try {
			const interviewInput: TaskInterviewInput = {
				tasks: taskContext.tasks.map(task => ({
					id: task.id,
					provider: 'google-tasks' as const,
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
					sourceUri:
						task.source === 'google' ? `https://tasks.google.com/task/${task.id}` : undefined,
				})),
				userPreferences: session?.preferences
					? {
							focusBlockMinimum: (session.preferences.focusBlockMins as number) || 90,
							conversationStyle: 'collaborative' as const,
							prioritizationApproach: 'hybrid' as const,
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

			const taskPlan = await this.plannerLLM.conductTaskInterview(
				interviewInput,
				session?.sessionId
			);

			this.auditLog('conductTaskInterview_success', {
				sessionId: session?.sessionId,
				tasksCount: taskContext.tasks.length,
				questionsGenerated: taskPlan.questions?.length || 0,
			});

			return taskPlan;
		} catch (error) {
			this.auditLog('conductTaskInterview_error', { error: String(error) });
			throw error;
		}
	}

	/**
	 * Handle follow-up questions in task interview (Chunk 3.1)
	 */
	private async handleFollowUpQuestions(plan: TaskPlan, userResponse: string): Promise<TaskPlan> {
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
	private isTaskPlanningRequest(message: string): boolean {
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
	private formatTaskPlanWithQuestions(plan: TaskPlan): string {
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
	private formatTaskPlan(plan: TaskPlan): string {
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
	async processMessage(sessionId: string, userMessage: string): Promise<string> {
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

				const finalMessage =
					finalResponse.choices[0]?.message?.content ||
					'I apologize, but I had trouble processing your request.';

				// Update session state and add response
				session.state = this.determineSessionState(finalMessage, session);
				session.pattern = this.detectConversationPattern(session.messages);

				session.messages.push({
					role: 'assistant',
					content: finalMessage,
					timestamp: new Date(),
				});

				this.auditLog('message_processed', {
					sessionId,
					pattern: session.pattern,
					state: session.state,
					toolCallsUsed: responseMessage.tool_calls.length,
					responseLength: finalMessage.length,
				});

				return finalMessage;
			} else {
				// Direct response without tool calls
				const content =
					responseMessage.content || 'I apologize, but I had trouble processing your request.';

				session.state = this.determineSessionState(content, session);
				session.pattern = this.detectConversationPattern(session.messages);

				session.messages.push({
					role: 'assistant',
					content,
					timestamp: new Date(),
				});

				this.auditLog('message_processed', {
					sessionId,
					pattern: session.pattern,
					state: session.state,
					responseLength: content.length,
				});

				return content;
			}
		} catch (error) {
			const errorMessage = `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`;
			this.auditLog('message_error', { sessionId, error: errorMessage });
			return errorMessage;
		}
	}

	/**
	 * Generate a day plan
	 */
	async generatePlan(sessionId: string, request: PlanRequest): Promise<PlanResponse> {
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
			const planningContext: PlanningContext = {
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

			const response: PlanResponse = {
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
		} catch (error) {
			this.auditLog('plan_generation_error', { sessionId, error: String(error) });
			throw error;
		}
	}

	/**
	 * Get session information
	 */
	getSession(sessionId: string): SessionContext | undefined {
		return this.sessions.get(sessionId);
	}

	/**
	 * Set Google Tasks authentication tokens
	 */
	setGoogleTasksTokens(tokens: {
		access_token: string;
		refresh_token?: string;
		expiry_date?: number;
	}): void {
		this.taskParser.setGoogleTokens(tokens);

		// Also update the agent context with the authenticated task parser
		this.agentContext.taskParser.setGoogleTokens(tokens);

		this.auditLog('google_tasks_tokens_set', { hasRefreshToken: !!tokens.refresh_token });
	}

	/**
	 * Get Google Tasks OAuth authorization URL
	 */
	async getGoogleTasksAuthUrl(): Promise<string> {
		try {
			const authUrl = await this.taskParser.getGoogleAuthUrl();
			this.auditLog('google_tasks_auth_url_generated', { success: true });
			return authUrl;
		} catch (error) {
			this.auditLog('google_tasks_auth_url_error', { error: String(error) });
			throw error;
		}
	}

	/**
	 * Exchange Google Tasks authorization code for tokens
	 */
	async exchangeGoogleTasksAuthCode(code: string) {
		try {
			const tokens = await this.taskParser.exchangeGoogleAuthCode(code);
			this.auditLog('google_tasks_tokens_exchanged', { success: true });
			return tokens;
		} catch (error) {
			this.auditLog('google_tasks_auth_exchange_error', { error: String(error) });
			throw error;
		}
	}

	/**
	 * Build system instructions for the OpenAI Agent (Task Interviewing Workflow)
	 */
	private buildSystemInstructions(): string {
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
	private getToolDefinitions() {
		return [
			{
				type: 'function' as const,
				function: {
					name: 'conduct_task_interview',
					description:
						'Interview user about their tasks and generate structured TaskPlan with scheduling recommendations',
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
				type: 'function' as const,
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
				type: 'function' as const,
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
				type: 'function' as const,
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
				type: 'function' as const,
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
				type: 'function' as const,
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
				type: 'function' as const,
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
	private buildConversationHistory(session: SessionContext) {
		const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
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
	private async handleToolCalls(
		toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[]
	) {
		const results: OpenAI.Chat.Completions.ChatCompletionToolMessageParam[] = [];

		for (const toolCall of toolCalls) {
			try {
				let result: any;
				const args = JSON.parse(toolCall.function.arguments);

				switch (toolCall.function.name) {
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

				results.push({
					role: 'tool',
					content: JSON.stringify(result),
					tool_call_id: toolCall.id,
				});
			} catch (error) {
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
	private async handleConductTaskInterview(params: any) {
		try {
			const { userMessage, includeContext = true } = params;

			// Build task context
			const taskContext = await this.buildTaskContext();

			// Conduct interview
			const taskPlan = await this.conductTaskInterview(taskContext, userMessage);

			return {
				success: true,
				taskPlan,
				tasksCount: taskContext.tasks.length,
				questionsGenerated: taskPlan.questions?.length || 0,
				hasCalendarSuggestions: (taskPlan.calendarSuggestions?.length || 0) > 0,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Tool handler: Read tasks from Google Tasks
	 */
	private async handleReadTasks(params: any) {
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
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Tool handler: Generate day plan
	 */
	private async handleGenerateDayPlan(params: any) {
		try {
			const { date, includeEvents = true, context = {} } = params;

			// Load calendar events if requested
			let events: Event[] = [];
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
			const planningContext: PlanningContext = {
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
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Tool handler: Read calendar
	 */
	private async handleReadCalendar(params: any) {
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
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Tool handler: Read file
	 */
	private async handleReadFile(params: any) {
		const { path } = params;
		const toolCall: MCPToolCall = {
			serverId: 'local-fs',
			tool: 'fs.read',
			args: { path },
		};
		return await this.mcpClient.execute(toolCall);
	}

	/**
	 * Tool handler: List directory
	 */
	private async handleListDirectory(params: any) {
		const { path } = params;
		const toolCall: MCPToolCall = {
			serverId: 'local-fs',
			tool: 'fs.list',
			args: { path },
		};
		return await this.mcpClient.execute(toolCall);
	}

	/**
	 * Tool handler: Search files
	 */
	private async handleSearchFiles(params: any) {
		const { pattern, rootPath = '.' } = params;
		const toolCall: MCPToolCall = {
			serverId: 'local-fs',
			tool: 'fs.search',
			args: { pattern, path: rootPath },
		};
		return await this.mcpClient.execute(toolCall);
	}

	/**
	 * Build session context for the agent
	 */
	private async buildSessionContext(session: SessionContext): Promise<Record<string, unknown>> {
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
	private determineSessionState(response: string, session: SessionContext): SessionState {
		// Task interviewing state determination
		if (
			response.includes('taskplan') ||
			response.includes('task plan') ||
			response.includes('prioritized tasks')
		) {
			return 'plan_draft';
		}

		if (
			response.includes('question') ||
			response.includes('clarify') ||
			response.includes('i have some questions')
		) {
			return 'clarify';
		}

		if (
			response.includes('tasks') ||
			response.includes('google tasks') ||
			response.includes('task analysis')
		) {
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
	private detectConversationPattern(messages: Message[]): ConversationPattern {
		if (messages.length <= 2) {
			return 'quick-question';
		}

		const lastMessage = messages[messages.length - 1];

		// Check for task interviewing patterns
		if (this.isTaskPlanningRequest(lastMessage.content)) {
			return 'planning-session';
		}

		// Check for clarification patterns
		if (
			lastMessage.content.toLowerCase().includes('question') ||
			lastMessage.content.toLowerCase().includes('clarify') ||
			lastMessage.content.toLowerCase().includes('priority')
		) {
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
	private isPlanningRequest(message: string): boolean {
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
	private async handlePlanningRequest(session: SessionContext, _message: string): Promise<string> {
		try {
			const planResponse = await this.generatePlan(session.sessionId, {});

			let response = `Here's your plan for ${planResponse.plan.date}:\n\n`;
			response += `**${planResponse.plan.summary}**\n\n`;

			response += '**Schedule:**\n';
			planResponse.plan.blocks.forEach((block: PlanBlock) => {
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
				planResponse.plan.suggestions.forEach((s: string) => {
					response += `• ${s}\n`;
				});
			}

			return response;
		} catch (error) {
			return `I couldn't generate a plan right now. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
		}
	}

	/**
	 * Handle general queries (Task Interviewing Workflow)
	 */
	private handleGeneralQuery(session: SessionContext, message: string): string {
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
	private getHelpMessage(): string {
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
	private getStatusMessage(session: SessionContext): string {
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
	private auditLog(action: string, args: Record<string, unknown>): void {
		const event: AuditEvent = {
			ts: new Date().toISOString(),
			actor: 'orion-core',
			user: 'system',
			action,
			args,
			result: { ok: true },
			hash: this.generateHash(action + JSON.stringify(args)),
		};

		// Phase 1A: Console logging, file logging in next phase
		if (this.config.mvp.debugMode) {
			console.warn(`[AUDIT] ${event.ts} - ${action}:`, args);
		}
	}

	/**
	 * Generate simple hash for audit chain
	 */
	private generateHash(data: string): string {
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
