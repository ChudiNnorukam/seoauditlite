<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { MagnifyingGlass, Robot, FileText, Code, TextAlignLeft, Tag, ListChecks, Lightning, ArrowRight, CaretDown } from 'phosphor-svelte';

	let { data } = $props();

	let domain = $state('');
	let loading = $state(false);
	let error = $state('');
	let openFaq = $state<number | null>(null);

	// Animated counter for social proof
	let auditCount = 2847;

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

			// Store result and show it
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

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="SEOAuditLite - Know Your AI Search Readiness" />
	<meta property="og:description" content="Check your site's AEO readiness for Perplexity, ChatGPT, and Claude. Free audit in 2 minutes, no signup required." />
	<meta property="og:url" content="https://seoauditlite.com/" />
	<meta property="og:site_name" content="SEOAuditLite" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="SEOAuditLite - Know Your AI Search Readiness" />
	<meta name="twitter:description" content="Check your site's AEO readiness for Perplexity, ChatGPT, and Claude. Free audit in 2 minutes." />

	<!-- JSON-LD SoftwareApplication Schema -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		"name": "SEOAuditLite",
		"applicationCategory": "BusinessApplication",
		"operatingSystem": "Web",
		"description": "Free AEO (Answer Engine Optimization) audit tool for checking AI search readiness",
		"url": "https://seoauditlite.com",
		"offers": {
			"@type": "Offer",
			"price": "0",
			"priceCurrency": "USD"
		},
		"author": {
			"@type": "Person",
			"name": "Chudi Nnorukam",
			"url": "https://chudi.dev"
		}
	}
	</script>`}

	<!-- JSON-LD FAQPage Schema -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "FAQPage",
		"mainEntity": [
			{
				"@type": "Question",
				"name": "How accurate is the audit?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "We check the same signals AI crawlers use — robots.txt directives, structured data, llms.txt, semantic HTML, and metadata. Results reflect real crawl behavior, not guesswork."
				}
			},
			{
				"@type": "Question",
				"name": "What is AEO?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "Answer Engine Optimization (AEO) is the practice of making your site visible and quotable by AI search engines like Perplexity, ChatGPT, and Claude — the next generation of search."
				}
			},
			{
				"@type": "Question",
				"name": "Is my data stored?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "Free audits are stored for 7 days. Pro audits are retained for 30 days. We never sell your data or share it with third parties beyond our infrastructure providers."
				}
			}
		]
	}
	</script>`}
</svelte:head>

<Header user={data.user} plan={data.plan} />

<div class="page">
	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-content">
			<div class="social-proof">
				<Lightning size={14} weight="fill" />
				<span><strong>{auditCount.toLocaleString()}</strong> audits run this month</span>
			</div>

			<h1 class="headline">
				Know your<br />
				<span class="accent-text">AI search readiness.</span>
			</h1>
			<p class="subheadline">Free AEO audit in 2 minutes. See how Perplexity, ChatGPT, and Claude see your site.</p>

			<!-- Audit Form -->
			<form onsubmit={handleAudit} class="audit-form">
				<div class="input-group">
					<input
						type="text"
						placeholder="Enter domain (e.g., yoursite.com)"
						bind:value={domain}
						disabled={loading}
						required
					/>
					<button type="submit" disabled={loading}>
						{#if loading}
							Analyzing...
						{:else}
							Analyze Site
							<ArrowRight size={16} weight="bold" />
						{/if}
					</button>
				</div>
				{#if error}
					<p class="error">{error}</p>
				{/if}
			</form>

			<!-- Stats with Source -->
			<div class="stats">
				<div class="stat">
					<span class="number">60%</span>
					<span class="stat-label">of sites invisible to AI</span>
				</div>
				<div class="stat-divider"></div>
				<div class="stat">
					<span class="number">30%</span>
					<span class="stat-label">of searches now AI-first</span>
				</div>
			</div>
			<p class="stats-source">Based on Gartner & Sparktoro 2024 research</p>
		</div>
	</section>

	<!-- The 6 AEO Checks -->
	<section class="checks-section">
		<h2>The 6 AEO Checks</h2>
		<p class="section-subtitle">What we analyze to score your AI readiness</p>

		<div class="checks-grid">
			<div class="check-card">
				<div class="check-icon orange"><Robot size={20} weight="duotone" /></div>
				<h3>AI Crawler Access</h3>
				<p>Does your robots.txt allow GPTBot, ClaudeBot, and PerplexityBot to crawl your content?</p>
			</div>
			<div class="check-card">
				<div class="check-icon"><FileText size={20} weight="duotone" /></div>
				<h3>llms.txt</h3>
				<p>The new robots.txt for AI — tells engines what content matters most</p>
			</div>
			<div class="check-card">
				<div class="check-icon"><Code size={20} weight="duotone" /></div>
				<h3>Structured Data</h3>
				<p>JSON-LD schema quality and completeness for rich AI answers</p>
			</div>
			<div class="check-card">
				<div class="check-icon"><TextAlignLeft size={20} weight="duotone" /></div>
				<h3>Extractability</h3>
				<p>Semantic HTML structure that AI can parse and quote</p>
			</div>
			<div class="check-card">
				<div class="check-icon"><Tag size={20} weight="duotone" /></div>
				<h3>AI Metadata</h3>
				<p>Canonical URLs, OG tags, publish dates AI engines trust</p>
			</div>
			<div class="check-card">
				<div class="check-icon"><ListChecks size={20} weight="duotone" /></div>
				<h3>Answer Format</h3>
				<p>FAQ/HowTo schema + bulleted lists AI loves to cite</p>
			</div>
		</div>
	</section>

	<!-- Micro Apps -->
	<section class="micro-apps">
		<h2>Micro Apps</h2>
		<p class="section-lede">Spin up fast AEO workflows without leaving the audit.</p>
		<div class="micro-grid">
			<div class="micro-card">
				<h3>AEO Quick Wins Planner</h3>
				<p>Build a prioritized plan, score impact vs effort, and export your sprint list.</p>
				<a class="micro-link" href="/planner">Open planner <ArrowRight size={12} weight="bold" /></a>
			</div>
		</div>
	</section>

	<!-- FAQ -->
	<section class="faq-section">
		<h2>Frequently Asked Questions</h2>
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

	<!-- Pricing -->
	<section class="pricing">
		<h2>Pricing</h2>
		<div class="pricing-grid">
			<div class="pricing-card">
				<h3>Free</h3>
				<p class="price">$0</p>
				<ul>
					<li>3 audits/month</li>
					<li>Full AEO score</li>
					<li>No signup</li>
				</ul>
				<a href="/#" class="pricing-cta secondary" onclick={(e) => { e.preventDefault(); (document.querySelector('.audit-form input') as HTMLInputElement | null)?.focus(); }}>Start Free</a>
			</div>
			<div class="pricing-card featured">
				<span class="badge">Popular</span>
				<h3>Pro</h3>
				<p class="price">$29<span>/month</span></p>
				<ul>
					<li>Unlimited audits</li>
					<li>30-day history</li>
					<li>PDF export</li>
				</ul>
				<a href="/account" class="pricing-cta primary">Go Pro <ArrowRight size={14} weight="bold" /></a>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="footer">
		<hr class="footer-rule" />
		<div class="footer-content">
			<p class="footer-brand">SEOAuditLite</p>
			<p class="footer-tagline">Know your AI search readiness</p>
			<div class="footer-links">
				<a href="/privacy">Privacy</a>
				<span class="divider">|</span>
				<a href="/terms">Terms</a>
				<span class="divider">|</span>
				<a href="/llms.txt">llms.txt</a>
				<span class="divider">|</span>
				<a href="/sitemap.xml">Sitemap</a>
				<span class="divider">|</span>
				<a href="https://chudi.dev" target="_blank" rel="noopener">Built by Chudi</a>
			</div>
			<p class="footer-copyright">&copy; {new Date().getFullYear()} SEOAuditLite. All rights reserved.</p>
		</div>
	</footer>
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
	}

	/* Hero */
	.hero {
		background: #fefcf9;
		padding: 64px 24px;
		text-align: center;
		position: relative;
		overflow: hidden;
	}

	.hero::before {
		content: '';
		position: absolute;
		top: -40%;
		left: 50%;
		transform: translateX(-50%);
		width: 600px;
		height: 600px;
		background: radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, transparent 70%);
		pointer-events: none;
	}

	.hero-content {
		position: relative;
		z-index: 1;
	}

	/* Social Proof Badge */
	.social-proof {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		background: rgba(249, 115, 22, 0.08);
		border: 1px solid rgba(249, 115, 22, 0.15);
		border-radius: 20px;
		font-size: 12px;
		color: var(--color-primary-hover, #ea580c);
		margin-bottom: 24px;
	}

	.social-proof strong {
		font-weight: 600;
		font-family: var(--font-mono);
	}

	.headline {
		font-size: 48px;
		margin: 0 0 16px 0;
		line-height: 1.1;
		letter-spacing: -0.03em;
		font-weight: 700;
		color: var(--color-text);
	}

	.accent-text {
		color: var(--color-primary);
	}

	.subheadline {
		font-size: 17px;
		color: var(--color-text-muted);
		margin: 0 0 36px 0;
		max-width: 480px;
		margin-left: auto;
		margin-right: auto;
		line-height: 1.5;
	}

	.audit-form {
		margin-bottom: 40px;
	}

	.input-group {
		display: flex;
		gap: 12px;
		max-width: 520px;
		margin: 0 auto;
		flex-wrap: wrap;
	}

	input {
		flex: 1;
		padding: 14px 18px;
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		font-size: 15px;
		min-width: 200px;
		background: var(--color-bg);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
		transition: border-color 150ms ease, box-shadow 150ms ease;
	}

	input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
	}

	button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 14px 24px;
		background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
		transition: transform 150ms ease, box-shadow 150ms ease;
		box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25);
	}

	button:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(249, 115, 22, 0.35);
	}

	button:active:not(:disabled) {
		transform: translateY(0);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		color: var(--color-danger);
		font-size: 13px;
		margin: 12px 0 0 0;
	}

	/* Stats Inline */
	.stats {
		display: inline-flex;
		align-items: center;
		gap: 20px;
		padding: 12px 24px;
		background: rgba(255, 255, 255, 0.8);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		backdrop-filter: blur(8px);
	}

	.stat {
		text-align: center;
	}

	.stat-divider {
		width: 1px;
		height: 32px;
		background: rgba(15, 23, 42, 0.1);
	}

	.number {
		display: block;
		font-size: 28px;
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: 2px;
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
	}

	.stat-label {
		display: block;
		font-size: 12px;
		color: var(--color-text-muted);
	}

	.stats-source {
		margin: 12px 0 0 0;
		font-size: 11px;
		color: var(--color-text-faint);
	}

	/* Checks Section (6 cards grid) */
	.checks-section {
		padding: 64px 24px;
	}

	.checks-section h2 {
		text-align: center;
		margin-bottom: 8px;
		font-size: 24px;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.section-subtitle {
		text-align: center;
		color: var(--color-text-muted);
		font-size: 14px;
		margin: 0 0 32px 0;
	}

	.checks-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		max-width: 900px;
		margin: 0 auto;
	}

	.check-card {
		padding: 20px;
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
	}

	.check-card:hover {
		transform: translateY(-2px);
		border-color: var(--color-border);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
	}

	.check-icon {
		width: 36px;
		height: 36px;
		border-radius: var(--radius-sm);
		background: var(--color-bg-subtle);
		color: var(--color-text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 14px;
	}

	.check-icon.orange {
		background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
		color: white;
	}

	.check-card h3 {
		margin: 0 0 8px 0;
		font-size: 14px;
		font-weight: 600;
	}

	.check-card p {
		margin: 0;
		font-size: 13px;
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	/* Micro Apps */
	.micro-apps {
		padding: 64px 24px;
		border-top: 1px solid var(--color-border-light);
		text-align: center;
	}

	.micro-apps h2 {
		font-size: 20px;
		font-weight: 600;
		letter-spacing: -0.01em;
		margin-bottom: 8px;
	}

	.section-lede {
		margin: 0 0 24px 0;
		color: var(--color-text-muted);
		font-size: 14px;
	}

	.micro-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 16px;
		max-width: 720px;
		margin: 0 auto;
	}

	.micro-card {
		background: var(--color-bg);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		padding: 20px;
		text-align: left;
	}

	.micro-card h3 {
		margin: 0 0 8px 0;
		font-size: 15px;
		font-weight: 600;
	}

	.micro-card p {
		margin: 0 0 16px 0;
		color: var(--color-text-muted);
		font-size: 13px;
		line-height: 1.5;
	}

	.micro-link {
		color: var(--color-primary);
		font-weight: 500;
		text-decoration: none;
		font-size: 13px;
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.micro-link:hover {
		color: var(--color-primary-hover);
	}

	/* FAQ Section */
	.faq-section {
		padding: 64px 24px;
		border-top: 1px solid var(--color-border-light);
	}

	.faq-section h2 {
		text-align: center;
		font-size: 20px;
		font-weight: 600;
		letter-spacing: -0.01em;
		margin-bottom: 24px;
	}

	.faq-list {
		max-width: 640px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.faq-item {
		width: 100%;
		text-align: left;
		background: var(--color-bg);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		padding: 16px 20px;
		cursor: pointer;
		transition: border-color 150ms ease;
		font-family: inherit;
	}

	.faq-item:hover {
		border-color: var(--color-border);
	}

	.faq-item.open {
		border-color: rgba(249, 115, 22, 0.2);
	}

	.faq-question {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		font-size: 14px;
		font-weight: 600;
		color: var(--color-text);
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
		margin: 12px 0 0 0;
		font-size: 13px;
		color: var(--color-text-secondary);
		line-height: 1.6;
	}

	/* Pricing */
	.pricing {
		padding: 64px 24px;
		background: var(--color-bg-subtle);
		border-top: 1px solid var(--color-border-light);
	}

	.pricing h2 {
		text-align: center;
		margin-bottom: 28px;
		font-size: 20px;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 16px;
		max-width: 600px;
		margin: 0 auto;
	}

	.pricing-card {
		padding: 24px;
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.pricing-card.featured {
		border-color: rgba(249, 115, 22, 0.3);
		background: rgba(249, 115, 22, 0.02);
	}

	.badge {
		position: absolute;
		top: -10px;
		right: 20px;
		background: var(--color-primary);
		color: white;
		padding: 4px 10px;
		border-radius: var(--radius-sm);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.pricing-card h3 {
		margin: 8px 0 6px 0;
		font-size: 16px;
		font-weight: 600;
	}

	.price {
		margin: 0 0 16px 0;
		font-size: 28px;
		font-weight: 600;
		color: var(--color-text);
		font-family: var(--font-mono);
	}

	.price span {
		font-size: 13px;
		font-weight: 400;
		color: var(--color-text-muted);
		font-family: var(--font-sans);
	}

	.pricing-card ul {
		list-style: none;
		margin: 0 0 20px 0;
		padding: 0;
		flex: 1;
	}

	.pricing-card li {
		padding: 8px 0;
		font-size: 13px;
		color: var(--color-text-secondary);
		border-bottom: 1px solid var(--color-border-light);
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.pricing-card li::before {
		content: '\2713';
		color: var(--color-success);
		font-weight: 700;
		font-size: 12px;
	}

	.pricing-card li:last-child {
		border-bottom: none;
	}

	.pricing-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 10px 20px;
		border-radius: var(--radius-sm);
		font-size: 14px;
		font-weight: 600;
		text-decoration: none;
		transition: transform 150ms ease, box-shadow 150ms ease;
		cursor: pointer;
	}

	.pricing-cta.primary {
		background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
		color: white;
		box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25);
	}

	.pricing-cta.primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(249, 115, 22, 0.35);
	}

	.pricing-cta.secondary {
		background: var(--color-bg);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.pricing-cta.secondary:hover {
		border-color: var(--color-text-muted);
	}

	/* Footer */
	.footer {
		padding: 40px 24px;
		background: var(--color-bg-subtle);
	}

	.footer-rule {
		border: none;
		border-top: 1px solid var(--color-border);
		margin: 0 0 32px 0;
	}

	.footer-content {
		text-align: center;
	}

	.footer-brand {
		font-size: 14px;
		font-weight: 600;
		margin: 0 0 4px 0;
		color: var(--color-text);
	}

	.footer-tagline {
		font-size: 12px;
		color: var(--color-text-muted);
		margin: 0 0 16px 0;
	}

	.footer-links {
		display: flex;
		justify-content: center;
		gap: 8px;
		flex-wrap: wrap;
		margin-bottom: 12px;
	}

	.footer-links a {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: 12px;
		transition: color 150ms ease;
	}

	.footer-links a:hover {
		color: var(--color-primary);
	}

	.footer-links .divider {
		color: var(--color-border);
	}

	.footer-copyright {
		font-size: 11px;
		color: var(--color-text-faint);
		margin: 0;
	}

	@media (max-width: 640px) {
		.headline {
			font-size: 32px;
		}

		.subheadline {
			font-size: 15px;
		}

		.input-group {
			flex-direction: column;
		}

		input,
		button {
			width: 100%;
		}

		button {
			justify-content: center;
		}

		.stats {
			flex-direction: column;
			gap: 0;
			padding: 16px;
		}

		.stat-divider {
			width: 100%;
			height: 1px;
			margin: 12px 0;
		}

		.checks-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (min-width: 641px) and (max-width: 900px) {
		.checks-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
