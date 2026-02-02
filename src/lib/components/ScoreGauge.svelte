<script lang="ts">
	interface Props {
		score: number;
		size?: 'sm' | 'md' | 'lg';
		showLabel?: boolean;
	}

	let { score, size = 'md', showLabel = true }: Props = $props();

	const sizes = {
		sm: { width: 100, stroke: 8, fontSize: 'text-2xl' },
		md: { width: 160, stroke: 12, fontSize: 'text-4xl' },
		lg: { width: 200, stroke: 14, fontSize: 'text-5xl' }
	};

	const config = $derived(sizes[size]);
	const radius = $derived((config.width - config.stroke) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const offset = $derived(circumference - (score / 100) * circumference);
</script>

<div class="score-gauge" style="width: {config.width}px; height: {config.width}px;">
	<svg class="gauge-ring" viewBox="0 0 {config.width} {config.width}">
		<!-- Background ring -->
		<circle
			cx={config.width / 2}
			cy={config.width / 2}
			r={radius}
			stroke="var(--glass-border)"
			stroke-width={config.stroke}
			fill="none"
		/>
		<!-- Score ring -->
		<circle
			cx={config.width / 2}
			cy={config.width / 2}
			r={radius}
			stroke="url(#scoreGradient)"
			stroke-width={config.stroke}
			fill="none"
			stroke-dasharray={circumference}
			stroke-dashoffset={offset}
			stroke-linecap="round"
			class="score-ring"
		/>
		<defs>
			<linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="var(--color-primary)" />
				<stop offset="100%" stop-color="var(--color-secondary)" />
			</linearGradient>
		</defs>
	</svg>
	<div class="gauge-center">
		<span class="score-value {config.fontSize}">{score}</span>
		{#if showLabel}
			<span class="score-label">/ 100</span>
		{/if}
	</div>
</div>

<style>
	.score-gauge {
		position: relative;
	}

	.gauge-ring {
		transform: rotate(-90deg);
	}

	.score-ring {
		transition: stroke-dashoffset 1s ease-out;
	}

	.gauge-center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.score-value {
		font-weight: 700;
		line-height: 1;
		color: var(--color-text);
	}

	.text-2xl { font-size: var(--text-2xl); }
	.text-4xl { font-size: var(--text-4xl); }
	.text-5xl { font-size: var(--text-5xl); }

	.score-label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin-top: 4px;
	}
</style>
