<script lang="ts">
	import Header from '$lib/components/Header.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Privacy Policy - SEOAuditLite</title>
	<meta name="description" content="Privacy Policy for SEOAuditLite - Learn how we collect, use, and protect your data." />
	<link rel="canonical" href="https://seoauditlite.com/privacy" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<Header user={data.user} />

	<main class="max-w-3xl mx-auto px-4 py-12">
		<article class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
			<p class="text-gray-500 mb-8">Last updated: January 25, 2026</p>

			<div class="prose prose-gray max-w-none">
				<h2>1. Introduction</h2>
				<p>
					SEOAuditLite ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services at seoauditlite.com.
				</p>

				<h2>2. Information We Collect</h2>

				<h3>2.1 Information You Provide</h3>
				<ul>
					<li><strong>Account Information:</strong> When you sign in with Google, we receive your name, email address, and profile picture.</li>
					<li><strong>Audit Data:</strong> Domain names you submit for analysis.</li>
					<li><strong>Payment Information:</strong> Processed securely by LemonSqueezy; we do not store credit card details.</li>
				</ul>

				<h3>2.2 Information Collected Automatically</h3>
				<ul>
					<li><strong>Usage Data:</strong> Pages visited, features used, audit results.</li>
					<li><strong>Device Information:</strong> Browser type, operating system, IP address.</li>
					<li><strong>Cookies:</strong> Session cookies for authentication and preferences.</li>
				</ul>

				<h2>3. How We Use Your Information</h2>
				<p>We use collected information to:</p>
				<ul>
					<li>Provide and improve our SEO/AEO audit services</li>
					<li>Process payments and manage subscriptions</li>
					<li>Send transactional emails (receipts, audit reports)</li>
					<li>Analyze usage patterns to improve the product</li>
					<li>Detect and prevent fraud or abuse</li>
				</ul>

				<h2>4. Data Sharing</h2>
				<p>We do not sell your personal information. We may share data with:</p>
				<ul>
					<li><strong>Service Providers:</strong> Vercel (hosting), Turso (database), LemonSqueezy (payments), Google (authentication)</li>
					<li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
				</ul>

				<h2>5. Data Retention</h2>
				<p>
					We retain your data for as long as your account is active or as needed to provide services. Audit data for free users is retained for 7 days. Pro users have extended retention based on their plan.
				</p>

				<h2>6. Your Rights (GDPR/CCPA)</h2>
				<p>You have the right to:</p>
				<ul>
					<li><strong>Access:</strong> Request a copy of your personal data</li>
					<li><strong>Rectification:</strong> Correct inaccurate data</li>
					<li><strong>Erasure:</strong> Request deletion of your data</li>
					<li><strong>Portability:</strong> Receive your data in a portable format</li>
					<li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
				</ul>
				<p>To exercise these rights, contact us at privacy@seoauditlite.com.</p>

				<h2>7. Cookies</h2>
				<p>We use essential cookies for:</p>
				<ul>
					<li>Authentication (session management)</li>
					<li>Entitlement tracking (anonymous usage limits)</li>
					<li>Affiliate attribution (Rewardful)</li>
				</ul>
				<p>You can disable cookies in your browser settings, but some features may not work properly.</p>

				<h2>8. Security</h2>
				<p>
					We implement industry-standard security measures including HTTPS encryption, secure authentication, and regular security audits. However, no method of transmission over the Internet is 100% secure.
				</p>

				<h2>9. Children's Privacy</h2>
				<p>
					Our services are not intended for users under 16 years of age. We do not knowingly collect personal information from children.
				</p>

				<h2>10. Changes to This Policy</h2>
				<p>
					We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
				</p>

				<h2>11. Contact Us</h2>
				<p>
					If you have questions about this Privacy Policy, please contact us at:
				</p>
				<ul>
					<li>Email: privacy@seoauditlite.com</li>
					<li>Website: https://seoauditlite.com</li>
				</ul>
			</div>
		</article>

		<div class="mt-8 text-center">
			<a href="/" class="text-orange-600 hover:text-orange-700 font-medium">
				&larr; Back to Home
			</a>
		</div>
	</main>
</div>

<style>
	.prose h2 {
		@apply text-xl font-semibold text-gray-900 mt-8 mb-4;
	}
	.prose h3 {
		@apply text-lg font-medium text-gray-800 mt-6 mb-3;
	}
	.prose p {
		@apply text-gray-600 mb-4 leading-relaxed;
	}
	.prose ul {
		@apply list-disc pl-6 mb-4 text-gray-600;
	}
	.prose li {
		@apply mb-2;
	}
</style>
