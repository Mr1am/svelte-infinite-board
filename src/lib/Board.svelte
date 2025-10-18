<script module lang="ts">
	import type { ScaleBounds, ZoomOptions, WheelOptions } from './types.js';

	export interface Props {
		x?: number;
		y?: number;
		scale?: number;
		scaleBounds?: ScaleBounds;
		zoom?: ZoomOptions;
		wheel?: WheelOptions;
		inertiaFriction?: number;
		onInertiaEnd?: () => any;
		onScaleEnd?: (scale: number) => any;
		onWheel?: (e: WheelEvent) => any;
		onPanStart?: (e: MouseEvent | TouchEvent) => any;
		onPan?: (e: MouseEvent | TouchEvent) => any;
		onPanEnd?: (e?: TouchEvent) => any;
		mousePan?: boolean;
		singleTouchPan?: boolean;
		doubleTouchPan?: boolean;
		lowerScaleRubber?: (over: number) => number;
		higherScaleRubber?: (over: number) => number;
		bgScopes?: import('./Background.svelte').Scope[];
		bgFadeDuration?: number;
		children?: import('svelte').Snippet;
	}
</script>

<script lang="ts">
	import Background from './Background.svelte';
	import {
		createVelocity,
		createDrag,
		createZoomAnchor,
		createPinch,
		createScaling,
		clamp,
		rubber,
		type View,
		setupPinch,
	} from '$lib/index.js';
	import { setContext } from 'svelte';

	let {
		x = $bindable(0),
		y = $bindable(0),
		scale = $bindable(1),
		scaleBounds: scaleBoundsDefault,
		wheel: wheelDefault,
		zoom: zoomDefault,
		inertiaFriction = 0.92,
		lowerScaleRubber = (over) => rubber(over, 0.75, 0.3),
		higherScaleRubber = (over) => rubber(over, 0.75, 0.65),
		onInertiaEnd = () => {},
		onScaleEnd = () => {},
		onWheel = () => {},
		onPanStart = () => {},
		onPan = () => {},
		onPanEnd = () => {},
		doubleTouchPan = true,
		singleTouchPan = true,
		mousePan = true,
		bgScopes = [
			{
				scale: 1,
				size: 256,
				bg: `#111`
			}
		],
		bgFadeDuration = 400,
		children,
		...rest
	}: Props = $props();

	const { pinch, setPinch } = createPinch();
	const { drag, setDrag } = createDrag();
	const { scaling, setScaling, stopScaling } = createScaling({ target: scale });
	const { zoomAnchor, setZoomAnchor } = createZoomAnchor();
	const { velocity, setVelocity } = createVelocity();

	const view: View = $derived({ x, y, scale });

	setContext('view', () => view);

	let scaleBounds = $derived({ min: 0.25, max: 3, ...scaleBoundsDefault });
	let wheel = $derived({ momentumFactor: 1, speed: 0.0135, ...wheelDefault });
	let zoom = $derived({
		immediateBlend: 0,
		kick: 0.25,
		touchpadMultiplier: 6,
		stiffness: 0.15,
		damping: 0.4,
		...zoomDefault
	});

	let board: HTMLElement | null = $state(null);

	let animationFrame = 0;

	function startScaleSpring() {
		if (scaling.frame) cancelAnimationFrame(scaling.frame);

		function step() {
			const diff = scaling.target - scale;
			scaling.velocity += diff * zoom.stiffness;
			scaling.velocity *= zoom.damping;

			const prevScale = scale;
			const nextScale = prevScale + scaling.velocity;
			const factor = prevScale !== 0 ? nextScale / prevScale : 1;

			x = zoomAnchor.x - (zoomAnchor.x - x) * factor;
			y = zoomAnchor.y - (zoomAnchor.y - y) * factor;
			scale = nextScale;

			if (Math.abs(diff) < 0.0001 && Math.abs(scaling.velocity) < 0.0001) {
				const finalFactor = scaling.target / scale || 1;
				x = zoomAnchor.x - (zoomAnchor.x - x) * finalFactor;
				y = zoomAnchor.y - (zoomAnchor.y - y) * finalFactor;
				scale = scaling.target;
				setScaling({ velocity: 0, frame: null });
				onScaleEnd(scale);
				return;
			}

			scaling.frame = requestAnimationFrame(step);
		}

		scaling.frame = requestAnimationFrame(step);
	}

	function animateInertia() {
		if (animationFrame) cancelAnimationFrame(animationFrame);

		function step() {
			x += velocity.x;
			y += velocity.y;

			velocity.x *= inertiaFriction;
			velocity.y *= inertiaFriction;

			if (Math.abs(velocity.x) > 0.001 || Math.abs(velocity.y) > 0.001) {
				animationFrame = requestAnimationFrame(step);
			} else {
				setVelocity({ x: 0, y: 0 });
				animationFrame = 0;
				onInertiaEnd();
			}
		}

		animationFrame = requestAnimationFrame(step);
	}

	function isBoardUnderEvent(e: Event) {
		if (!board) return false;

		const path = (e as any).composedPath?.();
		if (Array.isArray(path) && path.length) {
			if (path.includes(board)) return true;
		}

		let x: number | null = null;
		let y: number | null = null;

		if (e instanceof WheelEvent || e instanceof MouseEvent) {
			x = e.clientX;
			y = e.clientY;
		} else if (e instanceof TouchEvent) {
			const t = e.touches[0] || e.changedTouches[0];
			if (!t) return false;
			x = t.clientX;
			y = t.clientY;
		}

		if (x == null || y == null) return false;

		if (typeof document.elementsFromPoint === 'function') {
			const els = document.elementsFromPoint(x, y);
			if (els.includes(board)) return true;
			for (const el of els) {
				if (board.contains(el)) return true;
			}
		} else {
			return board.contains(document.elementFromPoint(x, y) as Node);
		}

		return false;
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();

		if (!isBoardUnderEvent(e)) return;

		const deltaX =
			(e.deltaMode === 1 ? e.deltaX : e.deltaX) * 0.12 * Math.max(1, Math.min(1.75, 1 / scale));
		const deltaY =
			(e.deltaMode === 1 ? e.deltaY : e.deltaY) * 0.12 * Math.max(1, Math.min(1.75, 1 / scale));

		if (e.ctrlKey || e.metaKey) {
			const rect = board!.getBoundingClientRect();
			const mx = e.clientX - rect.left;
			const my = e.clientY - rect.top;

			setZoomAnchor({ x: mx, y: my});

			const factor = Math.exp(
				-deltaY /
					(1 / (Math.abs(e.deltaY) < 20 ? wheel.speed * zoom.touchpadMultiplier : wheel.speed))
			);
			const requestedFull = scale * factor;

			let displayedRequested = requestedFull;

			if (displayedRequested < scaleBounds.min) {
				displayedRequested =
					scaleBounds.min + lowerScaleRubber(displayedRequested - scaleBounds.min);
			} else if (displayedRequested > scaleBounds.max) {
				displayedRequested =
					scaleBounds.max + higherScaleRubber(displayedRequested - scaleBounds.max);
			}

			const prevScale = scale;
			const deltaScale = displayedRequested - prevScale;
			const immediateDelta = deltaScale * zoom.immediateBlend;
			const newScale = prevScale + immediateDelta;

			const realFactor = prevScale !== 0 ? newScale / prevScale : 1;

			scale = newScale;
			x = mx - (mx - x) * realFactor;
			y = my - (my - y) * realFactor;

			setScaling({
				target: clamp(requestedFull, scaleBounds.min, scaleBounds.max),
				velocity: (scaling.velocity += deltaScale * zoom.kick)
			});

			startScaleSpring();
		} else {
			const applyVelocity = (value: number, delta: number) =>
				value * (1 - wheel.momentumFactor) + -delta * wheel.momentumFactor;

			if (e.shiftKey) {
				x -= deltaX;

				velocity.x = applyVelocity(velocity.x, deltaY);
			} else {
				x -= deltaX;
				y -= deltaY;
				velocity.x = applyVelocity(velocity.x, deltaX);
				velocity.y = applyVelocity(velocity.y, deltaY);
			}
			animateInertia();
		}

		onWheel(e);
	}

	function handleMouseDown(e: MouseEvent) {
		if (!mousePan) return;
		if (!isBoardUnderEvent(e)) return;
		setDrag({
			happens: true,
			startX: e.clientX - x,
			startY: e.clientY - y,
			lastX: e.clientX,
			lastY: e.clientY
		});
		velocity.x = 0;
		velocity.y = 0;
		cancelAnimationFrame(animationFrame);
		board && (board.style.cursor = 'grabbing');

		onPanStart(e);
	}

	function handleMouseMove(event: MouseEvent) {
		if (!drag.happens) return;
		velocity.x = event.clientX - drag.lastX;
		velocity.y = event.clientY - drag.lastY;
		setDrag({ lastX: event.clientX, lastY: event.clientY });

		x = event.clientX - drag.startX;
		y = event.clientY - drag.startY;

		onPan(event);
	}

	function handleMouseUp() {
		drag.happens = false;
		board && (board.style.cursor = 'grab');
		animateInertia();
		onPanEnd();
	}

	function handleTouchStart(e: TouchEvent) {
		if (!isBoardUnderEvent(e)) return;

		if (e.touches.length === 1 && singleTouchPan) {
			setDrag({
				happens: true,
				startX: e.touches[0].clientX - x,
				startY: e.touches[0].clientY - y,
				lastX: e.touches[0].clientX,
				lastY: e.touches[0].clientY
			});
			setVelocity({ x: 0, y: 0 });
			cancelAnimationFrame(animationFrame);
		} else if (e.touches.length === 2 && doubleTouchPan) {
			if (!board) return;

			const [t1, t2] = [e.touches[0], e.touches[1]];
			setDrag({
				happens: false,
				startX: (t1.clientX + t2.clientX) / 2,
				startY: (t1.clientY + t2.clientY) / 2
			});
			stopScaling();

			setPinch({ ...setupPinch([t1, t2], board), scale });
		}
		onPanStart(e);
	}

	function handleTouchMove(e: TouchEvent) {
		if (e.touches.length === 1 && drag.happens) {
			const t = e.touches[0];
			velocity.x = t.clientX - drag.lastX;
			velocity.y = t.clientY - drag.lastY;
			drag.lastX = t.clientX;
			drag.lastY = t.clientY;

			x = t.clientX - drag.startX;
			y = t.clientY - drag.startY;
		} else if (e.touches.length === 2) {
			const t1 = e.touches[0],
				t2 = e.touches[1];
			const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
			const zoomFactor = dist / pinch.distance;
			let requested = pinch.scale * zoomFactor;

			if (requested < scaleBounds.min) {
				requested = scaleBounds.min + lowerScaleRubber(requested - scaleBounds.min);
			} else if (requested > scaleBounds.max) {
				requested = scaleBounds.max + higherScaleRubber(requested - scaleBounds.max);
			}

			const newViewX = pinch.centerX - (pinch.centerX - pinch.offsetX) * (requested / pinch.scale);
			const newViewY = pinch.centerY - (pinch.centerY - pinch.offsetY) * (requested / pinch.scale);

			const currentPinchX = (t1.clientX + t2.clientX) / 2;
			const currentPinchY = (t1.clientY + t2.clientY) / 2;
			const dx = currentPinchX - drag.startX;
			const dy = currentPinchY - drag.startY;

			x = newViewX + dx;
			y = newViewY + dy;
			scale = requested;
			scaling.target = clamp(scale, scaleBounds.min, scaleBounds.max);
			onPan(e);
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (e.touches.length === 0) {
			drag.happens = false;
			scaling.target = clamp(scale, scaleBounds.min, scaleBounds.max);
			startScaleSpring();
			animateInertia();
		} else if (e.touches.length === 1) {
			stopScaling();
			const t = e.touches[0];
			drag.happens = true;
			drag.startX = t.clientX - x;
			drag.startY = t.clientY - y;
			drag.lastX = t.clientX;
			drag.lastY = t.clientY;
		}
		onPanEnd(e);
	}

	$effect(() => {
		window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
		window.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
		window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });

		return () => {
			if (animationFrame) cancelAnimationFrame(animationFrame);
			if (scaling.frame) cancelAnimationFrame(scaling.frame);

			window.removeEventListener('wheel', handleWheel, { capture: true } as any);
			window.removeEventListener('touchstart', handleTouchStart, { capture: true } as any);
			window.removeEventListener('touchmove', handleTouchMove, { capture: true } as any);
		};
	});
</script>

<svelte:body
	onmousedown={handleMouseDown}
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	onmouseleave={handleMouseUp}
	ontouchend={handleTouchEnd}
	ontouchcancel={handleTouchEnd}
/>

<section bind:this={board} {...rest}>
	<Background scopes={bgScopes} fadeDuration={bgFadeDuration}></Background>
	<div style="transform: translate({x}px, {y}px) scale({scale});">
		{@render children?.()}
	</div>
</section>

<style>
	section {
		width: 100%;
		height: 100%;
		overflow: hidden;
		position: relative;
		touch-action: none;
		-webkit-tap-highlight-color: transparent;
	}

	div {
		position: absolute;
		inset: 0;
		will-change: transform;
		transform-origin: 0 0;
	}
</style>
