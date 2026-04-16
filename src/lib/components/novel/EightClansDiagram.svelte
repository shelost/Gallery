<script>
	import { onMount } from 'svelte';
	import InlineGraphic from './InlineGraphic.svelte';

	const clans = [
		{ char: '沙宅', name: 'Satek', color: '#e8c840' },
		{ char: '眞牟', name: 'Jinmo', color: '#e8c840' },
		{ char: '燕比', name: 'Yunbi', color: '#e8c840' },
		{ char: '木荔', name: 'Mokli', color: '#e8c840' },
		{ char: '解', name: 'Hae', color: '#d4897a' },
		{ char: '白', name: 'Back', color: '#e0e0e0' },
		{ char: '國', name: 'Guk', color: '#6dbf8b' },
		{ char: '安', name: 'Ahn', color: '#d4897a' }
	];

	let gridEl = $state(null);

	onMount(async () => {
		const gsapModule = await import('gsap');
		const { ScrollTrigger } = await import('gsap/ScrollTrigger');
		const gsap = gsapModule.gsap;
		gsap.registerPlugin(ScrollTrigger);

		if (!gridEl) return;

		const tablets = gridEl.querySelectorAll('.clan-tablet');
		const titleEl = gridEl.querySelector('.clan-title-block');

		gsap.set(tablets, { opacity: 0, scale: 0.8, y: 15 });
		if (titleEl) gsap.set(titleEl, { opacity: 0, y: -10 });

		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: gridEl,
				start: 'top 80%',
				once: true
			}
		});

		if (titleEl) {
			tl.to(titleEl, {
				opacity: 1,
				y: 0,
				duration: 0.45,
				ease: 'power2.out'
			});
		}

		tl.to(
			tablets,
			{
				opacity: 1,
				scale: 1,
				y: 0,
				duration: 0.4,
				stagger: {
					amount: 0.5,
					grid: [2, 4],
					from: 'start'
				},
				ease: 'back.out(1.4)'
			},
			'-=0.2'
		);

		return () => {
			tl.kill();
		};
	});
</script>

<InlineGraphic>
	<div class="clan-wrapper" bind:this={gridEl}>
		<div class="clan-title-block">
			<h4 class="clan-title">Eight Great Clans</h4>
			<p class="clan-subtitle">대성팔족</p>
		</div>

		<div class="clan-grid">
			{#each clans as clan}
				<div class="clan-tablet">
					<div class="clan-tablet__card">
						<span class="clan-tablet__char" style="color: {clan.color}">
							{clan.char}
						</span>
					</div>
					<span class="clan-tablet__name">{clan.name}</span>
					<span class="clan-tablet__role">Clan</span>
				</div>
			{/each}
		</div>
	</div>
</InlineGraphic>

<style lang="scss">
	.clan-wrapper {
		width: 100%;
	}

	.clan-title-block {
		text-align: center;
		margin-bottom: 1.25rem;
	}

	.clan-title {
		font-family: 'DM Sans', 'Inter', sans-serif;
		font-size: 1.3rem;
		font-weight: 700;
		color: #e8e6f0;
		margin: 0 0 2px;
		letter-spacing: -0.01em;
	}

	.clan-subtitle {
		font-family: 'Noto Sans KR', sans-serif;
		font-size: 0.9rem;
		color: #e8c840;
		margin: 0;
		font-weight: 600;
	}

	.clan-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.75rem 0.6rem;
		max-width: 420px;
		margin: 0 auto;
	}

	.clan-tablet {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.clan-tablet__card {
		width: 100%;
		aspect-ratio: 3 / 4;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: border-color 0.2s;
	}

	.clan-tablet__card:hover {
		border-color: rgba(255, 255, 255, 0.25);
	}

	.clan-tablet__char {
		font-family: 'Noto Sans KR', 'Noto Sans CJK', serif;
		font-size: 1.3rem;
		font-weight: 800;
		line-height: 1.15;
		text-align: center;
	}

	.clan-tablet__name {
		font-family: 'DM Sans', 'Inter', sans-serif;
		font-size: 0.68rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.85);
		letter-spacing: 0.02em;
	}

	.clan-tablet__role {
		font-family: 'DM Sans', 'Inter', sans-serif;
		font-size: 0.55rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.35);
		letter-spacing: 0.06em;
		margin-top: -2px;
	}

	@media (max-width: 420px) {
		.clan-grid {
			grid-template-columns: repeat(4, 1fr);
			gap: 0.6rem 0.5rem;
		}

		.clan-tablet__char {
			font-size: 1rem;
		}

		.clan-tablet__name {
			font-size: 0.6rem;
		}
	}
</style>
