<script lang="ts">
	interface Props {
		status: 'pass' | 'warn' | 'fail';
		label?: string;
	}

	let { status, label }: Props = $props();

	const statusLabels = {
		pass: 'Pass',
		warn: 'Warn',
		fail: 'Fail'
	};
</script>

<span class="status-badge status-{status}">
	{label || statusLabels[status]}
</span>

<style>
	.status-badge {
		display: inline-flex;
		align-items: center;
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.status-pass {
		background: var(--color-success-light);
		color: var(--color-success);
	}

	.status-warn {
		background: var(--color-warning-light);
		color: var(--color-warning);
	}

	.status-fail {
		background: var(--color-danger-light);
		color: var(--color-danger);
	}
</style>
