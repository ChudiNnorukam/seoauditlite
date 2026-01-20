<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { User, CreditCard, ArrowSquareOut } from 'phosphor-svelte';

	let { data } = $props();

	let managingBilling = $state(false);
	let billingError = $state('');
	let upgradingPlan = $state(false);
	let upgradeError = $state('');

	async function openBillingPortal() {
		managingBilling = true;
		billingError = '';
		try {
			const response = await fetch('/api/billing/portal', { method: 'POST' });
			const payload = await response.json();
			if (!response.ok || !payload?.url) {
				billingError = payload?.error || 'Unable to open billing portal';
				managingBilling = false;
				return;
			}
			window.location.href = payload.url;
		} catch (e) {
			billingError = e instanceof Error ? e.message : 'Unable to open billing portal';
			managingBilling = false;
		}
	}

	async function upgradeToPro() {
		upgradingPlan = true;
		upgradeError = '';
		try {
			const response = await fetch('/api/billing/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
			const payload = await response.json();
			if (!response.ok || !payload?.url) {
				upgradeError = payload?.error || 'Unable to start checkout';
				upgradingPlan = false;
				return;
			}
			window.location.href = payload.url;
		} catch (e) {
			upgradeError = e instanceof Error ? e.message : 'Unable to start checkout';
			upgradingPlan = false;
		}
	}
</script>

<svelte:head>
	<title>Account - SEOAuditLite</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<Header user={data.user} plan={data.plan} />

<div class="page">
	<div class="container">
		<header class="page-header">
			<h1>Account</h1>
			<p class="subtitle">Manage your profile and billing</p>
		</header>

		<!-- Profile Section -->
		<section class="card">
			<div class="card-header">
				<User size={20} weight="duotone" />
				<h2>Profile</h2>
			</div>
			<div class="profile-info">
				{#if data.user?.avatarUrl}
					<img src={data.user.avatarUrl} alt="" class="profile-avatar" />
				{:else}
					<div class="profile-avatar-placeholder">
						<User size={24} weight="bold" />
					</div>
				{/if}
				<div class="profile-details">
					<p class="profile-name">{data.user?.name || 'User'}</p>
					<p class="profile-email">{data.user?.email}</p>
				</div>
			</div>
		</section>

		<!-- Billing Section -->
		<section class="card">
			<div class="card-header">
				<CreditCard size={20} weight="duotone" />
				<h2>Billing</h2>
			</div>

			<div class="plan-info">
				<div class="plan-badge {data.plan}">
					{data.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
				</div>
				{#if data.plan === 'free'}
					<p class="plan-description">3 audits per month. Upgrade for unlimited audits and more features.</p>
				{:else}
					<p class="plan-description">Unlimited audits, 30-day history, and PDF export.</p>
				{/if}
			</div>

			<div class="billing-actions">
				{#if data.plan === 'pro' && data.hasSubscription}
					<button class="button secondary" onclick={openBillingPortal} disabled={managingBilling}>
						{managingBilling ? 'Opening...' : 'Manage Billing'}
						<ArrowSquareOut size={16} weight="bold" />
					</button>
					{#if billingError}
						<p class="error">{billingError}</p>
					{/if}
				{:else}
					<button class="button primary" onclick={upgradeToPro} disabled={upgradingPlan}>
						{upgradingPlan ? 'Loading...' : 'Upgrade to Pro'}
					</button>
					{#if upgradeError}
						<p class="error">{upgradeError}</p>
					{/if}
				{/if}
			</div>
		</section>
	</div>
</div>

<style>
	.page {
		min-height: calc(100vh - 48px);
		background: #fafbfc;
	}

	.container {
		max-width: 600px;
		margin: 0 auto;
		padding: 32px 20px;
	}

	.page-header {
		margin-bottom: 32px;
	}

	.page-header h1 {
		margin: 0 0 4px 0;
		font-size: 24px;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: #0f172a;
	}

	.subtitle {
		margin: 0;
		font-size: 14px;
		color: #64748b;
	}

	/* Card */
	.card {
		background: #fff;
		border: 1px solid rgba(15, 23, 42, 0.08);
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 16px;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 16px;
		color: #64748b;
	}

	.card-header h2 {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		color: #0f172a;
	}

	/* Profile */
	.profile-info {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.profile-avatar {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		object-fit: cover;
	}

	.profile-avatar-placeholder {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: #f1f5f9;
		color: #64748b;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.profile-details {
		flex: 1;
	}

	.profile-name {
		margin: 0 0 4px 0;
		font-size: 16px;
		font-weight: 600;
		color: #0f172a;
	}

	.profile-email {
		margin: 0;
		font-size: 14px;
		color: #64748b;
	}

	/* Plan Info */
	.plan-info {
		margin-bottom: 20px;
	}

	.plan-badge {
		display: inline-block;
		padding: 4px 10px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		margin-bottom: 8px;
	}

	.plan-badge.free {
		background: #f1f5f9;
		color: #64748b;
	}

	.plan-badge.pro {
		background: linear-gradient(135deg, #1162d4 0%, #0891b2 100%);
		color: #fff;
	}

	.plan-description {
		margin: 0;
		font-size: 14px;
		color: #64748b;
		line-height: 1.5;
	}

	/* Billing Actions */
	.billing-actions {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 10px 18px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		border: none;
		transition: transform 150ms ease, box-shadow 150ms ease;
	}

	.button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.button.primary {
		background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
		color: #fff;
	}

	.button.primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(249, 115, 22, 0.35);
	}

	.button.secondary {
		background: #fff;
		border: 1px solid rgba(15, 23, 42, 0.15);
		color: #0f172a;
	}

	.button.secondary:hover:not(:disabled) {
		border-color: rgba(15, 23, 42, 0.25);
		background: #f8fafc;
	}

	.error {
		margin: 0;
		font-size: 13px;
		color: #dc2626;
	}
</style>
