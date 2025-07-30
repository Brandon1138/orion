/**
 * Calendar Parser Types - Phase 1A
 * Unified calendar event model for Google Calendar, Microsoft Graph, and .ics files
 */

export type CalendarProvider = 'google' | 'msgraph' | 'ics';

export interface Event {
	id: string; // provider id or synthetic
	provider: CalendarProvider;
	title: string;
	description?: string;
	start: string; // ISO 8601 with timezone
	end: string; // ISO 8601 with timezone
	allDay: boolean;
	location?: string;
	attendees?: { email: string; response?: 'yes' | 'no' | 'maybe' }[];
	recurrence?: string; // RRULE string if present
	transparency?: 'busy' | 'free';
	sensitivity?: 'normal' | 'private' | 'confidential';
	sourceUri?: string; // event htmlLink or file path
	raw?: unknown; // original payload
}

export interface CalendarConfig {
	google?: {
		enabled: boolean;
		calendarIds: string[];
		readOnly: boolean;
	};
	msgraph?: {
		enabled: boolean;
		mailbox: string;
		readOnly: boolean;
	};
	ics?: string[]; // file paths
}

export interface ChangeSet {
	additions: Event[];
	modifications: { before: Event; after: Event }[];
	deletions: Event[];
}

export interface WriteResult {
	success: boolean;
	errors: string[];
	processedChanges: number;
}
