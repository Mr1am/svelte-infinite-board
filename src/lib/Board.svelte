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
		type BoardProps,
		screenToBoardCoords,
		boardToScreenCoords,
		isBoardUnderEvent
	} from '$lib/index.js';

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
		onInertiaEnd: onInertiaEnds = () => {},
		onScaleEnd: onScaleEnds = () => {},
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
		bgParams = { duration: 400 },
		board = $bindable(null),
		children,
		...rest
	}: BoardProps = $props();

	let zoom = $derived({
		immediateBlend: 0,
		kick: 0.25,
		touchpadMultiplier: 6,
		stiffness: 0.15,
		damping: 0.4,
		...zoomDefault
	});

	const { pinch, setPinch } = createPinch();
	const { drag, setDrag } = createDrag();
	export const { scaling, setScaling, stopScaling, onScale, onScaleEnd } = createScaling(
		scale,
		0,
		0,
		zoom.stiffness,
		zoom.damping
	);
	const { zoomAnchor, setZoomAnchor } = createZoomAnchor();
	export const { velocity, setVelocity, cancelVelocity, inertia, onInertia, onInertiaEnd } = createVelocity(
		0,
		0,
		inertiaFriction
	);

	export const view = (): View => {
		return { x, y, scale };
	};

	export const screenToBoard = (coords: { x: number; y: number }) =>
		screenToBoardCoords(coords, x, y, scale);
	export const boardToScreen = (coords: { x: number; y: number }) =>
		boardToScreenCoords(coords, x, y, scale);

	export function getEventPosition(e: MouseEvent | TouchEvent): { x: number; y: number } {
		if (e instanceof MouseEvent) return { x: e.clientX, y: e.clientY };
		const touch = e.touches[0] || e.changedTouches[0];
		return { x: touch.clientX, y: touch.clientY };
	}

	onInertia(() => {
		x += velocity.x;
		y += velocity.y;
	});

	onInertiaEnd(() => onInertiaEnds());

	onScale(() => {
		const prevScale = scale;
		const nextScale = prevScale + scaling.velocity;
		const factor = prevScale !== 0 ? nextScale / prevScale : 1;

		x = zoomAnchor.x - (zoomAnchor.x - x) * factor;
		y = zoomAnchor.y - (zoomAnchor.y - y) * factor;
		scale = nextScale;
	});

	onScaleEnd(() => {
		const finalFactor = scaling.target / scaling.current || 1;
		x = zoomAnchor.x - (zoomAnchor.x - x) * finalFactor;
		y = zoomAnchor.y - (zoomAnchor.y - y) * finalFactor;

		onScaleEnds(scale);
	});

	let scaleBounds = $derived({ min: 0.25, max: 3, ...scaleBoundsDefault });
	let wheel = $derived({ momentumFactor: 1, speed: 0.0135, ...wheelDefault });

	$effect(() => {
		scaling.current = scale;
	});

	function handleWheel(e: WheelEvent) {
		e.preventDefault();

		if (!isBoardUnderEvent(e, board)) return;

		const deltaX =
			(e.deltaMode === 1 ? e.deltaX : e.deltaX) * 0.12 * Math.max(1, Math.min(1.75, 1 / scale));
		const deltaY =
			(e.deltaMode === 1 ? e.deltaY : e.deltaY) * 0.12 * Math.max(1, Math.min(1.75, 1 / scale));

		if (e.ctrlKey || e.metaKey) {
			const rect = board!.getBoundingClientRect();
			const mx = e.clientX - rect.left;
			const my = e.clientY - rect.top;

			setZoomAnchor({ x: mx, y: my });

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
		} else {
			const applyVelocity = (value: number, delta: number) =>
				value * (1 - wheel.momentumFactor) + -delta * wheel.momentumFactor;

			if (e.shiftKey) {
				x -= deltaX;

				velocity.x = applyVelocity(velocity.x, deltaY);
			} else {
				x -= deltaX;
				y -= deltaY;

				setVelocity({ x: applyVelocity(velocity.x, deltaX), y: applyVelocity(velocity.y, deltaY) });
			}
			inertia();
		}

		onWheel(e);
	}

	function handleMouseDown(e: MouseEvent) {
		if (!mousePan) {
			onPanStart(e);
			return;
		}
		if (!isBoardUnderEvent(e, board)) return;
		setDrag({
			happens: true,
			startX: e.clientX - x,
			startY: e.clientY - y,
			lastX: e.clientX,
			lastY: e.clientY
		});
		setVelocity({ x: 0, y: 0 });
		cancelVelocity();
		board && (board.style.cursor = 'grabbing');

		onPanStart(e);
	}

	function handleMouseMove(event: MouseEvent) {
		if (!drag.happens) return;

		if (!mousePan) {
			onPan(event);
			return;
		}
		setVelocity({ x: event.clientX - drag.lastX, y: event.clientY - drag.lastY });
		setDrag({ lastX: event.clientX, lastY: event.clientY });

		x = event.clientX - drag.startX;
		y = event.clientY - drag.startY;

		onPan(event);
	}

	function handleMouseUp(event: MouseEvent) {
		drag.happens = false;
		board && (board.style.cursor = 'grab');
		inertia();
		onPanEnd(event);
	}

	function handleTouchStart(e: TouchEvent) {
		if (!isBoardUnderEvent(e, board)) return;

		if (e.touches.length === 1) {
			if (!singleTouchPan) {
				onPanStart(e);
				return;
			}
			setDrag({
				happens: true,
				startX: e.touches[0].clientX - x,
				startY: e.touches[0].clientY - y,
				lastX: e.touches[0].clientX,
				lastY: e.touches[0].clientY
			});
			setVelocity({ x: 0, y: 0 });
			cancelVelocity();
		} else if (e.touches.length === 2) {
			if (!doubleTouchPan) {
				onPanStart(e);
				return;
			}
			if (!board) return;

			const [t1, t2] = [e.touches[0], e.touches[1]];
			setDrag({
				happens: false,
				startX: (t1.clientX + t2.clientX) / 2,
				startY: (t1.clientY + t2.clientY) / 2
			});
			stopScaling();

			setPinch({ ...setupPinch([t1, t2], board), scale, offsetX: x, offsetY: y });

			if (scaling.velocity < 0.0001) setZoomAnchor({ x: pinch.centerX, y: pinch.centerY });
		}

		onPanStart(e);
	}

	function handleTouchMove(e: TouchEvent) {
		if (e.touches.length === 1 && drag.happens) {
			if (!singleTouchPan) {
				onPan(e);
				return;
			}

			const t = e.touches[0];
			setVelocity({ x: t.clientX - drag.lastX, y: t.clientY - drag.lastY});
			setDrag({ lastX: t.clientX, lastY: t.clientY })

			x = t.clientX - drag.startX;
			y = t.clientY - drag.startY;
		} else if (e.touches.length === 2) {
			if (!doubleTouchPan) {
				onPan(e);
				return;
			}
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
		}
		onPan(e);
	}

	function handleTouchEnd(e: TouchEvent) {
		if (e.touches.length === 0) {
			drag.happens = false;
			scaling.target = clamp(scale, scaleBounds.min, scaleBounds.max);
			inertia();
		} else if (e.touches.length === 1) {
			stopScaling();
			const t = e.touches[0];
			setDrag({
				happens: false,
				startX: t.clientX - x,
				startY: t.clientY - y,
				lastX: t.clientX,
				lastY: t.clientY
			});
		}
		onPanEnd(e);
	}

	$effect(() => {
		window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
		window.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
		window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });

		return () => {
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
	ontouchend={handleTouchEnd}
	ontouchcancel={handleTouchEnd}
/>

<section bind:this={board} {...rest} oncontextmenu={(e) => e.preventDefault()}>
	<Background scopes={bgScopes} {bgParams} {x} {y} {scale}></Background>
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
