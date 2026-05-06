<script>
	export let percentage = 0; // 0-100
	
	$: fillWidth = Math.max(0, Math.min(100, percentage));
	$: color = fillWidth >= 80 ? '#00D05C' : fillWidth >= 50 ? '#FFB800' : fillWidth >= 20 ? '#FF6B00' : '#FF3B30';
</script>

<div class="battery" title="{percentage}%">
	<div class="battery-body">
		<div class="battery-fill" style="width: {fillWidth}%; background-color: {color};">
		</div>
	</div>
	<div class="battery-terminal"></div>
</div>

<style>
	.battery {
		display: inline-flex;
		align-items: center;
		gap: 1px;
		width: 24px;
		height: 10px;
		display: none;
	}
	
	.battery-body {
		width: 20px;
		height: 100%;
		border: 2px solid black;
		border-radius: 4px;
		position: relative;
		overflow: hidden;
		background: rgba(0, 0, 0, 0.05);
	}
	
	.battery-fill {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		transition: width 0.3s ease, background-color 0.3s ease;
		border-radius: 1px;
	}
	
	.battery-terminal {
		width: 3px;
		height: 8px;
		background: black;
		border-radius: 0 1px 1px 0;
	}
</style>
