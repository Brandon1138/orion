/**
 * Google Tasks OAuth2 Authentication
 * Phase 1A: Basic OAuth2 flow with token refresh
 * Based on calendar-parser/google-auth.ts but adapted for Tasks API
 */
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
export declare class GoogleTasksAuth {
    private config;
    private oauth2Client;
    constructor(config: GoogleAuthConfig);
    /**
     * Generate the authorization URL to redirect users to Google OAuth2
     */
    getAuthUrl(): Promise<string>;
    /**
     * Exchange authorization code for access and refresh tokens
     */
    exchangeCodeForTokens(code: string): Promise<Tokens>;
    /**
     * Refresh access token using refresh token
     */
    refreshTokens(refreshToken: string): Promise<Tokens>;
    /**
     * Set credentials for API calls
     */
    setCredentials(tokens: Tokens): void;
    /**
     * Get the configured OAuth2 client for making API calls
     */
    getOAuth2Client(): OAuth2Client;
    /**
     * Check if tokens are expired and need refresh
     */
    isTokenExpired(): boolean;
    /**
     * Auto-refresh tokens if needed before making API calls
     */
    ensureValidTokens(): Promise<void>;
}
/**
 * Default Google Tasks scopes for Phase 1A (read-only)
 */
export declare const DEFAULT_TASKS_SCOPES: string[];
/**
 * Full Google Tasks scopes (for future phases with write access)
 */
export declare const FULL_TASKS_SCOPES: string[];
/**
 * Create Google Tasks auth instance with default configuration
 */
export declare function createGoogleTasksAuth(config: Partial<GoogleAuthConfig>): GoogleTasksAuth;
