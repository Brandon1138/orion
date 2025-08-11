/**
 * Planner LLM - Phase 1A Implementation
 * Basic day planning with OpenAI structured outputs
 */
import type { PlannerConfig, TaskPlan, TaskInterviewInput } from './types.js';
export * from './types.js';
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
    events?: any[];
    preferences?: {
        focusBlockMins?: number;
        style?: string;
    };
    context?: Record<string, unknown>;
}
export declare class PlannerLLM {
    private config;
    private openai;
    private conversationState;
    constructor(config: PlannerConfig, apiKey?: string);
    private supportsTemperature;
    /**
     * Generate a structured day plan using LLM
     * Phase 1A: OpenAI structured outputs with fallback handling
     */
    generatePlan(context: PlanningContext): Promise<DayPlan>;
    /**
     * Generate plan using fallback model
     */
    private generatePlanWithFallback;
    /**
     * Generate a basic fallback plan when LLM fails
     */
    private generateFallbackPlan;
    /**
     * Enhanced conversation state management for interview flow
     */
    private updateConversationState;
    /**
     * Get conversation insights for debugging and optimization
     */
    private getConversationInsights;
    /**
     * Conduct conversational task interview using enhanced interview logic
     * Phase 1A: Multi-turn conversational task planning with intelligent question generation
     */
    conductTaskInterview(input: TaskInterviewInput, sessionId?: string): Promise<TaskPlan>;
    /**
     * Generate intelligent next steps based on interview state and insights
     */
    private generateIntelligentNextSteps;
    /**
     * Generate priority assessment questions for tasks
     */
    private generatePriorityQuestions;
    /**
     * Generate context gathering questions for task details
     */
    private generateContextQuestions;
    /**
     * Generate scheduling preference questions
     */
    private generateSchedulingQuestions;
    /**
     * Generate intelligent follow-up questions based on conversation context
     */
    private generateFollowUpQuestions;
    /**
     * Analyze conversation state to determine interview phase
     */
    private analyzeInterviewState;
    /**
     * Build conversational system prompt for task interviewing
     */
    private buildConversationalPrompt;
    /**
     * Build intelligent user prompt for task interview using enhanced interview logic
     */
    private buildTaskInterviewPrompt;
    /**
     * Validate TaskPlan against schema
     */
    private validateTaskPlan;
    /**
     * Generate a fallback TaskPlan when LLM fails
     */
    private generateFallbackTaskPlan;
    private buildSystemPrompt;
    private buildUserPrompt;
}
export default PlannerLLM;
