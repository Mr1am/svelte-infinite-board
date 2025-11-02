<script lang="ts">
	import { Board, type Node } from '$lib/index.js';
	import Selection from './Selection.svelte';
	import SelectionRange from './SelectionRange.svelte';
	import { useUndoRedo } from './history.svelte.js';

	type Position = {
		x?: number;
		y?: number;
	};

	let board = $state(null);
	let lastEvent = $state('none');

	let singleTouchPan = $state(true);
	let doubleTouchPan = $state(true);
	let mousePan = $state(false);
	let coords = $state({ x: 0, y: 0 });

	let longTapTimeout = $state<number | null>(null);
	let longTapDuration = 500;
	let selectedNodes = $state<Node[]>([]);

	let x = $state(50);
	let y = $state(25);

	let b: any = null;

	let nodes = $state<Node[]>([
		{ id: '1', x: 100, y: 100, w: 80, h: 60 },
		{ id: '2', x: 250, y: 150, w: 100, h: 80 },
		{ id: '3', x: 400, y: 300, w: 120, h: 40 },
		{ id: '4', x: 50, y: 400, w: 60, h: 60 }
	]);

	let selecting = $state(false);
	let selection = $state<{ start: Position; end: Position }>({
		start: { x: 0, y: 0 },
		end: { x: 0, y: 0 }
	});

	function getElementsUnderEvent(event: MouseEvent | TouchEvent): HTMLElement[] {
		if (typeof document === 'undefined') return [];

		let x: number, y: number;

		if (event instanceof MouseEvent) {
			x = event.clientX;
			y = event.clientY;
		} else if (event.touches[0]) {
			x = event.touches[0].clientX;
			y = event.touches[0].clientY;
		} else {
			return [];
		}

		const elements = document.elementsFromPoint(x, y);
		return elements.filter((el): el is HTMLElement => el instanceof HTMLElement);
	}

	let sel: any;

	const { push, undo, redo, canUndo, canRedo } = useUndoRedo({ nodes, selectedNodes });

	function handlePanStart(e: any) {
		if (e.button === 2) {
			e.preventDefault();
			sel.enter(e);
		}
		if (e.touches?.length === 1) {
			longTapTimeout = setTimeout(() => {
				sel.enter(e);
			}, longTapDuration) as any;
		}
	}

	function handlePan(e: any) {
		if (selecting) {
			sel.update(e);
		}
		if (longTapTimeout !== null) {
			clearTimeout(longTapTimeout);
			longTapTimeout = null;
		}
	}

	function handlePanEnd(e: any) {
		if (selecting) sel.end();

		if (longTapTimeout !== null) {
			clearTimeout(longTapTimeout);
			longTapTimeout = null;
		}
	}

	function handleContextMenu(e: MouseEvent) {
		if (selecting) e.preventDefault();
	}

	let scale = $state(0.75);

	function handleNodeClick(e: MouseEvent | TouchEvent, node: Node) {
		e.stopPropagation();

		const isTouch = e.type.startsWith('touch');
		const isCtrl = (e as MouseEvent).ctrlKey || (e as MouseEvent).metaKey;

		let newSelected: Node[] = [];

		if (!isTouch && isCtrl) {
			newSelected = selectedNodes.includes(node)
				? selectedNodes.filter((n) => n !== node)
				: [...selectedNodes, node];
		} else if (isTouch && selectedNodes.length > 1) {
			newSelected = selectedNodes.includes(node)
				? selectedNodes.filter((n) => n !== node)
				: [...selectedNodes, node];
		} else if (isTouch && selectedNodes.length === 1 && selectedNodes[0] !== node) {
			newSelected = [node];
		} else if (!isTouch && selectedNodes.includes(node) && selectedNodes.length > 1) {
			newSelected = selectedNodes.filter((n) => n !== node);
		} else {
			newSelected = [node];
		}

		applySelection(newSelected);
	}

	function applySelection(newSelected: Node[]) {
		const prevSelected = [...selectedNodes];
		const prevNodes = [...nodes];

		push({
			undo: () => {
				selectedNodes = prevSelected;
				nodes = prevNodes;
			},
			redo: () => {
				selectedNodes = newSelected;
			}
		});

		selectedNodes = newSelected;
	}
</script>

<section role="none" style="width: 100vw; height: 100dvh" oncontextmenu={handleContextMenu}>
	<Board
		bind:scale
		{mousePan}
		singleTouchPan={!selecting}
		{doubleTouchPan}
		onPanStart={handlePanStart}
		onPan={handlePan}
		onPanEnd={handlePanEnd}
		onClick={(e) => console.log(e)}
		onWheel={() => (lastEvent = 'onWheel')}
		bind:x
		bind:y
		bind:this={b}
		bind:board
		scaleBounds={{ min: 0.5, max: 3 }}
		bgScopes={[
			{
				scale: 1,
				size: 128,
				bg: `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_28_64)"><rect width="32" height="32" fill="#000000F2"/><rect width="16" height="16" rx="3" fill="#121212"/><rect x="16" y="16" width="16" height="16" rx="3" fill="#121212"/></g><defs><clipPath id="clip0_28_64"><rect width="32" height="32" fill="white"/></clipPath></defs></svg>`
			}
		]}
	>
		<h1 style="position: absolute; left: {coords.x}px; top: {coords.y}px">
			x {x.toFixed(2)}, y {y.toFixed(2)}
		</h1>
		<div style="display: flex; flex-direction: column; align-items: start; gap: 0.5rem;">
			<p>Last event: {lastEvent}</p>
			<label><input type="checkbox" bind:checked={singleTouchPan} /> singleTouchPan</label>
			<label><input type="checkbox" bind:checked={doubleTouchPan} /> doubleTouchPan</label>
			<label><input type="checkbox" bind:checked={mousePan} /> mousePan</label>
		</div>
		{#each nodes as node}
			<div
				style="
					position: absolute;
					left: {node.x}px;
					top: {node.y}px;
					width: {node.w}px;
					height: {node.h}px;
					background: #111;
					color: white;
					display: flex;
					align-items: center;
					justify-content: center;
					border: 1px solid #333;
					border-radius: 1rem;
				"
				data-id={node.id}
				data-node
				onclick={(e) => handleNodeClick(e, node)}
				ontouchstart={(e) => handleNodeClick(e, node)}
			>
				{node.id}
			</div>
		{/each}
		<SelectionRange
			{selection}
			{nodes}
			board={b}
			mode="partial"
			bind:selectedNodes
			pushHistory={(nodes) => applySelection(nodes)}
		/>
	</Board>
	<div
		style="position: fixed; top: 20px; left: 20px; width: 500px; height: 100px; background: #1a1a1a"
	></div>
	<Selection
		board={b}
		bind:selecting
		bind:selection
		bind:this={sel}
		scroll={{ threshold: 50, speed: 15 }}
	/>
</section>

<style>
	:global(body) {
		margin: 0;
		height: 100dvh;
		width: 100vw;
		overflow: hidden;
		color: white;
		font-family: sans-serif;
		user-select: none;
		background: rgba(0, 0, 0, 0.95);
	}

	* {
		text-rendering: optimizeSpeed;
	}
</style>
