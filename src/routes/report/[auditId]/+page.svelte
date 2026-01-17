<script lang="ts">
	import { onMount } from 'svelte';
	import type { AuditResult } from '$lib/auditing/schema';
	import type { EntitlementContext } from '$lib/auditing/entitlements';
	import { resolveEntitlements } from '$lib/auditing/resolve-entitlements';
	import { redactAudit } from '$lib/auditing/redact';
	import Header from '$lib/components/Header.svelte';
	import { CheckCircle, XCircle, Warning, Copy, ArrowSquareOut, Crown } from 'phosphor-svelte';

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
	let upgrading = false;
	let upgradeError = '';
	$: viewAudit = audit ? redactAudit(audit, entitlements) : null;
	$: domain = viewAudit ? extractDomain(viewAudit.audited_url) : '';

	onMount(() => {
		const url = new URL(window.location.href);
		const storedReferral = sessionStorage.getItem('rewardful_referral');
		if (storedReferral && !url.searchParams.get('referral')) {
			url.searchParams.set('referral', storedReferral);
		}
		shareUrl = url.toString();
		const cached = sessionStorage.getItem('lastAudit');
		if (cached) {
			try {
				const stored = JSON.parse(cached) as AuditResult;
				const currentId = window.location.pathname.split('/').pop();
				if (stored.audit_id && stored.audit_id === currentId) {
					entitlements = resolveEntitlements({
						audit: stored,
						isShareLink: false,
						isOwner: true,
						planOverride: entitlements.plan
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

	async function startUpgrade() {
		if (!viewAudit) return;
		upgrading = true;
		upgradeError = '';
		try {
			const response = await fetch('/api/billing/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ auditId: viewAudit.audit_id })
			});

			const payload = await response.json();
			if (!response.ok || !payload?.url) {
				upgradeError = payload?.error || 'Unable to start checkout';
				upgrading = false;
				return;
			}

			window.location.href = payload.url;
		} catch (error) {
			upgradeError = error instanceof Error ? error.message : 'Unable to start checkout';
			upgrading = false;
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

<Header showBack={true} />

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
					{#if copied}
						Copied
					{:else}
						<Copy size={14} weight="bold" />
						Copy
					{/if}
				</button>
			</div>
		</section>

		{#if !entitlements.isShareLink && entitlements.plan === 'free'}
			<section class="upgrade-card">
				<div>
					<h3>Unlock Pro insights</h3>
					<p class="muted">See full recommendations and deeper analysis.</p>
				</div>
				<div class="upgrade-actions">
					<button class="upgrade-button" type="button" on:click={startUpgrade} disabled={upgrading}>
						{#if upgrading}
							Redirecting…
						{:else}
							<Crown size={16} weight="fill" />
							Upgrade to Pro
						{/if}
					</button>
					{#if upgradeError}
						<p class="upgrade-error">{upgradeError}</p>
					{/if}
				</div>
			</section>
		{/if}

		<section class="checks">
			<h3>Checks</h3>
			<div class="check-list">
				{#each viewAudit.checks as check}
					<article class="check-card">
						<div class="check-header">
							<div class="check-title">
								<h4>{check.label}</h4>
								<p class="muted">{check.summary}</p>
							</div>
							<div class="check-score">
								<span class="status-badge" data-status={check.status}>
									{#if check.status === 'pass'}
										<CheckCircle size={14} weight="fill" />
									{:else if check.status === 'warning'}
										<Warning size={14} weight="fill" />
									{:else}
										<XCircle size={14} weight="fill" />
									{/if}
									{statusLabel(check.status)}
								</span>
								{#if check.metadata.is_pro_only}
									<span class="pro-badge">Pro</span>
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
		max-width: 800px;
		margin: 0 auto;
		padding: 32px 20px 80px;
	}

	.report-header {
		margin-bottom: 24px;
		border-bottom: 0.5px solid rgba(15, 23, 42, 0.08);
		padding-bottom: 16px;
	}

	.report-header h1 {
		margin: 0;
		font-size: 22px;
		font-weight: 600;
		letter-spacing: -0.01em;
		word-break: break-word;
	}

	.date {
		margin: 6px 0 0;
		font-size: 12px;
		color: #94a3b8;
	}

	.link {
		color: #1162d4;
		text-decoration: none;
		font-size: 13px;
	}

	.link:hover {
		text-decoration: underline;
	}

	.score-card {
		display: flex;
		gap: 24px;
		align-items: center;
		padding: 20px;
		border: 0.5px solid rgba(15, 23, 42, 0.08);
		border-radius: 6px;
		margin-bottom: 16px;
		background: #fff;
	}

	.score-ring {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: conic-gradient(#1162d4 calc(var(--score) * 1%), rgba(15, 23, 42, 0.06) 0);
		flex-shrink: 0;
	}

	.score-number {
		font-size: 32px;
		font-weight: 600;
		color: #0f172a;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
		font-variant-numeric: tabular-nums;
	}

	.score-label {
		font-size: 10px;
		font-weight: 600;
		color: #94a3b8;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.score-details h2 {
		margin: 0 0 4px;
		font-size: 16px;
		font-weight: 600;
	}

	.score-details p {
		margin: 0;
		color: #64748b;
		font-size: 13px;
	}

	.share-card {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		align-items: center;
		padding: 16px;
		border: 0.5px solid rgba(15, 23, 42, 0.08);
		border-radius: 6px;
		background: #fafbfc;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}

	.share-card h3 {
		margin: 0 0 2px;
		font-size: 14px;
		font-weight: 600;
	}

	.upgrade-card {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		align-items: center;
		padding: 16px;
		border: 0.5px solid rgba(17, 98, 212, 0.2);
		border-radius: 6px;
		background: rgba(17, 98, 212, 0.03);
		margin-bottom: 24px;
		flex-wrap: wrap;
	}

	.upgrade-card h3 {
		margin: 0 0 2px;
		font-size: 14px;
		font-weight: 600;
	}

	.upgrade-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
	}

	.upgrade-button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 10px 16px;
		border: none;
		border-radius: 6px;
		background: #1162d4;
		color: #fff;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 150ms ease;
	}

	.upgrade-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.upgrade-button:hover:not(:disabled) {
		background: #0c4da8;
	}

	.upgrade-error {
		margin: 0;
		color: #dc2626;
		font-size: 12px;
	}

	.share-input {
		display: flex;
		gap: 8px;
		align-items: center;
		flex: 1;
		min-width: 240px;
	}

	.share-input input {
		flex: 1;
		padding: 8px 12px;
		border: 0.5px solid rgba(15, 23, 42, 0.12);
		border-radius: 6px;
		font-size: 12px;
		color: #64748b;
		background: #fff;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
	}

	.share-input button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		border: none;
		border-radius: 6px;
		background: #1162d4;
		color: #fff;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: background 150ms ease;
	}

	.share-input button:hover {
		background: #0c4da8;
	}

	.checks {
		margin-top: 8px;
	}

	.checks h3,
	.notes h3,
	.limits h3 {
		margin: 0 0 12px;
		font-size: 14px;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.check-list {
		display: grid;
		gap: 12px;
	}

	.check-card {
		padding: 16px;
		border: 0.5px solid rgba(15, 23, 42, 0.08);
		border-radius: 6px;
		background: #fff;
	}

	.check-header {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		align-items: flex-start;
		margin-bottom: 10px;
	}

	.check-title h4 {
		margin: 0 0 2px;
		font-size: 14px;
		font-weight: 600;
	}

	.check-score {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		border-radius: 6px;
		font-size: 11px;
		font-weight: 600;
	}

	.status-badge[data-status='pass'] {
		background: rgba(34, 197, 94, 0.1);
		color: #16a34a;
	}

	.status-badge[data-status='warning'] {
		background: rgba(234, 179, 8, 0.12);
		color: #ca8a04;
	}

	.status-badge[data-status='fail'] {
		background: rgba(239, 68, 68, 0.1);
		color: #dc2626;
	}

	.pro-badge {
		padding: 4px 8px;
		border-radius: 6px;
		font-size: 10px;
		font-weight: 600;
		background: rgba(17, 98, 212, 0.1);
		color: #1162d4;
		letter-spacing: 0.02em;
	}

	.score {
		font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
		font-size: 14px;
		font-weight: 600;
		color: #0f172a;
		font-variant-numeric: tabular-nums;
	}

	.explanation {
		margin: 0 0 8px;
		color: #64748b;
		font-size: 13px;
		line-height: 1.5;
	}

	.recommendation {
		margin: 0;
		font-size: 13px;
		color: #0f172a;
		line-height: 1.5;
	}

	.recommendation strong {
		font-weight: 600;
		color: #475569;
	}

	.evidence {
		margin: 10px 0 0;
		padding-left: 16px;
		color: #64748b;
		font-size: 12px;
		line-height: 1.6;
	}

	.evidence li {
		margin-bottom: 2px;
	}

	.muted {
		margin: 0;
		color: #94a3b8;
		font-size: 12px;
	}

	.notes {
		margin-top: 24px;
	}

	.notes ul {
		margin: 0;
		padding-left: 16px;
		color: #64748b;
		font-size: 13px;
	}

	.limits {
		margin-top: 24px;
	}

	.limits-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 10px;
	}

	.limits-grid div {
		padding: 12px;
		border-radius: 6px;
		border: 0.5px solid rgba(15, 23, 42, 0.08);
		background: #fafbfc;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.label {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #94a3b8;
		font-weight: 500;
	}

	.value {
		font-size: 13px;
		font-weight: 600;
		color: #0f172a;
	}

	@media (max-width: 640px) {
		.container {
			padding: 24px 16px 60px;
		}

		.score-card {
			flex-direction: column;
			align-items: flex-start;
			gap: 16px;
		}

		.share-card,
		.upgrade-card {
			flex-direction: column;
			align-items: flex-start;
		}

		.share-input {
			width: 100%;
		}

		.check-header {
			flex-direction: column;
			gap: 8px;
		}

		.check-score {
			order: -1;
		}
	}
</style>
