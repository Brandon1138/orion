/**
 * IntentRouter - Sprint 1 minimal rule + heuristic LLM-less classifier
 */
export type Intent = 'read_tasks' | 'summarize' | 'web_fetch' | 'plan' | 'unknown';
export interface IntentRoute {
    intent: Intent;
    actions: Array<{
        tool: string;
        args: Record<string, unknown>;
        risk?: 'low' | 'medium' | 'high';
    }>;
}
export declare class IntentRouter {
    classify(message: string): Intent;
    route(message: string): IntentRoute;
    private extractUrl;
}
export default IntentRouter;
