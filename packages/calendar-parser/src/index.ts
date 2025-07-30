/**
 * Calendar Parser - Phase 1A Implementation
 * Focused on Google Calendar read-only integration
 */

import type { CalendarConfig, ChangeSet, Event, WriteResult } from './types.js';

export * from './types.js';

export class CalendarParser {
	constructor(private config: CalendarConfig) {}

	/**
	 * Load events from configured calendar sources
	 * Phase 1A: Google Calendar read-only support
	 */
	loadSources(): Promise<Event[]> {
		const events: Event[] = [];

		// Phase 1A: Basic Google Calendar support
		if (this.config.google?.enabled) {
			try {
				// TODO: Implement Google Calendar OAuth and event fetching
				// For now, return empty array - will implement in next iteration
			} catch (error) {
				console.error('Failed to load Google Calendar events:', error);
			}
		}

		// Phase 1A: .ics file support (if configured)
		if (this.config.ics?.length) {
			try {
				// TODO: Implement .ics file parsing
			} catch (error) {
				console.error('Failed to load .ics events:', error);
			}
		}

		return Promise.resolve(events);
	}

	/**
	 * Compare local events with proposed changes
	 */
	diff(_local: Event[], _proposed: Event[]): ChangeSet {
		// TODO: Implement diff logic
		return {
			additions: [],
			modifications: [],
			deletions: [],
		};
	}

	/**
	 * Write changes back to calendar providers
	 * Phase 1A: Read-only mode, this will throw an error
	 */
	writeChanges(_changes: ChangeSet): WriteResult {
		// Phase 1A: Read-only mode
		throw new Error('Write operations not supported in Phase 1A (read-only mode)');
	}
}

export default CalendarParser;
