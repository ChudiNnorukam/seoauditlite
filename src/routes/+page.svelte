<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { MagnifyingGlass, Robot, FileText, Code, TextAlignLeft, Tag, ListChecks } from 'phosphor-svelte';

	let domain = '';
	let loading = false;
	let error = '';

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
</svelte:head>

<Header />

<div class="page">
	<!-- Hero Section -->
	<section class="hero">
		<h1 class="headline">Know Your AI Search Readiness</h1>
		<p class="subheadline">AEO audit in 2 minutes. Free, no signup required.</p>

		<!-- Audit Form -->
		<form on:submit={handleAudit} class="audit-form">
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
						<MagnifyingGlass size={16} weight="bold" />
						Analyze Site
					{/if}
				</button>
			</div>
			{#if error}
				<p class="error">{error}</p>
			{/if}
		</form>

		<!-- Stats -->
		<div class="stats">
			<div class="stat">
				<span class="number">60%</span>
				<span class="label">invisible to AI</span>
			</div>
			<div class="stat">
				<span class="number">30%</span>
				<span class="label">AI-first searches</span>
			</div>
		</div>
	</section>

	<!-- How It Works -->
	<section class="how-it-works">
		<h2>The 6 AEO Checks</h2>
		<div class="grid">
			<div class="card">
				<div class="card-icon"><Robot size={20} weight="duotone" /></div>
				<h3>AI Crawler Access</h3>
				<p>robots.txt allows GPTBot, ClaudeBot, PerplexityBot?</p>
			</div>
			<div class="card">
				<div class="card-icon"><FileText size={20} weight="duotone" /></div>
				<h3>llms.txt</h3>
				<p>New robots.txt for AI engines</p>
			</div>
			<div class="card">
				<div class="card-icon"><Code size={20} weight="duotone" /></div>
				<h3>Structured Data</h3>
				<p>JSON-LD schema quality</p>
			</div>
			<div class="card">
				<div class="card-icon"><TextAlignLeft size={20} weight="duotone" /></div>
				<h3>Extractability</h3>
				<p>Semantic HTML + proper structure</p>
			</div>
			<div class="card">
				<div class="card-icon"><Tag size={20} weight="duotone" /></div>
				<h3>AI Metadata</h3>
				<p>Canonical URLs, OG tags, dates</p>
			</div>
			<div class="card">
				<div class="card-icon"><ListChecks size={20} weight="duotone" /></div>
				<h3>Answer Format</h3>
				<p>FAQ/HowTo schema + lists</p>
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
				<a class="micro-link" href="/planner">Open planner</a>
			</div>
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
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="footer">
		<div class="footer-content">
			<p class="footer-brand">SEOAuditLite</p>
			<p class="footer-tagline">Know your AI search readiness</p>
			<div class="footer-links">
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
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #fff;
		color: #0f172a;
		-webkit-font-smoothing: antialiased;
	}

	.page {
		max-width: 1200px;
		margin: 0 auto;
	}

	.hero {
		padding: 48px 20px 56px;
		text-align: center;
	}

	.headline {
		font-size: 36px;
		margin: 0 0 12px 0;
		line-height: 1.2;
		letter-spacing: -0.02em;
		font-weight: 600;
	}

	.subheadline {
		font-size: 16px;
		color: #64748b;
		margin: 0 0 32px 0;
	}

	.audit-form {
		margin-bottom: 32px;
	}

	.input-group {
		display: flex;
		gap: 12px;
		max-width: 480px;
		margin: 0 auto;
		flex-wrap: wrap;
	}

	input {
		flex: 1;
		padding: 12px 16px;
		border: 0.5px solid rgba(15, 23, 42, 0.12);
		border-radius: 6px;
		font-size: 14px;
		min-width: 200px;
		background: #fff;
		transition: border-color 150ms ease, box-shadow 150ms ease;
	}

	input:focus {
		outline: none;
		border-color: #1162d4;
		box-shadow: 0 0 0 3px rgba(17, 98, 212, 0.08);
	}

	button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 12px 20px;
		background: #1162d4;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: background 150ms ease;
	}

	button:hover:not(:disabled) {
		background: #0c4da8;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		color: #dc2626;
		font-size: 13px;
		margin: 12px 0 0 0;
	}

	.stats {
		display: flex;
		justify-content: center;
		gap: 16px;
		flex-wrap: wrap;
	}

	.stat {
		padding: 16px 20px;
		border: 0.5px solid rgba(15, 23, 42, 0.08);
		border-radius: 6px;
		text-align: center;
		min-width: 120px;
		background: #fafbfc;
	}

	.number {
		display: block;
		font-size: 24px;
		font-weight: 600;
		color: #1162d4;
		margin-bottom: 4px;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
		font-variant-numeric: tabular-nums;
	}

	.label {
		display: block;
		font-size: 12px;
		color: #64748b;
	}

	.how-it-works {
		padding: 48px 20px;
		border-top: 0.5px solid rgba(15, 23, 42, 0.08);
	}

	.how-it-works h2 {
		text-align: center;
		margin-bottom: 28px;
		font-size: 20px;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 12px;
	}

	.card {
		padding: 16px;
		border: 0.5px solid rgba(15, 23, 42, 0.08);
		border-radius: 6px;
		background: #fff;
		transition: border-color 150ms ease;
	}

	.card:hover {
		border-color: rgba(15, 23, 42, 0.16);
	}

	.card-icon {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		background: rgba(17, 98, 212, 0.08);
		color: #1162d4;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 12px;
	}

	.card h3 {
		margin: 0 0 6px 0;
		font-size: 14px;
		font-weight: 600;
	}

	.card p {
		margin: 0;
		font-size: 13px;
		color: #64748b;
		line-height: 1.4;
	}

	.pricing {
		padding: 48px 20px;
		background: #f8fafc;
		border-top: 0.5px solid rgba(15, 23, 42, 0.08);
	}

	.pricing h2 {
		text-align: center;
		margin-bottom: 28px;
		font-size: 20px;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.micro-apps {
		padding: 48px 20px;
		border-top: 0.5px solid rgba(15, 23, 42, 0.08);
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
		color: #64748b;
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
		background: white;
		border: 0.5px solid rgba(15, 23, 42, 0.08);
		border-radius: 6px;
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
		color: #64748b;
		font-size: 13px;
		line-height: 1.5;
	}

	.micro-link {
		color: #1162d4;
		font-weight: 500;
		text-decoration: none;
		font-size: 13px;
	}

	.micro-link:hover {
		text-decoration: underline;
	}

	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 16px;
		max-width: 600px;
		margin: 0 auto;
	}

	.pricing-card {
		padding: 20px;
		border: 0.5px solid rgba(15, 23, 42, 0.08);
		border-radius: 6px;
		background: white;
		position: relative;
	}

	.pricing-card.featured {
		border-color: rgba(17, 98, 212, 0.3);
		background: rgba(17, 98, 212, 0.02);
	}

	.badge {
		position: absolute;
		top: -10px;
		right: 20px;
		background: #1162d4;
		color: white;
		padding: 4px 10px;
		border-radius: 6px;
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
		color: #0f172a;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
	}

	.price span {
		font-size: 13px;
		font-weight: 400;
		color: #64748b;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.pricing-card ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.pricing-card li {
		padding: 8px 0;
		font-size: 13px;
		color: #475569;
		border-bottom: 0.5px solid rgba(15, 23, 42, 0.06);
	}

	.pricing-card li:last-child {
		border-bottom: none;
	}

	.footer {
		padding: 32px 20px;
		border-top: 0.5px solid rgba(15, 23, 42, 0.08);
		background: #fafbfc;
	}

	.footer-content {
		text-align: center;
	}

	.footer-brand {
		font-size: 14px;
		font-weight: 600;
		margin: 0 0 4px 0;
		color: #0f172a;
	}

	.footer-tagline {
		font-size: 12px;
		color: #64748b;
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
		color: #64748b;
		text-decoration: none;
		font-size: 12px;
		transition: color 150ms ease;
	}

	.footer-links a:hover {
		color: #1162d4;
	}

	.footer-links .divider {
		color: #e2e8f0;
	}

	.footer-copyright {
		font-size: 11px;
		color: #94a3b8;
		margin: 0;
	}

	@media (max-width: 640px) {
		.headline {
			font-size: 28px;
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
	}
</style>
