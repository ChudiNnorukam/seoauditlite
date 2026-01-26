<script lang="ts">
	import { MagnifyingGlass, ArrowLeft, User, CaretDown, SignOut, Gauge, GearSix } from 'phosphor-svelte';

	interface Props {
		showBack?: boolean;
		user?: {
			id: string;
			email: string;
			name: string | null;
			avatarUrl: string | null;
		} | null;
		plan?: 'free' | 'pro';
	}

	let { showBack = false, user = null, plan = 'free' }: Props = $props();

	let dropdownOpen = $state(false);
	let signingIn = $state(false);

	async function handleSignIn() {
		signingIn = true;
		try {
			const response = await fetch('/api/auth/login', { method: 'POST' });
			const data = await response.json();
			if (data.url) {
				window.location.href = data.url;
			}
		} catch (e) {
			console.error('Sign in error:', e);
			signingIn = false;
		}
	}

	async function handleSignOut() {
		dropdownOpen = false;
		await fetch('/api/auth/logout', { method: 'POST' });
		window.location.href = '/';
	}

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
	}

	function closeDropdown(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.user-menu')) {
			dropdownOpen = false;
		}
	}
</script>

<svelte:window onclick={closeDropdown} />

<header class="header">
	<div class="header-content">
		<div class="header-left">
			{#if showBack}
				<a href="/" class="back-link">
					<ArrowLeft size={16} weight="bold" />
					<span>New audit</span>
				</a>
			{:else}
				<a href="/" class="logo">
					<MagnifyingGlass size={18} weight="bold" />
					<span>SEOAuditLite</span>
				</a>
			{/if}
		</div>
		<nav class="header-nav">
			{#if !showBack}
				<a href="/planner" class="nav-link">Planner</a>
			{/if}

			{#if user}
				<div class="user-menu">
					<button class="user-button" onclick={toggleDropdown} type="button">
						{#if user.avatarUrl}
							<img src={user.avatarUrl} alt="" class="avatar" />
						{:else}
							<div class="avatar-placeholder">
								<User size={14} weight="bold" />
							</div>
						{/if}
						<span class="user-name">{user.name || user.email}</span>
						{#if plan === 'pro'}
							<span class="plan-badge pro">Pro</span>
						{/if}
						<CaretDown size={12} weight="bold" class="caret" />
					</button>

					{#if dropdownOpen}
						<div class="dropdown">
							<a href="/dashboard" class="dropdown-item" onclick={() => dropdownOpen = false}>
								<Gauge size={16} weight="regular" />
								<span>Dashboard</span>
							</a>
							<a href="/account" class="dropdown-item" onclick={() => dropdownOpen = false}>
								<GearSix size={16} weight="regular" />
								<span>Account</span>
							</a>
							<div class="dropdown-divider"></div>
							<button class="dropdown-item" onclick={handleSignOut} type="button">
								<SignOut size={16} weight="regular" />
								<span>Sign out</span>
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<button class="sign-in-button" onclick={handleSignIn} disabled={signingIn} type="button">
					{#if signingIn}
						Signing in...
					{:else}
						Sign in
					{/if}
				</button>
			{/if}
		</nav>
	</div>
</header>

<style>
	.header {
		border-bottom: 1px solid var(--color-border-light, rgba(15, 23, 42, 0.06));
		background: var(--color-bg, #fff);
		position: sticky;
		top: 0;
		z-index: 100;
		height: 56px;
		display: flex;
		align-items: center;
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}

	.header-left {
		display: flex;
		align-items: center;
	}

	.logo {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: var(--color-text, #0f172a);
		text-decoration: none;
		font-size: 15px;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.logo:hover {
		color: var(--color-primary, #f97316);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--color-text-muted, #64748b);
		text-decoration: none;
		font-size: 13px;
		font-weight: 500;
		transition: color 150ms ease;
	}

	.back-link:hover {
		color: var(--color-primary, #f97316);
	}

	.header-nav {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.nav-link {
		color: var(--color-text-muted, #64748b);
		text-decoration: none;
		font-size: 13px;
		font-weight: 500;
		transition: color 150ms ease;
	}

	.nav-link:hover {
		color: var(--color-text, #0f172a);
	}

	/* Sign in button — orange accent for CTA consistency */
	.sign-in-button {
		background: var(--color-primary, #f97316);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm, 6px);
		padding: 8px 16px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 150ms ease;
	}

	.sign-in-button:hover:not(:disabled) {
		background: var(--color-primary-hover, #ea580c);
	}

	.sign-in-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* User menu */
	.user-menu {
		position: relative;
	}

	.user-button {
		display: flex;
		align-items: center;
		gap: 8px;
		background: none;
		border: 1px solid var(--color-border-light, rgba(15, 23, 42, 0.06));
		border-radius: var(--radius-sm, 6px);
		padding: 4px 12px 4px 4px;
		cursor: pointer;
		transition: border-color 150ms ease;
	}

	.user-button:hover {
		border-color: var(--color-border, #e2e8f0);
	}

	.avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		object-fit: cover;
	}

	.avatar-placeholder {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--color-bg-muted, #f1f5f9);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-muted, #64748b);
	}

	.user-name {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text, #0f172a);
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.plan-badge {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.plan-badge.pro {
		background: linear-gradient(135deg, var(--color-primary, #f97316) 0%, var(--color-primary-hover, #ea580c) 100%);
		color: #fff;
	}

	:global(.caret) {
		color: var(--color-text-muted, #64748b);
	}

	/* Dropdown */
	.dropdown {
		position: absolute;
		top: calc(100% + 4px);
		right: 0;
		background: var(--color-bg, #fff);
		border: 1px solid var(--color-border-light, rgba(15, 23, 42, 0.06));
		border-radius: var(--radius-md, 10px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		min-width: 160px;
		padding: 4px;
		z-index: 200;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text, #0f172a);
		text-decoration: none;
		border-radius: var(--radius-sm, 6px);
		border: none;
		background: none;
		width: 100%;
		cursor: pointer;
		transition: background 150ms ease;
	}

	.dropdown-item:hover {
		background: var(--color-bg-muted, #f1f5f9);
	}

	.dropdown-divider {
		height: 1px;
		background: var(--color-border-light, rgba(15, 23, 42, 0.06));
		margin: 4px 0;
	}
</style>
