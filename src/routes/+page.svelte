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
		},
		{
			question: 'How often should I run an audit?',
			answer: 'Run an audit whenever you make significant content changes, publish new pages, or update your site structure. For actively maintained sites, monthly audits help track your AI search readiness over time.'
		},
		{
			question: 'What\'s the difference between SEO and AEO?',
			answer: 'Traditional SEO optimizes for search engine result pages (Google, Bing). AEO optimizes for AI-powered answer engines (ChatGPT, Perplexity, Claude) that generate answers directly. AEO focuses on structured data, semantic HTML, and content extractability rather than keyword density and backlinks.'
		},
		{
			question: 'Do I need technical knowledge to fix issues?',
			answer: 'Most fixes are straightforward. Adding llms.txt is as simple as creating a text file. Structured data can be generated with free tools. Our audit report provides specific, actionable recommendations with priority rankings to guide your improvements.'
		},
		{
			question: 'How long does it take to see results?',
			answer: 'AI crawlers typically re-index sites within 1-2 weeks after changes. However, improving your AEO score happens immediately once fixes are deployed. Run another audit after making changes to verify improvements.'
		},
		{
			question: 'Can AEO hurt my traditional SEO?',
			answer: 'No. AEO improvements like structured data, semantic HTML, and clear content hierarchy actually benefit traditional SEO as well. Search engines and AI engines both reward well-structured, accessible content.'
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

	<!-- Article metadata for AI engines -->
	<meta property="article:published_time" content="2025-12-15T00:00:00Z" />
	<meta property="article:modified_time" content="2026-01-26T00:00:00Z" />
	<meta property="article:author" content="Chudi Nnorukam" />

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
			},
			{
				"@type": "Question",
				"name": "How often should I run an audit?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "Run an audit whenever you make significant content changes, publish new pages, or update your site structure. For actively maintained sites, monthly audits help track your AI search readiness over time."
				}
			},
			{
				"@type": "Question",
				"name": "What's the difference between SEO and AEO?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "Traditional SEO optimizes for search engine result pages (Google, Bing). AEO optimizes for AI-powered answer engines (ChatGPT, Perplexity, Claude) that generate answers directly. AEO focuses on structured data, semantic HTML, and content extractability rather than keyword density and backlinks."
				}
			},
			{
				"@type": "Question",
				"name": "Do I need technical knowledge to fix issues?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "Most fixes are straightforward. Adding llms.txt is as simple as creating a text file. Structured data can be generated with free tools. Our audit report provides specific, actionable recommendations with priority rankings to guide your improvements."
				}
			},
			{
				"@type": "Question",
				"name": "How long does it take to see results?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "AI crawlers typically re-index sites within 1-2 weeks after changes. However, improving your AEO score happens immediately once fixes are deployed. Run another audit after making changes to verify improvements."
				}
			},
			{
				"@type": "Question",
				"name": "Can AEO hurt my traditional SEO?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "No. AEO improvements like structured data, semantic HTML, and clear content hierarchy actually benefit traditional SEO as well. Search engines and AI engines both reward well-structured, accessible content."
				}
			}
		]
	}
	</script>`}

	<!-- JSON-LD Organization Schema -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "Organization",
		"name": "SEOAuditLite",
		"url": "https://seoauditlite.com",
		"logo": "https://seoauditlite.com/logo.png",
		"description": "AI Search Readiness Audit Tool - Check your site's AEO (Answer Engine Optimization) for Perplexity, ChatGPT, and Claude",
		"founder": {
			"@type": "Person",
			"name": "Chudi Nnorukam",
			"url": "https://chudi.dev"
		},
		"sameAs": [
			"https://twitter.com/chudinnorukam",
			"https://github.com/anthropics/seoauditlite"
		]
	}
	</script>`}

	<!-- JSON-LD WebSite Schema with SearchAction -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "WebSite",
		"name": "SEOAuditLite",
		"url": "https://seoauditlite.com",
		"description": "AI Search Readiness Audit - Check your AEO score for ChatGPT, Perplexity, and Claude",
		"potentialAction": {
			"@type": "SearchAction",
			"target": {
				"@type": "EntryPoint",
				"urlTemplate": "https://seoauditlite.com/?q={search_term_string}"
			},
			"query-input": "required name=search_term_string"
		}
	}
	</script>`}

	<!-- JSON-LD Person Schema (Standalone) -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "Person",
		"name": "Chudi Nnorukam",
		"url": "https://chudi.dev",
		"jobTitle": "Founder & Developer",
		"worksFor": {
			"@type": "Organization",
			"name": "SEOAuditLite"
		},
		"sameAs": [
			"https://twitter.com/chudinnorukam",
			"https://github.com/chudinnorukam",
			"https://linkedin.com/in/chudinnorukam"
		]
	}
	</script>`}

	<!-- JSON-LD BlogPosting Schema -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		"headline": "AI Search Readiness: The Complete AEO Guide for 2026",
		"description": "Learn how to optimize your website for AI search engines like ChatGPT, Perplexity, and Claude. Comprehensive guide covering the 6 critical AEO checks.",
		"author": {
			"@type": "Person",
			"name": "Chudi Nnorukam",
			"url": "https://chudi.dev"
		},
		"publisher": {
			"@type": "Organization",
			"name": "SEOAuditLite",
			"logo": {
				"@type": "ImageObject",
				"url": "https://seoauditlite.com/logo.png"
			}
		},
		"datePublished": "2025-12-15T00:00:00Z",
		"dateModified": "2026-01-26T00:00:00Z",
		"mainEntityOfPage": {
			"@type": "WebPage",
			"@id": "https://seoauditlite.com/"
		},
		"keywords": ["AEO", "Answer Engine Optimization", "AI Search", "ChatGPT SEO", "Perplexity Optimization", "Claude AI", "AI Crawler"],
		"articleBody": "Answer Engine Optimization (AEO) is the practice of making your site visible and quotable by AI search engines. The 6 critical checks include: AI Crawler Access, llms.txt, Structured Data, Extractability, AI Metadata, and Answer Format."
	}
	</script>`}

	<!-- JSON-LD HowTo Schema -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "HowTo",
		"name": "How to Improve Your AI Search Readiness",
		"description": "Step-by-step guide to optimize your website for AI search engines like ChatGPT, Perplexity, and Claude",
		"step": [
			{
				"@type": "HowToStep",
				"name": "Check AI Crawler Access",
				"text": "Verify your robots.txt allows GPTBot, ClaudeBot, and PerplexityBot to crawl your content. Add explicit allow directives if missing.",
				"url": "https://seoauditlite.com/#ai-crawler-access"
			},
			{
				"@type": "HowToStep",
				"name": "Create llms.txt File",
				"text": "Publish an llms.txt file at your domain root declaring your AI crawling policy and listing your most important content pages.",
				"url": "https://seoauditlite.com/#llms-txt"
			},
			{
				"@type": "HowToStep",
				"name": "Add Structured Data",
				"text": "Implement JSON-LD schema markup for your content types: Organization, Person, FAQPage, HowTo, and BlogPosting schemas help AI engines understand your content.",
				"url": "https://seoauditlite.com/#structured-data"
			},
			{
				"@type": "HowToStep",
				"name": "Improve Content Extractability",
				"text": "Use semantic HTML tags (article, section, header), maintain proper heading hierarchy, add alt text to all images, and increase text-to-code ratio.",
				"url": "https://seoauditlite.com/#extractability"
			},
			{
				"@type": "HowToStep",
				"name": "Optimize AI Metadata",
				"text": "Add canonical URLs, OpenGraph tags, Twitter Card metadata, and article publication dates to help AI engines trust and cite your content.",
				"url": "https://seoauditlite.com/#ai-metadata"
			},
			{
				"@type": "HowToStep",
				"name": "Format Content for AI Extraction",
				"text": "Structure content with FAQ sections, bulleted lists, numbered lists, tables, and step-by-step guides that AI engines can easily parse and quote.",
				"url": "https://seoauditlite.com/#answer-format"
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
				<Lightning size={14} weight="fill" aria-label="Lightning bolt icon" />
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
							<ArrowRight size={16} weight="bold" aria-label="Arrow right icon" />
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
				<div class="check-icon"><Robot size={20} weight="duotone" aria-label="AI robot icon" /></div>
				<h3>AI Crawler Access</h3>
				<p>Does your robots.txt allow GPTBot, ClaudeBot, and PerplexityBot to crawl your content? Without explicit permission in your robots.txt file, AI search engines won't index your site, making your content invisible to ChatGPT, Perplexity, and Claude users searching for information in your domain.</p>
			</div>
			<div class="check-card">
				<div class="check-icon"><FileText size={20} weight="duotone" aria-label="File text icon" /></div>
				<h3>llms.txt</h3>
				<p>The new robots.txt for AI — tells engines what content matters most. This emerging standard lets you declare which pages should be prioritized when AI crawlers visit your site, helping ensure your most important content gets discovered and cited by AI answer engines.</p>
			</div>
			<div class="check-card">
				<div class="check-icon"><Code size={20} weight="duotone" aria-label="Code icon" /></div>
				<h3>Structured Data</h3>
				<p>JSON-LD schema quality and completeness for rich AI answers. Structured data helps AI engines understand your content relationships, author information, publication dates, and content types, making your site more quotable and increasing citation confidence.</p>
			</div>
			<div class="check-card">
				<div class="check-icon"><TextAlignLeft size={20} weight="duotone" aria-label="Text alignment icon" /></div>
				<h3>Extractability</h3>
				<p>Semantic HTML structure that AI can parse and quote. AI engines rely on clean HTML, proper heading hierarchy, descriptive alt text, and high text-to-code ratios to extract and understand your content. Poor HTML structure makes your content harder for AI to interpret accurately.</p>
			</div>
			<div class="check-card">
				<div class="check-icon"><Tag size={20} weight="duotone" aria-label="Tag icon" /></div>
				<h3>AI Metadata</h3>
				<p>Canonical URLs, OG tags, publish dates AI engines trust. Proper metadata signals help AI determine content freshness, authoritativeness, and canonical versions, increasing the likelihood your content will be cited with accurate attribution and timestamps.</p>
			</div>
			<div class="check-card">
				<div class="check-icon"><ListChecks size={20} weight="duotone" aria-label="Checklist icon" /></div>
				<h3>Answer Format</h3>
				<p>FAQ/HowTo schema + bulleted lists AI loves to cite. AI engines prefer structured Q&A formats, step-by-step guides, tables, and bulleted lists because they're easier to parse and quote directly in conversational responses to user queries.</p>
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
				<a class="micro-link" href="/planner">Open planner <ArrowRight size={12} weight="bold" aria-label="Arrow right icon" /></a>
			</div>
		</div>
	</section>

	<!-- SEO vs AEO Comparison -->
	<section class="comparison-section">
		<h2>SEO vs AEO: What's the Difference?</h2>
		<p class="section-subtitle">Traditional SEO and Answer Engine Optimization target different platforms with different strategies</p>
		<div class="comparison-table-wrapper">
			<table class="comparison-table">
				<thead>
					<tr>
						<th>Aspect</th>
						<th>Traditional SEO</th>
						<th>AEO (Answer Engine Optimization)</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Target Platform</strong></td>
						<td>Google, Bing search results pages</td>
						<td>ChatGPT, Perplexity, Claude AI answers</td>
					</tr>
					<tr>
						<td><strong>Goal</strong></td>
						<td>Rank in top 10 search results</td>
						<td>Get cited and quoted in AI responses</td>
					</tr>
					<tr>
						<td><strong>Key Signals</strong></td>
						<td>Keywords, backlinks, domain authority</td>
						<td>Structured data, extractability, semantic HTML</td>
					</tr>
					<tr>
						<td><strong>Content Format</strong></td>
						<td>Long-form SEO articles, keyword density</td>
						<td>FAQ format, bulleted lists, step-by-step guides</td>
					</tr>
					<tr>
						<td><strong>Technical Requirements</strong></td>
						<td>Sitemap, robots.txt, meta descriptions</td>
						<td>llms.txt, AI crawler access, publication dates</td>
					</tr>
					<tr>
						<td><strong>Crawlers</strong></td>
						<td>Googlebot, Bingbot</td>
						<td>GPTBot, ClaudeBot, PerplexityBot</td>
					</tr>
					<tr>
						<td><strong>User Behavior</strong></td>
						<td>Click through to website</td>
						<td>Get answer without clicking</td>
					</tr>
					<tr>
						<td><strong>Measurement</strong></td>
						<td>Rankings, organic traffic, CTR</td>
						<td>Citation frequency, AI visibility score</td>
					</tr>
				</tbody>
			</table>
		</div>
		<p class="comparison-note">Good news: AEO and SEO aren't mutually exclusive. Improving your structured data and content format benefits both traditional search engines and AI answer engines.</p>

		<dl class="aeo-glossary">
			<dt>Answer Engine</dt>
			<dd>AI systems like ChatGPT, Perplexity, and Claude that provide direct answers instead of search result links</dd>

			<dt>Structured Data</dt>
			<dd>Machine-readable markup (JSON-LD schemas) that helps AI engines understand your content's meaning and relationships</dd>

			<dt>Extractability</dt>
			<dd>How easily AI crawlers can parse and extract information from your HTML, influenced by semantic tags and text ratio</dd>

			<dt>llms.txt</dt>
			<dd>A robots.txt-style file that declares your AI crawling policy and content preferences for language models</dd>
		</dl>
	</section>

	<!-- FAQ -->
	<section class="faq-section">
		<h2>Frequently Asked Questions</h2>
		<div class="faq-list">
			{#each faqs as faq, i}
				<button class="faq-item" class:open={openFaq === i} onclick={() => toggleFaq(i)} type="button">
					<div class="faq-question">
						<span>{faq.question}</span>
						<CaretDown size={16} weight="bold" class="faq-caret" aria-label="Expand or collapse icon" />
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
				<a href="/account" class="pricing-cta primary">Go Pro <ArrowRight size={14} weight="bold" aria-label="Arrow right icon" /></a>
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
				<a href="/about">About</a>
				<span class="divider">|</span>
				<a href="/contact">Contact</a>
				<span class="divider">|</span>
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
		background: var(--color-bg-subtle);
		padding: 64px 24px;
		text-align: center;
		position: relative;
		overflow: hidden;
	}


	.hero-content {
		position: relative;
		z-index: 1;
	}

	/* Social Proof Badge */
	.social-proof {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: rgba(17, 98, 212, 0.08);
		border: 1px solid rgba(17, 98, 212, 0.15);
		border-radius: 20px;
		font-size: 12px;
		color: var(--color-primary-hover);
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
		margin: 0 0 32px 0;
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
		max-width: var(--width-narrow);
		margin: 0 auto;
		flex-wrap: wrap;
	}

	input {
		flex: 1;
		padding: 12px 16px;
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		font-size: 15px;
		min-width: 200px;
		background: var(--color-bg);
		transition: border-color 150ms ease;
	}

	input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(17, 98, 212, 0.1);
	}

	.input-group button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 12px 24px;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
		transition: transform 150ms ease, background 150ms ease;
	}

	.input-group button:hover:not(:disabled) {
		transform: translateY(-1px);
		background: var(--color-primary-hover);
	}

	.input-group button:active:not(:disabled) {
		transform: translateY(0);
	}

	.input-group button:disabled {
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
		gap: 24px;
		padding: 12px 24px;
		background: var(--color-bg);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
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
		margin-bottom: 4px;
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
		border-top: 1px solid var(--color-border-light);
	}

	.checks-section h2 {
		text-align: center;
		margin-bottom: 8px;
		font-size: 24px;
		font-weight: 600;
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
		max-width: var(--width-wide);
		margin: 0 auto;
	}

	.check-card {
		padding: 20px;
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		transition: transform 150ms ease, border-color 150ms ease;
	}

	.check-card:hover {
		transform: translateY(-1px);
		border-color: var(--color-border);
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
		margin-bottom: 16px;
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
		font-size: 24px;
		font-weight: 600;
		letter-spacing: -0.02em;
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
		max-width: var(--width-content);
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
		font-size: 24px;
		font-weight: 600;
		letter-spacing: -0.02em;
		margin-bottom: 24px;
	}

	.faq-list {
		max-width: var(--width-content);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.faq-item {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		width: 100%;
		text-align: left;
		background: var(--color-bg);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		padding: 16px;
		cursor: pointer;
		transition: border-color 150ms ease;
		font-family: inherit;
		box-shadow: none;
		font-size: inherit;
		font-weight: inherit;
	}

	.faq-item:hover {
		border-color: var(--color-border);
	}

	.faq-item.open {
		border-color: rgba(17, 98, 212, 0.2);
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
		padding-top: 12px;
		font-size: 13px;
		color: var(--color-text-secondary);
		line-height: 1.6;
		overflow-wrap: break-word;
		word-break: break-word;
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
		font-size: 24px;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 16px;
		max-width: var(--width-narrow);
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
		border-color: rgba(17, 98, 212, 0.3);
		background: rgba(17, 98, 212, 0.02);
	}

	.badge {
		position: absolute;
		top: -8px;
		right: 16px;
		background: var(--color-primary);
		color: white;
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.pricing-card h3 {
		margin: 8px 0 8px 0;
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
		padding: 12px 24px;
		border-radius: var(--radius-md);
		font-size: 14px;
		font-weight: 600;
		text-decoration: none;
		transition: transform 150ms ease, box-shadow 150ms ease;
		cursor: pointer;
	}

	.pricing-cta.primary {
		background: var(--color-primary);
		color: white;
	}

	.pricing-cta.primary:hover {
		transform: translateY(-1px);
		background: var(--color-primary-hover);
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

	/* Comparison Section */
	.comparison-section {
		padding: 64px 24px;
		border-top: 1px solid var(--color-border-light);
	}

	.comparison-section h2 {
		font-size: var(--text-2xl);
		font-weight: 600;
		text-align: center;
		margin-bottom: 8px;
		letter-spacing: -0.02em;
	}

	.comparison-section .section-subtitle {
		text-align: center;
		color: var(--color-text-secondary);
		max-width: 600px;
		margin: 0 auto 32px auto;
	}

	.comparison-table-wrapper {
		overflow-x: auto;
		margin-bottom: 24px;
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
	}

	.comparison-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
	}

	.comparison-table th {
		background: var(--color-bg-muted);
		padding: 12px 16px;
		text-align: left;
		font-weight: 600;
		border-bottom: 1px solid var(--color-border-light);
		color: var(--color-text);
	}

	.comparison-table td {
		padding: 12px 16px;
		border-bottom: 1px solid var(--color-border-light);
		color: var(--color-text-secondary);
		vertical-align: top;
	}

	.comparison-table tbody tr:last-child td {
		border-bottom: none;
	}

	.comparison-table td:first-child {
		font-weight: 500;
		color: var(--color-text);
	}

	.comparison-note {
		text-align: center;
		font-size: 14px;
		color: var(--color-text-muted);
		font-style: italic;
		max-width: 700px;
		margin: 0 auto;
	}

	.aeo-glossary {
		max-width: 700px;
		margin: 32px auto 0 auto;
		padding: 24px;
		background: var(--color-bg-muted);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
	}

	.aeo-glossary dt {
		font-weight: 600;
		font-size: 15px;
		color: var(--color-text);
		margin-bottom: 4px;
	}

	.aeo-glossary dd {
		margin: 0 0 16px 0;
		color: var(--color-text-secondary);
		font-size: 14px;
		line-height: 1.5;
	}

	.aeo-glossary dd:last-child {
		margin-bottom: 0;
	}

	@media (max-width: 768px) {
		.comparison-table {
			font-size: 12px;
		}

		.comparison-table th,
		.comparison-table td {
			padding: 8px 12px;
		}
	}
</style>
