import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		// Security: Bind to localhost only, use high random port
		host: '127.0.0.1',
		port: 58392,
		strictPort: true,
		headers: {
			'X-Frame-Options': 'DENY',
			'X-Content-Type-Options': 'nosniff',
			'Referrer-Policy': 'strict-origin-when-cross-origin'
		}
	},
	preview: {
		host: '127.0.0.1',
		port: 58392,
		strictPort: true
	}
});
