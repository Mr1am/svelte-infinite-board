<script lang="ts">
	import type { Node } from '$lib/index.js';

	let {
		selection,
		nodes,
		board,
		mode = 'partial',
		selectedNodes = $bindable<Node[]>([])
	} = $props<{
		selection: { start: { x: number; y: number } | null; end: { x: number; y: number } | null };
		nodes: Node[];
		board: any;
		mode: 'full' | 'partial';
		selectedNodes?: Node[];
	}>();

	$effect(() => {
		if (!selection.start || !selection.end) {
			return;
		}

		const rect = {
			left: Math.min(selection.start.x, selection.end.x),
			top: Math.min(selection.start.y, selection.end.y),
			right: Math.max(selection.start.x, selection.end.x),
			bottom: Math.max(selection.start.y, selection.end.y)
		};

		const fully: Node[] = [];
		const partial: Node[] = [];

		for (const node of nodes) {
			const n = {
				left: node.x,
				top: node.y,
				right: node.x + node.w,
				bottom: node.y + node.h
			};

			const fullyInside =
				rect.left <= n.left &&
				rect.top <= n.top &&
				rect.right >= n.right &&
				rect.bottom >= n.bottom;

			const intersects =
				rect.left < n.right && rect.right > n.left && rect.top < n.bottom && rect.bottom > n.top;

			if (fullyInside) fully.push(node);
			else if (intersects && mode === 'partial') partial.push(node);
		}

		selectedNodes = mode === 'full' ? fully : [...fully, ...partial];
	});

	let bounds = $derived.by(() => {
		if (selectedNodes.length === 0) return null;
		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;
		for (const n of selectedNodes) {
			minX = Math.min(minX, n.x);
			minY = Math.min(minY, n.y);
			maxX = Math.max(maxX, n.x + n.w);
			maxY = Math.max(maxY, n.y + n.h);
		}
		return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
	});

	let screenBounds = $derived.by(() => {
		if (!bounds || !board) return null;
		const p1 = {
			x: bounds.x,
			y: bounds.y
		};
		const p2 = {
			x: bounds.x + bounds.w,
			y: bounds.y + bounds.h
		};
		return { x: p1.x, y: p1.y, w: p2.x - p1.x, h: p2.y - p1.y };
	});
</script>

{#if screenBounds}
	<div
		class="selection-range"
		style="left:{screenBounds.x}px; top:{screenBounds.y}px; width:{screenBounds.w}px; height:{screenBounds.h}px;"
	>
		{#if selectedNodes.length === 1}
			{#each ['nw', 'ne', 'sw', 'se'] as dir}
				<div class="handler" data-dir={dir}></div>
			{/each}
		{/if}
	</div>
{/if}

{#if mode === 'partial' && selection.start && selection.end}
	{#each nodes as node}
		{#if !selectedNodes.includes(node)}
			{@const rect = {
				left: Math.min(selection.start.x, selection.end.x),
				top: Math.min(selection.start.y, selection.end.y),
				right: Math.max(selection.start.x, selection.end.x),
				bottom: Math.max(selection.start.y, selection.end.y)
			}}
			{@const intersects =
				rect.left < node.x + node.w &&
				rect.right > node.x &&
				rect.top < node.y + node.h &&
				rect.bottom > node.y}
			{#if intersects}
				{@const p1 = board.boardToScreen?.({ x: node.x, y: node.y }) ?? {
					x: node.x * board.scale + board.x,
					y: node.y * board.scale + board.y
				}}
				{@const p2 = board.boardToScreen?.({ x: node.x + node.w, y: node.y + node.h }) ?? {
					x: (node.x + node.w) * board.scale + board.x,
					y: (node.y + node.h) * board.scale + board.y
				}}
				<div
					class="partial-border"
					style="left:{p1.x}px; top:{p1.y}px; width:{p2.x - p1.x}px; height:{p2.y - p1.y}px;"
				></div>
			{/if}
		{/if}
	{/each}
{/if}

<style>
	.selection-range {
		position: fixed;
		border: 2px solid #4c8bff;
		background: rgba(76, 139, 255, 0.1);
		pointer-events: none;
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3) inset;
		border-radius: 0.5rem;
	}

	.handler {
		position: absolute;
		width: 8px;
		height: 8px;
		background: white;
		border: 1px solid #4c8bff;
		border-radius: 2px;
		transform: translate(-50%, -50%);
	}

	.handler[data-dir='nw'] {
		top: 0;
		left: 0;
	}
	.handler[data-dir='ne'] {
		top: 0;
		right: 0;
	}
	.handler[data-dir='sw'] {
		bottom: 0;
		left: 0;
	}
	.handler[data-dir='se'] {
		bottom: 0;
		right: 0;
	}

	.partial-border {
		position: fixed;
		border: 2px dashed #ff9800;
		pointer-events: none;
	}
</style>
