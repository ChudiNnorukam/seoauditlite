import { Google } from 'arctic';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ORIGIN } from '$env/static/private';

const clientId = GOOGLE_CLIENT_ID;
const clientSecret = GOOGLE_CLIENT_SECRET;
const origin = ORIGIN || 'http://localhost:5173';

// Validate credentials at module load time
// If partially configured, fail fast to prevent silent auth failures
const hasClientId = !!clientId;
const hasClientSecret = !!clientSecret;

if (hasClientId !== hasClientSecret) {
	// Partial configuration is an error - someone likely misconfigured
	throw new Error(
		`Google OAuth partially configured. ` +
		`GOOGLE_CLIENT_ID: ${hasClientId ? 'set' : 'missing'}, ` +
		`GOOGLE_CLIENT_SECRET: ${hasClientSecret ? 'set' : 'missing'}. ` +
		`Either set both or neither.`
	);
}

// If neither is set, auth is intentionally disabled (valid for dev/testing)
export const googleAuthEnabled = hasClientId && hasClientSecret;

export const google = googleAuthEnabled
	? new Google(clientId, clientSecret, `${origin}/api/auth/callback/google`)
	: null;

export interface GoogleUser {
	sub: string;
	email: string;
	name?: string;
	picture?: string;
	email_verified?: boolean;
}

export async function getGoogleUser(accessToken: string): Promise<GoogleUser> {
	const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch Google user: ${response.statusText}`);
	}

	return response.json();
}
