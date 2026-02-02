<script lang="ts">
	import { ChartLine, User, CaretDown, SignOut, GearSix, Gauge } from 'phosphor-svelte';

	interface Props {
		user?: {
			id: string;
			email: string;
			name: string | null;
			avatarUrl: string | null;
		} | null;
		plan?: 'free' | 'pro';
	}

	let { user = null, plan = 'free' }: Props = $props();

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
		<a href="/" class="logo">
			<div class="logo-icon">
				<ChartLine size={20} weight="bold" />
			</div>
			<span>SEOAuditLite</span>
		</a>

		<nav class="header-nav">
			<a href="/#features" class="nav-link">Features</a>
			<a href="/pricing" class="nav-link">Pricing</a>
			<a href="/#faq" class="nav-link">FAQ</a>
		</nav>

		<div class="header-actions">
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
							<span class="plan-badge">Pro</span>
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
				<a href="/api/auth/login" class="sign-in-link">Sign in</a>
				<button class="btn-primary" onclick={handleSignIn} disabled={signingIn} type="button">
					{#if signingIn}
						Loading...
					{:else}
						Get Started
					{/if}
				</button>
			{/if}
		</div>
	</div>
</header>

<style>
	.header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		background: var(--glass-bg);
		backdrop-filter: blur(var(--glass-blur));
		-webkit-backdrop-filter: blur(var(--glass-blur));
		border-bottom: 1px solid var(--glass-border);
	}

	.header-content {
		max-width: var(--width-max);
		margin: 0 auto;
		padding: 16px 24px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 12px;
		text-decoration: none;
		color: var(--color-text);
		font-size: var(--text-xl);
		font-weight: 600;
	}

	.logo-icon {
		width: 40px;
		height: 40px;
		border-radius: var(--radius-lg);
		background: var(--color-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}

	.header-nav {
		display: none;
		align-items: center;
		gap: 32px;
	}

	@media (min-width: 768px) {
		.header-nav {
			display: flex;
		}
	}

	.nav-link {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--text-base);
		font-weight: 500;
		transition: color 150ms ease;
	}

	.nav-link:hover {
		color: var(--color-text);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.sign-in-link {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--text-base);
		font-weight: 500;
		transition: color 150ms ease;
	}

	.sign-in-link:hover {
		color: var(--color-text);
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		padding: 10px 20px;
		background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
		color: white;
		border: none;
		border-radius: var(--radius-lg);
		font-family: var(--font-sans);
		font-size: var(--text-base);
		font-weight: 600;
		cursor: pointer;
		box-shadow: 0 4px 20px var(--color-primary-glow);
		transition: all 0.3s ease;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 30px var(--color-primary-glow);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* User Menu */
	.user-menu {
		position: relative;
	}

	.user-button {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		padding: 6px 12px 6px 6px;
		cursor: pointer;
		transition: border-color 150ms ease;
	}

	.user-button:hover {
		border-color: var(--color-border);
	}

	.avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		object-fit: cover;
	}

	.avatar-placeholder {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--color-bg-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-muted);
	}

	.user-name {
		font-size: var(--text-base);
		font-weight: 500;
		color: var(--color-text);
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.plan-badge {
		font-size: var(--text-xs);
		font-weight: 600;
		text-transform: uppercase;
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: white;
	}

	:global(.caret) {
		color: var(--color-text-muted);
	}

	/* Dropdown */
	.dropdown {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		background: var(--color-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		min-width: 180px;
		padding: 8px;
		z-index: 200;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		font-size: var(--text-base);
		font-weight: 500;
		color: var(--color-text);
		text-decoration: none;
		border-radius: var(--radius-md);
		border: none;
		background: none;
		width: 100%;
		cursor: pointer;
		transition: background 150ms ease;
	}

	.dropdown-item:hover {
		background: var(--color-bg-muted);
	}

	.dropdown-divider {
		height: 1px;
		background: var(--glass-border);
		margin: 8px 0;
	}
</style>
