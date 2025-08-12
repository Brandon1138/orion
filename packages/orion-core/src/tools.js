/**
 * ToolRegistry - Sprint 1 minimal implementation
 * - Discovers MCP file-system tools and native web.fetch
 */
export class ToolRegistry {
    webConfig;
    tools = new Map();
    constructor(webConfig) {
        this.webConfig = webConfig;
        // Register MCP FS tools (Phase 1A: read-only)
        this.register({
            name: 'fs.read',
            description: 'Read the contents of a file (read-only)',
            policy_tag: 'read',
        });
        this.register({
            name: 'fs.list',
            description: 'List directory contents (read-only)',
            policy_tag: 'read',
        });
        this.register({
            name: 'fs.search',
            description: 'Search for files by pattern (read-only)',
            policy_tag: 'read',
        });
        // Register native web.fetch tool
        this.register({
            name: 'web.fetch',
            description: 'HTTP GET a URL from an allowlist',
            policy_tag: 'network',
        });
    }
    register(def) {
        this.tools.set(def.name, def);
    }
    listTools() {
        return Array.from(this.tools.values());
    }
    getTool(name) {
        return this.tools.get(name);
    }
    /**
     * Validate whether a URL is permitted by the allowlist
     */
    isUrlAllowed(url) {
        const allow = this.webConfig?.allowlist ?? [];
        if (allow.length === 0)
            return false;
        return allow.some(prefix => url.startsWith(prefix));
    }
}
export default ToolRegistry;
