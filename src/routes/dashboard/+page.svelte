<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { MagnifyingGlass, ArrowRight, Clock, Globe } from 'phosphor-svelte';

	let { data } = $props();

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function extractDomain(url: string): string {
		try {
			return new URL(url).hostname;
		} catch {
			return url;
		}
	}

	function getScoreClass(score: number | null): string {
		if (score === null) return 'score-unknown';
		if (score >= 70) return 'score-good';
		if (score >= 40) return 'score-moderate';
		return 'score-poor';
	}
</script>

<svelte:head>
	<title>Dashboard - SEOAuditLite</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<Header user={data.user} plan={data.plan} />

<div class="page">
	<div class="container">
		<header class="page-header">
			<h1>Dashboard</h1>
			<p class="subtitle">Your recent audits</p>
		</header>

		{#if data.audits.length === 0}
			<div class="empty-state">
				<div class="empty-icon">
					<MagnifyingGlass size={32} weight="duotone" />
				</div>
				<h2>No audits yet</h2>
				<p>Run your first audit to see your history here.</p>
				<a href="/" class="cta-button">
					Run an audit
					<ArrowRight size={16} weight="bold" />
				</a>
			</div>
		{:else}
			<div class="audits-list">
				{#each data.audits as audit}
					<a href="/report/{audit.auditId}" class="audit-card">
						<div class="audit-info">
							<div class="audit-domain">
								<Globe size={16} weight="regular" />
								<span>{extractDomain(audit.auditedUrl)}</span>
							</div>
							<div class="audit-meta">
								<Clock size={14} weight="regular" />
								<span>{formatDate(audit.createdAt)}</span>
							</div>
						</div>
						<div class="audit-score {getScoreClass(audit.overallScore)}">
							{audit.overallScore ?? '—'}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.page {
		min-height: calc(100vh - 48px);
		background: #fafbfc;
	}

	.container {
		max-width: 720px;
		margin: 0 auto;
		padding: 32px 20px;
	}

	.page-header {
		margin-bottom: 32px;
	}

	.page-header h1 {
		margin: 0 0 4px 0;
		font-size: 24px;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: #0f172a;
	}

	.subtitle {
		margin: 0;
		font-size: 14px;
		color: #64748b;
	}

	/* Empty state */
	.empty-state {
		text-align: center;
		padding: 64px 20px;
		background: #fff;
		border: 1px solid rgba(15, 23, 42, 0.08);
		border-radius: 12px;
	}

	.empty-icon {
		width: 64px;
		height: 64px;
		margin: 0 auto 16px;
		border-radius: 16px;
		background: #f1f5f9;
		color: #64748b;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.empty-state h2 {
		margin: 0 0 8px 0;
		font-size: 18px;
		font-weight: 600;
		color: #0f172a;
	}

	.empty-state p {
		margin: 0 0 24px 0;
		font-size: 14px;
		color: #64748b;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 18px;
		background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
		color: #fff;
		text-decoration: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		transition: transform 150ms ease, box-shadow 150ms ease;
	}

	.cta-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(249, 115, 22, 0.35);
	}

	/* Audits list */
	.audits-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.audit-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		background: #fff;
		border: 1px solid rgba(15, 23, 42, 0.08);
		border-radius: 10px;
		text-decoration: none;
		transition: border-color 150ms ease, box-shadow 150ms ease;
	}

	.audit-card:hover {
		border-color: rgba(15, 23, 42, 0.15);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}

	.audit-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.audit-domain {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 15px;
		font-weight: 600;
		color: #0f172a;
	}

	.audit-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: #64748b;
	}

	.audit-score {
		font-size: 20px;
		font-weight: 700;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
		padding: 6px 12px;
		border-radius: 8px;
	}

	.score-good {
		background: rgba(34, 197, 94, 0.1);
		color: #15803d;
	}

	.score-moderate {
		background: rgba(234, 179, 8, 0.1);
		color: #a16207;
	}

	.score-poor {
		background: rgba(239, 68, 68, 0.1);
		color: #dc2626;
	}

	.score-unknown {
		background: #f1f5f9;
		color: #64748b;
	}

	@media (max-width: 480px) {
		.audit-card {
			flex-direction: column;
			align-items: flex-start;
			gap: 12px;
		}

		.audit-score {
			align-self: flex-end;
		}
	}
</style>
