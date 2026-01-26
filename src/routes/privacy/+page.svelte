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
			<p class="text-sm text-gray-400 mb-10">Last updated: January 25, 2026</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">1. Introduction</h2>
			<p class="text-gray-600 mb-4 leading-relaxed">
				SEOAuditLite ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services at seoauditlite.com.
			</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">2. Information We Collect</h2>

			<h3 class="text-lg font-medium text-gray-800 mt-6 mb-3">2.1 Information You Provide</h3>
			<ul class="list-disc pl-6 mb-4 text-gray-600 space-y-2">
				<li><strong class="text-gray-800">Account Information:</strong> When you sign in with Google, we receive your name, email address, and profile picture.</li>
				<li><strong class="text-gray-800">Audit Data:</strong> Domain names you submit for analysis.</li>
				<li><strong class="text-gray-800">Payment Information:</strong> Processed securely by LemonSqueezy; we do not store credit card details.</li>
			</ul>

			<h3 class="text-lg font-medium text-gray-800 mt-6 mb-3">2.2 Information Collected Automatically</h3>
			<ul class="list-disc pl-6 mb-4 text-gray-600 space-y-2">
				<li><strong class="text-gray-800">Usage Data:</strong> Pages visited, features used, audit results.</li>
				<li><strong class="text-gray-800">Device Information:</strong> Browser type, operating system, IP address.</li>
				<li><strong class="text-gray-800">Cookies:</strong> Session cookies for authentication and preferences.</li>
			</ul>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">3. How We Use Your Information</h2>
			<p class="text-gray-600 mb-3 leading-relaxed">We use collected information to:</p>
			<ul class="list-disc pl-6 mb-4 text-gray-600 space-y-2">
				<li>Provide and improve our SEO/AEO audit services</li>
				<li>Process payments and manage subscriptions</li>
				<li>Send transactional emails (receipts, audit reports)</li>
				<li>Analyze usage patterns to improve the product</li>
				<li>Detect and prevent fraud or abuse</li>
			</ul>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">4. Data Sharing</h2>
			<p class="text-gray-600 mb-3 leading-relaxed">We do not sell your personal information. We may share data with:</p>
			<ul class="list-disc pl-6 mb-4 text-gray-600 space-y-2">
				<li><strong class="text-gray-800">Service Providers:</strong> Vercel (hosting), Turso (database), LemonSqueezy (payments), Google (authentication)</li>
				<li><strong class="text-gray-800">Legal Requirements:</strong> When required by law or to protect our rights</li>
			</ul>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">5. Data Retention</h2>
			<p class="text-gray-600 mb-4 leading-relaxed">
				We retain your data for as long as your account is active or as needed to provide services. Audit data for free users is retained for 7 days. Pro users have extended retention based on their plan.
			</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">6. Your Rights (GDPR/CCPA)</h2>
			<p class="text-gray-600 mb-3 leading-relaxed">You have the right to:</p>
			<ul class="list-disc pl-6 mb-4 text-gray-600 space-y-2">
				<li><strong class="text-gray-800">Access:</strong> Request a copy of your personal data</li>
				<li><strong class="text-gray-800">Rectification:</strong> Correct inaccurate data</li>
				<li><strong class="text-gray-800">Erasure:</strong> Request deletion of your data</li>
				<li><strong class="text-gray-800">Portability:</strong> Receive your data in a portable format</li>
				<li><strong class="text-gray-800">Opt-out:</strong> Unsubscribe from marketing communications</li>
			</ul>
			<p class="text-gray-600 mb-4 leading-relaxed">To exercise these rights, contact us at privacy@seoauditlite.com.</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">7. Cookies</h2>
			<p class="text-gray-600 mb-3 leading-relaxed">We use essential cookies for:</p>
			<ul class="list-disc pl-6 mb-4 text-gray-600 space-y-2">
				<li>Authentication (session management)</li>
				<li>Entitlement tracking (anonymous usage limits)</li>
				<li>Affiliate attribution (Rewardful)</li>
			</ul>
			<p class="text-gray-600 mb-4 leading-relaxed">You can disable cookies in your browser settings, but some features may not work properly.</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">8. Security</h2>
			<p class="text-gray-600 mb-4 leading-relaxed">
				We implement industry-standard security measures including HTTPS encryption, secure authentication, and regular security audits. However, no method of transmission over the Internet is 100% secure.
			</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">9. Children's Privacy</h2>
			<p class="text-gray-600 mb-4 leading-relaxed">
				Our services are not intended for users under 16 years of age. We do not knowingly collect personal information from children.
			</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">10. Changes to This Policy</h2>
			<p class="text-gray-600 mb-4 leading-relaxed">
				We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
			</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">11. Contact Us</h2>
			<p class="text-gray-600 mb-3 leading-relaxed">
				If you have questions about this Privacy Policy, please contact us at:
			</p>
			<ul class="list-disc pl-6 mb-4 text-gray-600 space-y-2">
				<li>Email: privacy@seoauditlite.com</li>
				<li>Website: https://seoauditlite.com</li>
			</ul>
		</article>

		<div class="mt-8 text-center">
			<a href="/" class="text-orange-600 hover:text-orange-700 font-medium">
				&larr; Back to Home
			</a>
		</div>
	</main>
</div>
