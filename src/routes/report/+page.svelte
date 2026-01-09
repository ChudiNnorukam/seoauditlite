<script lang="ts">
	import type { AEOScore } from '$lib/auditing/types';

	let score: AEOScore | null = null;

	// Load from sessionStorage
	if (typeof window !== 'undefined') {
		const data = sessionStorage.getItem('lastAudit');
		if (data) {
			score = JSON.parse(data);
		}
	}
</script>

<svelte:head>
	<title>AEO Audit Report - {score?.domain || 'Report'}</title>
</svelte:head>

{#if !score}
	<div class="container">
		<p>No audit data found. <a href="/">Go back to audit</a></p>
	</div>
{:else}
	<div class="container">
		<!-- Report Header -->
		<header class="report-header">
			<div>
				<h1>{score.domain}</h1>
				<p class="date">{new Date(score.auditDate).toLocaleDateString()}</p>
			</div>
			<a href="/" class="link">← New Audit</a>
		</header>

		<!-- Score Card -->
		<section class="score-section">
			<div class="score-circle" data-grade={score.grade}>
				<span class="score-number">{score.combinedScore}</span>
				<span class="score-label">{score.grade}</span>
			</div>
			<div class="score-info">
				<h2>{score.message}</h2>
				<div class="score-breakdown-inline">
					<div class="score-item">
						<span class="label">AEO</span>
						<span class="value">{score.aeoScore}</span>
					</div>
					<div class="score-item">
						<span class="label">SEO</span>
						<span class="value">{score.seoScore}</span>
					</div>
				</div>
			</div>
		</section>

		<!-- Breakdown -->
		<section class="breakdown">
			<h3>Breakdown</h3>
			<div class="breakdown-tabs">
				<button class="tab-button active" on:click={() => window.location.hash = 'aeo'}>
					AEO Score ({score.aeoScore}/100)
				</button>
				<button class="tab-button" on:click={() => window.location.hash = 'seo'}>
					SEO Score ({score.seoScore}/100)
				</button>
			</div>
			<div class="checks">
				<!-- AEO Breakdown -->
				<div class="check-item">
					<span class="check-label">AI Crawlers</span>
					<span class="check-score">{score.breakdown.aeo.aiCrawlers}/20</span>
				</div>
				<div class="check-item">
					<span class="check-label">llms.txt</span>
					<span class="check-score">{score.breakdown.aeo.llmsTxt}/15</span>
				</div>
				<div class="check-item">
					<span class="check-label">Structured Data</span>
					<span class="check-score">{score.breakdown.aeo.structuredData}/25</span>
				</div>
				<div class="check-item">
					<span class="check-label">Extractability</span>
					<span class="check-score">{score.breakdown.aeo.extractability}/20</span>
				</div>
				<div class="check-item">
					<span class="check-label">AI Metadata</span>
					<span class="check-score">{score.breakdown.aeo.aiMetadata}/10</span>
				</div>
				<div class="check-item">
					<span class="check-label">Answer Format</span>
					<span class="check-score">{score.breakdown.aeo.answerFormat}/10</span>
				</div>
				<!-- SEO Breakdown -->
				<div class="check-item">
					<span class="check-label">Sitemap</span>
					<span class="check-score">{score.breakdown.seo.sitemap}/20</span>
				</div>
				<div class="check-item">
					<span class="check-label">robots.txt</span>
					<span class="check-score">{score.breakdown.seo.robots}/15</span>
				</div>
				<div class="check-item">
					<span class="check-label">Meta Tags</span>
					<span class="check-score">{score.breakdown.seo.metaTags}/25</span>
				</div>
				<div class="check-item">
					<span class="check-label">Performance</span>
					<span class="check-score">{score.breakdown.seo.performance}/20</span>
				</div>
				<div class="check-item">
					<span class="check-label">Schema</span>
					<span class="check-score">{score.breakdown.seo.schema}/20</span>
				</div>
			</div>
		</section>

		<!-- Improvements -->
		{#if score.improvements.length > 0}
			<section class="improvements">
				<h3>Recommended Improvements</h3>
				<div class="improvement-list">
					{#each score.improvements.slice(0, 5) as improvement}
						<div class="improvement-item" data-priority={improvement.priority}>
							<span class="priority-badge">{improvement.priority}</span>
							<div class="improvement-content">
								<p class="improvement-fix">{improvement.fix}</p>
								<p class="improvement-gain">+{improvement.pointsGain} points</p>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- CTA -->
		<section class="cta">
			<button class="btn btn-primary" on:click={() => (window.location.href = '/')}>
				Audit Another Site
			</button>
		</section>
	</div>
{/if}

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 40px 20px;
	}

	.report-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 40px;
		border-bottom: 0.5px solid rgba(15, 23, 42, 0.1);
		padding-bottom: 20px;
	}

	.report-header h1 {
		margin: 0;
		font-size: 24px;
		word-break: break-all;
	}

	.date {
		font-size: 12px;
		color: #64748b;
		margin: 8px 0 0 0;
	}

	.link {
		color: #1162d4;
		text-decoration: none;
		font-size: 14px;
	}

	.link:hover {
		text-decoration: underline;
	}

	.score-section {
		display: flex;
		gap: 32px;
		align-items: center;
		padding: 32px;
		border: 0.5px solid rgba(15, 23, 42, 0.1);
		border-radius: 6px;
		margin-bottom: 32px;
	}

	.score-circle {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: conic-gradient(#1162d4 var(--score-percent), rgba(15, 23, 42, 0.05) 0);
	}

	.score-circle[data-grade='A'] {
		--score-percent: 90%;
		background: conic-gradient(#16a34a 90%, rgba(15, 23, 42, 0.05) 0);
	}

	.score-circle[data-grade='B'] {
		--score-percent: 85%;
		background: conic-gradient(#1162d4 85%, rgba(15, 23, 42, 0.05) 0);
	}

	.score-circle[data-grade='C'] {
		--score-percent: 75%;
		background: conic-gradient(#ea580c 75%, rgba(15, 23, 42, 0.05) 0);
	}

	.score-number {
		font-size: 40px;
		font-weight: 600;
		color: #0f172a;
	}

	.score-label {
		font-size: 14px;
		font-weight: 500;
		color: #64748b;
		margin-top: 4px;
	}

	.score-info h2 {
		margin: 0 0 12px 0;
		font-size: 20px;
	}

	.score-info p {
		margin: 0;
		color: #64748b;
		font-size: 14px;
	}

	.score-breakdown-inline {
		display: flex;
		gap: 16px;
		margin-top: 12px;
	}

	.score-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.score-item .label {
		font-size: 12px;
		color: #64748b;
		font-weight: 500;
	}

	.score-item .value {
		font-size: 16px;
		font-weight: 600;
		color: #1162d4;
	}

	.breakdown {
		margin-bottom: 32px;
	}

	.breakdown h3 {
		margin: 0 0 16px 0;
		font-size: 18px;
	}

	.breakdown-tabs {
		display: flex;
		gap: 12px;
		margin-bottom: 16px;
		border-bottom: 0.5px solid rgba(15, 23, 42, 0.1);
	}

	.tab-button {
		padding: 8px 12px;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		font-size: 14px;
		font-weight: 500;
		color: #64748b;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.tab-button.active {
		color: #1162d4;
		border-bottom-color: #1162d4;
	}

	.tab-button:hover:not(.active) {
		color: #0f172a;
	}

	.checks {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	.check-item {
		padding: 12px 16px;
		border: 0.5px solid rgba(15, 23, 42, 0.1);
		border-radius: 4px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.check-label {
		font-size: 14px;
		font-weight: 500;
	}

	.check-score {
		font-family: 'SF Mono', Monaco, monospace;
		font-size: 14px;
		font-weight: 600;
		color: #1162d4;
	}

	.improvements {
		margin-bottom: 32px;
	}

	.improvements h3 {
		margin: 0 0 16px 0;
		font-size: 18px;
	}

	.improvement-item {
		padding: 12px 16px;
		border: 0.5px solid rgba(15, 23, 42, 0.1);
		border-radius: 4px;
		display: flex;
		gap: 12px;
		align-items: flex-start;
		margin-bottom: 8px;
	}

	.improvement-item[data-priority='critical'] {
		border-color: #dc2626;
		background: rgba(220, 38, 38, 0.02);
	}

	.priority-badge {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		padding: 4px 8px;
		border-radius: 2px;
		background: rgba(15, 23, 42, 0.1);
		white-space: nowrap;
		margin-top: 2px;
	}

	.improvement-content {
		flex: 1;
	}

	.improvement-fix {
		margin: 0;
		font-size: 14px;
	}

	.improvement-gain {
		margin: 4px 0 0 0;
		font-size: 12px;
		color: #64748b;
	}

	.cta {
		text-align: center;
		padding: 32px 0;
	}

	.btn {
		padding: 12px 24px;
		border: none;
		border-radius: 4px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
	}

	.btn-primary {
		background: #1162d4;
		color: white;
	}

	.btn-primary:hover {
		background: #0c4da8;
	}

	@media (max-width: 640px) {
		.score-section {
			flex-direction: column;
			text-align: center;
		}

		.checks {
			grid-template-columns: 1fr;
		}
	}
</style>
