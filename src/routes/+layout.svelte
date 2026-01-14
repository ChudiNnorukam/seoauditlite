<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- Google Search Console Verification -->
	<meta name="google-site-verification" content="Uhqx8KZG7zmeSBVPjgLSSHNEK1MlMsO6aM55CcNS444" />
</svelte:head>

{@render children()}
