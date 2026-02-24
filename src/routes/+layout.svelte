<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { env } from '$env/dynamic/public';

	const PUBLIC_REWARDFUL_API_KEY = env.PUBLIC_REWARDFUL_API_KEY ?? '';

	let { children } = $props();

	const referralStorageKey = 'rewardful_referral';
	const referralSentKey = 'rewardful_referral_sent';

	function persistReferral(referralId: string) {
		if (!referralId) return;
		sessionStorage.setItem(referralStorageKey, referralId);
	}

	async function sendReferral(referralId: string) {
		if (!referralId) return;
		const lastSent = sessionStorage.getItem(referralSentKey);
		if (lastSent === referralId) return;

		try {
			await fetch('/api/attribution', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ referralId })
			});
			sessionStorage.setItem(referralSentKey, referralId);
		} catch {
			// ignore attribution errors
		}
	}

	onMount(() => {
		if (!PUBLIC_REWARDFUL_API_KEY) return;

		const url = new URL(window.location.href);
		const referralParam = url.searchParams.get('referral');
		if (referralParam) {
			persistReferral(referralParam);
			sendReferral(referralParam);
		}

		const handleRewardful = () => {
			const referral = (window as unknown as { Rewardful?: { referral?: string } }).Rewardful?.referral;
			if (referral) {
				persistReferral(referral);
				sendReferral(referral);
			}
		};

		const rewardfulFn = (window as unknown as { rewardful?: (event: string, cb: () => void) => void })
			.rewardful;
		if (typeof rewardfulFn === 'function') {
			rewardfulFn('ready', handleRewardful);
		} else {
			const interval = window.setInterval(() => {
				const fn = (window as unknown as { rewardful?: (event: string, cb: () => void) => void })
					.rewardful;
				if (typeof fn === 'function') {
					fn('ready', handleRewardful);
					window.clearInterval(interval);
				}
			}, 300);
			window.setTimeout(() => window.clearInterval(interval), 5000);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- Google Search Console Verification -->
	<meta name="google-site-verification" content="Uhqx8KZG7zmeSBVPjgLSSHNEK1MlMsO6aM55CcNS444" />

	<!-- Structured Data: Organization -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "Organization",
			"name": "SEOAuditLite",
			"url": "https://seoauditlite.com",
			"logo": "https://seoauditlite.com/favicon.svg",
			"description": "AI Search Readiness Audit Tool - Check your site's AEO readiness for Perplexity, ChatGPT, and Claude",
			"founder": {
				"@type": "Person",
				"name": "Chudi Nnorukam",
				"url": "https://chudi.dev"
			},
			"sameAs": [
				"https://github.com/ChudiNnorukam"
			]
		}
	</script>

	<!-- Structured Data: WebSite -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebSite",
			"name": "SEOAuditLite",
			"url": "https://seoauditlite.com",
			"description": "Free AI Search Readiness Audit - Check your site's AEO readiness for Perplexity, ChatGPT, and Claude",
			"potentialAction": {
				"@type": "SearchAction",
				"target": "https://seoauditlite.com/?domain={search_term_string}",
				"query-input": "required name=search_term_string"
			}
		}
	</script>

	<!-- Structured Data: SoftwareApplication -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "SoftwareApplication",
			"name": "SEOAuditLite",
			"applicationCategory": "BusinessApplication",
			"operatingSystem": "Web Browser",
			"offers": {
				"@type": "Offer",
				"price": "0",
				"priceCurrency": "USD"
			},
			"description": "Free AI Search Readiness Audit Tool - Analyze your site's AEO (Answer Engine Optimization) readiness for AI-powered search engines",
			"url": "https://seoauditlite.com",
			"screenshot": "https://seoauditlite.com/og-image.png",
			"featureList": [
				"AI Crawler Access Check",
				"llms.txt Validation",
				"Structured Data Analysis",
				"Content Extractability Score",
				"AI Metadata Audit",
				"Answer Format Optimization"
			]
		}
	</script>

	{#if PUBLIC_REWARDFUL_API_KEY}
		<script>
			(function (w, r) {
				w._rwq = r;
				w[r] =
					w[r] ||
					function () {
						(w[r].q = w[r].q || []).push(arguments);
					};
			})(window, 'rewardful');
		</script>
		<script async src="https://app.rewardful.dev/rw.js" data-rewardful={PUBLIC_REWARDFUL_API_KEY}></script>
	{/if}
</svelte:head>

{@render children()}

<footer class="border-t border-gray-800 bg-[#0d1117] mt-16">
	<div class="max-w-5xl mx-auto px-4 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
		<span>SEOAuditLite &mdash; built by <a href="https://chudi.dev" target="_blank" rel="noopener noreferrer" class="text-gray-300 hover:text-white transition-colors">Chudi Nnorukam</a></span>
		<nav class="flex flex-wrap gap-5">
			<a href="https://chudi.dev/blog/aeo-answer-engine-optimization-explained" target="_blank" rel="noopener noreferrer" class="hover:text-gray-300 transition-colors">What is AEO?</a>
			<a href="https://chudi.dev/blog/llms-txt-robots-txt-for-ai-crawlers" target="_blank" rel="noopener noreferrer" class="hover:text-gray-300 transition-colors">llms.txt Guide</a>
			<a href="https://chudi.dev/blog/how-to-optimize-for-perplexity-chatgpt-ai-search" target="_blank" rel="noopener noreferrer" class="hover:text-gray-300 transition-colors">AI Search Guide</a>
			<a href="https://review-reply-copilot.netlify.app" target="_blank" rel="noopener noreferrer" class="hover:text-gray-300 transition-colors">Review Reply Copilot</a>
			<a href="https://chudi.dev" target="_blank" rel="noopener noreferrer" class="hover:text-gray-300 transition-colors">chudi.dev</a>
		</nav>
	</div>
</footer>
