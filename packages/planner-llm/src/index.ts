/**
 * Planner LLM - Phase 1A Implementation
 * Basic day planning with OpenAI structured outputs
 */

import OpenAI from 'openai';
import { DayPlan, PlanningContext, PlannerConfig } from './types.js';

export * from './types.js';

export class PlannerLLM {
	private openai: OpenAI;

	constructor(private config: PlannerConfig, apiKey?: string) {
		this.openai = new OpenAI({
			apiKey: apiKey || process.env.OPENAI_API_KEY,
		});
	}

	/**
	 * Generate a structured day plan using LLM
	 * Phase 1A: Basic implementation with OpenAI structured outputs
	 */
	async generatePlan(context: PlanningContext): Promise<DayPlan> {
		try {
			const systemPrompt = this.buildSystemPrompt();
			const userPrompt = this.buildUserPrompt(context);

			// TODO: Implement OpenAI structured output call
			// For Phase 1A, return a basic plan structure
			const plan: DayPlan = {
				date: context.date,
				summary: 'Basic day plan generated - Phase 1A implementation in progress',
				blocks: [
					{
						start: '09:00:00',
						end: '10:00:00',
						label: 'Morning planning',
						type: 'admin',
						risk: 'low',
					},
				],
				ambiguities: [],
				suggestions: ['Phase 1A: Full LLM integration coming soon'],
			};

			return plan;
		} catch (error) {
			console.error('Failed to generate plan:', error);
			throw new Error('Plan generation failed');
		}
	}

	private buildSystemPrompt(): string {
		return `You are Orion, a daily planning copilot.
Voice: friendly, competent, natural.
Given events and preferences, create a pragmatic schedule for today.

Requirements:
- First emit valid JSON for schema DayPlan v1. Then provide a short human summary.
- Add focus blocks around meetings; keep breaks.
- Ask precise questions when information is missing (set ambiguities[].required=true).
- When proposing commands or files, include them in blocks[].commands/filesToOpen.
- Avoid rescheduling meetings with external attendees unless the user asks.`;
	}

	private buildUserPrompt(context: PlanningContext): string {
		return `Plan for ${context.date}:
Events: ${JSON.stringify(context.events, null, 2)}
Preferences: ${JSON.stringify(context.preferences, null, 2)}
Context: ${JSON.stringify(context.context || {}, null, 2)}`;
	}
}

export default PlannerLLM;