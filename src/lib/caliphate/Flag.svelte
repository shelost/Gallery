<script>
	/** @type {{ id: 'us' | 'cn' | 'ir' | 'gr' | 'jp' | 'kr' | 'kp' | 'sa' | 'sun' | 'rising' | 'kaviani' | 'qing' | 'roc' | 'umayyad' | 'unity' | 'vexillum' | 'thirteen' | 'falcon' | 'arsacid' }} */
	let { id } = $props();
</script>

<svg class="flag" viewBox="0 0 30 20" aria-hidden="true">
	{#if id === 'us'}
		<rect width="30" height="20" fill="#b22234" />
		{#each [1, 3, 5, 7, 9, 11] as y (y)}
			<rect y={y * (20 / 13)} width="30" height={20 / 13} fill="#fff" />
		{/each}
		<rect width="12.6" height="10.77" fill="#3c3b6e" />
		{#each [1, 2, 3, 4, 5] as row (row)}
			{#each row % 2 ? [0, 1, 2, 3, 4] : [0, 1, 2, 3] as col (col)}
				<circle
					cx={1.3 + col * 2.2 + (row % 2 ? 0 : 1.1)}
					cy={1.15 + (row - 1) * 1.9}
					r="0.42"
					fill="#fff"
				/>
			{/each}
		{/each}
	{:else if id === 'cn'}
		<rect width="30" height="20" fill="#de2910" />
		<polygon points="5,2.2 5.7,4.3 7.9,4.3 6.1,5.6 6.8,7.7 5,6.4 3.2,7.7 3.9,5.6 2.1,4.3 4.3,4.3" fill="#ffde00" />
		<polygon points="10.2,1.6 10.5,2.5 11.4,2.5 10.7,3.1 11,4 10.2,3.4 9.4,4 9.7,3.1 9,2.5 9.9,2.5" fill="#ffde00" />
		<polygon points="11.6,3.6 11.9,4.5 12.8,4.5 12.1,5.1 12.4,6 11.6,5.4 10.8,6 11.1,5.1 10.4,4.5 11.3,4.5" fill="#ffde00" />
		<polygon points="11.6,6.4 11.9,7.3 12.8,7.3 12.1,7.9 12.4,8.8 11.6,8.2 10.8,8.8 11.1,7.9 10.4,7.3 11.3,7.3" fill="#ffde00" />
		<polygon points="10.2,8.4 10.5,9.3 11.4,9.3 10.7,9.9 11,10.8 10.2,10.2 9.4,10.8 9.7,9.9 9,9.3 9.9,9.3" fill="#ffde00" />
	{:else if id === 'ir'}
		<rect width="30" height="6.67" fill="#239f40" />
		<rect y="6.67" width="30" height="6.66" fill="#fff" />
		<rect y="13.33" width="30" height="6.67" fill="#da0000" />
		<path
			d="M15 7.1c1.6 0 2.6 1.1 2.6 2.5 0 1.5-1.2 2.2-2.6 3.2-1.4-1-2.6-1.7-2.6-3.2 0-1.4 1-2.5 2.6-2.5z"
			fill="#da0000"
		/>
	{:else if id === 'gr'}
		<rect width="30" height="20" fill="#0d5eaf" />
		{#each [1, 3, 5, 7] as band (band)}
			<rect y={band * 2.222} width="30" height="2.222" fill="#fff" />
		{/each}
		<rect width="11.1" height="11.1" fill="#0d5eaf" />
		<rect x="4.6" width="1.9" height="11.1" fill="#fff" />
		<rect y="4.6" width="11.1" height="1.9" fill="#fff" />
	{:else if id === 'jp'}
		<rect width="30" height="20" fill="#fff" />
		<circle cx="15" cy="10" r="5.2" fill="#bc002d" />
	{:else if id === 'kr'}
		<rect width="30" height="20" fill="#fff" />
		<circle cx="15" cy="10" r="4.2" fill="#cd2e3a" />
		<path d="M15 5.8a4.2 4.2 0 0 1 0 8.4 2.1 2.1 0 0 1 0-4.2 2.1 2.1 0 0 0 0-4.2z" fill="#0047a0" />
		<g fill="#111" stroke="#111" stroke-width="0.45" stroke-linecap="round">
			<path d="M5.2 4.2l3.2 2.2M5.7 3.4l3.2 2.2M6.2 2.6l3.2 2.2" />
			<path d="M21.2 14.2l3.2 2.2M21.7 13.4l3.2 2.2M20.7 15l3.2 2.2" />
			<path d="M21.4 4.4l3.2-2.2M21.9 5.2l3.2-2.2M22.4 6l3.2-2.2" />
			<path d="M4.6 16.2l3.2-2.2M5.1 17l3.2-2.2M4.1 15.4l3.2-2.2" />
		</g>
	{:else if id === 'kp'}
		<rect width="30" height="20" fill="#024fa2" />
		<rect y="3" width="30" height="14" fill="#fff" />
		<rect y="4" width="30" height="12" fill="#ed1c27" />
		<circle cx="11" cy="10" r="3.1" fill="#fff" />
		<polygon points="11,7.6 11.7,9.4 13.6,9.4 12.1,10.5 12.7,12.3 11,11.2 9.3,12.3 9.9,10.5 8.4,9.4 10.3,9.4" fill="#ed1c27" />
	{:else if id === 'sun'}
		<rect width="30" height="20" fill="#9a1b1b" />
		<g fill="#f0c14a" transform="translate(15 10)">
			<polygon points="0,-6.4 0.55,-1.7 0,-0.2" transform="rotate(0)" />
			<polygon points="0,-6.4 0.55,-1.7 0,-0.2" transform="rotate(22.5)" />
			<polygon points="0,-6.4 0.55,-1.7 0,-0.2" transform="rotate(45)" />
			<polygon points="0,-6.4 0.55,-1.7 0,-0.2" transform="rotate(67.5)" />
			<polygon points="0,-6.4 0.55,-1.7 0,-0.2" transform="rotate(90)" />
			<polygon points="0,-6.4 0.55,-1.7 0,-0.2" transform="rotate(112.5)" />
			<polygon points="0,-6.4 0.55,-1.7 0,-0.2" transform="rotate(135)" />
			<polygon points="0,-6.4 0.55,-1.7 0,-0.2" transform="rotate(157.5)" />
			<polygon points="0,-6.4 0.55,-1.7 0,-0.2" transform="rotate(180)" />
			<polygon points="0,-6.4 0.55,-1.7 0,-0.2" transform="rotate(202.5)" />
			<polygon points="0,-6.4 0.55,-1.7 0,-0.2" transform="rotate(225)" />
			<polygon points="0,-6.4 0.55,-1.7 0,-0.2" transform="rotate(247.5)" />
			<polygon points="0,-6.4 0.55,-1.7 0,-0.2" transform="rotate(270)" />
			<polygon points="0,-6.4 0.55,-1.7 0,-0.2" transform="rotate(292.5)" />
			<polygon points="0,-6.4 0.55,-1.7 0,-0.2" transform="rotate(315)" />
			<polygon points="0,-6.4 0.55,-1.7 0,-0.2" transform="rotate(337.5)" />
			<circle r="1.7" />
		</g>
	{:else if id === 'rising'}
		<rect width="30" height="20" fill="#fff" />
		<g fill="#bc002d">
			<polygon points="8,10 30,0 30,2.4" />
			<polygon points="8,10 30,3.6 30,6" />
			<polygon points="8,10 30,7.2 30,9.6" />
			<polygon points="8,10 30,10.4 30,12.8" />
			<polygon points="8,10 30,14 30,16.4" />
			<polygon points="8,10 30,17.6 30,20" />
			<polygon points="8,10 0,0 2.2,0" />
			<polygon points="8,10 0,20 2.2,20" />
			<circle cx="8" cy="10" r="3.3" />
		</g>
	{:else if id === 'kaviani'}
		<rect width="30" height="20" fill="#5c1a3a" />
		<polygon points="15,3.2 16.3,7.2 20.5,7.2 17.1,9.6 18.4,13.6 15,11.2 11.6,13.6 12.9,9.6 9.5,7.2 13.7,7.2" fill="#e6c36a" />
		<path d="M8 16.2h14M10 17.6h10" stroke="#e6c36a" stroke-width="0.7" />
	{:else if id === 'qing'}
		<rect width="30" height="20" fill="#ffde00" />
		<path d="M5 13c2.4-4.2 4.2-1.2 6.4-4.4 1.6 3.2 3.4 1 5.6-2.2 1.2 2.6 3.2.6 5.2-1.6" fill="none" stroke="#143a86" stroke-width="1.35" stroke-linecap="round" />
		<circle cx="23.2" cy="5.2" r="1.15" fill="#c8102e" />
	{:else if id === 'roc'}
		<rect width="30" height="20" fill="#e23a3a" />
		<rect width="15" height="10" fill="#003399" />
		<g fill="#fff" transform="translate(7.5 5)">
			<polygon points="0,-3.1 0.45,-0.9 0,0" transform="rotate(0)" />
			<polygon points="0,-3.1 0.45,-0.9 0,0" transform="rotate(30)" />
			<polygon points="0,-3.1 0.45,-0.9 0,0" transform="rotate(60)" />
			<polygon points="0,-3.1 0.45,-0.9 0,0" transform="rotate(90)" />
			<polygon points="0,-3.1 0.45,-0.9 0,0" transform="rotate(120)" />
			<polygon points="0,-3.1 0.45,-0.9 0,0" transform="rotate(150)" />
			<polygon points="0,-3.1 0.45,-0.9 0,0" transform="rotate(180)" />
			<polygon points="0,-3.1 0.45,-0.9 0,0" transform="rotate(210)" />
			<polygon points="0,-3.1 0.45,-0.9 0,0" transform="rotate(240)" />
			<polygon points="0,-3.1 0.45,-0.9 0,0" transform="rotate(270)" />
			<polygon points="0,-3.1 0.45,-0.9 0,0" transform="rotate(300)" />
			<polygon points="0,-3.1 0.45,-0.9 0,0" transform="rotate(330)" />
			<circle r="0.85" />
		</g>
	{:else if id === 'umayyad'}
		<rect width="30" height="20" fill="#f7f4ee" />
		<rect x="0.6" y="0.6" width="28.8" height="18.8" fill="none" stroke="#1c1b18" stroke-width="0.7" />
	{:else if id === 'unity'}
		<rect width="30" height="20" fill="#fff" />
		<path d="M16.2 2.2l1.5 1.6-0.4 2.2 1.6 1.4-0.3 2.4 1.1 2.2-1.6 2.6-1.5-1.2-0.2-2.2-1.5-1.6 0.6-2.4-1.2-1.8 1.5-1.2z" fill="#3d7ab5" />
	{:else if id === 'vexillum'}
		<rect width="30" height="20" fill="#8e1d2c" />
		<rect x="6" width="1.3" height="20" fill="#e6c36a" />
		<circle cx="16.5" cy="8.2" r="2.3" fill="#e6c36a" />
		<path d="M14.6 10.2l1.9 3.4 1.9-3.4" fill="#e6c36a" />
	{:else if id === 'thirteen'}
		<rect width="30" height="20" fill="#b22234" />
		{#each [1, 3, 5, 7, 9, 11] as y (y)}
			<rect y={y * (20 / 13)} width="30" height={20 / 13} fill="#fff" />
		{/each}
		<rect width="12" height="10.8" fill="#3c3b6e" />
		<circle cx="6" cy="5.4" r="3.1" fill="none" stroke="#fff" stroke-width="0.45" />
		{#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as i (i)}
			<circle cx={6 + Math.cos((i / 13) * Math.PI * 2) * 2.5} cy={5.4 + Math.sin((i / 13) * Math.PI * 2) * 2.5} r="0.38" fill="#fff" />
		{/each}
	{:else if id === 'falcon'}
		<rect width="30" height="20" fill="#7a1c2e" />
		<path d="M8 13c3-6 5-6 7-2 2-4 4-4 7 2-3-1-4 1-7 1s-4-2-7-1z" fill="#e6c36a" />
	{:else if id === 'arsacid'}
		<rect width="30" height="20" fill="#1d3a4a" />
		<polygon points="15,3.4 16.1,7.4 20.3,7.4 16.9,9.8 18.1,13.8 15,11.4 11.9,13.8 13.1,9.8 9.7,7.4 13.9,7.4" fill="#e6c36a" />
	{:else}
		<rect width="30" height="20" fill="#006c35" />
		<path d="M4 14.6h22" stroke="#fff" stroke-width="1.1" />
		<path d="M7 11.5c4-3.4 12-3.4 16 0" fill="none" stroke="#fff" stroke-width="0.9" />
	{/if}
</svg>

<style>
	.flag {
		display: inline-block;
		width: 1.15rem;
		height: auto;
		margin-right: 0.35rem;
		vertical-align: -0.12em;
		border-radius: 2px;
		box-shadow: 0 0 0 1px rgb(0 0 0 / 0.28);
	}
</style>
