<script lang="ts">
	import { onMount } from 'svelte';

	let redirecting = true;
	let lastAuditId: string | null = null;

	onMount(() => {
		const cached = sessionStorage.getItem('lastAudit');
		if (cached) {
			try {
				const audit = JSON.parse(cached) as { audit_id?: string };
				if (audit.audit_id) {
					lastAuditId = audit.audit_id;
					window.location.href = `/report/${audit.audit_id}`;
					return;
				}
			} catch {
				// ignore invalid cache
			}
		}
		redirecting = false;
	});
</script>

<svelte:head>
	<title>AEO Audit Report - SEOAuditLite</title>
	<meta name="description" content="Your latest AEO audit report." />
	<link rel="canonical" href="https://seoauditlite.com/report" />
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="container">
	{#if redirecting}
		<p>Loading your latest report...</p>
	{:else}
		<p>No audit data found. <a href="/">Go back to audit</a></p>
	{/if}
	{#if lastAuditId}
		<p class="hint">If you aren't redirected, open <a href={`/report/${lastAuditId}`}>your last report</a>.</p>
	{/if}
</div>

<style>
	.container {
		max-width: 640px;
		margin: 0 auto;
		padding: 64px 20px;
		text-align: center;
	}

	.hint {
		margin-top: 12px;
		font-size: 13px;
		color: #64748b;
	}

	a {
		color: #1162d4;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
