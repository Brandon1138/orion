/**
 * Orion CLI - Phase 1A Implementation
 * Command line interface for Orion
 */

import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { readFile } from 'fs/promises';
import type { OrionConfig } from '@orion/core';
import type { TaskPlan, TaskAnalysis, TaskQuestion, CalendarSuggestion } from '@orion/planner-llm';
import type { Task, TaskContext } from '@orion/task-parser';
import { TaskParser } from '@orion/task-parser';
import OrionCore from '@orion/core';

// Import legacy types for CLI display
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

export class OrionCLI {
	private orion?: OrionCore;
	private sessionId?: string;
	private config?: OrionConfig;

	async run(): Promise<void> {
		const program = new Command();

		program.name('orion').description('Orion - Daily Planning Copilot').version('1.0.0 (Phase 1A)');

		program
			.command('plan')
			.description('Generate a day plan')
			.option(
				'-d, --date <date>',
				'Date in YYYY-MM-DD format',
				new Date().toISOString().split('T')[0]
			)
			.option('--dry-run', 'Generate plan without executing actions')
			.action(async (options: { date: string; 'dry-run'?: boolean }) => {
				await this.initializeOrion();
				await this.handlePlanCommand(options);
			});

		program
			.command('chat')
			.description('Start interactive chat session')
			.option('--dry-run', 'Run chat without calling external APIs')
			.option(
				'-m, --message <message>',
				'Run a single-turn chat with the provided message and exit'
			)
			.action(async (options: { 'dry-run'?: boolean; message?: string }) => {
				await this.initializeOrion();
				await this.handleChatCommand(options);
			});

		program
			.command('agent-chat')
			.description('Start chat using OpenAI Agents SDK (Chunk 3.2)')
			.action(async () => {
				await this.initializeOrion();
				await this.handleAgentChatCommand();
			});

		// New Google Tasks workflow commands (Chunk 3.3)
		program
			.command('interview-tasks')
			.description('Start conversational interview about your Google Tasks')
			.option('--all-lists', 'Include all task lists (default: primary only)')
			.option('--include-completed', 'Include completed tasks in analysis')
			.addHelpText(
				'after',
				`
Examples:
  $ orion interview-tasks
  $ orion interview-tasks --all-lists --include-completed

This command starts a conversational interview where Orion will:
1. Read your Google Tasks
2. Ask questions about priorities, deadlines, and complexity
3. Generate a structured TaskPlan with scheduling recommendations`
			)
			.action(async (options: { 'all-lists'?: boolean; 'include-completed'?: boolean }) => {
				await this.initializeOrion();
				await this.handleInterviewTasksCommand(options);
			});

		program
			.command('read-tasks')
			.description('Display parsed Google Tasks')
			.option('--list-id <id>', 'Specific task list ID to read')
			.option('--include-completed', 'Include completed tasks')
			.option('--format <format>', 'Output format: table, json, summary', 'table')
			.addHelpText(
				'after',
				`
Examples:
  $ orion read-tasks
  $ orion read-tasks --format summary
  $ orion read-tasks --include-completed --format json

Displays your Google Tasks in various formats for review before planning.`
			)
			.action(
				async (options: { 'list-id'?: string; 'include-completed'?: boolean; format?: string }) => {
					await this.initializeOrion();
					await this.handleReadTasksCommand(options);
				}
			);

		program
			.command('task-plan')
			.alias('plan-tasks')
			.description('Generate TaskPlan from conversational interview')
			.option(
				'-d, --date <date>',
				'Target date for planning (YYYY-MM-DD)',
				new Date().toISOString().split('T')[0]
			)
			.option('--user-message <message>', 'Initial user message for planning context')
			.addHelpText(
				'after',
				`
Examples:
  $ orion task-plan
  $ orion task-plan --date 2025-02-01
  $ orion task-plan --user-message "Focus on urgent deadlines"

Generates a structured TaskPlan with priority analysis and calendar suggestions.`
			)
			.action(async (options: { date: string; 'user-message'?: string }) => {
				await this.initializeOrion();
				await this.handleTaskPlanCommand(options);
			});

		program
			.command('status')
			.description('Show Orion status and configuration')
			.action(async () => {
				await this.showStatusCommand();
			});

		program
			.command('audit')
			.description('Show audit log')
			.option('--tail', 'Follow audit log')
			.action((options: { tail?: boolean }) => {
				this.handleAuditCommand(options);
			});

		// Debug commands for conversation history and task analysis (Chunk 3.3)
		program
			.command('debug')
			.description('Debug commands for development')
			.option('--conversation', 'Show conversation history')
			.option('--session', 'Show current session state')
			.option('--task-analysis', 'Show last task analysis details')
			.action(
				(options: { conversation?: boolean; session?: boolean; 'task-analysis'?: boolean }) => {
					this.handleDebugCommand(options);
				}
			);

		program
			.command('auth')
			.description('Authentication management')
			.option('--google-tasks', 'Set up Google Tasks authentication')
			.option('--status', 'Show authentication status')
			.action(async (options: { googleTasks?: boolean; status?: boolean }) => {
				await this.handleAuthCommand(options);
			});

		await program.parseAsync();
	}

	private async initializeOrion(): Promise<void> {
		if (this.orion) return;

		try {
			console.log(chalk.blue('🚀 Initializing Orion...'));

			const config = await this.loadConfig();
			this.config = config;
			this.orion = new OrionCore(config);
			this.sessionId = this.orion.startSession('cli-user');

			console.log(chalk.green('✅ Orion initialized successfully!'));
			console.log(chalk.gray(`   Session ID: ${this.sessionId}`));
		} catch (error) {
			console.error(chalk.red('❌ Failed to initialize Orion:'), error);
			process.exit(1);
		}
	}

	private async loadConfig(): Promise<OrionConfig> {
		try {
			const configPath = process.env.ORION_CONFIG ?? './orion.config.json';
			const configData = await readFile(configPath, 'utf-8');
			return JSON.parse(configData) as OrionConfig;
		} catch {
			console.error(chalk.yellow('⚠️  Could not load config, using defaults'));

			// Return minimal Phase 1A config
			return {
				profile: {
					timezone: 'America/New_York',
					workday: { start: '09:00', end: '18:00', focusBlockMins: 90 },
					style: 'concise',
				},
				mvp: {
					mode: 'development',
					phase: '1A',
					quickStart: true,
					enabledFeatures: ['calendar-read', 'planning', 'file-read'],
					skipApprovals: ['read-operations'],
					autoAcceptPlans: false,
					debugMode: true,
					maxContextTokens: 24000,
					phaseEnforcement: true,
					circuitBreakers: true,
					rateLimiting: true,
				},
				calendars: {
					google: { enabled: false, calendarIds: [], readOnly: true },
					ics: [],
				},
				agents: {
					plannerModel: 'gpt-5-nano',
					fallbackModel: 'claude-3-5-sonnet',
					codexEnabled: false,
				},
				keys: {
					openaiKeyRef: 'env:OPENAI_API_KEY',
					googleKeyRef: 'keychain:GOOGLE_OAUTH_REFRESH',
					msgraphKeyRef: 'keychain:MSGRAPH_REFRESH',
				},
				audit: {
					path: './logs/audit.jsonl',
					hashing: true,
					includeMetrics: true,
					retentionDays: 90,
				},
			};
		}
	}

	private async handlePlanCommand(options: { date: string }): Promise<void> {
		if (!this.orion || !this.sessionId) {
			console.error(chalk.red('❌ Orion not initialized'));
			return;
		}

		console.log(chalk.blue(`📅 Generating plan for ${options.date}...`));

		try {
			const response = await this.orion.generatePlan(this.sessionId, {
				date: options.date,
			});

			console.log(chalk.green('\n✨ Your Day Plan'));
			console.log(chalk.gray('='.repeat(50)));
			console.log(chalk.bold(response.plan.summary));
			console.log('');

			console.log(chalk.blue('📋 Schedule:'));
			response.plan.blocks.forEach((block: PlanBlock) => {
				const timeRange = `${block.start}-${block.end}`;
				const typeEmoji = this.getTypeEmoji(block.type);
				console.log(
					`  ${typeEmoji} ${chalk.cyan(timeRange)} ${block.label} ${chalk.gray(`(${block.type})`)}`
				);
			});

			if (response.needsClarification) {
				console.log(chalk.yellow('\n❓ Questions for you:'));
				response.questions.forEach(q => {
					console.log(`  • ${q}`);
				});
			}
		} catch (error) {
			console.error(chalk.red('❌ Failed to generate plan:'), error);
		}
	}

	private async handleChatCommand(options?: {
		'dry-run'?: boolean;
		message?: string;
	}): Promise<void> {
		if (!this.orion || !this.sessionId) {
			console.error(chalk.red('❌ Orion not initialized'));
			return;
		}

		if (options?.message) {
			// One-shot, non-interactive mode
			try {
				if (options['dry-run']) {
					const model = this.config?.agents?.plannerModel || 'gpt-5-nano';
					const reply =
						"Hello! I'm Orion. In dry-run mode, I won't call external APIs.\n" +
						`I can help with: planning your day, interviewing your tasks, and summarising status. (model: ${model})`;
					console.log(chalk.green('Orion:'), reply);
					return;
				}

				const response = await this.orion.processMessage(this.sessionId, options.message);
				console.log(chalk.green('Orion:'), response);
				return;
			} catch (error) {
				console.error(chalk.red('❌ Error:'), error);
				return;
			}
		}

		console.log(chalk.green('💬 Starting interactive chat with Orion'));
		console.log(chalk.gray('Type "exit" or "quit" to end the session\n'));

		let shouldContinue = true;
		while (shouldContinue) {
			const result = await inquirer.prompt<{ message: string }>([
				{
					type: 'input',
					name: 'message',
					message: chalk.blue('You:'),
				},
			]);

			const message = result.message;
			if (
				typeof message === 'string' &&
				(message.toLowerCase() === 'exit' || message.toLowerCase() === 'quit')
			) {
				console.log(chalk.yellow('👋 Goodbye!'));
				shouldContinue = false;
				continue;
			}

			if (typeof message === 'string') {
				try {
					if (options?.['dry-run']) {
						// Simulate a helpful response without API calls
						const model = this.config?.agents?.plannerModel || 'gpt-5-nano';
						const reply =
							"Hello! I'm Orion. In dry-run mode, I won't call external APIs.\n" +
							`I can help with: planning your day, interviewing your tasks, and summarising status. (model: ${model})`;
						console.log(chalk.green('Orion:'), reply);
						console.log('');
					} else {
						const response = await this.orion.processMessage(this.sessionId, message);
						console.log(chalk.green('Orion:'), response);
						console.log('');
					}
				} catch (error) {
					console.error(chalk.red('❌ Error:'), error);
				}
			}
		}
	}

	private async handleAgentChatCommand(): Promise<void> {
		if (!this.orion || !this.sessionId) {
			console.error(chalk.red('❌ Orion not initialized'));
			return;
		}

		console.log(chalk.green('🤖 Starting OpenAI Agents SDK chat with Orion'));
		console.log(
			chalk.magenta('✨ Enhanced with structured outputs, tool handoffs, and agent orchestration')
		);
		console.log(chalk.gray('Type "exit" or "quit" to end the session\n'));

		let shouldContinue = true;
		while (shouldContinue) {
			const result = await inquirer.prompt<{ message: string }>([
				{
					type: 'input',
					name: 'message',
					message: chalk.blue('You:'),
				},
			]);

			const message = result.message;
			if (
				typeof message === 'string' &&
				(message.toLowerCase() === 'exit' || message.toLowerCase() === 'quit')
			) {
				console.log(chalk.yellow('👋 Goodbye! Agent session ended.'));
				shouldContinue = false;
				continue;
			}

			if (typeof message === 'string') {
				try {
					console.log(chalk.dim('🔄 Agent processing with tool handoffs...'));
					const response = await this.orion.handleUserMessageWithAgent(
						message,
						this.sessionId,
						'cli-user'
					);
					console.log(chalk.green('🤖 Orion Agent:'), response);
					console.log('');
				} catch (error) {
					console.error(chalk.red('❌ Agent Error:'), error);
				}
			}
		}
	}

	private async showStatusCommand(): Promise<void> {
		console.log(chalk.blue('📊 Orion Status'));
		console.log(chalk.gray('='.repeat(50)));

		console.log(`${chalk.cyan('Version:')} 1.0.0 (Phase 1A + Chunk 3.3 Complete)`);
		console.log(`${chalk.cyan('Status:')} ${chalk.green('Ready with Google Tasks Integration')}`);
		console.log(
			`${chalk.cyan('Features:')} Google Tasks, Task Interviewing, TaskPlan Generation, Agents SDK`
		);

		console.log(`${chalk.cyan('Config:')} ${process.env.ORION_CONFIG ?? './orion.config.json'}`);
		if (!this.config) {
			try {
				this.config = await this.loadConfig();
			} catch {
				// ignore
			}
		}
		if (this.config?.agents?.plannerModel) {
			console.log(
				`${chalk.cyan('Default Model:')} ${chalk.magenta(this.config.agents.plannerModel)}`
			);
		}

		// Check environment
		console.log(`\n${chalk.blue('🔧 Environment:')}`);
		console.log(`${chalk.cyan('Node.js:')} ${process.version}`);
		console.log(
			`${chalk.cyan('OpenAI API:')} ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`
		);

		// Show available commands
		console.log(`\n${chalk.blue('📋 Available Commands:')}`);
		console.log(`${chalk.cyan('orion interview-tasks')} - Start conversational task interview`);
		console.log(`${chalk.cyan('orion read-tasks')} - Display Google Tasks (table/json/summary)`);
		console.log(`${chalk.cyan('orion task-plan')} - Generate TaskPlan with scheduling`);
		console.log(`${chalk.cyan('orion chat')} - Interactive conversation mode`);
		console.log(`${chalk.cyan('orion agent-chat')} - OpenAI Agents SDK chat mode`);
		console.log(`${chalk.cyan('orion auth --google-tasks')} - Set up Google Tasks authentication`);
		console.log(`${chalk.cyan('orion debug --conversation')} - View conversation history`);

		if (this.orion && this.sessionId) {
			const session = this.orion.getSession(this.sessionId);
			if (session) {
				console.log(`\n${chalk.blue('📱 Current Session:')}`);
				console.log(`${chalk.cyan('Session ID:')} ${session.sessionId}`);
				console.log(`${chalk.cyan('State:')} ${session.state}`);
				console.log(`${chalk.cyan('Pattern:')} ${session.pattern}`);
				console.log(`${chalk.cyan('Messages:')} ${session.messages.length}`);
				console.log(
					`${chalk.cyan('Has TaskPlan:')} ${session.currentTaskPlan ? '✅ Yes' : '❌ No'}`
				);

				if (session.currentTaskPlan) {
					const plan = session.currentTaskPlan;
					console.log(`${chalk.cyan('Tasks Analyzed:')} ${plan.taskAnalysis.length}`);
					console.log(`${chalk.cyan('Questions:')} ${plan.questions?.length || 0}`);
					console.log(
						`${chalk.cyan('Calendar Suggestions:')} ${plan.calendarSuggestions?.length || 0}`
					);
				}
			}
		} else {
			console.log(`\n${chalk.yellow('⚠️ No active session. Run a command to initialize Orion.')}`);
		}

		console.log(`\n${chalk.blue('🚀 Quick Start:')}`);
		console.log(`1. ${chalk.cyan('orion auth --google-tasks')} - Set up authentication`);
		console.log(`2. ${chalk.cyan('orion interview-tasks')} - Start task planning conversation`);
		console.log(`3. ${chalk.cyan('orion debug --task-analysis')} - View your task plan`);
	}

	private handleAuditCommand(_options: Record<string, unknown>): void {
		// Phase 1A: Basic audit log viewing
		console.log(chalk.blue('📋 Audit Log'));
		console.log(chalk.gray('Phase 1A: Console-based audit logging'));
		console.log(chalk.yellow('Full audit log persistence coming in Phase 1B'));
	}

	private handleDebugCommand(options: {
		conversation?: boolean;
		session?: boolean;
		'task-analysis'?: boolean;
	}): void {
		if (!this.orion || !this.sessionId) {
			console.error(chalk.red('❌ Orion not initialized'));
			return;
		}

		const session = this.orion.getSession(this.sessionId);
		if (!session) {
			console.error(chalk.red('❌ No active session found'));
			return;
		}

		if (options.conversation) {
			console.log(chalk.blue('💬 Conversation History'));
			console.log(chalk.gray('='.repeat(50)));

			if (session.messages.length === 0) {
				console.log(chalk.yellow('No messages in conversation history'));
				return;
			}

			session.messages.forEach((msg, index) => {
				const timestamp = msg.timestamp.toLocaleTimeString();
				const roleColor = msg.role === 'user' ? chalk.cyan : chalk.green;
				console.log(`${index + 1}. [${timestamp}] ${roleColor(msg.role.toUpperCase())}:`);
				console.log(`   ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}`);
				console.log('');
			});
		}

		if (options.session) {
			console.log(chalk.blue('📱 Session State'));
			console.log(chalk.gray('='.repeat(50)));
			console.log(`${chalk.cyan('Session ID:')} ${session.sessionId}`);
			console.log(`${chalk.cyan('User ID:')} ${session.userId}`);
			console.log(`${chalk.cyan('State:')} ${session.state}`);
			console.log(`${chalk.cyan('Pattern:')} ${session.pattern}`);
			console.log(`${chalk.cyan('Messages:')} ${session.messages.length}`);
			console.log(`${chalk.cyan('Events:')} ${session.events.length}`);
			console.log(`${chalk.cyan('Started:')} ${session.startTime.toLocaleString()}`);
			console.log(`${chalk.cyan('Has DayPlan:')} ${session.currentPlan ? '✅' : '❌'}`);
			console.log(`${chalk.cyan('Has TaskPlan:')} ${session.currentTaskPlan ? '✅' : '❌'}`);
		}

		if (options['task-analysis']) {
			console.log(chalk.blue('🎯 Task Analysis'));
			console.log(chalk.gray('='.repeat(50)));

			if (session.currentTaskPlan) {
				this.displayTaskPlan(session.currentTaskPlan);
			} else {
				console.log(chalk.yellow('No task analysis available. Run interview-tasks first.'));
			}
		}

		// If no specific options, show all
		if (!options.conversation && !options.session && !options['task-analysis']) {
			console.log(chalk.blue('🐛 Debug Information'));
			console.log(chalk.gray('Available debug options:'));
			console.log('  --conversation   Show conversation history');
			console.log('  --session        Show session state');
			console.log('  --task-analysis  Show task analysis details');
		}
	}

	private async handleAuthCommand(options: {
		googleTasks?: boolean;
		status?: boolean;
	}): Promise<void> {
		if (options.googleTasks) {
			console.log(chalk.blue('🔐 Google Tasks Authentication Setup'));
			console.log(chalk.gray('='.repeat(50)));

			if (!this.orion) {
				await this.initializeOrion();
			}

			try {
				console.log(chalk.dim('🔄 Generating Google Tasks authorization URL...'));
				const authUrl = await this.orion!.getGoogleTasksAuthUrl();

				console.log(chalk.green('✅ Authorization URL generated!'));
				console.log('');
				console.log(chalk.bold('1. Open this URL in your browser:'));
				console.log(chalk.cyan(authUrl));
				console.log('');
				console.log(chalk.bold('2. Authorize Orion to access your Google Tasks'));
				console.log(chalk.bold('3. Copy the authorization code from the redirect URL'));
				console.log('');

				// Interactive code exchange
				const result = await inquirer.prompt<{ code: string }>([
					{
						type: 'input',
						name: 'code',
						message: 'Enter the authorization code:',
					},
				]);

				if (result.code && typeof result.code === 'string' && result.code.trim()) {
					console.log(chalk.dim('🔄 Exchanging authorization code for tokens...'));
					const tokens = await this.orion!.exchangeGoogleTasksAuthCode(result.code.trim());

					// Set the tokens in Orion for immediate use
					this.orion!.setGoogleTasksTokens(tokens);

					console.log(chalk.green('✅ Google Tasks authentication successful!'));
					console.log(chalk.gray('You can now use commands like: orion read-tasks'));
				} else {
					console.log(chalk.yellow('⚠️ No authorization code provided. Authentication cancelled.'));
				}
			} catch (error) {
				console.error(chalk.red('❌ Authentication failed:'), error);
			}
		}

		if (options.status) {
			console.log(chalk.blue('🔐 Authentication Status'));
			console.log(chalk.gray('='.repeat(50)));

			// Check OpenAI API key
			const hasOpenAI = !!process.env.OPENAI_API_KEY;
			console.log(
				`${chalk.cyan('OpenAI API:')} ${hasOpenAI ? chalk.green('✅ Configured') : chalk.red('❌ Missing')}`
			);

			// Check Google Tasks (this would require checking stored tokens)
			console.log(
				`${chalk.cyan('Google Tasks:')} ${chalk.yellow('⚠️ Status check not implemented')}`
			);
			console.log(
				chalk.gray('Run: orion auth --google-tasks to set up Google Tasks authentication')
			);
		}

		// If no specific options, show help
		if (!options.googleTasks && !options.status) {
			console.log(chalk.blue('🔐 Authentication Management'));
			console.log(chalk.gray('Available auth options:'));
			console.log('  --google-tasks   Set up Google Tasks OAuth2 authentication');
			console.log('  --status         Show authentication status');
		}
	}

	// New handler methods for Google Tasks workflow (Chunk 3.3)

	private async handleInterviewTasksCommand(options: {
		'all-lists'?: boolean;
		'include-completed'?: boolean;
	}): Promise<void> {
		if (!this.orion || !this.sessionId) {
			console.error(chalk.red('❌ Orion not initialized'));
			return;
		}

		console.log(chalk.blue('🎯 Starting conversational task interview...'));
		console.log(
			chalk.gray("I'll read your Google Tasks and help you plan your day through conversation.")
		);
		console.log('');

		try {
			// Start the conversational interview workflow
			const message = `Help me plan my tasks. ${options['include-completed'] ? 'Include completed tasks in the analysis.' : 'Focus on incomplete tasks only.'} ${options['all-lists'] ? 'Look at all my task lists.' : 'Use my primary task list.'}`;

			console.log(chalk.dim('🔄 Reading your Google Tasks and starting interview...'));
			const response = await this.orion.handleUserMessageWithAgent(
				message,
				this.sessionId,
				'cli-user'
			);

			console.log(chalk.green('🤖 Orion:'), response);
			console.log('');

			// Continue conversational loop
			await this.continueTaskInterview();
		} catch (error) {
			console.error(chalk.red('❌ Failed to start task interview:'), error);
		}
	}

	private async handleReadTasksCommand(options: {
		'list-id'?: string;
		'include-completed'?: boolean;
		format?: string;
	}): Promise<void> {
		if (!this.orion || !this.sessionId) {
			console.error(chalk.red('❌ Orion not initialized'));
			return;
		}

		console.log(chalk.blue('📋 Reading Google Tasks...'));

		try {
			// Use the handleReadTasks method from OrionCore
			const taskListIds = options['list-id'] ? [options['list-id']] : undefined;
			const result = await (this.orion as any).handleReadTasks({
				taskListIds,
				includeCompleted: options['include-completed'] || false,
			});

			if (!result.success) {
				console.error(chalk.red('❌ Failed to read tasks:'), result.error);
				return;
			}

			// Display tasks based on format
			const { tasks, taskLists, totalTasks } = result;

			console.log(chalk.green(`✅ Found ${totalTasks} tasks from ${taskLists.length} task lists`));
			console.log('');

			switch (options.format) {
				case 'json':
					console.log(JSON.stringify({ tasks, taskLists }, null, 2));
					break;
				case 'summary':
					this.displayTasksSummary(tasks, taskLists);
					break;
				default:
					this.displayTasksTable(tasks, taskLists);
			}
		} catch (error) {
			console.error(chalk.red('❌ Failed to read tasks:'), error);
		}
	}

	private async handleTaskPlanCommand(options: {
		date: string;
		'user-message'?: string;
	}): Promise<void> {
		if (!this.orion || !this.sessionId) {
			console.error(chalk.red('❌ Orion not initialized'));
			return;
		}

		console.log(chalk.blue(`🎯 Generating TaskPlan for ${options.date}...`));

		try {
			const userMessage =
				options['user-message'] ||
				`Generate a task plan for ${options.date}. Please read my Google Tasks and create a structured plan with scheduling recommendations.`;

			console.log(chalk.dim('🔄 Analyzing tasks and generating plan...'));
			const response = await this.orion.handleUserMessageWithAgent(
				userMessage,
				this.sessionId,
				'cli-user'
			);

			console.log(chalk.green('🎯 TaskPlan Generated:'));
			console.log(chalk.gray('='.repeat(60)));

			// Try to parse TaskPlan from response for better formatting
			try {
				const taskPlanMatch = response.match(/```json\n([\s\S]*?)\n```/);
				if (taskPlanMatch) {
					const taskPlan: TaskPlan = JSON.parse(taskPlanMatch[1]);
					this.displayTaskPlan(taskPlan);
				} else {
					// Fallback to plain text display
					console.log(response);
				}
			} catch {
				// If parsing fails, display the raw response
				console.log(response);
			}
		} catch (error) {
			console.error(chalk.red('❌ Failed to generate task plan:'), error);
		}
	}

	private async continueTaskInterview(): Promise<void> {
		console.log(chalk.gray('Continue the conversation (type "done" to finish):'));
		console.log('');

		let shouldContinue = true;
		while (shouldContinue) {
			const result = await inquirer.prompt<{ message: string }>([
				{
					type: 'input',
					name: 'message',
					message: chalk.blue('You:'),
				},
			]);

			const message = result.message;
			if (
				typeof message === 'string' &&
				(message.toLowerCase() === 'done' ||
					message.toLowerCase() === 'exit' ||
					message.toLowerCase() === 'quit')
			) {
				console.log(chalk.green('✅ Task interview completed!'));
				shouldContinue = false;
				continue;
			}

			if (typeof message === 'string' && message.trim()) {
				try {
					console.log(chalk.dim('🔄 Processing your response...'));
					const response = await this.orion!.handleUserMessageWithAgent(
						message,
						this.sessionId!,
						'cli-user'
					);
					console.log(chalk.green('🤖 Orion:'), response);
					console.log('');
				} catch (error) {
					console.error(chalk.red('❌ Error:'), error);
				}
			}
		}
	}

	// Display formatting methods for new workflow (Chunk 3.3)

	private displayTasksTable(tasks: Task[], taskLists: Array<{ id: string; title: string }>): void {
		if (tasks.length === 0) {
			console.log(chalk.yellow('📭 No tasks found'));
			return;
		}

		// Group tasks by list
		const tasksByList = new Map<string, Task[]>();
		tasks.forEach(task => {
			const listId = task.listId || 'unknown';
			if (!tasksByList.has(listId)) {
				tasksByList.set(listId, []);
			}
			tasksByList.get(listId)!.push(task);
		});

		// Display each list
		tasksByList.forEach((listTasks, listId) => {
			const taskList = taskLists.find(list => list.id === listId);
			const listTitle = taskList?.title || `Unknown List (${listId})`;

			console.log(chalk.cyan(`\n📋 ${listTitle}`));
			console.log(chalk.gray('-'.repeat(50)));

			listTasks.forEach(task => {
				const statusEmoji = task.status === 'completed' ? '✅' : '⏳';
				const priorityIndicator = task.due ? '🔥' : '';
				const dueDate = task.due
					? chalk.yellow(`(due: ${new Date(task.due).toLocaleDateString()})`)
					: '';

				console.log(`  ${statusEmoji} ${priorityIndicator} ${chalk.bold(task.title)} ${dueDate}`);

				if (task.notes) {
					console.log(
						chalk.gray(
							`     💭 ${task.notes.substring(0, 80)}${task.notes.length > 80 ? '...' : ''}`
						)
					);
				}

				if (task.level > 0) {
					console.log(chalk.dim(`     └─ Subtask (level ${task.level})`));
				}
			});
		});
	}

	private displayTasksSummary(
		tasks: Task[],
		taskLists: Array<{ id: string; title: string }>
	): void {
		const completedCount = tasks.filter(t => t.status === 'completed').length;
		const pendingCount = tasks.filter(t => t.status === 'needsAction').length;
		const withDueDates = tasks.filter(t => t.due).length;
		const overdue = tasks.filter(t => t.due && new Date(t.due) < new Date()).length;

		console.log(chalk.blue('📊 Task Summary'));
		console.log(chalk.gray('='.repeat(30)));
		console.log(`${chalk.green('✅ Completed:')} ${completedCount}`);
		console.log(`${chalk.yellow('⏳ Pending:')} ${pendingCount}`);
		console.log(`${chalk.cyan('📅 With due dates:')} ${withDueDates}`);
		if (overdue > 0) {
			console.log(`${chalk.red('🔥 Overdue:')} ${overdue}`);
		}
		console.log(`${chalk.blue('📋 Task lists:')} ${taskLists.length}`);

		// Show task lists
		console.log('\n📂 Task Lists:');
		taskLists.forEach(list => {
			const listTasks = tasks.filter(t => t.listId === list.id);
			console.log(`  • ${chalk.cyan(list.title)} (${listTasks.length} tasks)`);
		});
	}

	private displayTaskPlan(taskPlan: TaskPlan): void {
		console.log(chalk.bold(`📅 Plan Date: ${taskPlan.planDate}`));
		console.log(chalk.gray(`💬 Summary: ${taskPlan.conversationSummary}`));
		console.log('');

		// Display task analysis
		if (taskPlan.taskAnalysis && taskPlan.taskAnalysis.length > 0) {
			console.log(chalk.blue('🎯 Task Analysis:'));
			taskPlan.taskAnalysis.forEach((analysis: TaskAnalysis, index: number) => {
				const priorityColor = this.getPriorityColor(analysis.priority);
				const complexityEmoji = this.getComplexityEmoji(analysis.complexity);

				console.log(`${index + 1}. ${chalk.bold(analysis.title)}`);
				console.log(
					`   ${priorityColor(`Priority: ${analysis.priority}`)} | ${complexityEmoji} ${analysis.complexity} | ⏱️  ${analysis.estimatedDuration}min`
				);
				console.log(
					`   📅 Suggested: ${analysis.suggestedSchedule.preferredDate} ${analysis.suggestedSchedule.preferredTimeSlot || ''}`
				);

				if (analysis.context.blockers && analysis.context.blockers.length > 0) {
					console.log(`   🚫 Blockers: ${analysis.context.blockers.join(', ')}`);
				}

				if (analysis.dependencies && analysis.dependencies.length > 0) {
					console.log(`   🔗 Depends on: ${analysis.dependencies.join(', ')}`);
				}
				console.log('');
			});
		}

		// Display questions if any
		if (taskPlan.questions && taskPlan.questions.length > 0) {
			console.log(chalk.yellow('❓ Follow-up Questions:'));
			taskPlan.questions.forEach((q: TaskQuestion, index: number) => {
				console.log(`${index + 1}. ${q.question}`);
				if (q.options) {
					q.options.forEach((option: string) => console.log(`   • ${option}`));
				}
			});
			console.log('');
		}

		// Display calendar suggestions
		if (taskPlan.calendarSuggestions && taskPlan.calendarSuggestions.length > 0) {
			console.log(chalk.green('📅 Calendar Suggestions:'));
			taskPlan.calendarSuggestions.forEach((suggestion: CalendarSuggestion, index: number) => {
				console.log(`${index + 1}. ${chalk.bold(suggestion.eventTitle)}`);
				console.log(
					`   📅 ${suggestion.suggestedDate} ${suggestion.suggestedTime || ''} (${suggestion.duration}min)`
				);
				console.log(`   📝 ${suggestion.description}`);
				console.log('');
			});
		}

		// Display next steps
		if (taskPlan.nextSteps && taskPlan.nextSteps.length > 0) {
			console.log(chalk.magenta('🚀 Next Steps:'));
			taskPlan.nextSteps.forEach((step: string, index: number) => {
				console.log(`${index + 1}. ${step}`);
			});
		}
	}

	private getPriorityColor(priority: string): (text: string) => string {
		switch (priority) {
			case 'urgent':
				return chalk.red;
			case 'high':
				return chalk.yellow;
			case 'medium':
				return chalk.blue;
			case 'low':
				return chalk.gray;
			default:
				return chalk.white;
		}
	}

	private getComplexityEmoji(complexity: string): string {
		switch (complexity) {
			case 'simple':
				return '🟢';
			case 'moderate':
				return '🟡';
			case 'complex':
				return '🔴';
			default:
				return '⚪';
		}
	}

	private getTypeEmoji(type: string): string {
		const emojis: Record<string, string> = {
			meeting: '🤝',
			focus: '🎯',
			break: '☕',
			admin: '📋',
			commute: '🚗',
			exercise: '💪',
			errand: '🏃',
			sleep: '😴',
		};
		return emojis[type] || '📅';
	}
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
	const cli = new OrionCLI();
	cli.run().catch(console.error);
}

export default OrionCLI;
