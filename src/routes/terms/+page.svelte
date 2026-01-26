<script lang="ts">
	import Header from '$lib/components/Header.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Terms of Service - SEOAuditLite</title>
	<meta name="description" content="Terms of Service for SEOAuditLite - Read our terms and conditions for using our SEO audit services." />
	<link rel="canonical" href="https://seoauditlite.com/terms" />
</svelte:head>

<div class="page">
	<Header user={data.user} />

	<main class="legal-page">
		<article class="legal-card">
			<h1>Terms of Service</h1>
			<p class="updated">Last updated: January 25, 2026</p>

			<section>
				<h2>1. Acceptance of Terms</h2>
				<p>By accessing or using SEOAuditLite ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.</p>
			</section>

			<section>
				<h2>2. Description of Service</h2>
				<p>SEOAuditLite provides AI search readiness audits (AEO - Answer Engine Optimization) that analyze websites for compatibility with AI systems like ChatGPT, Perplexity, and Claude. Our Service includes:</p>
				<ul>
					<li>Free tier: Limited audits per week with basic features</li>
					<li>Pro tier: Unlimited audits with full features and detailed recommendations</li>
				</ul>
			</section>

			<section>
				<h2>3. User Accounts</h2>
				<h3>3.1 Registration</h3>
				<p>You may use certain features without an account. To access Pro features, you must sign in using Google authentication. You are responsible for maintaining the security of your account.</p>

				<h3>3.2 Account Restrictions</h3>
				<p>You agree not to:</p>
				<ul>
					<li>Share your account credentials with others</li>
					<li>Create multiple accounts to circumvent usage limits</li>
					<li>Use the Service for any illegal purpose</li>
				</ul>
			</section>

			<section>
				<h2>4. Acceptable Use</h2>
				<p>You agree to use the Service only for lawful purposes. You may not:</p>
				<ul>
					<li>Submit domains you do not own or have permission to audit</li>
					<li>Attempt to overload, hack, or disrupt the Service</li>
					<li>Scrape or automatically access the Service without permission</li>
					<li>Use the Service to gather competitive intelligence on third parties without consent</li>
					<li>Resell or redistribute audit results commercially without a license</li>
				</ul>
			</section>

			<section>
				<h2>5. Payment Terms</h2>
				<h3>5.1 Pricing</h3>
				<p>Pro subscriptions are billed monthly or annually as indicated at checkout. Prices are in USD and exclude applicable taxes.</p>

				<h3>5.2 Refunds</h3>
				<p>We offer a 7-day money-back guarantee for new Pro subscriptions. Refund requests after 7 days are handled on a case-by-case basis. Contact support@seoauditlite.com for refund requests.</p>

				<h3>5.3 Cancellation</h3>
				<p>You may cancel your subscription at any time from your account settings. Access continues until the end of your billing period.</p>
			</section>

			<section>
				<h2>6. Intellectual Property</h2>
				<h3>6.1 Our Content</h3>
				<p>The Service, including its design, code, and content, is owned by SEOAuditLite and protected by copyright and trademark laws.</p>

				<h3>6.2 Your Content</h3>
				<p>You retain ownership of any data you submit. By using the Service, you grant us a license to process your data to provide the Service.</p>
			</section>

			<section>
				<h2>7. Disclaimer of Warranties</h2>
				<p>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee that:</p>
				<ul>
					<li>The Service will be uninterrupted or error-free</li>
					<li>Audit results will be accurate or complete</li>
					<li>Following recommendations will improve your search rankings</li>
				</ul>
			</section>

			<section>
				<h2>8. Limitation of Liability</h2>
				<p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, SEOAUDITLITE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES.</p>
				<p>Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
			</section>

			<section>
				<h2>9. Indemnification</h2>
				<p>You agree to indemnify and hold harmless SEOAuditLite from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.</p>
			</section>

			<section>
				<h2>10. Modifications to Service</h2>
				<p>We reserve the right to modify, suspend, or discontinue the Service at any time. We will provide reasonable notice for material changes affecting paid subscribers.</p>
			</section>

			<section>
				<h2>11. Termination</h2>
				<p>We may terminate or suspend your access to the Service immediately, without notice, for conduct that we believe violates these Terms or is harmful to other users or us.</p>
			</section>

			<section>
				<h2>12. Governing Law</h2>
				<p>These Terms shall be governed by and construed in accordance with the laws of the United States. Any disputes shall be resolved in the courts of Delaware.</p>
			</section>

			<section>
				<h2>13. Changes to Terms</h2>
				<p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
			</section>

			<section>
				<h2>14. Contact Us</h2>
				<p>For questions about these Terms, please contact us at:</p>
				<ul>
					<li>Email: legal@seoauditlite.com</li>
					<li>Website: https://seoauditlite.com</li>
				</ul>
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

	.legal-page {
		max-width: 720px;
		margin: 0 auto;
		padding: 40px 20px 60px;
	}

	.legal-card {
		background: var(--color-bg);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-lg);
		padding: 40px;
	}

	h1 {
		font-size: 28px;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 4px 0;
		letter-spacing: -0.02em;
	}

	.updated {
		font-size: 13px;
		color: var(--color-text-faint);
		margin: 0 0 32px 0;
	}

	section {
		margin-bottom: 28px;
	}

	h2 {
		font-size: 17px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 12px 0;
		letter-spacing: -0.01em;
	}

	h3 {
		font-size: 15px;
		font-weight: 600;
		color: var(--color-text-secondary);
		margin: 16px 0 8px 0;
	}

	p {
		font-size: 14px;
		color: var(--color-text-secondary);
		line-height: 1.7;
		margin: 0 0 12px 0;
	}

	ul {
		list-style: disc;
		padding-left: 24px;
		margin: 0 0 12px 0;
	}

	li {
		font-size: 14px;
		color: var(--color-text-secondary);
		line-height: 1.7;
		padding: 3px 0;
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
		.legal-card {
			padding: 24px;
		}

		h1 {
			font-size: 24px;
		}
	}
</style>
