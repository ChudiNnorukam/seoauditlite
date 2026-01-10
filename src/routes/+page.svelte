<script lang="ts">
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
			window.location.href = '/report';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Network error';
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>SEOAuditLite - AI Search Readiness Audit</title>
	<meta name="description" content="Check your site's AEO (Answer Engine Optimization) readiness for Perplexity, ChatGPT, and Claude." />
	<link rel="canonical" href="https://seoauditlite.vercel.app/" />
</svelte:head>

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
					{loading ? 'Analyzing...' : 'Analyze Site'}
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
				<h3>AI Crawler Access</h3>
				<p>robots.txt allows GPTBot, ClaudeBot, PerplexityBot?</p>
			</div>
			<div class="card">
				<h3>llms.txt</h3>
				<p>New robots.txt for AI engines</p>
			</div>
			<div class="card">
				<h3>Structured Data</h3>
				<p>JSON-LD schema quality</p>
			</div>
			<div class="card">
				<h3>Extractability</h3>
				<p>Semantic HTML + proper structure</p>
			</div>
			<div class="card">
				<h3>AI Metadata</h3>
				<p>Canonical URLs, OG tags, dates</p>
			</div>
			<div class="card">
				<h3>Answer Format</h3>
				<p>FAQ/HowTo schema + lists</p>
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
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #fff;
		color: #0f172a;
	}

	.page {
		max-width: 1200px;
		margin: 0 auto;
	}

	.hero {
		padding: 60px 20px;
		text-align: center;
	}

	.headline {
		font-size: 40px;
		margin: 0 0 12px 0;
		line-height: 1.2;
	}

	.subheadline {
		font-size: 18px;
		color: #64748b;
		margin: 0 0 32px 0;
	}

	.audit-form {
		margin-bottom: 32px;
	}

	.input-group {
		display: flex;
		gap: 12px;
		max-width: 500px;
		margin: 0 auto;
		flex-wrap: wrap;
	}

	input {
		flex: 1;
		padding: 12px 16px;
		border: 0.5px solid rgba(15, 23, 42, 0.1);
		border-radius: 4px;
		font-size: 14px;
		min-width: 200px;
	}

	input:focus {
		outline: none;
		border-color: #1162d4;
		box-shadow: 0 0 0 3px rgba(17, 98, 212, 0.1);
	}

	button {
		padding: 12px 24px;
		background: #1162d4;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
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
		font-size: 14px;
		margin: 12px 0 0 0;
	}

	.stats {
		display: flex;
		justify-content: center;
		gap: 24px;
		flex-wrap: wrap;
	}

	.stat {
		padding: 16px;
		border: 0.5px solid rgba(15, 23, 42, 0.1);
		border-radius: 6px;
		text-align: center;
		min-width: 120px;
	}

	.number {
		display: block;
		font-size: 24px;
		font-weight: 600;
		color: #1162d4;
		margin-bottom: 4px;
	}

	.label {
		display: block;
		font-size: 12px;
		color: #64748b;
	}

	.how-it-works {
		padding: 60px 20px;
		border-top: 0.5px solid rgba(15, 23, 42, 0.1);
	}

	.how-it-works h2 {
		text-align: center;
		margin-bottom: 32px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
	}

	.card {
		padding: 16px;
		border: 0.5px solid rgba(15, 23, 42, 0.1);
		border-radius: 6px;
	}

	.card h3 {
		margin: 0 0 8px 0;
		font-size: 16px;
	}

	.card p {
		margin: 0;
		font-size: 14px;
		color: #64748b;
	}

	.pricing {
		padding: 60px 20px;
		background: #f1f5f9;
		border-top: 0.5px solid rgba(15, 23, 42, 0.1);
	}

	.pricing h2 {
		text-align: center;
		margin-bottom: 32px;
	}

	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 24px;
		max-width: 900px;
		margin: 0 auto;
	}

	.pricing-card {
		padding: 24px;
		border: 0.5px solid rgba(15, 23, 42, 0.1);
		border-radius: 6px;
		background: white;
		position: relative;
	}

	.pricing-card.featured {
		border-color: #1162d4;
		background: rgba(17, 98, 212, 0.02);
	}

	.badge {
		position: absolute;
		top: -12px;
		right: 24px;
		background: #1162d4;
		color: white;
		padding: 4px 12px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
	}

	.pricing-card h3 {
		margin: 12px 0 8px 0;
		font-size: 20px;
	}

	.price {
		margin: 0 0 16px 0;
		font-size: 32px;
		font-weight: 600;
		color: #1162d4;
	}

	.price span {
		font-size: 14px;
		font-weight: 400;
		color: #64748b;
	}

	.pricing-card ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.pricing-card li {
		padding: 8px 0;
		font-size: 14px;
		border-bottom: 0.5px solid rgba(15, 23, 42, 0.1);
	}

	.pricing-card li:last-child {
		border-bottom: none;
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
	}
</style>
