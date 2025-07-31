/**
 * Orion Agent - OpenAI Agents SDK Integration (Chunk 3.2)
 * Task interviewing workflow with structured TaskPlan outputs
 *
 * Note: This implementation demonstrates the core concepts from the OpenAI Agents SDK:
 * 1. Agent Definition with proper configuration
 * 2. Structured Outputs (TaskPlan JSON compliance)
 * 3. Tool Handoffs (TaskParser ↔ PlannerLLM coordination)
 */
import type { TaskPlan } from '@orion/planner-llm';
import type { Task } from '@orion/task-parser';
import { TaskParser } from '@orion/task-parser';
import { PlannerLLM } from '@orion/planner-llm';
import type { OrionConfig } from './types.js';
/**
 * Context for the Orion Agent - passed to tools and handoffs
 */
export interface OrionContext {
    config: OrionConfig;
    taskParser: TaskParser;
    plannerLLM: PlannerLLM;
    sessionId?: string;
    userId?: string;
}
/**
 * TaskParser ↔ PlannerLLM Tool Handoff Coordinator
 * This demonstrates the core concept of tool handoffs from OpenAI Agents SDK
 */
export declare class TaskPlanningOrchestrator {
    private taskParser;
    private plannerLLM;
    private config;
    constructor(taskParser: TaskParser, plannerLLM: PlannerLLM, config: OrionConfig);
    /**
     * Orchestrates task interviewing with structured TaskPlan output
     * This demonstrates the three core Chunk 3.2 concepts:
     * 1. Agent-like orchestration
     * 2. Structured TaskPlan JSON compliance
     * 3. Tool handoffs between TaskParser and PlannerLLM
     */
    conductTaskInterview(userMessage: string, sessionId?: string): Promise<{
        taskPlan: TaskPlan | null;
        success: boolean;
        error?: string;
    }>;
    /**
     * Validates TaskPlan structure for JSON compliance (Structured Outputs)
     */
    private validateTaskPlanStructure;
    /**
     * Reads tasks using TaskParser (demonstrates tool handoff)
     */
    readTasks(taskListIds?: string[]): Promise<{
        success: boolean;
        tasks?: Task[];
        error?: string;
    }>;
}
/**
 * Create the Orion Agent with OpenAI Agents SDK Concepts (Simplified)
 * Based on SPEC.md Section 9.1 with TaskPlan structured outputs
 */
export declare function createOrionAgent(config: OrionConfig): {
    name: string;
    instructions: string;
    model: string;
    orchestrator: TaskPlanningOrchestrator;
};
/**
 * Create Orion context for agent execution (OpenAI Agents SDK pattern)
 */
export declare function createOrionContext(config: OrionConfig, sessionId?: string, userId?: string): OrionContext;
/**
 * Run the Orion Agent with structured TaskPlan output
 * Demonstrates the three core Chunk 3.2 concepts in practice
 */
export declare function runOrionAgent(agent: {
    orchestrator: TaskPlanningOrchestrator;
}, context: OrionContext, userMessage: string): Promise<{
    taskPlan: TaskPlan | null;
    response: string;
}>;
