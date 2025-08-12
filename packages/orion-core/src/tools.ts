/**
 * ToolRegistry - Sprint 1 minimal implementation
 * - Discovers MCP file-system tools and native web.fetch
 */

export type ToolDefinition = {
	name: string; // e.g., 'fs.read', 'web.fetch'
	description: string;
	// Sprint 3: allow richer policy tags like 'med:calendar.write', 'low:github.read'
	policy_tag: string;
	// Optional JSON schema describing arguments for validation/contract testing
	schema?: Record<string, unknown>;
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

		// Sprint 3 — High-value connectors (schemas + policy tags)
		// Calendar (provider-agnostic wrappers; provider chosen by config)
		this.register({
			name: 'calendar.create_event',
			description: 'Create a calendar event (Google or Microsoft Graph based on config)',
			policy_tag: 'med:calendar.write',
			schema: {
				type: 'object',
				properties: {
					title: { type: 'string' },
					date: { type: 'string', description: 'YYYY-MM-DD' },
					time: { type: 'string', description: 'HH:MM (24h)' },
					durationMins: { type: 'number', minimum: 0 },
					description: { type: 'string' },
					attendees: { type: 'array', items: { type: 'string' } },
					sourceTaskId: { type: 'string' },
				},
				required: ['title', 'date'],
			},
		});

		this.register({
			name: 'calendar.update_event',
			description: 'Update an existing calendar event',
			policy_tag: 'med:calendar.write',
			schema: {
				type: 'object',
				properties: {
					eventId: { type: 'string' },
					title: { type: 'string' },
					date: { type: 'string' },
					time: { type: 'string' },
					durationMins: { type: 'number', minimum: 0 },
					description: { type: 'string' },
					attendees: { type: 'array', items: { type: 'string' } },
				},
				required: ['eventId'],
			},
		});

		// GitHub
		this.register({
			name: 'github.issue.create',
			description: 'Create a GitHub issue in a repository',
			policy_tag: 'med:github.write',
			schema: {
				type: 'object',
				properties: {
					owner: { type: 'string' },
					repo: { type: 'string' },
					title: { type: 'string' },
					body: { type: 'string' },
					labels: { type: 'array', items: { type: 'string' } },
				},
				required: ['owner', 'repo', 'title'],
			},
		});

		this.register({
			name: 'github.comment.create',
			description: 'Create a comment on an issue or PR',
			policy_tag: 'med:github.write',
			schema: {
				type: 'object',
				properties: {
					owner: { type: 'string' },
					repo: { type: 'string' },
					issue_number: { type: 'number' },
					body: { type: 'string' },
				},
				required: ['owner', 'repo', 'issue_number', 'body'],
			},
		});

		this.register({
			name: 'github.search_prs',
			description: 'Search pull requests by query string',
			policy_tag: 'low:github.read',
			schema: {
				type: 'object',
				properties: {
					query: {
						type: 'string',
						description: 'GitHub search query, e.g., repo:owner/name is:pr is:open',
					},
					per_page: { type: 'number', minimum: 1, maximum: 100, default: 10 },
					page: { type: 'number', minimum: 1, default: 1 },
				},
				required: ['query'],
			},
		});

		// Notion
		this.register({
			name: 'notion.task.create',
			description: 'Create a task/page in a Notion database',
			policy_tag: 'med:notion.write',
			schema: {
				type: 'object',
				properties: {
					databaseId: { type: 'string' },
					title: { type: 'string' },
					properties: { type: 'object' },
				},
				required: ['databaseId', 'title'],
			},
		});

		this.register({
			name: 'notion.task.update',
			description: 'Update a Notion task/page',
			policy_tag: 'med:notion.write',
			schema: {
				type: 'object',
				properties: {
					pageId: { type: 'string' },
					properties: { type: 'object' },
				},
				required: ['pageId'],
			},
		});

		// Linear
		this.register({
			name: 'linear.issue.create',
			description: 'Create a Linear issue',
			policy_tag: 'med:linear.write',
			schema: {
				type: 'object',
				properties: {
					teamId: { type: 'string' },
					title: { type: 'string' },
					description: { type: 'string' },
					priority: { type: 'number' },
				},
				required: ['teamId', 'title'],
			},
		});

		this.register({
			name: 'linear.issue.update',
			description: 'Update a Linear issue',
			policy_tag: 'med:linear.write',
			schema: {
				type: 'object',
				properties: {
					issueId: { type: 'string' },
					title: { type: 'string' },
					description: { type: 'string' },
					priority: { type: 'number' },
					stateId: { type: 'string' },
				},
				required: ['issueId'],
			},
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
