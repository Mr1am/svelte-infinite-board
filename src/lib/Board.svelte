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
		inertiaEnd?: () => any;
		lowerScaleRubber?: (over: number) => number;
		higherScaleRubber?: (over: number) => number;
		scaleEnd?: (scale: number) => any;
		bgScopes?: import('./Background.svelte').Scope[];
		bgFadeDuration?: number;
		children?: import('svelte').Snippet;
	}
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import Background from './Background.svelte';
	import { clamp, rubber } from './utils.js';

	let {
		x = $bindable(0),
		y = $bindable(0),
		scale = $bindable(1),
		scaleBounds: scaleBoundsDefault,
		wheel: wheelDefault,
		zoom: zoomDefault,
		inertiaFriction = 0.92,
		lowerScaleRubber = (over) => rubber(over, 0.2, 0.1),
		higherScaleRubber = (over) => rubber(over, 0.75, 0.65),
		inertiaEnd = () => {},
		scaleEnd = () => {},
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

	let drag = {
		happens: false,
		startX: 0,
		startY: 0,
		lastX: 0,
		lastY: 0
	};

	let velocity = {
		x: 0,
		y: 0
	};

	let zoomAnchor = {
		x: 0,
		y: 0
	};

	let pinch = {
		distance: 0,
		scale: 1,
		centerX: 0,
		centerY: 0,
		offsetX: 0,
		offsetY: 0
	};

	let animationFrame = 0;

	let targetScale = scale;

	let scaleVelocity = 0;
	let scaleSpringFrame: number | null = null;

	function stopScaleSpring() {
		if (scaleSpringFrame) {
			cancelAnimationFrame(scaleSpringFrame);
			scaleSpringFrame = null;
		}
		scaleVelocity = 0;
	}

	function startScaleSpring() {
		if (scaleSpringFrame) cancelAnimationFrame(scaleSpringFrame);

		function step() {
			const diff = targetScale - scale;
			scaleVelocity += diff * zoom.stiffness;
			scaleVelocity *= zoom.damping;

			const prevScale = scale;
			const nextScale = prevScale + scaleVelocity;
			const factor = prevScale !== 0 ? nextScale / prevScale : 1;

			x = zoomAnchor.x - (zoomAnchor.x - x) * factor;
			y = zoomAnchor.y - (zoomAnchor.y - y) * factor;
			scale = nextScale;

			if (Math.abs(diff) < 0.0001 && Math.abs(scaleVelocity) < 0.0001) {
				const finalFactor = targetScale / scale || 1;
				x = zoomAnchor.x - (zoomAnchor.x - x) * finalFactor;
				y = zoomAnchor.y - (zoomAnchor.y - y) * finalFactor;
				scale = targetScale;
				scaleVelocity = 0;
				scaleSpringFrame = null;
				scaleEnd(scale);
				return;
			}

			scaleSpringFrame = requestAnimationFrame(step);
		}

		scaleSpringFrame = requestAnimationFrame(step);
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
				velocity.x = 0;
				velocity.y = 0;
				animationFrame = 0;
				inertiaEnd();
			}
		}

		animationFrame = requestAnimationFrame(step);
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const deltaX =
			(e.deltaMode === 1 ? e.deltaX : e.deltaX) * 0.12 * Math.max(1, Math.min(1.75, 1 / scale));
		const deltaY =
			(e.deltaMode === 1 ? e.deltaY : e.deltaY) * 0.12 * Math.max(1, Math.min(1.75, 1 / scale));

		if (e.ctrlKey || e.metaKey) {
			const rect = board!.getBoundingClientRect();
			const mx = e.clientX - rect.left;
			const my = e.clientY - rect.top;

			zoomAnchor.x = mx;
			zoomAnchor.y = my;

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

			targetScale = clamp(requestedFull, scaleBounds.min, scaleBounds.max);

			scaleVelocity += deltaScale * zoom.kick;

			startScaleSpring();
		} else {
			if (e.shiftKey) {
				x -= deltaX;
				velocity.x = velocity.x * (1 - wheel.momentumFactor) + -deltaY * wheel.momentumFactor;
			} else {
				x -= deltaX;
				y -= deltaY;
				velocity.x = velocity.x * (1 - wheel.momentumFactor) + -deltaX * wheel.momentumFactor;
				velocity.y = velocity.y * (1 - wheel.momentumFactor) + -deltaY * wheel.momentumFactor;
			}
			animateInertia();
		}
	}

	function handleMouseDown(e: MouseEvent) {
		drag.happens = true;
		drag.startX = e.clientX - x;
		drag.startY = e.clientY - y;
		drag.lastX = e.clientX;
		drag.lastY = e.clientY;
		velocity.x = 0;
		velocity.y = 0;
		cancelAnimationFrame(animationFrame);
		board && (board.style.cursor = 'grabbing');
	}

	function handleMouseMove(e: MouseEvent) {
		if (!drag.happens) return;
		velocity.x = e.clientX - drag.lastX;
		velocity.y = e.clientY - drag.lastY;
		drag.lastX = e.clientX;
		drag.lastY = e.clientY;

		x = e.clientX - drag.startX;
		y = e.clientY - drag.startY;
	}

	function handleMouseUp() {
		drag.happens = false;
		board && (board.style.cursor = 'grab');
		animateInertia();
	}

	function setPinchCenterAndOffsets(t1: Touch, t2: Touch) {
		const rect = board!.getBoundingClientRect();
		pinch.centerX = (t1.clientX + t2.clientX) / 2 - rect.left;
		pinch.centerY = (t1.clientY + t2.clientY) / 2 - rect.top;
		pinch.offsetX = x;
		pinch.offsetY = y;

		if (scaleVelocity < 0.0001) {
			zoomAnchor.x = pinch.centerX;
			zoomAnchor.y = pinch.centerY;
		}
	}

	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length === 1) {
			drag.happens = true;
			drag.startX = e.touches[0].clientX - x;
			drag.startY = e.touches[0].clientY - y;
			drag.lastX = e.touches[0].clientX;
			drag.lastY = e.touches[0].clientY;
			velocity.x = 0;
			velocity.y = 0;
			cancelAnimationFrame(animationFrame);
		} else if (e.touches.length === 2) {
			drag.happens = false;
			stopScaleSpring();
			const [t1, t2] = [e.touches[0], e.touches[1]];
			pinch.distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
			pinch.scale = scale;
			setPinchCenterAndOffsets(t1, t2);
			drag.startX = (t1.clientX + t2.clientX) / 2;
			drag.startY = (t1.clientY + t2.clientY) / 2;
		}
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
			targetScale = clamp(scale, scaleBounds.min, scaleBounds.max);
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (e.touches.length === 0) {
			drag.happens = false;
			targetScale = clamp(scale, scaleBounds.min, scaleBounds.max);
			startScaleSpring();
			animateInertia();
		} else if (e.touches.length === 1) {
			stopScaleSpring();
			const t = e.touches[0];
			drag.happens = true;
			drag.startX = t.clientX - x;
			drag.startY = t.clientY - y;
			drag.lastX = t.clientX;
			drag.lastY = t.clientY;
		}
	}

	onDestroy(() => {
		if (animationFrame) cancelAnimationFrame(animationFrame);
		if (scaleSpringFrame) cancelAnimationFrame(scaleSpringFrame);
	});
</script>

<section
	bind:this={board}
	onwheel={handleWheel}
	onmousedown={handleMouseDown}
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	onmouseleave={handleMouseUp}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	ontouchcancel={handleTouchEnd}
	{...rest}
>
	<Background {scale} {x} {y} scopes={bgScopes} fadeDuration={bgFadeDuration}></Background>
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
