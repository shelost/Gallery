<script>
	import { onMount } from 'svelte';
	import InlineGraphic from './InlineGraphic.svelte';

	const tiers = [
		{ label: 'Slaves', color: '#5a5868', icon: '▬', rank: '' },
		{ label: '1st Rank', color: '#6e6c7a', icon: '○', rank: '1' },
		{ label: '2nd Rank', color: '#7d7b8c', icon: '◇', rank: '2' },
		{ label: '3rd Rank', color: '#8a889d', icon: '△', rank: '3' },
		{ label: '4th Rank', color: '#9b8fb8', icon: '☗', rank: '4' },
		{ label: '5th Rank', color: '#8b7cca', icon: '⬠', rank: '5' },
		{ label: '6th Rank', color: '#7b6bbe', icon: '⬡', rank: '6' }
	];

	const elites = [
		{ label: 'Nobles', color: '#6dbf6d', icon: '▲' },
		{ label: 'Royals', color: '#e8c840', icon: '♛' }
	];

	let pyramidEl = $state(null);

	onMount(async () => {
		const gsapModule = await import('gsap');
		const { ScrollTrigger } = await import('gsap/ScrollTrigger');
		const gsap = gsapModule.gsap;
		gsap.registerPlugin(ScrollTrigger);

		if (!pyramidEl) return;

		const tierEls = pyramidEl.querySelectorAll('.bone-tier');
		const eliteEls = pyramidEl.querySelectorAll('.bone-elite');
		const titleEl = pyramidEl.querySelector('.bone-title-block');

		gsap.set([...tierEls, ...eliteEls], { opacity: 0, y: 20 });
		if (titleEl) gsap.set(titleEl, { opacity: 0, x: 20 });

		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: pyramidEl,
				start: 'top 80%',
				once: true
			}
		});

		tl.to(tierEls, {
			opacity: 1,
			y: 0,
			duration: 0.4,
			stagger: 0.1,
			ease: 'power2.out'
		});

		tl.to(
			eliteEls,
			{
				opacity: 1,
				y: 0,
				duration: 0.45,
				stagger: 0.15,
				ease: 'back.out(1.4)'
			},
			'-=0.15'
		);

		if (titleEl) {
			tl.to(
				titleEl,
				{
					opacity: 1,
					x: 0,
					duration: 0.5,
					ease: 'power2.out'
				},
				'-=0.5'
			);
		}

		return () => {
			tl.kill();
		};
	});
</script>

<InlineGraphic>
	<div class="bone-pyramid" bind:this={pyramidEl}>
		<div class="bone-layout">
			<div class="bone-stack">
				<div class="bone-elites">
					{#each elites as elite, i}
						<div class="bone-elite" style="--c: {elite.color}">
							<span class="bone-elite__icon">{elite.icon}</span>
							<span class="bone-elite__label">{elite.label}</span>
						</div>
					{/each}
					<svg class="bone-connector" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M20 0 L30 38" stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="3 3" />
						<path d="M40 0 L30 38" stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="3 3" />
					</svg>
				</div>

				{#each [...tiers].reverse() as tier, i}
					{@const widthPercent = 40 + i * 9}
					<div
						class="bone-tier"
						style="
							--bg: {tier.color};
							--w: {widthPercent}%;
						"
					>
						<span class="bone-tier__icon">{tier.icon}</span>
						<span class="bone-tier__label">{tier.label}</span>
					</div>
				{/each}
			</div>

			<div class="bone-title-block">
				<h4 class="bone-title">Bone Ranks</h4>
				<p class="bone-subtitle">골품제</p>
			</div>
		</div>
	</div>
</InlineGraphic>

<style lang="scss">
	.bone-pyramid {
		width: 100%;
	}

	.bone-layout {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		gap: 2rem;
	}

	.bone-stack {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
		flex: 1;
		max-width: 320px;
	}

	.bone-elites {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		margin-bottom: 4px;
		position: relative;
	}

	.bone-connector {
		width: 60px;
		height: 32px;
		display: block;
	}

	.bone-elite {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.bone-elite__icon {
		font-size: 1rem;
		color: var(--c);
	}

	.bone-elite__label {
		font-family: 'DM Sans', 'Inter', sans-serif;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--c);
		letter-spacing: 0.03em;
	}

	.bone-tier {
		width: var(--w);
		background: var(--bg);
		border-radius: 6px;
		padding: 6px 0;
		margin-top: -1px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		transition: transform 0.15s ease;
		clip-path: polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%);
	}

	.bone-tier__icon {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.bone-tier__label {
		font-family: 'DM Sans', 'Inter', sans-serif;
		font-size: 0.65rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		letter-spacing: 0.04em;
	}

	.bone-title-block {
		text-align: right;
		padding-top: 0.5rem;
		flex-shrink: 0;
	}

	.bone-title {
		font-family: 'DM Sans', 'Inter', sans-serif;
		font-size: 1.4rem;
		font-weight: 700;
		color: #8b9fcc;
		margin: 0;
		letter-spacing: -0.01em;
	}

	.bone-subtitle {
		font-family: 'Noto Sans KR', sans-serif;
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.35);
		margin: 2px 0 0;
	}

	@media (max-width: 500px) {
		.bone-layout {
			flex-direction: column;
			align-items: center;
			gap: 1rem;
		}

		.bone-title-block {
			text-align: center;
			order: -1;
			padding-top: 0;
		}

		.bone-stack {
			max-width: 260px;
		}
	}
</style>
