<script>
	let {
		title = '',
		subtitle = '',
		class: className = '',
		children
	} = $props();
</script>

<figure class="novel-graphic {className}">
	<div class="novel-graphic__card">
		{#if title}
			<div class="novel-graphic__header">
				<h4 class="novel-graphic__title">{title}</h4>
				{#if subtitle}
					<p class="novel-graphic__subtitle">{subtitle}</p>
				{/if}
			</div>
		{/if}
		<div class="novel-graphic__content">
			{@render children()}
		</div>
	</div>
</figure>
