/**
 * Orion Core - Phase 1A Implementation
 * Main orchestration and conversation loop
 */

import { CalendarParser } from '@orion/calendar-parser';
import { PlannerLLM } from '@orion/planner-llm';
import { MCPClient } from '@orion/mcp-client';
import { CommandRouter } from '@orion/command-router';
import type {
	AuditEvent,
	ConversationPattern,
	Message,
	OrionConfig,
	PlanRequest,
	PlanResponse,
	SessionContext,
} from './types.js';

export * from './types.js';

export class OrionCore {
	private calendarParser: CalendarParser;
	private plannerLLM: PlannerLLM;
	private mcpClient: MCPClient;
	private commandRouter: CommandRouter;
	private sessions = new Map<string, SessionContext>();

	constructor(private config: OrionConfig) {
		this.calendarParser = new CalendarParser(config.calendars);
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
	 * Process a user message in the conversation
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

			// Detect conversation pattern and update session state
			const detectedPattern: ConversationPattern = this.detectConversationPattern(session.messages);
			session.pattern = detectedPattern;

			// Route to appropriate handler based on pattern
			let response: string;

			if (this.isPlanningRequest(userMessage)) {
				session.state = 'context_build';
				response = await this.handlePlanningRequest(session, userMessage);
			} else {
				response = this.handleGeneralQuery(session, userMessage);
			}

			// Add assistant response to session
			session.messages.push({
				role: 'assistant',
				content: response,
				timestamp: new Date(),
			});

			this.auditLog('message_processed', {
				sessionId,
				pattern: session.pattern,
				state: session.state,
			});

			return response;
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

			// Build planning context
			const planningContext = {
				date: request.date ?? new Date().toISOString().split('T')[0],
				events,
				preferences: { ...session.preferences, ...(request.preferences ?? {}) },
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
	 * Detect conversation pattern from message history
	 */
	private detectConversationPattern(messages: Message[]): ConversationPattern {
		if (messages.length <= 2) {
			return 'quick-question';
		}

		const lastMessage = messages[messages.length - 1];

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
			planResponse.plan.blocks.forEach(block => {
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
				planResponse.plan.suggestions.forEach(s => {
					response += `• ${s}\n`;
				});
			}

			return response;
		} catch (error) {
			return `I couldn't generate a plan right now. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
		}
	}

	/**
	 * Handle general queries
	 */
	private handleGeneralQuery(session: SessionContext, message: string): string {
		// Phase 1A: Simple responses for non-planning queries
		if (message.toLowerCase().includes('help')) {
			return this.getHelpMessage();
		}

		if (message.toLowerCase().includes('status')) {
			return this.getStatusMessage(session);
		}

		return "I'm Orion, your daily planning copilot! I can help you plan your day, organize your schedule, and manage your tasks. Try asking me 'What's my day looking like?' or 'Help me plan today'.";
	}

	/**
	 * Get help message
	 */
	private getHelpMessage(): string {
		return `**Orion - Daily Planning Copilot (Phase 1A)**

I can help you with:
• **Day Planning**: "What's my day looking like?" or "Plan my day"
• **Schedule Review**: "Show me today's meetings"
• **Status Check**: "What's my status?"

**Phase 1A Features:**
• Basic day plan generation
• Calendar event reading (Google Calendar integration coming soon)
• Read-only file operations
• Conversation-based planning

**Coming in Phase 1B:**
• Advanced approval workflows
• Shell command execution
• User preference learning
• Enhanced context management

Type your request and I'll help you plan your day!`;
	}

	/**
	 * Get status message
	 */
	private getStatusMessage(session: SessionContext): string {
		return `**Session Status**
• Session ID: ${session.sessionId}
• State: ${session.state}
• Pattern: ${session.pattern}
• Messages: ${session.messages.length}
• Current Plan: ${session.currentPlan ? '✓ Generated' : '✗ None'}
• Started: ${session.startTime.toLocaleTimeString()}

**Orion Configuration:**
• Phase: ${this.config.mvp.phase}
• Mode: ${this.config.mvp.mode}
• Debug: ${this.config.mvp.debugMode ? 'ON' : 'OFF'}`;
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
