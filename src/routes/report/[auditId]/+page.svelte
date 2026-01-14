<script lang="ts">
	import { onMount } from 'svelte';
	import type { AuditResult } from '$lib/auditing/schema';
	import type { EntitlementContext } from '$lib/auditing/entitlements';
	import { resolveEntitlements } from '$lib/auditing/resolve-entitlements';
	import { redactAudit } from '$lib/auditing/redact';

	export let data: {
		audit: AuditResult | null;
		error?: string | null;
		entitlements: EntitlementContext;
	};

	let shareUrl = '';
	let copied = false;
	let audit: AuditResult | null = data.audit;
	let entitlements: EntitlementContext = data.entitlements;
	let viewAudit: AuditResult | null = null;
	$: viewAudit = audit ? redactAudit(audit, entitlements) : null;
	$: domain = viewAudit ? extractDomain(viewAudit.audited_url) : '';

	onMount(() => {
		shareUrl = window.location.href;
		const cached = sessionStorage.getItem('lastAudit');
		if (cached) {
			try {
				const stored = JSON.parse(cached) as AuditResult;
				const currentId = window.location.pathname.split('/').pop();
				if (stored.audit_id && stored.audit_id === currentId) {
					entitlements = resolveEntitlements({
						audit: stored,
						isShareLink: false,
						isOwner: true
					});
					audit = stored;
				}
			} catch {
				// ignore invalid cache
			}
		}
	});

	async function copyShareLink() {
		if (!shareUrl) return;
		try {
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			setTimeout(() => (copied = false), 1600);
		} catch {
			copied = false;
		}
	}

	function extractDomain(url: string): string {
		try {
			return new URL(url).hostname;
		} catch {
			return url;
		}
	}

	function statusLabel(status: string): string {
		if (status === 'pass') return 'Pass';
		if (status === 'warning') return 'Needs work';
		return 'Fail';
	}
</script>

<svelte:head>
	<title>AEO Audit Report - {domain || 'Report'}</title>
	<meta
		name="description"
		content="AEO audit results showing AI search readiness score for {domain || 'your site'}."
	/>
	<link rel="canonical" href="https://seoauditlite.com/report" />
	<meta name="robots" content="noindex" />
</svelte:head>

{#if !viewAudit}
	<div class="container">
		<p>{data.error ?? 'No audit data found.'}</p>
		<a class="link" href="/">Run a new audit</a>
	</div>
{:else}
	<div class="container">
		<header class="report-header">
			<div>
				<h1>{domain}</h1>
				<p class="date">{new Date(viewAudit.audited_at).toLocaleDateString()}</p>
			</div>
			<a href="/" class="link">← New audit</a>
		</header>

		<section class="score-card">
			<div class="score-ring" style={`--score:${viewAudit.overall_score}`}>
				<span class="score-number">{viewAudit.overall_score}</span>
				<span class="score-label">Overall</span>
			</div>
			<div class="score-details">
				<h2>AI Search Readiness</h2>
				<p>
					{viewAudit.visibility_summary.ai_visible_percentage}% visible to AI ·
					{viewAudit.visibility_summary.ai_invisible_percentage}% invisible
				</p>
			</div>
		</section>

		<section class="share-card">
			<div>
				<h3>Share this audit</h3>
				<p class="muted">Read-only link for clients, teammates, or affiliates.</p>
			</div>
			<div class="share-input">
				<input type="text" readonly value={shareUrl} />
				<button type="button" on:click={copyShareLink}>
					{copied ? 'Copied' : 'Copy'}
				</button>
			</div>
		</section>

		<section class="checks">
			<h3>Checks</h3>
			<div class="check-list">
				{#each viewAudit.checks as check}
					<article class="check-card" data-status={check.status}>
						<div class="check-header">
							<div>
								<h4>{check.label}</h4>
								<p class="muted">{check.summary}</p>
							</div>
							<div class="check-score">
								<span class="pill">{statusLabel(check.status)}</span>
								{#if check.metadata.is_pro_only}
									<span class="pill pro">Pro</span>
								{/if}
								<span class="score">{check.score}</span>
							</div>
						</div>
						<p class="explanation">{check.details.explanation}</p>
						<p class="recommendation">
							<strong>Next step:</strong> {check.details.recommendation}
						</p>
						{#if check.details.evidence.length > 0}
							<ul class="evidence">
								{#each check.details.evidence as item}
									<li>{item}</li>
								{/each}
							</ul>
						{/if}
					</article>
				{/each}
			</div>
		</section>

		{#if viewAudit.notes.length > 0}
			<section class="notes">
				<h3>Notes</h3>
				<ul>
					{#each viewAudit.notes as note}
						<li>{note.message}</li>
					{/each}
				</ul>
			</section>
		{/if}

		<section class="limits">
			<h3>Plan limits</h3>
			<div class="limits-grid">
				<div>
					<span class="label">Plan</span>
					<span class="value">{viewAudit.limits.plan}</span>
				</div>
				<div>
					<span class="label">Audits remaining</span>
					<span class="value">{viewAudit.limits.audits_remaining}</span>
				</div>
				<div>
					<span class="label">Export</span>
					<span class="value">{viewAudit.limits.export_available ? 'Available' : 'Locked'}</span>
				</div>
				<div>
					<span class="label">History</span>
					<span class="value">{viewAudit.limits.history_days} days</span>
				</div>
			</div>
		</section>
	</div>
{/if}

<style>
	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 48px 20px 80px;
	}

	.report-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 32px;
		border-bottom: 0.5px solid rgba(15, 23, 42, 0.1);
		padding-bottom: 20px;
	}

	.report-header h1 {
		margin: 0;
		font-size: 26px;
		word-break: break-word;
	}

	.date {
		margin: 8px 0 0;
		font-size: 12px;
		color: #64748b;
	}

	.link {
		color: #1162d4;
		text-decoration: none;
		font-size: 14px;
	}

	.link:hover {
		text-decoration: underline;
	}

	.score-card {
		display: flex;
		gap: 28px;
		align-items: center;
		padding: 24px;
		border: 0.5px solid rgba(15, 23, 42, 0.1);
		border-radius: 10px;
		margin-bottom: 24px;
		background: #fff;
	}

	.score-ring {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: conic-gradient(#1162d4 calc(var(--score) * 1%), rgba(15, 23, 42, 0.08) 0);
	}

	.score-number {
		font-size: 36px;
		font-weight: 600;
		color: #0f172a;
	}

	.score-label {
		font-size: 12px;
		font-weight: 600;
		color: #64748b;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.score-details h2 {
		margin: 0 0 6px;
		font-size: 20px;
	}

	.score-details p {
		margin: 0;
		color: #64748b;
	}

	.share-card {
		display: flex;
		justify-content: space-between;
		gap: 24px;
		align-items: center;
		padding: 20px;
		border: 0.5px solid rgba(15, 23, 42, 0.1);
		border-radius: 10px;
		background: #f8fafc;
		margin-bottom: 32px;
		flex-wrap: wrap;
	}

	.share-input {
		display: flex;
		gap: 8px;
		align-items: center;
		flex: 1;
		min-width: 260px;
	}

	.share-input input {
		flex: 1;
		padding: 10px 12px;
		border: 0.5px solid rgba(15, 23, 42, 0.2);
		border-radius: 6px;
		font-size: 12px;
		color: #0f172a;
	}

	.share-input button {
		padding: 10px 16px;
		border: none;
		border-radius: 6px;
		background: #1162d4;
		color: #fff;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
	}

	.share-input button:hover {
		background: #0c4da8;
	}

	.checks h3,
	.notes h3,
	.limits h3 {
		margin: 0 0 16px;
		font-size: 18px;
	}

	.check-list {
		display: grid;
		gap: 16px;
	}

	.check-card {
		padding: 18px;
		border: 0.5px solid rgba(15, 23, 42, 0.1);
		border-radius: 10px;
		background: #fff;
	}

	.check-card[data-status='pass'] {
		border-color: rgba(34, 197, 94, 0.5);
		background: rgba(34, 197, 94, 0.04);
	}

	.check-card[data-status='warning'] {
		border-color: rgba(234, 179, 8, 0.5);
		background: rgba(234, 179, 8, 0.06);
	}

	.check-card[data-status='fail'] {
		border-color: rgba(239, 68, 68, 0.5);
		background: rgba(239, 68, 68, 0.05);
	}

	.check-header {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		align-items: flex-start;
		margin-bottom: 10px;
	}

	.check-header h4 {
		margin: 0;
		font-size: 16px;
	}

	.check-score {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.pill {
		padding: 4px 8px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 600;
		background: rgba(15, 23, 42, 0.08);
		color: #0f172a;
	}

	.pill.pro {
		background: rgba(17, 98, 212, 0.12);
		color: #0c4da8;
	}

	.score {
		font-family: 'SF Mono', Monaco, monospace;
		font-size: 14px;
		font-weight: 600;
		color: #1162d4;
	}

	.explanation {
		margin: 0 0 8px;
		color: #475569;
		font-size: 14px;
	}

	.recommendation {
		margin: 0;
		font-size: 14px;
		color: #0f172a;
	}

	.evidence {
		margin: 8px 0 0;
		padding-left: 18px;
		color: #475569;
		font-size: 13px;
	}

	.muted {
		margin: 0;
		color: #64748b;
		font-size: 13px;
	}

	.notes ul {
		margin: 0;
		padding-left: 18px;
		color: #475569;
	}

	.limits {
		margin-top: 32px;
	}

	.limits-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 12px;
	}

	.limits-grid div {
		padding: 12px;
		border-radius: 8px;
		border: 0.5px solid rgba(15, 23, 42, 0.1);
		background: #fff;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.label {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #94a3b8;
	}

	.value {
		font-size: 14px;
		font-weight: 600;
		color: #0f172a;
	}

	@media (max-width: 700px) {
		.report-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 8px;
		}

		.score-card {
			flex-direction: column;
			align-items: flex-start;
		}

		.share-card {
			align-items: flex-start;
		}
	}
</style>
