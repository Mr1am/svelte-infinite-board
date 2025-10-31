<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { expoOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { flyOut } from 'svelte-fancy-transitions';

	let {
		board,
		selecting = $bindable(false),
		selection = $bindable({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }),
		screenSelectionTween = { duration: 200, easing: expoOut },
		screenSelection = new Tween({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }, screenSelectionTween),
		scroll = { threshold: 65, speed: 10 },
		...rest
	} = $props<{
		board: any;
		selecting: boolean;
		selection?: Selection;
		screenSelectionTween?: import('svelte/motion').TweenedOptions<{
			start: { x: number; y: number };
			end: { x: number; y: number };
		}>;
		screenSelection?: Selection;
		scroll?: ScrollOptions;
	}>();

	type ScrollOptions = {
		threshold?: number;
		speed?: number;
	};

	type Position = {
		x?: number;
		y?: number;
	};

	type Selection = {
		start?: Position;
		end?: Position;
	};

	let vel = new Tween({ x: 0, y: 0 }, { duration: 500 });
	let autoScrollRaf = $state<number | null>(null);

	$effect(() => {
		if (!selecting) return;
		let { scale, x, y } = board.view();

		const start = board.boardToScreen?.({ x: selection.start.x, y: selection.start.y }) ?? {
			x: selection.start.x * scale + x,
			y: selection.start.y * scale + y
		};
		const end = board.boardToScreen?.({ x: selection.end.x, y: selection.end.y }) ?? {
			x: selection.end.x * scale + x,
			y: selection.end.y * scale + y
		};

		screenSelection.target = {
			start: {
				x: Math.min(start.x, end.x),
				y: Math.min(start.y, end.y)
			},
			end: {
				x: Math.abs(end.x - start.x),
				y: Math.abs(end.y - start.y)
			}
		};
	});

	export function enter(e: MouseEvent | TouchEvent) {
		if (!board || selecting) return;

		selecting = true;
		const pos = board.getEventPosition(e);
		selection.start = board.screenToBoard(pos);
		screenSelection = new Tween({ start: selection.start, end: selection.start }, screenSelectionTween);
		selection.end = selection.start;
	}

	export function update(e: MouseEvent | TouchEvent) {
		if (!selecting || !board) return;

		const pos = board.getEventPosition(e);
		selection.end = board.screenToBoard(pos);

		const { x, y } = pos;
		const { innerWidth, innerHeight } = window;
		stopAutoScroll();

		let dx = 0;
		let dy = 0;
		if (x < scroll.threshold) dx = -(scroll.threshold - x) / scroll.threshold;
		else if (x > innerWidth - scroll.threshold)
			dx = (x - (innerWidth - scroll.threshold)) / scroll.threshold;
		if (y < scroll.threshold) dy = -(scroll.threshold - y) / scroll.threshold;
		else if (y > innerHeight - scroll.threshold)
			dy = (y - (innerHeight - scroll.threshold)) / scroll.threshold;

		if (dx || dy) {
			startAutoScroll(dx, dy, pos);
		}
	}

	export function end() {
		if (!selecting) return;

		selecting = false;

		const result =
			selection.start && selection.end ? { start: selection.start, end: selection.end } : null;

		selecting = false;
		selection.start = null;
		selection.end = null;

		return result;
	}

	function startAutoScroll(dx: number, dy: number, pos: { x: number; y: number }) {
		if (autoScrollRaf) return;
		const speed = scroll.speed ?? 10;
		vel.target = { x: -dx * speed, y: -dy * speed };
		const step = () => {
			if (!selecting || !board || !selection.start) return;

			board.setVelocity({
				x: vel.current.x,
				y: vel.current.y
			});
			board.inertia();

			const point = board.screenToBoard(pos);
			selection = { ...selection, end: point };

			autoScrollRaf = requestAnimationFrame(step);
		};
		autoScrollRaf = requestAnimationFrame(step);
	}

	function stopAutoScroll() {
		if (!autoScrollRaf) return;
		cancelAnimationFrame(autoScrollRaf);
		autoScrollRaf = null;
		vel.target = { x: 0, y: 0 };
	}
</script>

{#if selecting}
	<div
		in:fade={{ duration: 200 }}
		out:flyOut={{ duration: 500, reverse: true, scaling: 6, blur: 20 }}
		{...rest}
		style="top: {screenSelection.current.start.y}px;
		width: {screenSelection.current.end.x}px;
		height: {screenSelection.current.end.y}px;
		left: {screenSelection.current.start.x}px"
	></div>
{/if}

<style>
	div {
		position: absolute;
		display: flex;
		border: 1px;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.15);
	}
</style>
