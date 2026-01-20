// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			entitlementKey?: string;
			user?: {
				id: string;
				email: string;
				name: string | null;
				avatarUrl: string | null;
				googleId: string | null;
			} | null;
			session?: {
				id: string;
				userId: string;
				expiresAt: Date;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
