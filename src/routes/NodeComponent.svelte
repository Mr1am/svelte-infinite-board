<script lang="ts">
	export let node: {
		id: string;
		x: number;
		y: number;
		w: number;
		h: number;
		selected: boolean;
	};
</script>

<div
	class="node"
	class:selected={node.selected}
	style="
		position: absolute;
		left: {node.x}px;
		top: {node.y}px;
		width: {node.w}px;
		height: {node.h}px;
	"
	on:click
	on:touchstart|preventDefault
>
	{node.id}
</div>

<style>
	.node {
		background: #111;
		color: white;
		border: 1px solid #333;
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		transition: all 0.1s ease;
	}

	.node.selected {
		border: 2px solid #4c8bff;
		box-shadow: 0 0 0 1px rgba(76, 139, 255, 0.3);
		background: #1a1a1a;
	}
</style>