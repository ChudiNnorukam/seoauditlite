<script lang="ts">
	import Header from '$lib/components/Header.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Contact - SEOAuditLite</title>
	<meta name="description" content="Get in touch with the SEOAuditLite team. Questions, feedback, or partnership inquiries welcome." />
	<link rel="canonical" href="https://seoauditlite.com/contact" />
</svelte:head>

<div class="page">
	<Header user={data.user} />

	<main class="contact-page">
		<article class="contact-card">
			<h1>Contact Us</h1>
			<p class="subtitle">Questions, feedback, or partnership inquiries? We'd love to hear from you.</p>

			<section class="contact-grid">
				<div class="contact-method">
					<div class="icon">✉️</div>
					<h2>Email</h2>
					<p>For general inquiries, support, or feedback:</p>
					<a href="mailto:hello@seoauditlite.com" class="contact-link">hello@seoauditlite.com</a>
				</div>

				<div class="contact-method">
					<div class="icon">🔒</div>
					<h2>Privacy</h2>
					<p>For data privacy or GDPR/CCPA requests:</p>
					<a href="mailto:privacy@seoauditlite.com" class="contact-link">privacy@seoauditlite.com</a>
				</div>

				<div class="contact-method">
					<div class="icon">⚖️</div>
					<h2>Legal</h2>
					<p>For legal inquiries or terms questions:</p>
					<a href="mailto:legal@seoauditlite.com" class="contact-link">legal@seoauditlite.com</a>
				</div>

				<div class="contact-method">
					<div class="icon">🤝</div>
					<h2>Partnerships</h2>
					<p>For affiliate, integration, or business inquiries:</p>
					<a href="mailto:partners@seoauditlite.com" class="contact-link">partners@seoauditlite.com</a>
				</div>
			</section>

			<section class="social-section">
				<h2>Follow Us</h2>
				<div class="social-links">
					<a href="https://twitter.com/chudin" target="_blank" rel="noopener" class="social-link">
						<span class="social-icon">𝕏</span>
						<span>Twitter/X</span>
					</a>
					<a href="https://github.com/ChudiNnorukam" target="_blank" rel="noopener" class="social-link">
						<span class="social-icon">💻</span>
						<span>GitHub</span>
					</a>
					<a href="https://chudi.dev" target="_blank" rel="noopener" class="social-link">
						<span class="social-icon">🌐</span>
						<span>Website</span>
					</a>
				</div>
			</section>

			<section class="response-time">
				<h3>Response Time</h3>
				<p>We typically respond within 24-48 hours during business days (Monday-Friday, 9am-5pm PST).</p>
				<p>For urgent issues with Pro subscriptions, please include "URGENT" in your subject line.</p>
			</section>

			<section class="faq-link">
				<p>Looking for quick answers? Check our <a href="/#faq">FAQ section</a> on the homepage.</p>
			</section>
		</article>

		<div class="back-link">
			<a href="/">&larr; Back to Home</a>
		</div>
	</main>
</div>

<style>
	.page {
		min-height: 100vh;
		background: var(--color-bg-subtle);
	}

	.contact-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 40px 20px 60px;
	}

	.contact-card {
		background: var(--color-bg);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-lg);
		padding: 40px;
	}

	h1 {
		font-size: 28px;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 8px 0;
		letter-spacing: -0.02em;
	}

	.subtitle {
		font-size: 15px;
		color: var(--color-text-faint);
		margin: 0 0 32px 0;
		line-height: 1.6;
	}

	.contact-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 24px;
		margin-bottom: 40px;
	}

	.contact-method {
		padding: 24px;
		background: var(--color-bg-subtle);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		text-align: center;
	}

	.icon {
		font-size: 32px;
		margin-bottom: 12px;
	}

	.contact-method h2 {
		font-size: 17px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 8px 0;
	}

	.contact-method p {
		font-size: 13px;
		color: var(--color-text-secondary);
		margin: 0 0 12px 0;
		line-height: 1.5;
	}

	.contact-link {
		display: inline-block;
		color: var(--color-primary);
		font-weight: 500;
		font-size: 14px;
		text-decoration: none;
		word-break: break-all;
	}

	.contact-link:hover {
		color: var(--color-primary-hover);
		text-decoration: underline;
	}

	.social-section {
		margin-bottom: 32px;
		padding-top: 32px;
		border-top: 1px solid var(--color-border-light);
	}

	.social-section h2 {
		font-size: 17px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 16px 0;
		text-align: center;
	}

	.social-links {
		display: flex;
		gap: 16px;
		justify-content: center;
		flex-wrap: wrap;
	}

	.social-link {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		background: var(--color-bg-subtle);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		color: var(--color-text);
		text-decoration: none;
		font-size: 14px;
		font-weight: 500;
		transition: all 150ms ease;
	}

	.social-link:hover {
		background: var(--color-bg);
		border-color: var(--color-primary);
		color: var(--color-primary);
		transform: translateY(-1px);
	}

	.social-icon {
		font-size: 18px;
	}

	.response-time {
		padding: 20px;
		background: var(--color-bg-subtle);
		border-radius: var(--radius-md);
		margin-bottom: 24px;
	}

	.response-time h3 {
		font-size: 15px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 8px 0;
	}

	.response-time p {
		font-size: 13px;
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin: 0 0 8px 0;
	}

	.response-time p:last-child {
		margin-bottom: 0;
	}

	.faq-link {
		text-align: center;
		padding: 16px;
	}

	.faq-link p {
		font-size: 14px;
		color: var(--color-text-secondary);
		margin: 0;
	}

	.faq-link a {
		color: var(--color-primary);
		font-weight: 500;
		text-decoration: none;
	}

	.faq-link a:hover {
		color: var(--color-primary-hover);
		text-decoration: underline;
	}

	.back-link {
		text-align: center;
		margin-top: 24px;
	}

	.back-link a {
		color: var(--color-primary);
		font-weight: 500;
		font-size: 14px;
		text-decoration: none;
	}

	.back-link a:hover {
		color: var(--color-primary-hover);
	}

	@media (max-width: 640px) {
		.contact-card {
			padding: 24px;
		}

		h1 {
			font-size: 24px;
		}

		.contact-grid {
			grid-template-columns: 1fr;
		}

		.social-links {
			flex-direction: column;
			align-items: stretch;
		}

		.social-link {
			justify-content: center;
		}
	}
</style>
