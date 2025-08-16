/**
 * Google Tasks OAuth2 Authentication
 * Phase 1A: Basic OAuth2 flow with token refresh
 * Based on calendar-parser/google-auth.ts but adapted for Tasks API
 */

import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

export interface GoogleAuthConfig {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string[];
}

export interface Tokens {
	access_token: string;
	refresh_token?: string;
	scope?: string;
	token_type?: string;
	expiry_date?: number;
}

export class GoogleTasksAuth {
	private oauth2Client: OAuth2Client;

	constructor(private config: GoogleAuthConfig) {
		this.oauth2Client = new google.auth.OAuth2(
			config.clientId,
			config.clientSecret,
			config.redirectUri
		);
	}

	/**
	 * Generate the authorization URL to redirect users to Google OAuth2
	 */
	async getAuthUrl(): Promise<string> {
		const authUrl = this.oauth2Client.generateAuthUrl({
			access_type: 'offline', // Required for refresh tokens
			scope: this.config.scopes,
			prompt: 'consent', // Force consent screen to ensure refresh token
		});

		return authUrl;
	}

	/**
	 * Exchange authorization code for access and refresh tokens
	 */
	async exchangeCodeForTokens(code: string): Promise<Tokens> {
		try {
			const { tokens } = await this.oauth2Client.getToken(code);

			// Set credentials for future API calls
			this.oauth2Client.setCredentials(tokens);

			return {
				access_token: tokens.access_token!,
				refresh_token: tokens.refresh_token || undefined,
				scope: tokens.scope,
				token_type: tokens.token_type || undefined,
				expiry_date: tokens.expiry_date || undefined,
			};
		} catch (error) {
			throw new Error(`Failed to exchange authorization code: ${error}`);
		}
	}

	/**
	 * Refresh access token using refresh token
	 */
	async refreshTokens(refreshToken: string): Promise<Tokens> {
		try {
			this.oauth2Client.setCredentials({
				refresh_token: refreshToken,
			});

			const { credentials } = await this.oauth2Client.refreshAccessToken();

			return {
				access_token: credentials.access_token!,
				refresh_token: credentials.refresh_token || refreshToken, // Keep existing refresh token if new one not provided
				scope: credentials.scope,
				token_type: credentials.token_type || undefined,
				expiry_date: credentials.expiry_date || undefined,
			};
		} catch (error) {
			throw new Error(`Failed to refresh access token: ${error}`);
		}
	}

	/**
	 * Set credentials for API calls
	 */
	setCredentials(tokens: Tokens): void {
		this.oauth2Client.setCredentials({
			access_token: tokens.access_token,
			refresh_token: tokens.refresh_token,
			token_type: tokens.token_type,
			expiry_date: tokens.expiry_date,
		});
	}

	/**
	 * Get the configured OAuth2 client for making API calls
	 */
	getOAuth2Client(): OAuth2Client {
		return this.oauth2Client;
	}

	/**
	 * Check if tokens are expired and need refresh
	 */
	isTokenExpired(): boolean {
		const credentials = this.oauth2Client.credentials;
		if (!credentials.expiry_date) {
			return false; // If no expiry date, assume not expired
		}

		// Check if token expires within next 5 minutes (buffer time)
		const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
		return Date.now() + bufferTime >= credentials.expiry_date;
	}

	/**
	 * Auto-refresh tokens if needed before making API calls
	 */
	async ensureValidTokens(): Promise<void> {
		const credentials = this.oauth2Client.credentials;

		if (this.isTokenExpired() && credentials.refresh_token) {
			try {
				await this.refreshTokens(credentials.refresh_token);
			} catch (error) {
				throw new Error(`Failed to auto-refresh tokens: ${error}`);
			}
		}
	}
}

/**
 * Default Google Tasks scopes for Phase 1A (read-only)
 */
export const DEFAULT_TASKS_SCOPES = ['https://www.googleapis.com/auth/tasks.readonly'];

/**
 * Full Google Tasks scopes (for future phases with write access)
 */
export const FULL_TASKS_SCOPES = ['https://www.googleapis.com/auth/tasks'];

/**
 * Create Google Tasks auth instance with default configuration
 */
export function createGoogleTasksAuth(config: Partial<GoogleAuthConfig>): GoogleTasksAuth {
	const defaultConfig: GoogleAuthConfig = {
		clientId: process.env.GOOGLE_TASKS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
		clientSecret: process.env.GOOGLE_TASKS_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
		redirectUri:
			process.env.GOOGLE_TASKS_REDIRECT_URI ||
			process.env.GOOGLE_REDIRECT_URI ||
			'http://localhost:3000/auth/callback',
		scopes: DEFAULT_TASKS_SCOPES,
	};

	return new GoogleTasksAuth({ ...defaultConfig, ...config });
}
