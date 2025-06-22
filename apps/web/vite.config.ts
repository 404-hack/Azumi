import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['firebase/app', 'firebase/messaging', 'firebase/analytics']
	},
	define: {
		global: 'globalThis'
	}
});
