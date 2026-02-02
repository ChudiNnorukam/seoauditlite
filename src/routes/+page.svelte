<script lang="ts">
	import HeaderDark from '$lib/components/HeaderDark.svelte';
	import AuroraBackground from '$lib/components/AuroraBackground.svelte';
	import GlassCard from '$lib/components/GlassCard.svelte';
	import ScoreGauge from '$lib/components/ScoreGauge.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { Lightning, ArrowRight, CaretDown, Robot, FileText, Code, TextAlignLeft, Tag, ListChecks } from 'phosphor-svelte';

	let { data } = $props();

	let domain = $state('');
	let loading = $state(false);
	let error = $state('');
	let openFaq = $state<number | null>(null);

	const auditCount = 2847;

	const faqs = [
		{
			question: 'How accurate is the audit?',
			answer: 'We check the same signals AI crawlers use — robots.txt directives, structured data, llms.txt, semantic HTML, and metadata. Results reflect real crawl behavior, not guesswork.'
		},
		{
			question: 'What is AEO?',
			answer: 'Answer Engine Optimization (AEO) is the practice of making your site visible and quotable by AI search engines like Perplexity, ChatGPT, and Claude — the next generation of search.'
		},
		{
			question: 'Is my data stored?',
			answer: 'Free audits are stored for 7 days. Pro audits are retained for 30 days. We never sell your data or share it with third parties beyond our infrastructure providers.'
		},
		{
			question: 'How often should I run an audit?',
			answer: 'Run an audit whenever you make significant content changes, publish new pages, or update your site structure. For actively maintained sites, monthly audits help track your AI search readiness over time.'
		},
		{
			question: "What's the difference between SEO and AEO?",
			answer: 'Traditional SEO optimizes for search engine result pages (Google, Bing). AEO optimizes for AI-powered answer engines (ChatGPT, Perplexity, Claude) that generate answers directly.'
		},
		{
			question: 'Do I need technical knowledge to fix issues?',
			answer: 'Most fixes are straightforward. Adding llms.txt is as simple as creating a text file. Our audit report provides specific, actionable recommendations with priority rankings.'
		}
	];

	const checks = [
		{
			icon: Robot,
			title: 'AI Crawler Access',
			description: 'Does your robots.txt allow GPTBot, ClaudeBot, and PerplexityBot to crawl your content?'
		},
		{
			icon: FileText,
			title: 'llms.txt',
			description: 'The new robots.txt for AI — tells engines what content matters most on your site.'
		},
		{
			icon: Code,
			title: 'Structured Data',
			description: 'JSON-LD schema quality and completeness for rich AI answers and citations.'
		},
		{
			icon: TextAlignLeft,
			title: 'Extractability',
			description: 'Semantic HTML structure that AI can parse, understand, and quote accurately.'
		},
		{
			icon: Tag,
			title: 'AI Metadata',
			description: 'Canonical URLs, OG tags, and publish dates that AI engines trust and cite.'
		},
		{
			icon: ListChecks,
			title: 'Answer Format',
			description: 'FAQ/HowTo schema + bulleted lists that AI engines love to cite directly.'
		}
	];

	function toggleFaq(index: number) {
		openFaq = openFaq === index ? null : index;
	}

	async function handleAudit(e: Event) {
		e.preventDefault();
		if (!domain.trim()) return;

		loading = true;
		error = '';

		try {
			const response = await fetch('/api/audit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ domain: domain.trim() })
			});

			const data = await response.json();

			if (!response.ok || !data.success) {
				error = data.error || 'Audit failed';
				loading = false;
				return;
			}

			sessionStorage.setItem('lastAudit', JSON.stringify(data.data));
			window.location.href = `/report/${data.data.audit_id}`;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Network error';
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>SEOAuditLite - AI Search Readiness Audit</title>
	<meta name="description" content="Check your site's AEO (Answer Engine Optimization) readiness for Perplexity, ChatGPT, and Claude. Free audit in 2 minutes." />
	<link rel="canonical" href="https://seoauditlite.com/" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="SEOAuditLite - Know Your AI Search Readiness" />
	<meta property="og:description" content="Check your site's AEO readiness for Perplexity, ChatGPT, and Claude. Free audit in 2 minutes." />
	<meta property="og:url" content="https://seoauditlite.com/" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="SEOAuditLite - Know Your AI Search Readiness" />
</svelte:head>

<div class="page dark">
	<AuroraBackground />
	<HeaderDark user={data.user} plan={data.plan} />

	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-content">
			<!-- Badge -->
			<div class="badge">
				<span class="badge-dot"></span>
				<Lightning size={14} weight="fill" />
				<span><strong>{auditCount.toLocaleString()}</strong> audits run this month</span>
			</div>

			<h1 class="headline">
				Know your<br>
				<span class="gradient-text">AI search readiness.</span>
			</h1>

			<p class="subheadline">
				Free AEO audit in 2 minutes. See how Perplexity, ChatGPT, and Claude see your site.
			</p>

			<!-- Audit Form -->
			<form onsubmit={handleAudit} class="audit-form">
				<input
					type="text"
					placeholder="Enter your domain (e.g., yoursite.com)"
					bind:value={domain}
					disabled={loading}
					required
				/>
				<button type="submit" class="btn-primary" disabled={loading}>
					{#if loading}
						Analyzing...
					{:else}
						Analyze Site
						<ArrowRight size={18} weight="bold" />
					{/if}
				</button>
			</form>
			{#if error}
				<p class="error">{error}</p>
			{/if}

			<!-- Stats -->
			<div class="stats-row">
				<div class="stat">
					<span class="stat-number">60%</span>
					<span class="stat-label">Sites invisible to AI</span>
				</div>
				<div class="stat-divider"></div>
				<div class="stat">
					<span class="stat-number">30%</span>
					<span class="stat-label">Searches now AI-first</span>
				</div>
			</div>
		</div>

		<!-- Hero Visual -->
		<div class="hero-visual">
			<GlassCard class="score-card" glow>
				<div class="score-header">
					<div class="score-icon">
						<Robot size={24} weight="duotone" />
					</div>
					<div>
						<div class="score-subtitle">AEO Score</div>
						<div class="score-domain">example.com</div>
					</div>
				</div>
				<div class="score-gauge-wrapper">
					<ScoreGauge score={78} size="lg" />
				</div>
				<div class="score-stats">
					<div class="mini-stat pass">
						<span class="mini-stat-value">4</span>
						<span class="mini-stat-label">Passed</span>
					</div>
					<div class="mini-stat warn">
						<span class="mini-stat-value">1</span>
						<span class="mini-stat-label">Warnings</span>
					</div>
					<div class="mini-stat fail">
						<span class="mini-stat-value">1</span>
						<span class="mini-stat-label">Failed</span>
					</div>
				</div>
			</GlassCard>

			<!-- Floating Cards -->
			<div class="floating-card top-right">
				<span class="floating-icon pass">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
						<polyline points="20 6 9 17 4 12"></polyline>
					</svg>
				</span>
				<div>
					<div class="floating-title">GPTBot Access</div>
					<div class="floating-subtitle">Allowed</div>
				</div>
			</div>

			<div class="floating-card bottom-left">
				<span class="floating-icon trend">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
						<polyline points="17 6 23 6 23 12"></polyline>
					</svg>
				</span>
				<div>
					<div class="floating-title">+12 pts</div>
					<div class="floating-subtitle">This month</div>
				</div>
			</div>
		</div>
	</section>

	<!-- The 6 AEO Checks -->
	<section id="features" class="checks-section">
		<div class="section-header">
			<h2>The 6 AEO Checks</h2>
			<p>What we analyze to score your AI search readiness</p>
		</div>

		<div class="checks-grid">
			{#each checks as check}
				<GlassCard class="check-card" hover padding="lg">
					<div class="check-icon">
						<check.icon size={24} weight="duotone" />
					</div>
					<h3>{check.title}</h3>
					<p>{check.description}</p>
				</GlassCard>
			{/each}
		</div>
	</section>

	<!-- Pricing -->
	<section id="pricing" class="pricing-section">
		<div class="section-header">
			<h2>Simple Pricing</h2>
			<p>Start free, upgrade when you need more</p>
		</div>

		<div class="pricing-grid">
			<GlassCard class="pricing-card" padding="lg">
				<h3>Free</h3>
				<div class="price">$0<span>/month</span></div>
				<ul>
					<li>3 audits per month</li>
					<li>Full 6-point AEO score</li>
					<li>No signup required</li>
					<li>7-day report retention</li>
				</ul>
				<button class="btn-secondary" onclick={() => document.querySelector('.audit-form input')?.focus()}>
					Start Free
				</button>
			</GlassCard>

			<GlassCard class="pricing-card featured" glow padding="lg">
				<span class="popular-badge">Most Popular</span>
				<h3>Pro</h3>
				<div class="price">$29<span>/month</span></div>
				<ul>
					<li>Unlimited audits</li>
					<li>30-day history</li>
					<li>PDF export</li>
					<li>Score trend tracking</li>
					<li>Priority support</li>
				</ul>
				<a href="/account" class="btn-primary">
					Go Pro
					<ArrowRight size={16} weight="bold" />
				</a>
			</GlassCard>
		</div>
	</section>

	<!-- FAQ -->
	<section id="faq" class="faq-section">
		<div class="section-header">
			<h2>Frequently Asked Questions</h2>
		</div>

		<div class="faq-list">
			{#each faqs as faq, i}
				<button class="faq-item" class:open={openFaq === i} onclick={() => toggleFaq(i)} type="button">
					<div class="faq-question">
						<span>{faq.question}</span>
						<CaretDown size={16} weight="bold" class="faq-caret" />
					</div>
					{#if openFaq === i}
						<p class="faq-answer">{faq.answer}</p>
					{/if}
				</button>
			{/each}
		</div>
	</section>

	<!-- CTA -->
	<section class="cta-section">
		<GlassCard class="cta-card" glow padding="lg">
			<h2>Ready to improve your AI visibility?</h2>
			<p>Run your free audit now and see exactly what AI search engines see.</p>
			<button class="btn-primary" onclick={() => document.querySelector('.audit-form input')?.focus()}>
				Start Free Audit
				<ArrowRight size={18} weight="bold" />
			</button>
		</GlassCard>
	</section>

	<!-- Footer -->
	<footer class="footer">
		<div class="footer-content">
			<div class="footer-brand">
				<span class="footer-logo">SEOAuditLite</span>
				<span class="footer-tagline">Know your AI search readiness</span>
			</div>
			<nav class="footer-links">
				<a href="/about">About</a>
				<a href="/contact">Contact</a>
				<a href="/privacy">Privacy</a>
				<a href="/terms">Terms</a>
				<a href="/llms.txt">llms.txt</a>
			</nav>
			<p class="footer-copyright">&copy; {new Date().getFullYear()} SEOAuditLite</p>
		</div>
	</footer>
</div>

<style>
	.page {
		min-height: 100vh;
		background: var(--color-bg);
		color: var(--color-text);
	}

	/* Hero */
	.hero {
		max-width: var(--width-max);
		margin: 0 auto;
		padding: 140px 24px 80px;
		display: grid;
		grid-template-columns: 1fr;
		gap: 60px;
		align-items: center;
	}

	@media (min-width: 1024px) {
		.hero {
			grid-template-columns: 1fr 1fr;
			padding-top: 160px;
		}
	}

	.hero-content {
		text-align: center;
	}

	@media (min-width: 1024px) {
		.hero-content {
			text-align: left;
		}
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-pill);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin-bottom: 24px;
	}

	.badge-dot {
		width: 8px;
		height: 8px;
		background: var(--color-primary);
		border-radius: 50%;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	.badge strong {
		color: var(--color-text);
	}

	.headline {
		font-size: clamp(36px, 8vw, 56px);
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: -0.03em;
		margin: 0 0 24px;
	}

	.subheadline {
		font-size: var(--text-xl);
		color: var(--color-text-muted);
		margin: 0 0 40px;
		max-width: 480px;
		line-height: 1.6;
	}

	@media (min-width: 1024px) {
		.subheadline {
			margin-left: 0;
			margin-right: auto;
		}
	}

	/* Audit Form */
	.audit-form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		max-width: 500px;
		margin: 0 auto 40px;
		padding: 8px;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-2xl);
	}

	@media (min-width: 640px) {
		.audit-form {
			flex-direction: row;
		}
	}

	@media (min-width: 1024px) {
		.audit-form {
			margin-left: 0;
		}
	}

	.audit-form input {
		flex: 1;
		padding: 16px 20px;
		background: transparent;
		border: none;
		font-family: var(--font-sans);
		font-size: var(--text-md);
		color: var(--color-text);
	}

	.audit-form input::placeholder {
		color: var(--color-text-faint);
	}

	.audit-form input:focus {
		outline: none;
	}

	.audit-form .btn-primary {
		padding: 16px 28px;
		white-space: nowrap;
	}

	.error {
		color: var(--color-danger);
		font-size: var(--text-sm);
		margin: -24px 0 24px;
	}

	/* Stats */
	.stats-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 32px;
	}

	@media (min-width: 1024px) {
		.stats-row {
			justify-content: flex-start;
		}
	}

	.stat {
		text-align: center;
	}

	@media (min-width: 1024px) {
		.stat {
			text-align: left;
		}
	}

	.stat-number {
		display: block;
		font-size: var(--text-3xl);
		font-weight: 700;
		color: var(--color-primary);
	}

	.stat-label {
		font-size: var(--text-sm);
		color: var(--color-text-faint);
	}

	.stat-divider {
		width: 1px;
		height: 48px;
		background: var(--glass-border);
	}

	/* Hero Visual */
	.hero-visual {
		display: none;
		position: relative;
		justify-content: center;
	}

	@media (min-width: 1024px) {
		.hero-visual {
			display: flex;
		}
	}

	:global(.score-card) {
		width: 100%;
		max-width: 360px;
	}

	.score-header {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 24px;
	}

	.score-icon {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-lg);
		background: var(--color-primary-light);
		color: var(--color-primary);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.score-subtitle {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.score-domain {
		font-size: var(--text-xl);
		font-weight: 600;
	}

	.score-gauge-wrapper {
		display: flex;
		justify-content: center;
		margin-bottom: 24px;
	}

	.score-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}

	.mini-stat {
		text-align: center;
		padding: 12px;
		border-radius: var(--radius-lg);
		background: var(--color-bg-muted);
	}

	.mini-stat-value {
		display: block;
		font-size: var(--text-lg);
		font-weight: 700;
	}

	.mini-stat.pass .mini-stat-value { color: var(--color-success); }
	.mini-stat.warn .mini-stat-value { color: var(--color-warning); }
	.mini-stat.fail .mini-stat-value { color: var(--color-danger); }

	.mini-stat-label {
		font-size: var(--text-xs);
		color: var(--color-text-faint);
	}

	/* Floating Cards */
	.floating-card {
		position: absolute;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		animation: float 6s ease-in-out infinite;
	}

	.floating-card.top-right {
		top: -20px;
		right: -20px;
	}

	.floating-card.bottom-left {
		bottom: -20px;
		left: -20px;
		animation-delay: -3s;
	}

	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-10px); }
	}

	.floating-icon {
		width: 32px;
		height: 32px;
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.floating-icon.pass {
		background: var(--color-success-light);
		color: var(--color-success);
	}

	.floating-icon.trend {
		background: var(--color-primary-light);
		color: var(--color-primary);
	}

	.floating-title {
		font-size: var(--text-base);
		font-weight: 600;
	}

	.floating-subtitle {
		font-size: var(--text-xs);
		color: var(--color-text-faint);
	}

	/* Sections */
	.section-header {
		text-align: center;
		margin-bottom: 48px;
	}

	.section-header h2 {
		font-size: var(--text-3xl);
		font-weight: 700;
		margin: 0 0 12px;
		letter-spacing: -0.02em;
	}

	.section-header p {
		font-size: var(--text-lg);
		color: var(--color-text-muted);
		margin: 0;
	}

	/* Checks Section */
	.checks-section {
		max-width: var(--width-max);
		margin: 0 auto;
		padding: 80px 24px;
	}

	.checks-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 20px;
	}

	:global(.check-card) {
		display: flex;
		flex-direction: column;
	}

	:global(.check-card) .check-icon {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-lg);
		background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-secondary-light) 100%);
		color: var(--color-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 16px;
	}

	:global(.check-card) h3 {
		font-size: var(--text-lg);
		font-weight: 600;
		margin: 0 0 8px;
	}

	:global(.check-card) p {
		font-size: var(--text-base);
		color: var(--color-text-muted);
		margin: 0;
		line-height: 1.6;
	}

	/* Pricing Section */
	.pricing-section {
		max-width: var(--width-content);
		margin: 0 auto;
		padding: 80px 24px;
	}

	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 24px;
	}

	:global(.pricing-card) {
		display: flex;
		flex-direction: column;
		position: relative;
	}

	:global(.pricing-card.featured) {
		border-color: var(--color-primary);
		background: rgba(244, 37, 157, 0.05);
	}

	.popular-badge {
		position: absolute;
		top: -12px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--color-primary);
		color: white;
		padding: 6px 16px;
		border-radius: var(--radius-pill);
		font-size: var(--text-sm);
		font-weight: 600;
	}

	:global(.pricing-card) h3 {
		font-size: var(--text-lg);
		font-weight: 600;
		margin: 0 0 8px;
	}

	.price {
		font-size: var(--text-4xl);
		font-weight: 700;
		margin-bottom: 24px;
	}

	.price span {
		font-size: var(--text-md);
		font-weight: 400;
		color: var(--color-text-muted);
	}

	:global(.pricing-card) ul {
		list-style: none;
		padding: 0;
		margin: 0 0 24px;
		flex: 1;
	}

	:global(.pricing-card) li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 0;
		border-bottom: 1px solid var(--glass-border);
		font-size: var(--text-base);
		color: var(--color-text-secondary);
	}

	:global(.pricing-card) li::before {
		content: '';
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-success-light);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	:global(.pricing-card) li:last-child {
		border-bottom: none;
	}

	/* FAQ Section */
	.faq-section {
		max-width: var(--width-content);
		margin: 0 auto;
		padding: 80px 24px;
	}

	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.faq-item {
		display: flex;
		flex-direction: column;
		width: 100%;
		text-align: left;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		padding: 20px 24px;
		cursor: pointer;
		transition: border-color 150ms ease;
		font-family: var(--font-sans);
	}

	.faq-item:hover {
		border-color: var(--color-border);
	}

	.faq-item.open {
		border-color: var(--color-primary);
	}

	.faq-question {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		font-size: var(--text-md);
		font-weight: 600;
	}

	:global(.faq-caret) {
		color: var(--color-text-muted);
		flex-shrink: 0;
		transition: transform 200ms ease;
	}

	.faq-item.open :global(.faq-caret) {
		transform: rotate(180deg);
	}

	.faq-answer {
		margin: 16px 0 0;
		padding-top: 16px;
		border-top: 1px solid var(--glass-border);
		font-size: var(--text-base);
		color: var(--color-text-muted);
		line-height: 1.7;
	}

	/* CTA Section */
	.cta-section {
		max-width: var(--width-content);
		margin: 0 auto;
		padding: 40px 24px 80px;
	}

	:global(.cta-card) {
		text-align: center;
	}

	:global(.cta-card) h2 {
		font-size: var(--text-3xl);
		font-weight: 700;
		margin: 0 0 12px;
	}

	:global(.cta-card) p {
		font-size: var(--text-lg);
		color: var(--color-text-muted);
		margin: 0 0 32px;
	}

	/* Footer */
	.footer {
		border-top: 1px solid var(--glass-border);
		padding: 48px 24px;
	}

	.footer-content {
		max-width: var(--width-max);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
		text-align: center;
	}

	@media (min-width: 768px) {
		.footer-content {
			flex-direction: row;
			justify-content: space-between;
			text-align: left;
		}
	}

	.footer-brand {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.footer-logo {
		font-size: var(--text-md);
		font-weight: 600;
	}

	.footer-tagline {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.footer-links {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 24px;
	}

	.footer-links a {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--text-sm);
		transition: color 150ms ease;
	}

	.footer-links a:hover {
		color: var(--color-primary);
	}

	.footer-copyright {
		font-size: var(--text-sm);
		color: var(--color-text-faint);
		margin: 0;
	}
</style>
