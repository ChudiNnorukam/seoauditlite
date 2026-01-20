import { Google } from 'arctic';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ORIGIN } from '$env/static/private';

const clientId = GOOGLE_CLIENT_ID;
const clientSecret = GOOGLE_CLIENT_SECRET;
const origin = ORIGIN || 'http://localhost:5173';

if (!clientId || !clientSecret) {
	console.warn('Google OAuth credentials not configured. Auth will be disabled.');
}

export const google = clientId && clientSecret
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
