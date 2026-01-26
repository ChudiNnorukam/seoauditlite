<script lang="ts">
	import { onMount } from 'svelte';
	import type { AuditResult } from '$lib/auditing/schema';

	const focusOptions = [
		{ id: 'quick', label: 'Quick Wins', hint: 'Low lift, fast impact' },
		{ id: 'balanced', label: 'Balanced', hint: 'Mix of fixes and growth' },
		{ id: 'strategic', label: 'Strategic', hint: 'Bigger bets, long-term gains' }
	];

	const allTasks = [
		{
			id: 'llms',
			title: 'Publish llms.txt',
			category: 'AI Access',
			description: 'Declare your AI crawling rules and top content hubs.',
			impact: 5,
			effort: 1,
			mode: 'quick'
		},
		{
			id: 'ai-robots',
			title: 'Audit AI bot access in robots.txt',
			category: 'AI Access',
			description: 'Verify GPTBot, ClaudeBot, and PerplexityBot access.',
			impact: 4,
			effort: 2,
			mode: 'quick'
		},
		{
			id: 'schema-core',
			title: 'Add core JSON-LD schema',
			category: 'Structured Data',
			description: 'Implement Organization, WebSite, and FAQ schema.',
			impact: 5,
			effort: 3,
			mode: 'balanced'
		},
		{
			id: 'content-outline',
			title: 'Fix heading hierarchy',
			category: 'Content Signals',
			description: 'Ensure one H1 and semantic H2/H3 sections.',
			impact: 4,
			effort: 2,
			mode: 'quick'
		},
		{
			id: 'metadata',
			title: 'Refresh canonical + OG tags',
			category: 'Metadata',
			description: 'Tighten canonical URLs and social preview metadata.',
			impact: 3,
			effort: 2,
			mode: 'quick'
		},
		{
			id: 'answers',
			title: 'Publish answer-first pages',
			category: 'Answer Formats',
			description: 'Create FAQ and HowTo sections with clear summaries.',
			impact: 5,
			effort: 4,
			mode: 'strategic'
		},
		{
			id: 'internal-links',
			title: 'Strengthen internal linking',
			category: 'Crawl Paths',
			description: 'Link key pages from nav and in-content modules.',
			impact: 4,
			effort: 3,
			mode: 'balanced'
		},
		{
			id: 'content-refresh',
			title: 'Refresh top 5 money pages',
			category: 'Content Signals',
			description: 'Add 2026 updates, FAQs, and source citations.',
			impact: 5,
			effort: 4,
			mode: 'strategic'
		},
		{
			id: 'performance',
			title: 'Improve core web vitals',
			category: 'Performance',
			description: 'Tackle LCP, CLS, and image lazy-loading gaps.',
			impact: 4,
			effort: 4,
			mode: 'balanced'
		}
	];

	let domain = '';
	let focus = 'quick';
	let tasks = allTasks.map((task) => ({ ...task, selected: task.mode === 'quick' }));
	let lastAudit: AuditResult | null = null;
	let copied = false;

	onMount(() => {
		const bodyClass = 'planner-body';
		document.body.classList.add(bodyClass);
		const cached = sessionStorage.getItem('lastAudit');
		if (cached) {
			lastAudit = JSON.parse(cached) as AuditResult;
			domain = extractDomain(lastAudit.audited_url);
		}
		return () => {
			document.body.classList.remove(bodyClass);
		};
	});

	$: filteredTasks = tasks.filter((task) => {
		if (focus === 'balanced') {
			return task.mode !== 'strategic';
		}
		if (focus === 'strategic') {
			return true;
		}
		return task.mode === 'quick';
	});

	$: selectedTasks = tasks.filter((task) => task.selected);
	$: impactScore = selectedTasks.reduce((sum, task) => sum + task.impact, 0);
	$: effortScore = selectedTasks.reduce((sum, task) => sum + task.effort, 0);
	$: progress = Math.round((selectedTasks.length / tasks.length) * 100);

	const categoryOrder = ['AI Access', 'Structured Data', 'Content Signals', 'Metadata', 'Answer Formats', 'Crawl Paths', 'Performance'];

	function extractDomain(url: string): string {
		try {
			return new URL(url).hostname;
		} catch {
			return url;
		}
	}

	function buildPlanText() {
		const siteName = domain ? domain : 'your-site.com';
		const grouped = categoryOrder
			.map((category) => ({
				category,
				items: selectedTasks.filter((task) => task.category === category)
			}))
			.filter((group) => group.items.length > 0);

		const taskLines = grouped
			.map((group) => {
				const header = `## ${group.category}`;
				const items = group.items.map((task) => `- ${task.title} (${task.impact} impact / ${task.effort} effort)`);
				return [header, ...items].join('\n');
			})
			.join('\n\n');

		return [
			`# AEO Quick Wins Plan`,
			`Site: ${siteName}`,
			`Focus: ${focusOptions.find((option) => option.id === focus)?.label}`,
			``,
			`Impact Score: ${impactScore}`,
			`Effort Score: ${effortScore}`,
			``,
			taskLines || 'No tasks selected yet.'
		].join('\n');
	}

	async function copyPlan() {
		const planText = buildPlanText();
		try {
			await navigator.clipboard.writeText(planText);
			copied = true;
			setTimeout(() => (copied = false), 1600);
		} catch (error) {
			const textarea = document.createElement('textarea');
			textarea.value = planText;
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			document.body.appendChild(textarea);
			textarea.focus();
			textarea.select();
			try {
				document.execCommand('copy');
				copied = true;
				setTimeout(() => (copied = false), 1600);
			} finally {
				document.body.removeChild(textarea);
			}
		}
	}

	function downloadPlan() {
		const blob = new Blob([buildPlanText()], { type: 'text/plain;charset=utf-8' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = 'aeo-quick-wins-plan.txt';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(link.href);
	}

	function toggleAll(checked: boolean) {
		tasks = tasks.map((task) => ({ ...task, selected: checked ? filteredTasks.some((item) => item.id === task.id) : false }));
	}
</script>

<svelte:head>
	<title>AEO Quick Wins Planner - SEOAuditLite</title>
	<meta name="description" content="Build a focused AEO plan in minutes: pick quick wins, estimate impact, and export your action plan." />
	<link rel="canonical" href="https://seoauditlite.com/planner" />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="AEO Quick Wins Planner - SEOAuditLite" />
	<meta property="og:description" content="Build a prioritized AEO plan and export it for your team. Pick quick wins, estimate impact vs effort." />
	<meta property="og:url" content="https://seoauditlite.com/planner" />
</svelte:head>

<div class="planner">
	<header class="planner__header">
		<div>
			<p class="eyebrow">Micro App</p>
			<h1>AEO Quick Wins Planner</h1>
			<p class="lede">Build a prioritized AEO plan and export it for your team.</p>
		</div>
		<a class="back-link" href="/">Back to audit</a>
	</header>

	<section class="planner__panel">
		<div class="panel__intro">
			<h2>Project snapshot</h2>
			<p>Set the site, choose your focus, and select the actions you want to ship first.</p>
		</div>

		<div class="panel__inputs">
			<label class="input-card">
				<span>Site domain</span>
				<input type="text" placeholder="yoursite.com" bind:value={domain} />
				<em>{lastAudit ? `Last audit loaded for ${extractDomain(lastAudit.audited_url)}` : 'Tip: run an audit to auto-fill.'}</em>
			</label>
			<div class="focus-picker">
				<span>Focus</span>
				<div class="focus-grid">
					{#each focusOptions as option}
						<button
							class:active={focus === option.id}
							on:click={() => (focus = option.id)}
							type="button"
						>
							<strong>{option.label}</strong>
							<small>{option.hint}</small>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section class="planner__grid">
		<div class="task-board">
			<div class="task-board__header">
				<h3>Action library</h3>
				<div class="task-board__controls">
					<button type="button" on:click={() => toggleAll(true)}>Select focus</button>
					<button type="button" on:click={() => toggleAll(false)}>Clear all</button>
				</div>
			</div>
			<div class="task-board__list">
				{#each filteredTasks as task, index}
					<label class="task-card" style={`animation-delay: ${index * 60}ms`}>
						<div class="task-card__header">
							<input type="checkbox" bind:checked={task.selected} />
							<span class="tag">{task.category}</span>
						</div>
						<h4>{task.title}</h4>
						<p>{task.description}</p>
						<div class="task-card__meta">
							<span>Impact {task.impact}/5</span>
							<span>Effort {task.effort}/5</span>
						</div>
					</label>
				{/each}
			</div>
		</div>

		<aside class="summary">
			<div class="summary__card">
				<h3>Plan health</h3>
				<div class="meter">
					<div class="meter__fill" style={`width: ${progress}%`}></div>
				</div>
				<div class="summary__stats">
					<div>
						<strong>{selectedTasks.length}</strong>
						<span>tasks selected</span>
					</div>
					<div>
						<strong>{impactScore}</strong>
						<span>impact score</span>
					</div>
					<div>
						<strong>{effortScore}</strong>
						<span>effort score</span>
					</div>
				</div>
				<p class="summary__note">Aim for impact above 18 with effort below 16 for a fast sprint.</p>
			</div>

			<div class="summary__card">
				<h3>Export your plan</h3>
				<p>Share the plan with your team or drop it in your project tracker.</p>
				<div class="summary__actions">
					<button type="button" class="primary" on:click={copyPlan}>
						{copied ? 'Copied' : 'Copy plan'}
					</button>
					<button type="button" on:click={downloadPlan}>Download</button>
				</div>
			</div>
		</aside>
	</section>
</div>

<style>
	:global(body.planner-body) {
		background: var(--color-bg-subtle);
		color: var(--color-text);
	}

	.planner {
		max-width: 1100px;
		margin: 0 auto;
		padding: 48px 20px 80px;
		position: relative;
	}


	.planner__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 32px;
	}

	.planner__header h1 {
		font-size: 40px;
		margin: 8px 0 12px;
		letter-spacing: -0.02em;
		font-weight: 700;
	}

	.eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.2em;
		font-size: 12px;
		font-weight: 600;
		color: var(--color-primary-hover);
	}

	.lede {
		font-size: 18px;
		color: var(--color-text-secondary);
		max-width: 520px;
	}

	.back-link {
		color: var(--color-text);
		text-decoration: none;
		padding: 10px 16px;
		border-radius: var(--radius-pill);
		border: 1px solid var(--color-border-light);
		background: rgba(255, 255, 255, 0.6);
		font-weight: 600;
		font-size: 14px;
		transition: all 150ms ease;
	}

	.back-link:hover {
		transform: translateY(-1px);
	}

	.planner__panel {
		background: var(--color-bg);
		border-radius: var(--radius-lg);
		padding: 28px;
		border: 1px solid var(--color-border-light);
		margin-bottom: 28px;
		display: grid;
		gap: 24px;
	}

	.panel__intro h2 {
		margin: 0 0 8px;
		font-size: 22px;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.panel__inputs {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 20px;
	}

	.input-card {
		display: flex;
		flex-direction: column;
		gap: 10px;
		background: var(--color-bg-subtle);
		border-radius: var(--radius-md);
		padding: 16px;
		border: 1px solid var(--color-border-light);
	}

	.input-card span {
		font-weight: 600;
		font-size: 14px;
	}

	.input-card input {
		border: none;
		background: var(--color-bg);
		padding: 12px 16px;
		border-radius: var(--radius-md);
		font-size: 14px;
		font-family: inherit;
		box-shadow: inset 0 0 0 1px var(--color-border-light);
	}

	.input-card em {
		font-size: 12px;
		color: var(--color-text-muted);
	}

	.focus-picker span {
		font-size: 14px;
		font-weight: 600;
	}

	.focus-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 12px;
		margin-top: 10px;
	}

	.focus-grid button {
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		padding: 12px;
		background: var(--color-bg);
		text-align: left;
		cursor: pointer;
		transition: all 150ms ease;
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-family: inherit;
	}

	.focus-grid button.active {
		background: rgba(17, 98, 212, 0.08);
		border-color: rgba(17, 98, 212, 0.4);
		box-shadow: 0 8px 20px rgba(17, 98, 212, 0.12);
	}

	.focus-grid button strong {
		font-size: 14px;
		font-weight: 600;
	}

	.focus-grid button small {
		color: var(--color-text-muted);
		font-size: 12px;
	}

	.planner__grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 320px);
		gap: 24px;
		align-items: start;
	}

	.task-board {
		background: var(--color-bg);
		border-radius: var(--radius-lg);
		padding: 24px;
		border: 1px solid var(--color-border-light);
	}

	.task-board__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}

	.task-board__controls {
		display: flex;
		gap: 10px;
	}

	.task-board__controls button {
		border: 1px solid var(--color-border-light);
		background: var(--color-bg);
		border-radius: var(--radius-pill);
		padding: 8px 12px;
		font-size: 12px;
		cursor: pointer;
		font-weight: 500;
	}

	.task-board__list {
		display: grid;
		gap: 16px;
	}

	.task-card {
		border-radius: var(--radius-md);
		padding: 16px;
		border: 1px solid var(--color-border-light);
		background: var(--color-bg);
		display: grid;
		gap: 10px;
		animation: rise 450ms ease forwards;
		opacity: 0;
	}

	.task-card__header {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.task-card input {
		accent-color: var(--color-primary);
	}

	.task-card h4 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
	}

	.task-card p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 14px;
	}

	.task-card__meta {
		display: flex;
		gap: 12px;
		font-size: 12px;
		color: var(--color-text-faint);
	}

	.tag {
		font-size: 12px;
		font-weight: 600;
		background: rgba(17, 98, 212, 0.1);
		padding: 4px 8px;
		border-radius: var(--radius-pill);
		color: var(--color-primary-hover);
	}

	.summary {
		display: grid;
		gap: 16px;
	}

	.summary__card {
		background: var(--color-text);
		color: white;
		border-radius: var(--radius-lg);
		padding: 20px;
	}

	.summary__card:nth-child(2) {
		background: var(--color-bg);
		color: var(--color-text);
		border: 1px solid var(--color-border-light);
	}

	.summary__card h3 {
		margin: 0 0 12px;
		font-weight: 600;
	}

	.meter {
		height: 8px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: var(--radius-pill);
		overflow: hidden;
		margin-bottom: 16px;
	}

	.summary__card:nth-child(2) .meter {
		background: var(--color-bg-muted);
	}

	.meter__fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: var(--radius-pill);
		transition: width 200ms ease;
	}

	.summary__stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
		text-align: center;
	}

	.summary__stats strong {
		display: block;
		font-size: 20px;
		font-family: var(--font-mono);
	}

	.summary__stats span {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.7);
	}

	.summary__card:nth-child(2) .summary__stats span {
		color: var(--color-text-muted);
	}

	.summary__note {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.7);
		margin-top: 12px;
	}

	.summary__actions {
		display: grid;
		gap: 10px;
	}

	.summary__actions button {
		border: none;
		border-radius: var(--radius-sm);
		padding: 10px 16px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		background: var(--color-bg-muted);
	}

	.summary__actions button.primary {
		background: var(--color-primary);
		color: white;
	}

	.summary__actions button.primary:hover {
		background: var(--color-primary-hover);
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 960px) {
		.planner__grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 720px) {
		.planner__header {
			flex-direction: column;
			align-items: flex-start;
		}

		.planner__header h1 {
			font-size: 32px;
		}
	}
</style>
