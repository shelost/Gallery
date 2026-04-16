<script>
	import { onMount } from 'svelte';
	import InlineGraphic from './InlineGraphic.svelte';

	const commanderies = [
		{ char: '東', label: 'East', labelKr: '동부' },
		{ char: '西', label: 'West', labelKr: '서부' },
		{ char: '內', label: 'Central', labelKr: '내부' },
		{ char: '南', label: 'South', labelKr: '남부' },
		{ char: '北', label: 'North', labelKr: '북부' }
	];

	let wrapperEl = $state(null);

	onMount(async () => {
		const gsapModule = await import('gsap');
		const { ScrollTrigger } = await import('gsap/ScrollTrigger');
		const gsap = gsapModule.gsap;
		gsap.registerPlugin(ScrollTrigger);

		if (!wrapperEl) return;

		const banners = wrapperEl.querySelectorAll('.cmd-banner');
		const figures = wrapperEl.querySelectorAll('.cmd-figure');
		const labels = wrapperEl.querySelectorAll('.cmd-label');
		const titleEl = wrapperEl.querySelector('.cmd-title-block');

		gsap.set(banners, { opacity: 0, y: -30, scaleY: 0.6, transformOrigin: 'top center' });
		gsap.set(figures, { opacity: 0, y: 15 });
		gsap.set(labels, { opacity: 0 });
		if (titleEl) gsap.set(titleEl, { opacity: 0, y: 15 });

		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: wrapperEl,
				start: 'top 80%',
				once: true
			}
		});

		tl.to(banners, {
			opacity: 1,
			y: 0,
			scaleY: 1,
			duration: 0.45,
			stagger: 0.12,
			ease: 'back.out(1.6)'
		});

		tl.to(
			figures,
			{
				opacity: 1,
				y: 0,
				duration: 0.4,
				stagger: 0.08,
				ease: 'power2.out'
			},
			'-=0.25'
		);

		tl.to(
			labels,
			{
				opacity: 1,
				duration: 0.3,
				stagger: 0.06
			},
			'-=0.3'
		);

		if (titleEl) {
			tl.to(
				titleEl,
				{
					opacity: 1,
					y: 0,
					duration: 0.5,
					ease: 'power2.out'
				},
				'-=0.3'
			);
		}

		return () => {
			tl.kill();
		};
	});
</script>

<InlineGraphic>
	<div class="cmd-wrapper" bind:this={wrapperEl}>
		<div class="cmd-row">
			{#each commanderies as cmd}
				<div class="cmd-col">
					<div class="cmd-banner">
						<svg class="cmd-banner__flag" viewBox="0 0 44 60" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M2 0H42V48L22 58L2 48V0Z" fill="#c0392b" />
							<path d="M2 0H42V48L22 58L2 48V0Z" fill="url(#bannerGrad)" />
							<text
								x="22"
								y="32"
								text-anchor="middle"
								dominant-baseline="central"
								fill="#fff"
								font-size="20"
								font-weight="700"
								font-family="'Noto Sans KR', sans-serif"
							>
								{cmd.char}
							</text>
							<defs>
								<linearGradient id="bannerGrad" x1="22" y1="0" x2="22" y2="60" gradientUnits="userSpaceOnUse">
									<stop offset="0" stop-color="rgba(255,255,255,0.1)" />
									<stop offset="1" stop-color="rgba(0,0,0,0.15)" />
								</linearGradient>
							</defs>
						</svg>
					</div>

					<div class="cmd-figure">
						<svg class="cmd-figure__icon" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg">
							<!-- head -->
							<circle cx="24" cy="12" r="8" fill="#9e9eaa" />
							<!-- body -->
							<path d="M12 26C12 22 17 20 24 20C31 20 36 22 36 26V38H12V26Z" fill="#8a8a96" />
							<!-- arms -->
							<rect x="8" y="24" width="6" height="14" rx="3" fill="#8a8a96" />
							<rect x="34" y="24" width="6" height="14" rx="3" fill="#8a8a96" />
							<!-- desk -->
							<rect x="6" y="40" width="36" height="4" rx="2" fill="#6b3a2a" />
							<rect x="4" y="44" width="40" height="3" rx="1" fill="#8b4a34" />
							<!-- desk legs -->
							<rect x="10" y="47" width="3" height="6" rx="1" fill="#6b3a2a" />
							<rect x="35" y="47" width="3" height="6" rx="1" fill="#6b3a2a" />
						</svg>
					</div>

					<span class="cmd-label">{cmd.label}</span>
				</div>
			{/each}
		</div>

		<div class="cmd-title-block">
			<p class="cmd-subtitle">오부</p>
			<h4 class="cmd-title">Five Commanderies</h4>
		</div>
	</div>
</InlineGraphic>

<style lang="scss">
	.cmd-wrapper {
		width: 100%;
	}

	.cmd-row {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 1rem;
		padding: 0 0.5rem;
	}

	.cmd-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		flex: 0 1 72px;
	}

	.cmd-banner__flag {
		width: 36px;
		height: auto;
		display: block;
		filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.25));
	}

	.cmd-figure__icon {
		width: 42px;
		height: auto;
		display: block;
	}

	.cmd-label {
		font-family: 'DM Sans', 'Inter', sans-serif;
		font-size: 0.62rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.55);
		letter-spacing: 0.05em;
		text-align: center;
	}

	.cmd-title-block {
		text-align: center;
		margin-top: 1.25rem;
	}

	.cmd-subtitle {
		font-family: 'Noto Sans KR', sans-serif;
		font-size: 0.95rem;
		color: rgba(255, 255, 255, 0.35);
		margin: 0 0 2px;
		font-weight: 600;
	}

	.cmd-title {
		font-family: 'DM Sans', 'Inter', sans-serif;
		font-size: 1.25rem;
		font-weight: 700;
		color: #e8e6f0;
		margin: 0;
		letter-spacing: -0.01em;
	}

	@media (max-width: 420px) {
		.cmd-row {
			gap: 0.5rem;
		}

		.cmd-col {
			flex: 0 1 56px;
		}

		.cmd-banner__flag {
			width: 28px;
		}

		.cmd-figure__icon {
			width: 34px;
		}

		.cmd-label {
			font-size: 0.55rem;
		}
	}
</style>
