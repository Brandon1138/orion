/**
 * ToolRegistry - Sprint 1 minimal implementation
 * - Discovers MCP file-system tools and native web.fetch
 */
export type ToolDefinition = {
    name: string;
    description: string;
    policy_tag: 'read' | 'network' | 'unknown';
};
export interface WebConfig {
    allowlist?: string[];
}
export declare class ToolRegistry {
    private webConfig?;
    private tools;
    constructor(webConfig?: WebConfig | undefined);
    register(def: ToolDefinition): void;
    listTools(): ToolDefinition[];
    getTool(name: string): ToolDefinition | undefined;
    /**
     * Validate whether a URL is permitted by the allowlist
     */
    isUrlAllowed(url: string): boolean;
}
export default ToolRegistry;
