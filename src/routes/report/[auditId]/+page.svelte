<script lang="ts">
	import { onMount } from 'svelte';
	import type { AuditResult } from '$lib/auditing/schema';
	import type { EntitlementContext } from '$lib/auditing/entitlements';
	import { resolveEntitlements } from '$lib/auditing/resolve-entitlements';
	import { redactAudit } from '$lib/auditing/redact';
	import HeaderDark from '$lib/components/HeaderDark.svelte';
	import AuroraBackground from '$lib/components/AuroraBackground.svelte';
	import GlassCard from '$lib/components/GlassCard.svelte';
	import ScoreGauge from '$lib/components/ScoreGauge.svelte';
	import { CheckCircle, XCircle, Warning, Copy, Crown, ArrowLeft, Download, ArrowClockwise, TrendUp } from 'phosphor-svelte';

	let { data } = $props();

	let shareUrl = $state('');
	let copied = $state(false);
	let audit = $derived<AuditResult | null>(data.audit);
	let entitlements = $derived<EntitlementContext>(data.entitlements);
	let viewAudit = $derived(audit ? redactAudit(audit, entitlements) : null);
	let domain = $derived(viewAudit ? extractDomain(viewAudit.audited_url) : '');
	let upgrading = $state(false);
	let upgradeError = $state('');

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

	function getStatusIcon(status: string) {
		if (status === 'pass') return CheckCircle;
		if (status === 'warning') return Warning;
		return XCircle;
	}
</script>

<svelte:head>
	<title>AEO Audit Report - {domain || 'Report'}</title>
	<meta
		name="description"
		content="AEO audit results showing AI search readiness score for {domain || 'your site'}."
	/>
	<link rel="canonical" href={`https://seoauditlite.com/report/${viewAudit?.audit_id ?? ''}`} />
	<meta name="robots" content="noindex" />

	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		"itemListElement": [
			{
				"@type": "ListItem",
				"position": 1,
				"name": "Home",
				"item": "https://seoauditlite.com/"
			},
			{
				"@type": "ListItem",
				"position": 2,
				"name": "Report",
				"item": "https://seoauditlite.com/report/${viewAudit?.audit_id ?? ''}"
			}
		]
	}
	</script>`}

	<meta property="og:title" content="AEO Audit Report - {domain || 'Report'}" />
	<meta
		property="og:description"
		content="AI search readiness score: {viewAudit?.overall_score ?? 0}/100 for {domain || 'your site'}."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content={shareUrl || `https://seoauditlite.com/report/${viewAudit?.audit_id ?? ''}`} />
	{#if data.ogImageUrl}
		<meta property="og:image" content={data.ogImageUrl} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
	{/if}

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="AEO Audit Report - {domain || 'Report'}" />
	<meta
		name="twitter:description"
		content="AI search readiness score: {viewAudit?.overall_score ?? 0}/100 for {domain || 'your site'}."
	/>
	{#if data.ogImageUrl}
		<meta name="twitter:image" content={data.ogImageUrl} />
	{/if}
</svelte:head>

<div class="page dark">
	<AuroraBackground animate={false} />
	<HeaderDark user={data.user} plan={data.plan} />

	{#if !viewAudit}
		<div class="container">
			<GlassCard class="error-card" padding="lg">
				<p>{data.error ?? 'No audit data found.'}</p>
				<a class="btn-primary" href="/">Run a new audit</a>
			</GlassCard>
		</div>
	{:else}
		<div class="container">
			<!-- Back Link -->
			<a href="/" class="back-link">
				<ArrowLeft size={16} weight="bold" />
				<span>New audit</span>
			</a>

			<!-- Domain Header -->
			<GlassCard class="domain-header" padding="lg">
				<div class="domain-info">
					<div class="domain-meta">
						<span class="meta-label">Audit Report</span>
						<span class="meta-divider">|</span>
						<span class="meta-date">{new Date(viewAudit.audited_at).toLocaleDateString()}</span>
					</div>
					<h1>{domain}</h1>
				</div>
				<div class="domain-actions">
					<button class="btn-secondary" type="button" onclick={copyShareLink}>
						<Copy size={16} weight="bold" />
						{copied ? 'Copied!' : 'Share'}
					</button>
					<a href="/" class="btn-primary">
						<ArrowClockwise size={16} weight="bold" />
						Re-audit
					</a>
				</div>
			</GlassCard>

			<!-- Main Grid -->
			<div class="main-grid">
				<!-- Score Card -->
				<GlassCard class="score-card" glow padding="lg">
					<h2 class="card-title">AEO Score</h2>
					<div class="score-gauge-wrapper">
						<ScoreGauge score={viewAudit.overall_score} size="lg" />
					</div>
					<div class="score-trend">
						<TrendUp size={18} weight="bold" class="trend-icon" />
						<span class="trend-text">
							{viewAudit.visibility_summary.ai_visible_percentage}% visible to AI
						</span>
					</div>
				</GlassCard>

				<!-- Status Cards Grid -->
				<div class="status-grid">
					{#each viewAudit.checks.slice(0, 6) as check}
						<GlassCard class="status-card" padding="md">
							<div class="status-header">
								<span class="status-icon" data-status={check.status}>
									{#if check.status === 'pass'}
										<CheckCircle size={18} weight="fill" />
									{:else if check.status === 'warning'}
										<Warning size={18} weight="fill" />
									{:else}
										<XCircle size={18} weight="fill" />
									{/if}
								</span>
								<span class="status-badge" data-status={check.status}>
									{statusLabel(check.status)}
								</span>
							</div>
							<h3 class="status-title">{check.label}</h3>
							<p class="status-summary">{check.summary}</p>
						</GlassCard>
					{/each}
				</div>
			</div>

			<!-- Upgrade Card -->
			{#if !entitlements.isShareLink && entitlements.plan === 'free'}
				<GlassCard class="upgrade-card" glow padding="lg">
					<div class="upgrade-content">
						<Crown size={24} weight="fill" class="upgrade-icon" />
						<div>
							<h3>Unlock Pro insights</h3>
							<p>See full recommendations, deeper analysis, and export to PDF.</p>
						</div>
					</div>
					<div class="upgrade-actions">
						<button class="btn-primary" type="button" onclick={startUpgrade} disabled={upgrading}>
							{#if upgrading}
								Redirecting...
							{:else}
								Upgrade to Pro
							{/if}
						</button>
						{#if upgradeError}
							<p class="upgrade-error">{upgradeError}</p>
						{/if}
					</div>
				</GlassCard>
			{/if}

			<!-- Detailed Checks -->
			<section class="checks-section">
				<h2 class="section-title">Detailed Results</h2>
				<div class="checks-list">
					{#each viewAudit.checks as check}
						<GlassCard class="check-card" padding="lg">
							<div class="check-header">
								<div class="check-title-row">
									<h3>{check.label}</h3>
									{#if check.metadata.is_pro_only}
										<span class="pro-badge">Pro</span>
									{/if}
								</div>
								<div class="check-status">
									<span class="status-badge large" data-status={check.status}>
										{#if check.status === 'pass'}
											<CheckCircle size={14} weight="fill" />
										{:else if check.status === 'warning'}
											<Warning size={14} weight="fill" />
										{:else}
											<XCircle size={14} weight="fill" />
										{/if}
										{statusLabel(check.status)}
									</span>
									<span class="check-score">{check.score}</span>
								</div>
							</div>
							<p class="check-explanation">{check.details.explanation}</p>
							<div class="check-recommendation">
								<strong>Next step:</strong> {check.details.recommendation}
							</div>
							{#if check.details.evidence.length > 0}
								<ul class="check-evidence">
									{#each check.details.evidence as item}
										<li>{item}</li>
									{/each}
								</ul>
							{/if}
						</GlassCard>
					{/each}
				</div>
			</section>

			<!-- Plan Limits -->
			<section class="limits-section">
				<h2 class="section-title">Plan Limits</h2>
				<div class="limits-grid">
					<GlassCard class="limit-card" padding="md">
						<span class="limit-label">Plan</span>
						<span class="limit-value">{viewAudit.limits.plan}</span>
					</GlassCard>
					<GlassCard class="limit-card" padding="md">
						<span class="limit-label">Audits Remaining</span>
						<span class="limit-value">{viewAudit.limits.audits_remaining}</span>
					</GlassCard>
					<GlassCard class="limit-card" padding="md">
						<span class="limit-label">Export</span>
						<span class="limit-value">{viewAudit.limits.export_available ? 'Available' : 'Locked'}</span>
					</GlassCard>
					<GlassCard class="limit-card" padding="md">
						<span class="limit-label">History</span>
						<span class="limit-value">{viewAudit.limits.history_days} days</span>
					</GlassCard>
				</div>
			</section>

			<!-- Footer -->
			<footer class="report-footer">
				<p>&copy; {new Date().getFullYear()} SEOAuditLite. Know your AI search readiness.</p>
			</footer>
		</div>
	{/if}
</div>

<style>
	.page {
		min-height: 100vh;
		background: var(--color-bg);
		color: var(--color-text);
	}

	.container {
		max-width: var(--width-wide);
		margin: 0 auto;
		padding: 100px 24px 80px;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--text-sm);
		font-weight: 500;
		margin-bottom: 24px;
		transition: color 150ms ease;
	}

	.back-link:hover {
		color: var(--color-primary);
	}

	/* Domain Header */
	:global(.domain-header) {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin-bottom: 24px;
	}

	@media (min-width: 640px) {
		:global(.domain-header) {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}
	}

	.domain-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}

	.meta-label, .meta-date {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.meta-divider {
		color: var(--color-text-faint);
	}

	.domain-info h1 {
		margin: 0;
		font-size: var(--text-2xl);
		font-weight: 600;
		word-break: break-word;
	}

	.domain-actions {
		display: flex;
		gap: 12px;
		flex-shrink: 0;
	}

	/* Main Grid */
	.main-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
		margin-bottom: 24px;
	}

	@media (min-width: 768px) {
		.main-grid {
			grid-template-columns: 280px 1fr;
		}
	}

	/* Score Card */
	:global(.score-card) {
		text-align: center;
	}

	.card-title {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-text-muted);
		margin: 0 0 20px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.score-gauge-wrapper {
		display: flex;
		justify-content: center;
		margin-bottom: 20px;
	}

	.score-trend {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-size: var(--text-sm);
	}

	:global(.trend-icon) {
		color: var(--color-success);
	}

	.trend-text {
		color: var(--color-text-muted);
	}

	/* Status Grid */
	.status-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	@media (min-width: 640px) {
		.status-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	:global(.status-card) {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.status-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.status-icon {
		display: flex;
	}

	.status-icon[data-status='pass'] { color: var(--color-success); }
	.status-icon[data-status='warning'] { color: var(--color-warning); }
	.status-icon[data-status='fail'] { color: var(--color-danger); }

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		font-weight: 600;
	}

	.status-badge[data-status='pass'] {
		background: var(--color-success-light);
		color: var(--color-success);
	}

	.status-badge[data-status='warning'] {
		background: var(--color-warning-light);
		color: var(--color-warning);
	}

	.status-badge[data-status='fail'] {
		background: var(--color-danger-light);
		color: var(--color-danger);
	}

	.status-badge.large {
		padding: 6px 10px;
		font-size: var(--text-sm);
	}

	.status-title {
		margin: 0;
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.status-summary {
		margin: 0;
		font-size: var(--text-xs);
		color: var(--color-text-faint);
		line-height: 1.4;
	}

	/* Upgrade Card */
	:global(.upgrade-card) {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin-bottom: 40px;
		border-color: var(--color-primary) !important;
		background: rgba(244, 37, 157, 0.05) !important;
	}

	@media (min-width: 640px) {
		:global(.upgrade-card) {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}
	}

	.upgrade-content {
		display: flex;
		align-items: flex-start;
		gap: 16px;
	}

	:global(.upgrade-icon) {
		color: var(--color-primary);
		flex-shrink: 0;
	}

	.upgrade-content h3 {
		margin: 0 0 4px;
		font-size: var(--text-md);
		font-weight: 600;
	}

	.upgrade-content p {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.upgrade-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
	}

	.upgrade-error {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-danger);
	}

	/* Checks Section */
	.checks-section {
		margin-bottom: 40px;
	}

	.section-title {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 16px;
	}

	.checks-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	:global(.check-card) {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.check-header {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	@media (min-width: 640px) {
		.check-header {
			flex-direction: row;
			align-items: flex-start;
			justify-content: space-between;
		}
	}

	.check-title-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.check-title-row h3 {
		margin: 0;
		font-size: var(--text-md);
		font-weight: 600;
	}

	.pro-badge {
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		font-weight: 600;
		background: var(--color-primary-light);
		color: var(--color-primary);
	}

	.check-status {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-shrink: 0;
	}

	.check-score {
		font-family: var(--font-mono);
		font-size: var(--text-lg);
		font-weight: 700;
		color: var(--color-text);
	}

	.check-explanation {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: 1.6;
	}

	.check-recommendation {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		line-height: 1.6;
	}

	.check-recommendation strong {
		color: var(--color-text);
	}

	.check-evidence {
		margin: 0;
		padding-left: 20px;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: 1.6;
	}

	.check-evidence li {
		margin-bottom: 4px;
	}

	/* Limits Section */
	.limits-section {
		margin-bottom: 40px;
	}

	.limits-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	@media (min-width: 640px) {
		.limits-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	:global(.limit-card) {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.limit-label {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-faint);
	}

	.limit-value {
		font-size: var(--text-md);
		font-weight: 600;
		color: var(--color-text);
		text-transform: capitalize;
	}

	/* Footer */
	.report-footer {
		text-align: center;
		padding-top: 24px;
		border-top: 1px solid var(--glass-border);
	}

	.report-footer p {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text-faint);
	}

	/* Error Card */
	:global(.error-card) {
		text-align: center;
	}

	:global(.error-card) p {
		margin: 0 0 20px;
		color: var(--color-text-muted);
	}

	/* Buttons */
	.btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px 20px;
		background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
		color: white;
		border: none;
		border-radius: var(--radius-lg);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		box-shadow: 0 4px 20px var(--color-primary-glow);
		transition: all 0.3s ease;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 30px var(--color-primary-glow);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px 20px;
		background: var(--glass-bg);
		color: var(--color-text);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-secondary:hover {
		background: var(--color-bg-muted);
		border-color: var(--color-border);
	}
</style>
