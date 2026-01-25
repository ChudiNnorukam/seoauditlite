import { error } from '@sveltejs/kit';

export function requireAuth(locals: App.Locals) {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	return locals.user;
}
