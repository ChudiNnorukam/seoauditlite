<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		glow?: boolean;
		hover?: boolean;
		padding?: 'none' | 'sm' | 'md' | 'lg';
		children: Snippet;
	}

	let {
		class: className = '',
		glow = false,
		hover = false,
		padding = 'md',
		children
	}: Props = $props();

	const paddingClasses = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	};
</script>

<div
	class="glass-card {paddingClasses[padding]} {className}"
	class:glow
	class:hover-effect={hover}
>
	{@render children()}
</div>

<style>
	.glass-card {
		background: var(--glass-bg);
		backdrop-filter: blur(var(--glass-blur));
		-webkit-backdrop-filter: blur(var(--glass-blur));
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-2xl);
	}

	.p-4 { padding: 16px; }
	.p-6 { padding: 24px; }
	.p-8 { padding: 32px; }

	.glow {
		box-shadow: var(--shadow-glow);
	}

	.hover-effect {
		transition: transform 150ms ease, background 150ms ease;
	}

	.hover-effect:hover {
		transform: translateY(-2px);
		background: var(--color-bg-muted);
	}
</style>
