/**
 * Orion CLI - Phase 1A Implementation
 * Command line interface for Orion
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { readFile } from 'fs/promises';
import { join } from 'path';
import OrionCore, { OrionConfig } from '@orion/core';

export class OrionCLI {
	private orion?: OrionCore;
	private sessionId?: string;

	async run(): Promise<void> {
		const program = new Command();

		program
			.name('orion')
			.description('Orion - Daily Planning Copilot')
			.version('1.0.0 (Phase 1A)');

		program
			.command('plan')
			.description('Generate a day plan')
			.option('-d, --date <date>', 'Date in YYYY-MM-DD format', new Date().toISOString().split('T')[0])
			.option('--dry-run', 'Generate plan without executing actions')
			.action(async (options) => {
				await this.initializeOrion();
				await this.handlePlanCommand(options);
			});

		program
			.command('chat')
			.description('Start interactive chat session')
			.action(async () => {
				await this.initializeOrion();
				await this.handleChatCommand();
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
			.action(async (options) => {
				await this.handleAuditCommand(options);
			});

		await program.parseAsync();
	}

	private async initializeOrion(): Promise<void> {
		if (this.orion) return;

		try {
			console.log(chalk.blue('🚀 Initializing Orion...'));
			
			const config = await this.loadConfig();
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
			const configPath = process.env.ORION_CONFIG || './orion.config.json';
			const configData = await readFile(configPath, 'utf-8');
			return JSON.parse(configData);
		} catch (error) {
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
					plannerModel: 'gpt-4o',
					plannerTemperature: 0.2,
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

	private async handlePlanCommand(options: any): Promise<void> {
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
			response.plan.blocks.forEach(block => {
				const timeRange = `${block.start}-${block.end}`;
				const typeEmoji = this.getTypeEmoji(block.type);
				console.log(`  ${typeEmoji} ${chalk.cyan(timeRange)} ${block.label} ${chalk.gray(`(${block.type})`)}`);
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

	private async handleChatCommand(): Promise<void> {
		if (!this.orion || !this.sessionId) {
			console.error(chalk.red('❌ Orion not initialized'));
			return;
		}

		console.log(chalk.green('💬 Starting interactive chat with Orion'));
		console.log(chalk.gray('Type "exit" or "quit" to end the session\n'));

		while (true) {
			const { message } = await inquirer.prompt([
				{
					type: 'input',
					name: 'message',
					message: chalk.blue('You:'),
				},
			]);

			if (message.toLowerCase() === 'exit' || message.toLowerCase() === 'quit') {
				console.log(chalk.yellow('👋 Goodbye!'));
				break;
			}

			try {
				const response = await this.orion.processMessage(this.sessionId, message);
				console.log(chalk.green('Orion:'), response);
				console.log('');
			} catch (error) {
				console.error(chalk.red('❌ Error:'), error);
			}
		}
	}

	private async showStatusCommand(): Promise<void> {
		console.log(chalk.blue('📊 Orion Status'));
		console.log(chalk.gray('=' .repeat(50)));
		
		console.log(`${chalk.cyan('Version:')} 1.0.0 (Phase 1A)`);
		console.log(`${chalk.cyan('Status:')} ${chalk.green('Ready')}`);
		console.log(`${chalk.cyan('Features:')} Planning, Calendar Reading, File Operations`);
		console.log(`${chalk.cyan('Config:')} ${process.env.ORION_CONFIG || './orion.config.json'}`);
		
		// Check environment
		console.log('\n' + chalk.blue('🔧 Environment:'));
		console.log(`${chalk.cyan('Node.js:')} ${process.version}`);
		console.log(`${chalk.cyan('OpenAI API:')} ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
		
		if (this.orion && this.sessionId) {
			const session = this.orion.getSession(this.sessionId);
			if (session) {
				console.log('\n' + chalk.blue('📱 Current Session:'));
				console.log(`${chalk.cyan('Session ID:')} ${session.sessionId}`);
				console.log(`${chalk.cyan('State:')} ${session.state}`);
				console.log(`${chalk.cyan('Pattern:')} ${session.pattern}`);
				console.log(`${chalk.cyan('Messages:')} ${session.messages.length}`);
			}
		}
	}

	private async handleAuditCommand(options: any): Promise<void> {
		// Phase 1A: Basic audit log viewing
		console.log(chalk.blue('📋 Audit Log'));
		console.log(chalk.gray('Phase 1A: Console-based audit logging'));
		console.log(chalk.yellow('Full audit log persistence coming in Phase 1B'));
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