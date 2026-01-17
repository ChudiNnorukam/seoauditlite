<script lang="ts">
	import { MagnifyingGlass, ArrowLeft } from 'phosphor-svelte';

	export let showBack = false;
</script>

<header class="header">
	<div class="header-content">
		<div class="header-left">
			{#if showBack}
				<a href="/" class="back-link">
					<ArrowLeft size={16} weight="bold" />
					<span>New audit</span>
				</a>
			{:else}
				<a href="/" class="logo">
					<MagnifyingGlass size={18} weight="bold" />
					<span>SEOAuditLite</span>
				</a>
			{/if}
		</div>
		<nav class="header-nav">
			{#if !showBack}
				<a href="/planner" class="nav-link">Planner</a>
			{/if}
		</nav>
	</div>
</header>

<style>
	.header {
		border-bottom: 0.5px solid rgba(15, 23, 42, 0.08);
		background: #fff;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 12px 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-left {
		display: flex;
		align-items: center;
	}

	.logo {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: #0f172a;
		text-decoration: none;
		font-size: 15px;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.logo:hover {
		color: #1162d4;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: #64748b;
		text-decoration: none;
		font-size: 13px;
		font-weight: 500;
		transition: color 150ms ease;
	}

	.back-link:hover {
		color: #1162d4;
	}

	.header-nav {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.nav-link {
		color: #64748b;
		text-decoration: none;
		font-size: 13px;
		font-weight: 500;
		transition: color 150ms ease;
	}

	.nav-link:hover {
		color: #0f172a;
	}
</style>
