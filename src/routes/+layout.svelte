<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { PUBLIC_REWARDFUL_API_KEY } from '$env/static/public';

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
