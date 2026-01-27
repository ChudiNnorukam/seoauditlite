<script lang="ts">
	import Header from '$lib/components/Header.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>About - SEOAuditLite | The First AEO Audit Tool</title>
	<meta name="description" content="Learn about SEOAuditLite - the first Answer Engine Optimization (AEO) audit tool for ChatGPT, Perplexity, and Claude search visibility." />
	<link rel="canonical" href="https://seoauditlite.com/about" />
</svelte:head>

<div class="page">
	<Header user={data.user} />

	<main class="about-page">
		<article class="about-card">
			<h1>About SEOAuditLite</h1>
			<p class="tagline">The first AEO audit tool for AI search readiness</p>

			<section>
				<h2>The AEO Problem</h2>
				<p>
					In 2024, Google search dropped to 58% market share. ChatGPT, Perplexity, and Claude are how millions now find information. But most websites are invisible to AI search engines.
				</p>
				<p>
					Traditional SEO tools check for Google-specific signals: backlinks, keyword density, page speed. But AI search engines look for different signals: structured data, semantic HTML, AI crawler access, and machine-readable content summaries.
				</p>
				<p>
					<strong>That's the AEO gap.</strong> And most websites score under 50/100.
				</p>
			</section>

			<section>
				<h2>Our Solution</h2>
				<p>
					SEOAuditLite is the first AEO (Answer Engine Optimization) audit tool. We check 6 critical signals that AI search engines use to rank and cite your content:
				</p>
				<ul>
					<li><strong>AI Crawler Access</strong> - Does your robots.txt allow GPTBot, ClaudeBot, and PerplexityBot?</li>
					<li><strong>llms.txt</strong> - Do you have an AI-readable site summary at /llms.txt?</li>
					<li><strong>Structured Data</strong> - High-quality JSON-LD schema for content understanding</li>
					<li><strong>Extractability</strong> - Semantic HTML that AI can parse and cite</li>
					<li><strong>AI Metadata</strong> - Canonical URLs, Open Graph tags, publication dates</li>
					<li><strong>Answer Format</strong> - FAQ schema, HowTo guides, and list structures</li>
				</ul>
				<p>
					You get an instant score (0-100) and prioritized recommendations ranked by impact and effort.
				</p>
			</section>

			<section>
				<h2>Who Built This</h2>
				<p>
					Created by <a href="https://chudi.dev" target="_blank" rel="noopener">Chudi Nnorukam</a>, a software engineer focused on AI-native web experiences.
				</p>
				<p>
					After optimizing this site to score 100/100 on our own AEO audit (we eat our own dog food), we packaged the methodology into a tool anyone can use in 2 minutes.
				</p>
			</section>

			<section>
				<h2>Why Trust Us</h2>
				<ul>
					<li><strong>We use it ourselves:</strong> SEOAuditLite.com scores 100/100 on our own audit</li>
					<li><strong>Open methodology:</strong> All 6 checks are documented and transparent</li>
					<li><strong>Free tier:</strong> No credit card required to try it - 3 audits per month</li>
					<li><strong>No vendor lock-in:</strong> Export your audit results and recommendations</li>
				</ul>
			</section>

			<section>
				<h2>Built With</h2>
				<p>
					SEOAuditLite is built with modern web technologies:
				</p>
				<ul>
					<li><strong>SvelteKit</strong> - Fast, reactive UI framework</li>
					<li><strong>TypeScript</strong> - Type-safe codebase</li>
					<li><strong>Turso (LibSQL)</strong> - Edge database for low-latency storage</li>
					<li><strong>Vercel</strong> - Global edge deployment</li>
					<li><strong>Lucia Auth</strong> - Secure authentication with Google OAuth</li>
				</ul>
			</section>

			<section>
				<h2>The Mission</h2>
				<p>
					Make every website AI-search ready. As AI becomes the primary way people discover information, we want to democratize access to AEO best practices.
				</p>
				<p>
					Whether you're a solo founder, content marketer, or enterprise SEO team, you should be able to audit your AEO readiness in 2 minutes - for free.
				</p>
			</section>

			<section>
				<h2>Contact</h2>
				<p>Questions, feedback, or partnership inquiries?</p>
				<ul>
					<li>Email: <a href="mailto:hello@seoauditlite.com">hello@seoauditlite.com</a></li>
					<li>Twitter: <a href="https://twitter.com/chudin" target="_blank" rel="noopener">@chudin</a></li>
					<li>Website: <a href="https://chudi.dev" target="_blank" rel="noopener">chudi.dev</a></li>
				</ul>
			</section>
		</article>

		<div class="cta-section">
			<p>Ready to check your AEO score?</p>
			<a href="/" class="cta-button">Try Free Audit</a>
		</div>
	</main>
</div>

<style>
	.page {
		min-height: 100vh;
		background: var(--color-bg-subtle);
	}

	.about-page {
		max-width: 720px;
		margin: 0 auto;
		padding: 40px 20px 60px;
	}

	.about-card {
		background: var(--color-bg);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-lg);
		padding: 40px;
	}

	h1 {
		font-size: 32px;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 8px 0;
		letter-spacing: -0.02em;
	}

	.tagline {
		font-size: 16px;
		color: var(--color-text-faint);
		margin: 0 0 32px 0;
	}

	section {
		margin-bottom: 32px;
	}

	section:last-of-type {
		margin-bottom: 0;
	}

	h2 {
		font-size: 20px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 12px 0;
		letter-spacing: -0.01em;
	}

	p {
		font-size: 14px;
		color: var(--color-text-secondary);
		line-height: 1.7;
		margin: 0 0 12px 0;
	}

	p:last-child {
		margin-bottom: 0;
	}

	ul {
		list-style: disc;
		padding-left: 24px;
		margin: 12px 0;
	}

	li {
		font-size: 14px;
		color: var(--color-text-secondary);
		line-height: 1.7;
		padding: 4px 0;
	}

	li strong {
		color: var(--color-text);
	}

	a {
		color: var(--color-primary);
		text-decoration: none;
		font-weight: 500;
	}

	a:hover {
		color: var(--color-primary-hover);
		text-decoration: underline;
	}

	.cta-section {
		text-align: center;
		margin-top: 32px;
		padding: 32px;
		background: var(--color-bg);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-lg);
	}

	.cta-section p {
		font-size: 16px;
		color: var(--color-text);
		margin-bottom: 16px;
		font-weight: 500;
	}

	.cta-button {
		display: inline-block;
		background: var(--color-primary);
		color: white;
		padding: 12px 32px;
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: 14px;
		text-decoration: none;
		transition: all 150ms ease;
	}

	.cta-button:hover {
		background: var(--color-primary-hover);
		transform: translateY(-1px);
		text-decoration: none;
	}

	@media (max-width: 640px) {
		.about-card {
			padding: 24px;
		}

		h1 {
			font-size: 26px;
		}

		h2 {
			font-size: 18px;
		}

		.cta-section {
			padding: 24px;
		}
	}
</style>
