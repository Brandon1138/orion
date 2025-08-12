/**
 * IntentRouter - Sprint 1 minimal rule + heuristic LLM-less classifier
 */
export class IntentRouter {
    classify(message) {
        const m = message.toLowerCase();
        if (m.includes('task') || m.includes('todo') || m.includes('to-do'))
            return 'read_tasks';
        if (m.includes('summarize') || m.includes('summary'))
            return 'summarize';
        if (m.includes('http://') || m.includes('https://'))
            return 'web_fetch';
        return 'unknown';
    }
    route(message) {
        const intent = this.classify(message);
        switch (intent) {
            case 'read_tasks':
                return {
                    intent,
                    actions: [
                        { tool: 'fs.read', args: { path: './fixtures/google-tasks.json' }, risk: 'low' },
                        { tool: 'summarize.tasks', args: {}, risk: 'low' },
                    ],
                };
            case 'summarize':
                return { intent, actions: [{ tool: 'summarize.text', args: {}, risk: 'low' }] };
            case 'web_fetch': {
                const url = this.extractUrl(message);
                return { intent, actions: [{ tool: 'web.fetch', args: { url }, risk: 'medium' }] };
            }
            default:
                return { intent: 'unknown', actions: [] };
        }
    }
    extractUrl(text) {
        const match = text.match(/https?:\/\/\S+/);
        return match?.[0];
    }
}
export default IntentRouter;
