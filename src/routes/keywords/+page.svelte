<script lang="ts">
	import { MagnifyingGlass, Download, TrendUp, TrendDown, Minus, ArrowsClockwise } from 'phosphor-svelte';
	import type { KeywordResult } from '$lib/server/keywords/types';

	let seedKeyword = $state('');
	let loading = $state(false);
	let loadingStage = $state<string>('');
	let error = $state<string | null>(null);
	let results = $state<KeywordResult[]>([]);
	let sortColumn = $state<'keyword' | 'interest' | 'volume' | 'difficulty' | 'intent'>('interest');
	let sortDirection = $state<'asc' | 'desc'>('desc');
	let displayLimit = $state(50);
	let trendsFailureCount = $state(0);

	// Filters
	let filterIntent = $state<'all' | 'informational' | 'navigational' | 'transactional'>('all');
	let filterInterestMin = $state(0);
	let filterTrend = $state<'all' | 'rising' | 'stable' | 'falling'>('all');
	let filterDifficultyMax = $state(100);

	// Check if search volume data is available
	let hasVolumeData = $derived(results.some(r => r.searchVolume && r.searchVolume > 0));

	// Computed filtered results
	let filteredResults = $derived(() => {
		let filtered = [...results];

		if (filterIntent !== 'all') {
			filtered = filtered.filter(r => r.intent === filterIntent);
		}

		if (filterInterestMin > 0) {
			filtered = filtered.filter(r => r.relativeInterest >= filterInterestMin);
		}

		if (filterTrend !== 'all') {
			filtered = filtered.filter(r => r.trendDirection === filterTrend);
		}

		if (filterDifficultyMax < 100) {
			filtered = filtered.filter(r => r.difficulty <= filterDifficultyMax);
		}

		return filtered;
	});

	async function handleSearch() {
		if (!seedKeyword.trim()) {
			error = 'Please enter a keyword';
			return;
		}

		loading = true;
		loadingStage = 'Fetching suggestions...';
		error = null;
		results = [];
		trendsFailureCount = 0;
		displayLimit = 50;

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
			const totalBatches = Math.ceil(suggestions.length / 5);
			let failedBatches = 0;

			for (let i = 0; i < suggestions.length; i += 5) {
				const batch = suggestions.slice(i, i + 5);
				const currentBatch = Math.floor(i / 5) + 1;
				loadingStage = `Analyzing trends... (${currentBatch}/${totalBatches})`;

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
				} else {
					failedBatches++;
					// Track which keywords failed for warning message
					trendsFailureCount += batch.length;
				}
			}

			// Fetch search volume data (optional - requires DataForSEO credentials)
			loadingStage = 'Fetching search volume...';
			const volumeMap = new Map<string, { volume: number; cpc: number }>();

			try {
				// Fetch in batches of 100 (DataForSEO limit per request)
				for (let i = 0; i < suggestions.length; i += 100) {
					const batch = suggestions.slice(i, i + 100);

					const volumeResponse = await fetch('/api/keywords/volume', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ keywords: batch })
					});

					if (volumeResponse.ok) {
						const { volumeData, available } = await volumeResponse.json();
						if (available && volumeData) {
							volumeData.forEach((item: any) => {
								volumeMap.set(item.keyword, {
									volume: item.searchVolume,
									cpc: item.cpc
								});
							});
						}
					}
				}
			} catch (err) {
				console.warn('Search volume data unavailable:', err);
			}

			// Combine suggestions with trends, intent, difficulty, and volume
			results = suggestions.map((keyword: string, index: number) => {
				const trend = trendsMap.get(keyword) || { interest: 0, direction: 'unknown', sparkline: [] };
				const intent = classifyIntent(keyword);
				const difficulty = calculateDifficulty(keyword, index, suggestions.length);
				const volume = volumeMap.get(keyword);

				return {
					keyword,
					relativeInterest: trend.interest,
					trendDirection: trend.direction as 'rising' | 'stable' | 'falling' | 'unknown',
					sparkline: trend.sparkline,
					intent,
					difficulty,
					searchVolume: volume?.volume,
					cpc: volume?.cpc
				};
			});

			// Sort by interest (default)
			sortResults('interest', 'desc');

			// Show warning if some trends failed
			if (failedBatches > 0) {
				error = `Trends data unavailable for ${trendsFailureCount} keywords. Showing available data.`;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
			loadingStage = '';
		}
	}

	function loadMore() {
		displayLimit += 50;
	}

	function resetFilters() {
		filterIntent = 'all';
		filterInterestMin = 0;
		filterTrend = 'all';
		filterDifficultyMax = 100;
		displayLimit = 50;
	}

	function hasActiveFilters(): boolean {
		return filterIntent !== 'all' || filterInterestMin > 0 || filterTrend !== 'all' || filterDifficultyMax < 100;
	}

	function calculateDifficulty(keyword: string, position: number, totalResults: number): number {
		// Heuristic-based keyword difficulty (0-100)
		// Factors: position in autocomplete, keyword length, modifiers

		let difficulty = 50; // Base difficulty

		// Position factor: Earlier in autocomplete = more popular = harder
		const positionScore = (position / totalResults) * 50; // 0-50 points
		difficulty += 50 - positionScore; // Invert so early position = high difficulty

		// Length factor: Longer keywords = more specific = easier
		const words = keyword.split(' ').length;
		if (words >= 4) difficulty -= 15; // Long-tail keywords easier
		else if (words === 3) difficulty -= 10;
		else if (words === 2) difficulty -= 5;
		// 1-word = no adjustment (hardest)

		// Modifier factor: Presence of location/modifiers = easier
		const easyModifiers = ['near me', 'for', 'with', 'without', 'in', 'free', 'best', 'top'];
		const hasEasyModifier = easyModifiers.some(mod => keyword.includes(mod));
		if (hasEasyModifier) difficulty -= 10;

		// Clamp to 0-100
		return Math.max(0, Math.min(100, Math.round(difficulty)));
	}

	function classifyIntent(keyword: string): 'informational' | 'navigational' | 'transactional' | 'unknown' {
		const lower = keyword.toLowerCase();

		// Weighted scoring: higher score = stronger signal
		let informationalScore = 0;
		let transactionalScore = 0;
		let navigationalScore = 0;

		// Informational signals (check first - more specific)
		const informational = {
			strong: ['how to', 'what is', 'what are', 'why', 'when to', 'guide', 'tutorial', 'meaning', 'definition'],
			medium: ['learn', 'example', 'tips', 'ideas', 'explained', 'understand', 'basics', 'beginner'],
			weak: ['help', 'info', 'about']
		};

		informational.strong.forEach(phrase => {
			if (lower.includes(phrase)) {
				informationalScore += lower.startsWith(phrase) ? 3 : 2.5;
			}
		});
		informational.medium.forEach(phrase => {
			if (lower.includes(phrase)) informationalScore += 1.5;
		});
		informational.weak.forEach(word => {
			if (lower.includes(word)) informationalScore += 0.5;
		});

		// Transactional signals
		const transactional = {
			strong: ['buy', 'purchase', 'price', 'pricing', 'cost', 'cheap', 'discount', 'coupon', 'deal', 'order'],
			medium: ['best', 'top', 'review', 'comparison', 'vs', 'versus', 'alternative'],
			weak: ['free', 'trial', 'download'] // Weak because "free guide" is informational
		};

		transactional.strong.forEach(word => {
			if (lower.includes(word)) {
				transactionalScore += lower.startsWith(word) ? 3 : 2.5;
			}
		});
		transactional.medium.forEach(word => {
			if (lower.includes(word)) transactionalScore += 1.5;
		});
		transactional.weak.forEach(word => {
			// Only count if at end (e.g., "seo tool free" not "free seo guide")
			if (lower.endsWith(word) || lower.includes(` ${word} `)) {
				transactionalScore += 0.5;
			}
		});

		// Navigational signals
		const navigational = {
			strong: ['login', 'sign in', 'sign up', 'register', 'dashboard', 'account', 'portal'],
			medium: ['official', 'website', 'site', 'app', 'platform'],
			weak: ['online', 'web']
		};

		navigational.strong.forEach(phrase => {
			if (lower.includes(phrase)) navigationalScore += 2.5;
		});
		navigational.medium.forEach(word => {
			if (lower.includes(word)) navigationalScore += 1.5;
		});
		navigational.weak.forEach(word => {
			if (lower.includes(word)) navigationalScore += 0.5;
		});

		// Determine intent by highest score (with minimum threshold)
		const maxScore = Math.max(informationalScore, transactionalScore, navigationalScore);

		if (maxScore < 1) return 'unknown'; // No strong signals

		if (informationalScore === maxScore) return 'informational';
		if (transactionalScore === maxScore) return 'transactional';
		if (navigationalScore === maxScore) return 'navigational';

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
			} else if (column === 'volume') {
				aVal = a.searchVolume || 0;
				bVal = b.searchVolume || 0;
			} else if (column === 'difficulty') {
				aVal = a.difficulty;
				bVal = b.difficulty;
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
		const headers = hasVolumeData
			? ['Keyword', 'Search Volume', 'Relative Interest', 'Trend Direction', 'Difficulty', 'CPC', 'Intent']
			: ['Keyword', 'Relative Interest', 'Trend Direction', 'Difficulty', 'Intent'];

		const rows = filteredResults().map((r) => {
			const baseRow = [
				r.keyword,
				r.relativeInterest.toString(),
				r.trendDirection,
				r.difficulty.toString(),
				r.intent
			];

			if (hasVolumeData) {
				return [
					r.keyword,
					r.searchVolume?.toString() || '0',
					r.relativeInterest.toString(),
					r.trendDirection,
					r.difficulty.toString(),
					r.cpc?.toFixed(2) || '0',
					r.intent
				];
			}

			return baseRow;
		});

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
							<span>{loadingStage || 'Searching...'}</span>
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
			<div class="filters-section">
				<div class="filters-header">
					<span class="filters-label">Filters</span>
					{#if hasActiveFilters()}
						<button class="reset-filters-button" onclick={resetFilters}>Reset</button>
					{/if}
				</div>

				<div class="filters-grid">
					<div class="filter-group">
						<label class="filter-label">Intent</label>
						<select bind:value={filterIntent} class="filter-select">
							<option value="all">All intents</option>
							<option value="informational">Informational</option>
							<option value="navigational">Navigational</option>
							<option value="transactional">Transactional</option>
						</select>
					</div>

					<div class="filter-group">
						<label class="filter-label">Min Interest</label>
						<select bind:value={filterInterestMin} class="filter-select">
							<option value={0}>Any</option>
							<option value={25}>25+</option>
							<option value={50}>50+</option>
							<option value={75}>75+</option>
						</select>
					</div>

					<div class="filter-group">
						<label class="filter-label">Trend</label>
						<select bind:value={filterTrend} class="filter-select">
							<option value="all">All trends</option>
							<option value="rising">Rising</option>
							<option value="stable">Stable</option>
							<option value="falling">Falling</option>
						</select>
					</div>

					<div class="filter-group">
						<label class="filter-label">Max Difficulty</label>
						<select bind:value={filterDifficultyMax} class="filter-select">
							<option value={100}>Any</option>
							<option value={30}>Easy (≤30)</option>
							<option value={70}>Medium (≤70)</option>
						</select>
					</div>
				</div>
			</div>

			<div class="results-section">
				<div class="results-header">
					<div class="results-count">
						{filteredResults().length} of {results.length} keywords
						{#if hasActiveFilters()}
							<span class="filtered-indicator">(filtered)</span>
						{/if}
					</div>
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
								{#if hasVolumeData}
									<th class="sortable" onclick={() => handleSort('volume')}>
										Volume
										{#if sortColumn === 'volume'}
											<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
										{/if}
									</th>
								{/if}
								<th>Trend</th>
								<th class="sortable" onclick={() => handleSort('difficulty')}>
									Difficulty
									{#if sortColumn === 'difficulty'}
										<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</th>
								<th class="sortable" onclick={() => handleSort('intent')}>
									Intent
									{#if sortColumn === 'intent'}
										<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredResults().slice(0, displayLimit) as result}
								<tr>
									<td class="keyword-cell">{result.keyword}</td>
									<td class="interest-cell">
										<span class="interest-value">{result.relativeInterest}</span>
									</td>
									{#if hasVolumeData}
										<td class="volume-cell">
											{#if result.searchVolume && result.searchVolume > 0}
												<span class="volume-value">{result.searchVolume.toLocaleString()}</span>
											{:else}
												<span class="volume-na">—</span>
											{/if}
										</td>
									{/if}
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
									<td class="difficulty-cell">
										<span class="difficulty-badge {result.difficulty < 30 ? 'easy' : result.difficulty < 70 ? 'medium' : 'hard'}">
											{result.difficulty}
										</span>
									</td>
									<td class="intent-cell">
										<span class="intent-badge {result.intent}">{result.intent}</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				{#if filteredResults().length > displayLimit}
					<div class="load-more-section">
						<button class="load-more-button" onclick={loadMore}>
							Load more ({filteredResults().length - displayLimit} remaining)
						</button>
					</div>
				{/if}
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

	.filters-section {
		max-width: 1200px;
		margin: 32px auto 0;
		padding: 16px;
		background: var(--color-bg-muted, #f1f5f9);
		border-radius: var(--radius-md, 10px);
	}

	.filters-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.filters-label {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text, #0f172a);
	}

	.reset-filters-button {
		background: none;
		border: none;
		color: var(--color-primary);
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		padding: 4px 8px;
		transition: opacity 150ms ease;
	}

	.reset-filters-button:hover {
		opacity: 0.8;
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.filter-label {
		font-size: 12px;
		font-weight: 500;
		color: var(--color-text-muted, #64748b);
	}

	.filter-select {
		background: var(--color-bg, #fff);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: var(--radius-sm, 6px);
		padding: 8px 12px;
		font-size: 13px;
		color: var(--color-text, #0f172a);
		cursor: pointer;
		transition: border-color 150ms ease;
	}

	.filter-select:hover {
		border-color: var(--color-primary);
	}

	.filter-select:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.results-section {
		margin-top: 24px;
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

	.filtered-indicator {
		color: var(--color-text-muted, #64748b);
		font-weight: 400;
		font-size: 13px;
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

	.volume-cell {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.volume-value {
		font-weight: 600;
		color: var(--color-text, #0f172a);
		font-size: 13px;
	}

	.volume-na {
		color: var(--color-text-muted, #64748b);
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

	.difficulty-cell {
		text-align: center;
	}

	.difficulty-badge {
		display: inline-block;
		min-width: 32px;
		padding: 4px 8px;
		border-radius: var(--radius-sm, 6px);
		font-size: 11px;
		font-weight: 600;
	}

	.difficulty-badge.easy {
		background: rgba(34, 197, 94, 0.1);
		color: #22c55e;
	}

	.difficulty-badge.medium {
		background: rgba(251, 191, 36, 0.1);
		color: #f59e0b;
	}

	.difficulty-badge.hard {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
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

	.load-more-section {
		display: flex;
		justify-content: center;
		margin-top: 24px;
	}

	.load-more-button {
		background: var(--color-bg, #fff);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: var(--radius-md, 10px);
		padding: 12px 24px;
		font-size: 14px;
		font-weight: 500;
		color: var(--color-text, #0f172a);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.load-more-button:hover {
		background: var(--color-bg-muted, #f1f5f9);
		border-color: var(--color-primary);
		color: var(--color-primary);
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
