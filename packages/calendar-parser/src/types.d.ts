/**
 * Calendar Parser Types - Phase 1A
 * Unified calendar event model for Google Calendar, Microsoft Graph, and .ics files
 */
export type CalendarProvider = 'google' | 'msgraph' | 'ics';
export interface Event {
    id: string;
    provider: CalendarProvider;
    title: string;
    description?: string;
    start: string;
    end: string;
    allDay: boolean;
    location?: string;
    attendees?: {
        email: string;
        response?: 'yes' | 'no' | 'maybe';
    }[];
    recurrence?: string;
    transparency?: 'busy' | 'free';
    sensitivity?: 'normal' | 'private' | 'confidential';
    sourceUri?: string;
    raw?: unknown;
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
    ics?: string[];
}
export interface ChangeSet {
    additions: Event[];
    modifications: {
        before: Event;
        after: Event;
    }[];
    deletions: Event[];
}
export interface WriteResult {
    success: boolean;
    errors: string[];
    processedChanges: number;
}
