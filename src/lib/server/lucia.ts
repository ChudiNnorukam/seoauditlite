import { Lucia } from 'lucia';
import { LibSQLAdapter } from '@lucia-auth/adapter-sqlite';
import { createClient, type Client } from '@libsql/client';
import { dev } from '$app/environment';
import { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } from '$env/static/private';

let client: Client | null = null;

function getClient(): Client {
	if (!client) {
		if (!TURSO_DATABASE_URL) {
			throw new Error('TURSO_DATABASE_URL environment variable is not set');
		}
		client = createClient({
			url: TURSO_DATABASE_URL,
			authToken: TURSO_AUTH_TOKEN
		});
	}
	return client;
}

// Lazy-initialize Lucia to avoid build-time errors
let luciaInstance: Lucia<Record<never, never>, { email: string; name: string | null; avatarUrl: string | null; googleId: string | null }> | null = null;

export function getLucia() {
	if (!luciaInstance) {
		const adapter = new LibSQLAdapter(getClient(), {
			user: 'users',
			session: 'sessions'
		});

		luciaInstance = new Lucia(adapter, {
			sessionCookie: {
				attributes: {
					secure: !dev
				}
			},
			getUserAttributes: (attributes) => {
				return {
					email: attributes.email,
					name: attributes.name,
					avatarUrl: attributes.avatar_url,
					googleId: attributes.google_id
				};
			}
		});
	}
	return luciaInstance;
}

// For compatibility with existing code that imports lucia directly
export const lucia = {
	get sessionCookieName() {
		return getLucia().sessionCookieName;
	},
	validateSession(sessionId: string) {
		return getLucia().validateSession(sessionId);
	},
	createSession(userId: string, attributes: Record<string, unknown>) {
		return getLucia().createSession(userId, attributes);
	},
	createSessionCookie(sessionId: string) {
		return getLucia().createSessionCookie(sessionId);
	},
	createBlankSessionCookie() {
		return getLucia().createBlankSessionCookie();
	},
	invalidateSession(sessionId: string) {
		return getLucia().invalidateSession(sessionId);
	}
};

declare module 'lucia' {
	interface Register {
		Lucia: ReturnType<typeof getLucia>;
		DatabaseUserAttributes: DatabaseUserAttributes;
		DatabaseSessionAttributes: Record<never, never>;
	}
}

interface DatabaseUserAttributes {
	email: string;
	name: string | null;
	avatar_url: string | null;
	google_id: string | null;
}

// Export user attributes type for use in hooks
export interface LuciaUserAttributes {
	email: string;
	name: string | null;
	avatarUrl: string | null;
	googleId: string | null;
}
