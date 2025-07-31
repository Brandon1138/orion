/**
 * Calendar Parser - Phase 1A Implementation
 * Focused on Google Calendar read-only integration
 */
import { type Tokens } from './google-auth.js';
import type { CalendarConfig, ChangeSet, Event, WriteResult } from './types.js';
export * from './types.js';
export * from './google-auth.js';
export declare class CalendarParser {
    private config;
    private googleAuth?;
    constructor(config: CalendarConfig);
    /**
     * Load events from configured calendar sources
     * Phase 1A: Google Calendar read-only support
     */
    loadSources(dateRange?: {
        start: Date;
        end: Date;
    }): Promise<Event[]>;
    /**
     * Load events from Google Calendar
     */
    loadGoogleEvents(dateRange?: {
        start: Date;
        end: Date;
    }): Promise<Event[]>;
    /**
     * Normalize Google Calendar event to internal Event format
     */
    private normalizeGoogleEvent;
    /**
     * Handle timezone conversion for Google events
     */
    private handleTimezones;
    /**
     * Map Google response status to our format
     */
    private mapGoogleResponseStatus;
    /**
     * Map Google visibility to sensitivity
     */
    private mapGoogleVisibility;
    /**
     * Mask private events to protect sensitive information
     */
    private maskPrivateEvents;
    /**
     * Set Google Calendar authentication tokens
     */
    setGoogleTokens(tokens: Tokens): void;
    /**
     * Compare local events with proposed changes
     */
    diff(_local: Event[], _proposed: Event[]): ChangeSet;
    /**
     * Write changes back to calendar providers
     * Phase 1A: Read-only mode, this will throw an error
     */
    writeChanges(_changes: ChangeSet): WriteResult;
}
export default CalendarParser;
