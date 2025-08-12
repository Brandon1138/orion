/**
 * ToolRegistry - Sprint 1 minimal implementation
 * - Discovers MCP file-system tools and native web.fetch
 */

export type ToolDefinition = {
  name: string; // e.g., 'fs.read', 'web.fetch'
  description: string;
  policy_tag: 'read' | 'network' | 'unknown';
};

export interface WebConfig {
  allowlist?: string[]; // URL prefixes allowed for fetch
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor(private webConfig?: WebConfig) {
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

  register(def: ToolDefinition): void {
    this.tools.set(def.name, def);
  }

  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Validate whether a URL is permitted by the allowlist
   */
  isUrlAllowed(url: string): boolean {
    const allow = this.webConfig?.allowlist ?? [];
    if (allow.length === 0) return false;
    return allow.some(prefix => url.startsWith(prefix));
  }
}

export default ToolRegistry;


