/**
 * Calendar Parser - Phase 1A Implementation
 * Focused on Google Calendar read-only integration
 */

import { google } from 'googleapis';
import { GoogleCalendarAuth, type Tokens } from './google-auth.js';
import type { CalendarConfig, ChangeSet, Event, WriteResult } from './types.js';

export * from './types.js';
export * from './google-auth.js';

export class CalendarParser {
	private googleAuth?: GoogleCalendarAuth;

	constructor(private config: CalendarConfig) {
		// Initialize Google Calendar auth if enabled
		if (this.config.google?.enabled) {
			this.googleAuth = new GoogleCalendarAuth({
				clientId: process.env.GOOGLE_CLIENT_ID || '',
				clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
				redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
				scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
			});
		}
	}

	/**
	 * Load events from configured calendar sources
	 * Phase 1A: Google Calendar read-only support
	 */
	async loadSources(dateRange?: { start: Date; end: Date }): Promise<Event[]> {
		const events: Event[] = [];

		// Phase 1A: Google Calendar support
		if (this.config.google?.enabled && this.googleAuth) {
			try {
				const googleEvents = await this.loadGoogleEvents(dateRange);
				events.push(...googleEvents);
			} catch (error) {
				console.error('Failed to load Google Calendar events:', error);
				// In Phase 1A, we continue with other sources if Google fails
			}
		}

		// Phase 1A: .ics file support (if configured)
		if (this.config.ics?.length) {
			try {
				// TODO: Implement .ics file parsing in future iteration
				console.log('ICS file parsing not yet implemented');
			} catch (error) {
				console.error('Failed to load .ics events:', error);
			}
		}

		return events;
	}

	/**
	 * Load events from Google Calendar
	 */
	async loadGoogleEvents(dateRange?: { start: Date; end: Date }): Promise<Event[]> {
		if (!this.googleAuth) {
			throw new Error('Google Calendar authentication not configured');
		}

		// Ensure we have valid tokens before making API calls
		await this.googleAuth.ensureValidTokens();

		const calendar = google.calendar({ version: 'v3', auth: this.googleAuth.getOAuth2Client() });
		const events: Event[] = [];

		// Default to current day if no date range provided
		const defaultStart = new Date();
		defaultStart.setHours(0, 0, 0, 0);
		const defaultEnd = new Date();
		defaultEnd.setHours(23, 59, 59, 999);

		const timeMin = dateRange?.start || defaultStart;
		const timeMax = dateRange?.end || defaultEnd;

		const calendarIds = this.config.google?.calendarIds || ['primary'];

		for (const calendarId of calendarIds) {
			try {
				const response = await calendar.events.list({
					calendarId,
					timeMin: timeMin.toISOString(),
					timeMax: timeMax.toISOString(),
					singleEvents: true, // Expand recurring events
					orderBy: 'startTime',
					maxResults: 250, // Google's max per request
				});

				if (response.data.items) {
					for (const googleEvent of response.data.items) {
						const normalizedEvent = this.normalizeGoogleEvent(googleEvent, calendarId);
						if (normalizedEvent) {
							events.push(normalizedEvent);
						}
					}
				}
			} catch (error) {
				console.error(`Failed to load events from calendar ${calendarId}:`, error);
				// Continue with other calendars
			}
		}

		// Apply privacy masking
		return this.maskPrivateEvents(events);
	}

	/**
	 * Normalize Google Calendar event to internal Event format
	 */
	private normalizeGoogleEvent(googleEvent: any, calendarId: string): Event | null {
		if (!googleEvent.id || !googleEvent.summary) {
			return null; // Skip events without ID or title
		}

		// Handle start/end times
		const { start, end } = this.handleTimezones(googleEvent);

		// Determine if it's an all-day event
		const allDay = Boolean(googleEvent.start?.date && googleEvent.end?.date);

		return {
			id: `google-${calendarId}-${googleEvent.id}`,
			provider: 'google',
			title: googleEvent.summary || 'Untitled Event',
			description: googleEvent.description,
			start,
			end,
			allDay,
			location: googleEvent.location,
			attendees: googleEvent.attendees?.map((attendee: any) => ({
				email: attendee.email,
				response: this.mapGoogleResponseStatus(attendee.responseStatus),
			})),
			recurrence: googleEvent.recurrence?.[0], // Take first RRULE if present
			transparency: googleEvent.transparency === 'transparent' ? 'free' : 'busy',
			sensitivity: this.mapGoogleVisibility(googleEvent.visibility),
			sourceUri: googleEvent.htmlLink,
			raw: googleEvent,
		};
	}

	/**
	 * Handle timezone conversion for Google events
	 */
	private handleTimezones(googleEvent: any): { start: string; end: string } {
		// All-day events use date instead of dateTime
		if (googleEvent.start?.date && googleEvent.end?.date) {
			// For all-day events, create ISO strings with local timezone
			const startDate = new Date(googleEvent.start.date);
			const endDate = new Date(googleEvent.end.date);

			return {
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			};
		}

		// Regular events with time
		const start = googleEvent.start?.dateTime || googleEvent.start?.date;
		const end = googleEvent.end?.dateTime || googleEvent.end?.date;

		if (!start || !end) {
			throw new Error('Event missing start or end time');
		}

		return {
			start: new Date(start).toISOString(),
			end: new Date(end).toISOString(),
		};
	}

	/**
	 * Map Google response status to our format
	 */
	private mapGoogleResponseStatus(status?: string): 'yes' | 'no' | 'maybe' | undefined {
		switch (status) {
			case 'accepted':
				return 'yes';
			case 'declined':
				return 'no';
			case 'tentative':
				return 'maybe';
			default:
				return undefined;
		}
	}

	/**
	 * Map Google visibility to sensitivity
	 */
	private mapGoogleVisibility(visibility?: string): 'normal' | 'private' | 'confidential' {
		switch (visibility) {
			case 'private':
				return 'private';
			case 'confidential':
				return 'confidential';
			default:
				return 'normal';
		}
	}

	/**
	 * Mask private events to protect sensitive information
	 */
	private maskPrivateEvents(events: Event[]): Event[] {
		return events.map(event => {
			if (event.sensitivity === 'private' || event.sensitivity === 'confidential') {
				return {
					...event,
					title: event.sensitivity === 'confidential' ? 'Confidential Event' : 'Private Event',
					description: undefined,
					location: undefined,
					attendees: undefined,
				};
			}
			return event;
		});
	}

	/**
	 * Set Google Calendar authentication tokens
	 */
	setGoogleTokens(tokens: Tokens): void {
		if (this.googleAuth) {
			this.googleAuth.setCredentials(tokens);
		}
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
