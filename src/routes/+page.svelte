<script lang="ts">
	import { Board } from '$lib/index.js';
	import Selection from './Selection.svelte';

	type Position = {
		x?: number;
		y?: number;
	};

	let board = $state(null);
	let lastEvent = $state('none');

	let singleTouchPan = $state(true);
	let doubleTouchPan = $state(true);
	let mousePan = $state(true);
	let coords = $state({ x: 0, y: 0 });

	let longTapTimeout = $state<number | null>(null);
	let longTapDuration = 500;

	let x = $state(50);
	let y = $state(25);

	let b: any = null;

	let selecting = $state(false);
	let selection = $state<{ start: Position; end: Position }>({
		start: { x: 0, y: 0 },
		end: { x: 0, y: 0 }
	});

	let sel: any;

	function handlePanStart(e: any) {
		if (e.button === 2) {
			e.preventDefault();
			sel.enter(e);
		} if (e.touches?.length === 1) {
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
</script>

<section role="none" style="width: 100vw; height: 100dvh" oncontextmenu={handleContextMenu}>
	<Board
		scale={0.75}
		mousePan={!selecting}
		singleTouchPan={!selecting}
		{doubleTouchPan}
		onPanStart={handlePanStart}
		onPan={handlePan}
		onPanEnd={handlePanEnd}
		onWheel={() => (lastEvent = 'onWheel')}
		bind:x={x}
		bind:y={y}
		bind:this={b}
		bind:board={board}
		scaleBounds={{ min: 0.5, max: 3 }}
		bgScopes={[
			{
				scale: 1,
				size: 128,
				bg: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_28_64)"><rect width="32" height="32" fill="#000000F2"/><rect width="16" height="16" rx="3" fill="#121212"/><rect x="16" y="16" width="16" height="16" rx="3" fill="#121212"/></g><defs><clipPath id="clip0_28_64"><rect width="32" height="32" fill="white"/></clipPath></defs></svg>`
			}
		]}
	>
		<h1 style="position: absolute; left: {coords.x}px; top: {coords.y}px">
			coords: {coords.x.toFixed(2)} {coords.y.toFixed(2)}
			x {x.toFixed(2)}
			y {y.toFixed(2)}
		</h1>
		<div style="display: flex; flex-direction: column; align-items: start; gap: 0.5rem;">
			<p>Last event: {lastEvent}</p>
			<label><input type="checkbox" bind:checked={singleTouchPan}> singleTouchPan</label>
			<label><input type="checkbox" bind:checked={doubleTouchPan}> doubleTouchPan</label>
			<label><input type="checkbox" bind:checked={mousePan}> mousePan</label>
		</div>
	</Board>
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