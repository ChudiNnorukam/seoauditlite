<script lang="ts">
	import { MagnifyingGlass, Download, TrendUp, TrendDown, Minus, ArrowsClockwise } from 'phosphor-svelte';
	import type { KeywordResult } from '$lib/server/keywords/types';

	let seedKeyword = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let results = $state<KeywordResult[]>([]);
	let sortColumn = $state<'keyword' | 'interest' | 'intent'>('interest');
	let sortDirection = $state<'asc' | 'desc'>('desc');

	async function handleSearch() {
		if (!seedKeyword.trim()) {
			error = 'Please enter a keyword';
			return;
		}

		loading = true;
		error = null;
		results = [];

		try {
			// Fetch autocomplete suggestions
			const suggestResponse = await fetch('/api/keywords/suggest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ seed: seedKeyword.trim() })
			});

			if (!suggestResponse.ok) {
				const errorData = await suggestResponse.json();
				throw new Error(errorData.error || 'Failed to fetch suggestions');
			}

			const { suggestions } = await suggestResponse.json();

			if (suggestions.length === 0) {
				error = 'No suggestions found. Try a different keyword.';
				loading = false;
				return;
			}

			// Fetch trends for all suggestions (batch in groups of 5)
			const trendsMap = new Map<string, { interest: number; direction: string; sparkline: number[] }>();

			for (let i = 0; i < suggestions.length; i += 5) {
				const batch = suggestions.slice(i, i + 5);

				const trendsResponse = await fetch('/api/keywords/trends', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ keywords: batch })
				});

				if (trendsResponse.ok) {
					const { trends } = await trendsResponse.json();
					trends.forEach((trend: any) => {
						trendsMap.set(trend.keyword, {
							interest: trend.relativeInterest,
							direction: trend.trendDirection,
							sparkline: trend.sparkline
						});
					});
				}
			}

			// Combine suggestions with trends and intent
			results = suggestions.map((keyword: string) => {
				const trend = trendsMap.get(keyword) || { interest: 0, direction: 'unknown', sparkline: [] };
				const intent = classifyIntent(keyword);

				return {
					keyword,
					relativeInterest: trend.interest,
					trendDirection: trend.direction as 'rising' | 'stable' | 'falling' | 'unknown',
					sparkline: trend.sparkline,
					intent
				};
			});

			// Sort by interest (default)
			sortResults('interest', 'desc');
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	function classifyIntent(keyword: string): 'informational' | 'navigational' | 'transactional' | 'unknown' {
		const lower = keyword.toLowerCase();

		const transactional = ['buy', 'price', 'cost', 'cheap', 'deal', 'discount', 'coupon', 'free', 'download', 'trial', 'review', 'best', 'top', 'vs'];
		if (transactional.some((word) => lower.includes(word))) return 'transactional';

		const informational = ['how to', 'what is', 'why', 'guide', 'tutorial', 'learn', 'meaning', 'definition', 'example', 'tips', 'ideas'];
		if (informational.some((phrase) => lower.includes(phrase))) return 'informational';

		const navigational = ['login', 'sign in', 'official', 'website', 'app'];
		if (navigational.some((word) => lower.includes(word))) return 'navigational';

		return 'unknown';
	}

	function sortResults(column: typeof sortColumn, direction: typeof sortDirection) {
		sortColumn = column;
		sortDirection = direction;

		results = [...results].sort((a, b) => {
			let aVal: string | number;
			let bVal: string | number;

			if (column === 'keyword') {
				aVal = a.keyword.toLowerCase();
				bVal = b.keyword.toLowerCase();
			} else if (column === 'interest') {
				aVal = a.relativeInterest;
				bVal = b.relativeInterest;
			} else {
				aVal = a.intent;
				bVal = b.intent;
			}

			if (direction === 'asc') {
				return aVal > bVal ? 1 : -1;
			} else {
				return aVal < bVal ? 1 : -1;
			}
		});
	}

	function handleSort(column: typeof sortColumn) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortDirection = 'desc';
		}
		sortResults(column, sortDirection);
	}

	function exportCSV() {
		const headers = ['Keyword', 'Relative Interest', 'Trend Direction', 'Intent'];
		const rows = results.map((r) => [
			r.keyword,
			r.relativeInterest.toString(),
			r.trendDirection,
			r.intent
		]);

		const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `keywords-${seedKeyword.replace(/\s+/g, '-')}-${Date.now()}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function renderSparkline(data: number[]): string {
		if (data.length === 0) return '';

		const max = Math.max(...data);
		const min = Math.min(...data);
		const range = max - min || 1;

		const points = data.map((value, index) => {
			const x = (index / (data.length - 1)) * 100;
			const y = 100 - ((value - min) / range) * 100;
			return `${x},${y}`;
		});

		return `M ${points.join(' L ')}`;
	}

	function getTrendColor(direction: string) {
		if (direction === 'rising') return 'var(--color-success, #22c55e)';
		if (direction === 'falling') return 'var(--color-error, #ef4444)';
		return 'var(--color-text-muted, #64748b)';
	}
</script>

<svelte:head>
	<title>Free Keyword Research Tool | SEOAuditLite</title>
	<meta name="description" content="Discover keyword ideas with free autocomplete suggestions and Google Trends data. No API key required." />

	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		"name": "Free Keyword Research Tool",
		"applicationCategory": "BusinessApplication",
		"operatingSystem": "Web",
		"description": "Discover keyword ideas using Google Autocomplete and Trends. Free, no API key required.",
		"url": "https://seoauditlite.com/keywords",
		"offers": {
			"@type": "Offer",
			"price": "0",
			"priceCurrency": "USD"
		},
		"author": {
			"@type": "Person",
			"name": "Chudi Nnorukam",
			"url": "https://chudi.dev"
		},
		"featureList": [
			"Google Autocomplete keyword expansion",
			"Google Trends relative interest data",
			"Keyword intent classification",
			"CSV export",
			"No API key required"
		]
	}
	</script>`}
</svelte:head>

<div class="page">
	<div class="container">
		<div class="header-section">
			<h1>Keyword Research</h1>
			<p class="description">Discover keyword ideas using Google Autocomplete and Trends. Free, no API key required.</p>
		</div>

		<div class="search-section">
			<form onsubmit={(e) => { e.preventDefault(); handleSearch(); }}>
				<div class="search-input-wrapper">
					<MagnifyingGlass size={20} weight="regular" />
					<input
						type="text"
						bind:value={seedKeyword}
						placeholder="Enter seed keyword (e.g., seo audit)"
						class="search-input"
						disabled={loading}
					/>
					<button type="submit" class="search-button" disabled={loading}>
						{#if loading}
							<ArrowsClockwise size={16} weight="bold" class="spin" />
							<span>Searching...</span>
						{:else}
							<span>Search</span>
						{/if}
					</button>
				</div>
			</form>

			{#if error}
				<div class="error-message">{error}</div>
			{/if}
		</div>

		{#if results.length > 0}
			<div class="results-section">
				<div class="results-header">
					<div class="results-count">{results.length} keywords found</div>
					<button class="export-button" onclick={exportCSV}>
						<Download size={16} weight="regular" />
						<span>Export CSV</span>
					</button>
				</div>

				<div class="table-wrapper">
					<table class="results-table">
						<thead>
							<tr>
								<th class="sortable" onclick={() => handleSort('keyword')}>
									Keyword
									{#if sortColumn === 'keyword'}
										<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</th>
								<th class="sortable" onclick={() => handleSort('interest')}>
									Interest
									{#if sortColumn === 'interest'}
										<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</th>
								<th>Trend</th>
								<th class="sortable" onclick={() => handleSort('intent')}>
									Intent
									{#if sortColumn === 'intent'}
										<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</th>
							</tr>
						</thead>
						<tbody>
							{#each results as result}
								<tr>
									<td class="keyword-cell">{result.keyword}</td>
									<td class="interest-cell">
										<span class="interest-value">{result.relativeInterest}</span>
									</td>
									<td class="trend-cell">
										<div class="trend-wrapper">
											{#if result.sparkline.length > 0}
												<svg viewBox="0 0 100 100" class="sparkline" preserveAspectRatio="none">
													<path d={renderSparkline(result.sparkline)} fill="none" stroke={getTrendColor(result.trendDirection)} stroke-width="3" />
												</svg>
											{/if}
											{#if result.trendDirection === 'rising'}
												<TrendUp size={14} weight="bold" style="color: {getTrendColor(result.trendDirection)}" />
											{:else if result.trendDirection === 'falling'}
												<TrendDown size={14} weight="bold" style="color: {getTrendColor(result.trendDirection)}" />
											{:else}
												<Minus size={14} weight="bold" style="color: {getTrendColor(result.trendDirection)}" />
											{/if}
										</div>
									</td>
									<td class="intent-cell">
										<span class="intent-badge {result.intent}">{result.intent}</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.page {
		min-height: calc(100vh - 56px);
		background: var(--color-bg, #fff);
		padding: 40px 20px;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.header-section {
		text-align: center;
		margin-bottom: 40px;
	}

	h1 {
		font-size: 32px;
		font-weight: 700;
		color: var(--color-text, #0f172a);
		margin: 0 0 12px 0;
		letter-spacing: -0.02em;
	}

	.description {
		font-size: 15px;
		color: var(--color-text-muted, #64748b);
		margin: 0;
	}

	.search-section {
		max-width: 640px;
		margin: 0 auto 40px;
	}

	.search-input-wrapper {
		display: flex;
		align-items: center;
		gap: 12px;
		background: var(--color-bg, #fff);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: var(--radius-md, 10px);
		padding: 12px 16px;
		transition: border-color 150ms ease;
	}

	.search-input-wrapper:focus-within {
		border-color: var(--color-primary);
	}

	.search-input {
		flex: 1;
		border: none;
		outline: none;
		font-size: 14px;
		color: var(--color-text, #0f172a);
		background: transparent;
	}

	.search-input::placeholder {
		color: var(--color-text-muted, #64748b);
	}

	.search-button {
		background: var(--color-primary);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm, 6px);
		padding: 8px 16px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 6px;
		transition: background 150ms ease;
		white-space: nowrap;
	}

	.search-button:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	.search-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error-message {
		margin-top: 12px;
		padding: 12px 16px;
		background: var(--color-error-bg, #fef2f2);
		border: 1px solid var(--color-error, #ef4444);
		border-radius: var(--radius-sm, 6px);
		color: var(--color-error, #ef4444);
		font-size: 13px;
		text-align: center;
	}

	.results-section {
		margin-top: 40px;
	}

	.results-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.results-count {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-text, #0f172a);
	}

	.export-button {
		display: flex;
		align-items: center;
		gap: 6px;
		background: var(--color-bg, #fff);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: var(--radius-sm, 6px);
		padding: 8px 16px;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text, #0f172a);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.export-button:hover {
		background: var(--color-bg-muted, #f1f5f9);
		border-color: var(--color-border-hover, #cbd5e1);
	}

	.table-wrapper {
		overflow-x: auto;
		border: 1px solid var(--color-border-light, rgba(15, 23, 42, 0.06));
		border-radius: var(--radius-md, 10px);
	}

	.results-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}

	.results-table thead {
		background: var(--color-bg-muted, #f1f5f9);
	}

	.results-table th {
		text-align: left;
		padding: 12px 16px;
		font-weight: 600;
		color: var(--color-text, #0f172a);
		border-bottom: 1px solid var(--color-border-light, rgba(15, 23, 42, 0.06));
		white-space: nowrap;
	}

	.sortable {
		cursor: pointer;
		user-select: none;
	}

	.sortable:hover {
		background: var(--color-bg, #fff);
	}

	.sort-indicator {
		margin-left: 4px;
		color: var(--color-primary);
	}

	.results-table td {
		padding: 12px 16px;
		border-bottom: 1px solid var(--color-border-light, rgba(15, 23, 42, 0.06));
	}

	.results-table tbody tr:hover {
		background: var(--color-bg-muted, #f1f5f9);
	}

	.keyword-cell {
		font-weight: 500;
		color: var(--color-text, #0f172a);
	}

	.interest-cell {
		text-align: center;
	}

	.interest-value {
		display: inline-block;
		min-width: 32px;
		padding: 4px 8px;
		background: var(--color-bg-muted, #f1f5f9);
		border-radius: var(--radius-sm, 6px);
		font-weight: 600;
		font-size: 12px;
	}

	.trend-cell {
		width: 120px;
	}

	.trend-wrapper {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.sparkline {
		width: 80px;
		height: 24px;
	}

	.intent-cell {
		text-align: center;
	}

	.intent-badge {
		display: inline-block;
		padding: 4px 8px;
		border-radius: var(--radius-sm, 6px);
		font-size: 11px;
		font-weight: 600;
		text-transform: capitalize;
	}

	.intent-badge.informational {
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
	}

	.intent-badge.transactional {
		background: rgba(34, 197, 94, 0.1);
		color: #22c55e;
	}

	.intent-badge.navigational {
		background: rgba(168, 85, 247, 0.1);
		color: #a855f7;
	}

	.intent-badge.unknown {
		background: var(--color-bg-muted, #f1f5f9);
		color: var(--color-text-muted, #64748b);
	}

	:global(.spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 720px) {
		.page {
			padding: 24px 16px;
		}

		h1 {
			font-size: 24px;
		}

		.search-input-wrapper {
			flex-direction: column;
			align-items: stretch;
		}

		.search-button {
			width: 100%;
			justify-content: center;
		}

		.results-header {
			flex-direction: column;
			gap: 12px;
			align-items: flex-start;
		}

		.export-button {
			width: 100%;
			justify-content: center;
		}

		.table-wrapper {
			overflow-x: scroll;
		}
	}
</style>
