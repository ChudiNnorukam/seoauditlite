<script lang="ts">
	import Header from '$lib/components/Header.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Terms of Service - SEOAuditLite</title>
	<meta name="description" content="Terms of Service for SEOAuditLite - Read our terms and conditions for using our SEO audit services." />
	<link rel="canonical" href="https://seoauditlite.com/terms" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<Header user={data.user} />

	<main class="max-w-3xl mx-auto px-4 py-12">
		<article class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
			<p class="text-sm text-gray-400 mb-10">Last updated: January 25, 2026</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">1. Acceptance of Terms</h2>
			<p class="text-gray-600 mb-4 leading-relaxed">
				By accessing or using SEOAuditLite ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
			</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">2. Description of Service</h2>
			<p class="text-gray-600 mb-3 leading-relaxed">
				SEOAuditLite provides AI search readiness audits (AEO - Answer Engine Optimization) that analyze websites for compatibility with AI systems like ChatGPT, Perplexity, and Claude. Our Service includes:
			</p>
			<ul class="list-disc pl-6 mb-4 text-gray-600 space-y-2">
				<li>Free tier: Limited audits per week with basic features</li>
				<li>Pro tier: Unlimited audits with full features and detailed recommendations</li>
			</ul>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">3. User Accounts</h2>
			<h3 class="text-lg font-medium text-gray-800 mt-6 mb-3">3.1 Registration</h3>
			<p class="text-gray-600 mb-4 leading-relaxed">
				You may use certain features without an account. To access Pro features, you must sign in using Google authentication. You are responsible for maintaining the security of your account.
			</p>

			<h3 class="text-lg font-medium text-gray-800 mt-6 mb-3">3.2 Account Restrictions</h3>
			<p class="text-gray-600 mb-3 leading-relaxed">You agree not to:</p>
			<ul class="list-disc pl-6 mb-4 text-gray-600 space-y-2">
				<li>Share your account credentials with others</li>
				<li>Create multiple accounts to circumvent usage limits</li>
				<li>Use the Service for any illegal purpose</li>
			</ul>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">4. Acceptable Use</h2>
			<p class="text-gray-600 mb-3 leading-relaxed">You agree to use the Service only for lawful purposes. You may not:</p>
			<ul class="list-disc pl-6 mb-4 text-gray-600 space-y-2">
				<li>Submit domains you do not own or have permission to audit</li>
				<li>Attempt to overload, hack, or disrupt the Service</li>
				<li>Scrape or automatically access the Service without permission</li>
				<li>Use the Service to gather competitive intelligence on third parties without consent</li>
				<li>Resell or redistribute audit results commercially without a license</li>
			</ul>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">5. Payment Terms</h2>
			<h3 class="text-lg font-medium text-gray-800 mt-6 mb-3">5.1 Pricing</h3>
			<p class="text-gray-600 mb-4 leading-relaxed">
				Pro subscriptions are billed monthly or annually as indicated at checkout. Prices are in USD and exclude applicable taxes.
			</p>

			<h3 class="text-lg font-medium text-gray-800 mt-6 mb-3">5.2 Refunds</h3>
			<p class="text-gray-600 mb-4 leading-relaxed">
				We offer a 7-day money-back guarantee for new Pro subscriptions. Refund requests after 7 days are handled on a case-by-case basis. Contact support@seoauditlite.com for refund requests.
			</p>

			<h3 class="text-lg font-medium text-gray-800 mt-6 mb-3">5.3 Cancellation</h3>
			<p class="text-gray-600 mb-4 leading-relaxed">
				You may cancel your subscription at any time from your account settings. Access continues until the end of your billing period.
			</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">6. Intellectual Property</h2>
			<h3 class="text-lg font-medium text-gray-800 mt-6 mb-3">6.1 Our Content</h3>
			<p class="text-gray-600 mb-4 leading-relaxed">
				The Service, including its design, code, and content, is owned by SEOAuditLite and protected by copyright and trademark laws.
			</p>

			<h3 class="text-lg font-medium text-gray-800 mt-6 mb-3">6.2 Your Content</h3>
			<p class="text-gray-600 mb-4 leading-relaxed">
				You retain ownership of any data you submit. By using the Service, you grant us a license to process your data to provide the Service.
			</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">7. Disclaimer of Warranties</h2>
			<p class="text-gray-600 mb-3 leading-relaxed">
				THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee that:
			</p>
			<ul class="list-disc pl-6 mb-4 text-gray-600 space-y-2">
				<li>The Service will be uninterrupted or error-free</li>
				<li>Audit results will be accurate or complete</li>
				<li>Following recommendations will improve your search rankings</li>
			</ul>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">8. Limitation of Liability</h2>
			<p class="text-gray-600 mb-4 leading-relaxed">
				TO THE MAXIMUM EXTENT PERMITTED BY LAW, SEOAUDITLITE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES.
			</p>
			<p class="text-gray-600 mb-4 leading-relaxed">
				Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
			</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">9. Indemnification</h2>
			<p class="text-gray-600 mb-4 leading-relaxed">
				You agree to indemnify and hold harmless SEOAuditLite from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.
			</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">10. Modifications to Service</h2>
			<p class="text-gray-600 mb-4 leading-relaxed">
				We reserve the right to modify, suspend, or discontinue the Service at any time. We will provide reasonable notice for material changes affecting paid subscribers.
			</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">11. Termination</h2>
			<p class="text-gray-600 mb-4 leading-relaxed">
				We may terminate or suspend your access to the Service immediately, without notice, for conduct that we believe violates these Terms or is harmful to other users or us.
			</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">12. Governing Law</h2>
			<p class="text-gray-600 mb-4 leading-relaxed">
				These Terms shall be governed by and construed in accordance with the laws of the United States. Any disputes shall be resolved in the courts of Delaware.
			</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">13. Changes to Terms</h2>
			<p class="text-gray-600 mb-4 leading-relaxed">
				We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the new Terms.
			</p>

			<h2 class="text-xl font-semibold text-gray-900 mt-10 mb-4">14. Contact Us</h2>
			<p class="text-gray-600 mb-3 leading-relaxed">
				For questions about these Terms, please contact us at:
			</p>
			<ul class="list-disc pl-6 mb-4 text-gray-600 space-y-2">
				<li>Email: legal@seoauditlite.com</li>
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
