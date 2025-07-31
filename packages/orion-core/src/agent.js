/**
 * Orion Agent - OpenAI Agents SDK Integration (Chunk 3.2)
 * Task interviewing workflow with structured TaskPlan outputs
 *
 * Note: This implementation demonstrates the core concepts from the OpenAI Agents SDK:
 * 1. Agent Definition with proper configuration
 * 2. Structured Outputs (TaskPlan JSON compliance)
 * 3. Tool Handoffs (TaskParser ↔ PlannerLLM coordination)
 */
import { TaskParser } from '@orion/task-parser';
import { PlannerLLM } from '@orion/planner-llm';
/**
 * Create conversational system prompt for task interviewing
 */
function conversationalSystemPrompt() {
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
 * TaskParser ↔ PlannerLLM Tool Handoff Coordinator
 * This demonstrates the core concept of tool handoffs from OpenAI Agents SDK
 */
export class TaskPlanningOrchestrator {
    taskParser;
    plannerLLM;
    config;
    constructor(taskParser, plannerLLM, config) {
        this.taskParser = taskParser;
        this.plannerLLM = plannerLLM;
        this.config = config;
    }
    /**
     * Orchestrates task interviewing with structured TaskPlan output
     * This demonstrates the three core Chunk 3.2 concepts:
     * 1. Agent-like orchestration
     * 2. Structured TaskPlan JSON compliance
     * 3. Tool handoffs between TaskParser and PlannerLLM
     */
    async conductTaskInterview(userMessage, sessionId) {
        try {
            // Tool Handoff 1: TaskParser → Load Google Tasks
            const taskContext = await this.taskParser.loadTasks();
            // Prepare structured interview input (ensures TaskPlan JSON compliance)
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
                conversationHistory: [userMessage],
                context: {
                    currentDate: new Date().toISOString().split('T')[0],
                    timeZone: this.config.profile.timezone,
                    workingHours: {
                        start: this.config.profile.workday.start,
                        end: this.config.profile.workday.end,
                    },
                },
            };
            // Tool Handoff 2: PlannerLLM → Conduct structured interview
            const taskPlan = await this.plannerLLM.conductTaskInterview(interviewInput, sessionId);
            // Validate TaskPlan JSON structure (Structured Outputs compliance)
            if (!this.validateTaskPlanStructure(taskPlan)) {
                throw new Error('TaskPlan does not meet JSON schema requirements');
            }
            return {
                success: true,
                taskPlan,
            };
        }
        catch (error) {
            return {
                success: false,
                taskPlan: null,
                error: error instanceof Error ? error.message : 'Unknown error in task interview',
            };
        }
    }
    /**
     * Validates TaskPlan structure for JSON compliance (Structured Outputs)
     */
    validateTaskPlanStructure(plan) {
        try {
            // Basic validation of required TaskPlan fields
            return !!(plan &&
                typeof plan.planDate === 'string' &&
                typeof plan.conversationSummary === 'string' &&
                Array.isArray(plan.taskAnalysis) &&
                Array.isArray(plan.nextSteps));
        }
        catch {
            return false;
        }
    }
    /**
     * Reads tasks using TaskParser (demonstrates tool handoff)
     */
    async readTasks(taskListIds) {
        try {
            const result = await this.taskParser.loadGoogleTasks(taskListIds);
            return {
                success: true,
                tasks: result.tasks,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error reading tasks',
            };
        }
    }
}
/**
 * Create the Orion Agent with OpenAI Agents SDK Concepts (Simplified)
 * Based on SPEC.md Section 9.1 with TaskPlan structured outputs
 */
export function createOrionAgent(config) {
    const taskParser = new TaskParser({
        google: {
            taskListIds: undefined, // Will use all task lists by default
            includeCompleted: false,
            maxResults: 100,
        },
    });
    const plannerLLM = new PlannerLLM({
        model: config.agents.plannerModel,
        temperature: config.agents.plannerTemperature,
        fallbackModel: config.agents.fallbackModel,
    });
    const orchestrator = new TaskPlanningOrchestrator(taskParser, plannerLLM, config);
    return {
        name: 'Orion',
        instructions: conversationalSystemPrompt(),
        model: config.agents.plannerModel,
        orchestrator,
    };
}
/**
 * Create Orion context for agent execution (OpenAI Agents SDK pattern)
 */
export function createOrionContext(config, sessionId, userId) {
    const taskParser = new TaskParser({
        google: {
            taskListIds: undefined, // Will use all task lists by default
            includeCompleted: false,
            maxResults: 100,
        },
    });
    const plannerLLM = new PlannerLLM({
        model: config.agents.plannerModel,
        temperature: config.agents.plannerTemperature,
        fallbackModel: config.agents.fallbackModel,
    });
    return {
        config,
        taskParser,
        plannerLLM,
        sessionId,
        userId,
    };
}
/**
 * Run the Orion Agent with structured TaskPlan output
 * Demonstrates the three core Chunk 3.2 concepts in practice
 */
export async function runOrionAgent(agent, context, userMessage) {
    try {
        // Use the orchestrator to handle tool handoffs and structured outputs
        const result = await agent.orchestrator.conductTaskInterview(userMessage, context.sessionId);
        if (!result.success) {
            return {
                taskPlan: null,
                response: `Sorry, I encountered an error: ${result.error}`,
            };
        }
        // Generate human-readable response with structured TaskPlan
        const response = formatTaskPlanResponse(result.taskPlan, userMessage);
        return { taskPlan: result.taskPlan, response };
    }
    catch (error) {
        const errorMessage = `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        return { taskPlan: null, response: errorMessage };
    }
}
/**
 * Format TaskPlan for human-readable response
 */
function formatTaskPlanResponse(plan, userMessage) {
    if (!plan) {
        return "I'm ready to help you plan your tasks! Try asking me 'Help me plan my tasks' or 'What should I work on today?'.";
    }
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
