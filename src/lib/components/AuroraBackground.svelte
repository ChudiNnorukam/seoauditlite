<script lang="ts">
	interface Props {
		animate?: boolean;
	}

	let { animate = true }: Props = $props();
</script>

<div class="aurora-container" aria-hidden="true">
	<div
		class="aurora-blur aurora-1"
		class:animate
	></div>
	<div
		class="aurora-blur aurora-2"
		class:animate
		style="animation-delay: -7s"
	></div>
	<div
		class="aurora-blur aurora-3"
		class:animate
		style="animation-delay: -14s"
	></div>
</div>

<style>
	.aurora-container {
		position: fixed;
		inset: 0;
		z-index: -1;
		overflow: hidden;
		pointer-events: none;
	}

	.aurora-blur {
		position: absolute;
		filter: blur(120px);
		border-radius: 100%;
	}

	.aurora-1 {
		width: 700px;
		height: 700px;
		background: var(--color-primary);
		top: -250px;
		left: -200px;
		opacity: 0.15;
	}

	.aurora-2 {
		width: 500px;
		height: 500px;
		background: var(--color-secondary);
		bottom: -150px;
		right: -150px;
		opacity: 0.12;
	}

	.aurora-3 {
		width: 400px;
		height: 400px;
		background: var(--color-primary);
		top: 40%;
		left: 50%;
		transform: translate(-50%, -50%);
		opacity: 0.08;
	}

	.animate {
		animation: aurora-float 20s ease-in-out infinite;
	}

	@keyframes aurora-float {
		0%, 100% { transform: translate(0, 0) scale(1); }
		33% { transform: translate(30px, -30px) scale(1.1); }
		66% { transform: translate(-20px, 20px) scale(0.95); }
	}

	.aurora-3.animate {
		animation: aurora-float-center 20s ease-in-out infinite;
	}

	@keyframes aurora-float-center {
		0%, 100% { transform: translate(-50%, -50%) scale(1); }
		33% { transform: translate(-45%, -55%) scale(1.1); }
		66% { transform: translate(-55%, -45%) scale(0.95); }
	}
</style>
