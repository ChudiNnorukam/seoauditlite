<script lang="ts">
	import HeaderDark from '$lib/components/HeaderDark.svelte';
	import AuroraBackground from '$lib/components/AuroraBackground.svelte';
	import GlassCard from '$lib/components/GlassCard.svelte';
	import { MagnifyingGlass, ArrowRight, Clock, Globe, TrendUp, TrendDown } from 'phosphor-svelte';

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

	function getScoreColor(score: number | null): string {
		if (score === null) return 'var(--color-text-muted)';
		if (score >= 70) return 'var(--color-success)';
		if (score >= 40) return 'var(--color-warning)';
		return 'var(--color-danger)';
	}
</script>

<svelte:head>
	<title>Dashboard - SEOAuditLite</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="page dark">
	<AuroraBackground animate={false} />
	<HeaderDark user={data.user} plan={data.plan} />

	<div class="container">
		<header class="page-header">
			<div class="header-content">
				<h1>Dashboard</h1>
				<p class="subtitle">Your recent audits and AEO progress</p>
			</div>
			<a href="/" class="btn-primary">
				New Audit
				<ArrowRight size={16} weight="bold" />
			</a>
		</header>

		<!-- Stats Overview -->
		{#if data.audits.length > 0}
			<div class="stats-grid">
				<GlassCard class="stat-card" padding="lg">
					<div class="stat-icon">
						<MagnifyingGlass size={24} weight="duotone" />
					</div>
					<div class="stat-content">
						<span class="stat-value">{data.audits.length}</span>
						<span class="stat-label">Total Audits</span>
					</div>
				</GlassCard>
				<GlassCard class="stat-card" padding="lg">
					<div class="stat-icon trend-up">
						<TrendUp size={24} weight="duotone" />
					</div>
					<div class="stat-content">
						<span class="stat-value">{Math.max(...data.audits.map(a => a.overallScore ?? 0))}</span>
						<span class="stat-label">Best Score</span>
					</div>
				</GlassCard>
				<GlassCard class="stat-card" padding="lg">
					<div class="stat-icon">
						<Globe size={24} weight="duotone" />
					</div>
					<div class="stat-content">
						<span class="stat-value">{new Set(data.audits.map(a => extractDomain(a.auditedUrl))).size}</span>
						<span class="stat-label">Sites Audited</span>
					</div>
				</GlassCard>
			</div>
		{/if}

		{#if data.audits.length === 0}
			<GlassCard class="empty-state" glow padding="lg">
				<div class="empty-icon">
					<MagnifyingGlass size={40} weight="duotone" />
				</div>
				<h2>No audits yet</h2>
				<p>Run your first audit to see your AI search readiness and track your progress over time.</p>
				<a href="/" class="btn-primary">
					Run Your First Audit
					<ArrowRight size={16} weight="bold" />
				</a>
			</GlassCard>
		{:else}
			<section class="audits-section">
				<h2 class="section-title">Recent Audits</h2>
				<div class="audits-list">
					{#each data.audits as audit}
						<a href="/report/{audit.auditId}" class="audit-card">
							<GlassCard class="audit-card-inner" padding="lg">
								<div class="audit-info">
									<div class="audit-domain">
										<Globe size={18} weight="regular" />
										<span>{extractDomain(audit.auditedUrl)}</span>
									</div>
									<div class="audit-meta">
										<Clock size={14} weight="regular" />
										<span>{formatDate(audit.createdAt)}</span>
									</div>
								</div>
								<div class="audit-score-wrapper">
									<div class="audit-score-ring" style="--score: {audit.overallScore ?? 0}; --color: {getScoreColor(audit.overallScore)}">
										<span class="audit-score-value" style="color: {getScoreColor(audit.overallScore)}">
											{audit.overallScore ?? '—'}
										</span>
									</div>
								</div>
								<div class="audit-arrow">
									<ArrowRight size={20} weight="bold" />
								</div>
							</GlassCard>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Footer -->
		<footer class="dashboard-footer">
			<p>&copy; {new Date().getFullYear()} SEOAuditLite. Know your AI search readiness.</p>
		</footer>
	</div>
</div>

<style>
	.page {
		min-height: 100vh;
		background: var(--color-bg);
	}

	.container {
		max-width: var(--width-wide);
		margin: 0 auto;
		padding: 100px 24px 80px;
	}

	/* Page Header */
	.page-header {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin-bottom: 32px;
	}

	@media (min-width: 640px) {
		.page-header {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}
	}

	.page-header h1 {
		margin: 0 0 4px 0;
		font-size: var(--text-3xl);
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.subtitle {
		margin: 0;
		font-size: var(--text-md);
		color: var(--color-text-muted);
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
		margin-bottom: 40px;
	}

	:global(.stat-card) {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.stat-icon {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-lg);
		background: var(--color-primary-light);
		color: var(--color-primary);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat-icon.trend-up {
		background: var(--color-success-light);
		color: var(--color-success);
	}

	.stat-content {
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-size: var(--text-2xl);
		font-weight: 700;
		font-family: var(--font-mono);
	}

	.stat-label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	/* Empty State */
	:global(.empty-state) {
		text-align: center;
		max-width: 480px;
		margin: 0 auto;
	}

	.empty-icon {
		width: 80px;
		height: 80px;
		margin: 0 auto 24px;
		border-radius: var(--radius-xl);
		background: var(--color-primary-light);
		color: var(--color-primary);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.empty-state) h2 {
		margin: 0 0 12px 0;
		font-size: var(--text-2xl);
		font-weight: 600;
	}

	:global(.empty-state) p {
		margin: 0 0 32px 0;
		font-size: var(--text-md);
		color: var(--color-text-muted);
		line-height: 1.6;
	}

	/* Audits Section */
	.audits-section {
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

	.audits-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.audit-card {
		text-decoration: none;
		display: block;
	}

	:global(.audit-card-inner) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		transition: transform 150ms ease, border-color 150ms ease;
	}

	.audit-card:hover :global(.audit-card-inner) {
		transform: translateY(-2px);
		border-color: var(--color-primary);
	}

	.audit-info {
		flex: 1;
		min-width: 0;
	}

	.audit-domain {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: var(--text-md);
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 4px;
	}

	.audit-domain span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.audit-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.audit-score-wrapper {
		flex-shrink: 0;
	}

	.audit-score-ring {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: conic-gradient(
			var(--color) calc(var(--score) * 1%),
			var(--glass-border) calc(var(--score) * 1%)
		);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.audit-score-ring::before {
		content: '';
		position: absolute;
		inset: 6px;
		background: var(--color-bg);
		border-radius: 50%;
	}

	.audit-score-value {
		position: relative;
		font-size: var(--text-lg);
		font-weight: 700;
		font-family: var(--font-mono);
	}

	.audit-arrow {
		color: var(--color-text-muted);
		transition: transform 150ms ease, color 150ms ease;
	}

	.audit-card:hover .audit-arrow {
		transform: translateX(4px);
		color: var(--color-primary);
	}

	/* Footer */
	.dashboard-footer {
		text-align: center;
		padding-top: 24px;
		border-top: 1px solid var(--glass-border);
	}

	.dashboard-footer p {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text-faint);
	}

	/* Primary Button */
	.btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px 24px;
		background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
		color: white;
		border: none;
		border-radius: var(--radius-lg);
		font-family: var(--font-sans);
		font-size: var(--text-base);
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		box-shadow: 0 4px 20px var(--color-primary-glow);
		transition: all 0.3s ease;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 30px var(--color-primary-glow);
	}
</style>
