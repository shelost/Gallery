<script>
	/** @type {{ id: string }} */
	let { id } = $props();

	/** Real flags from Wikimedia Commons, not drawings. */
	const FILES = {
		us: 'us.png',
		cn: 'cn.png',
		jp: 'jp.png',
		kr: 'kr.png',
		kp: 'kp.png',
		gr: 'gr.png',
		ir: 'ir.png',
		sa: 'sa.png',
		eu: 'eu.png',
		roc: 'roc.png',
		qing: 'qing.png',
		rising: 'rising.png',
		sun: 'sun.png',
		thirteen: 'thirteen.png',
		unity: 'unity.png',
		umayyad: 'umayyad.png',
		vexillum: 'vexillum.png',
		falcon: 'falcon.png',
		kaviani: 'kaviani.png',
		arsacid: 'falcon.png',
		uk: 'uk.png',
		fr: 'fr.png',
		ru: 'ru.png'
	};

	const file = $derived(FILES[id] ?? 'us.png');
</script>

<img class="flag" src="/blog/caliphate/flags/{file}" alt="" width="20" height="14" />

<style>
	.flag {
		display: inline-block;
		flex: none;
		width: 1.28em;
		height: 0.86em;
		max-width: 1.28em;
		max-height: 0.86em;
		margin: 0 0.35em 0 0;
		padding: 0;
		vertical-align: -0.12em;
		object-fit: cover;
		object-position: center;
		border-radius: 2px;
		box-shadow: 0 0 0 1px rgb(0 0 0 / 0.28);
		background: var(--paper-2, #ece9e1);
	}
</style>
