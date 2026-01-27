import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// User state comes from layout.server.ts
	// No additional server-side data needed for Phase 1
	return {};
};
