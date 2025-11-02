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
		isBoardUnderEvent,
		setDelta,
		viewByPinch,
		dragDelta,
		applyScaleBounding,
		isClick
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
		onClick = () => {},
		clickThreshold = 5,
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
	export const { scaling, setScaling, stopScaling, onScale, scaleSpring, onScaleEnd } = createScaling(
		scale,
		0,
		0,
		zoom.stiffness,
		zoom.damping
	);
	const { zoomAnchor, setZoomAnchor } = createZoomAnchor();
	export const {
		velocity,
		setVelocity,
		cancelVelocity,
		stopVelocity,
		inertia,
		onInertia,
		onInertiaEnd
	} = createVelocity(0, 0, inertiaFriction);

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

	let click: {
		start: {
			x: number;
			y: number;
		};
		end: {
			x: number;
			y: number;
		};
		event: null | MouseEvent | TouchEvent;
	} = {
		start: { x: 0, y: 0 },
		end: { x: 0, y: 0 },
		event: null
	};

	let willChange = $state(true); // willChange blurs board context, so we need to turn it off sometimes

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
		const fixed = Number(scale.toFixed(2)) * 10;
		willChange = !(scale > 1 && Math.abs(fixed - Math.round(fixed)) < 1e-8);
	});

	onScaleEnd(() => {
		const finalFactor = scaling.target / scaling.current || 1;
		x = zoomAnchor.x - (zoomAnchor.x - x) * finalFactor;
		y = zoomAnchor.y - (zoomAnchor.y - y) * finalFactor;

		onScaleEnds(scale);

		if (!willChange) willChange = true;
	});

	let scaleBounds = $derived({ min: 0.25, max: 3, ...scaleBoundsDefault });
	let wheel = $derived({ momentumFactor: 1, speed: 0.0135, ...wheelDefault });

	$effect(() => {
		scaling.current = scale;
	});

	function handleWheel(e: WheelEvent) {
		e.preventDefault();

		if (!isBoardUnderEvent(e, board)) return;

		const delta = setDelta(e, scale);

		if (e.ctrlKey || e.metaKey) {
			const rect = board!.getBoundingClientRect();
			const mx = e.clientX - rect.left;
			const my = e.clientY - rect.top;

			setZoomAnchor({ x: mx, y: my });

			const factor = Math.exp(
				-delta.y /
					(1 /
						(Math.abs(e.deltaY) < 20
							? wheel.speed * zoom.touchpadMultiplier * (e.deltaMode === 1 ? 0.25 : 1)
							: wheel.speed * (e.deltaMode === 1 ? 0.25 : 1)))
			);

			const displayedRequested = applyScaleBounding(
				scale * factor,
				scaleBounds,
				lowerScaleRubber,
				higherScaleRubber
			);

			const deltaScale = displayedRequested - scale;
			const immediateDelta = deltaScale * zoom.immediateBlend;
			const newScale = scale + immediateDelta;

			const realFactor = scale !== 0 ? newScale / scale : 1;

			scale = newScale;
			x = mx - (mx - x) * realFactor;
			y = my - (my - y) * realFactor;

			setScaling({
				target: clamp(displayedRequested, scaleBounds.min, scaleBounds.max),
				velocity: (scaling.velocity += deltaScale * zoom.kick)
			});
		} else {
			const applyVelocity = (value: number, delta: number) =>
				value * (1 - wheel.momentumFactor) + -delta * wheel.momentumFactor;

			if (e.shiftKey) {
				x -= delta.x;
				velocity.x = applyVelocity(velocity.x, delta.y);
			} else {
				x -= delta.x;
				y -= delta.y;

				setVelocity({
					x: applyVelocity(velocity.x, delta.x),
					y: applyVelocity(velocity.y, delta.y)
				});
			}
			inertia();
		}

		scaleSpring();
		onWheel(e);
	}

	function handleMouseDown(e: MouseEvent) {
		click.start = { x: e.clientX, y: e.clientY };
		onPanStart(e);
		click.event = e;
		if (!mousePan) return;

		setDrag({
			happens: true,
			startX: e.clientX - x,
			startY: e.clientY - y,
			lastX: e.clientX,
			lastY: e.clientY
		});
		stopVelocity();
		board && (board.style.cursor = 'grabbing');
	}

	function handleMouseMove(event: MouseEvent) {
		onPan(event);
		if (!drag.happens) return;
		if (!mousePan) return;
		setVelocity({ x: event.clientX - drag.lastX, y: event.clientY - drag.lastY });
		setDrag({ lastX: event.clientX, lastY: event.clientY });

		x = event.clientX - drag.startX;
		y = event.clientY - drag.startY;
	}

	function handleMouseUp(event: MouseEvent) {
		click.end = { x: event.clientX, y: event.clientY };
		drag.happens = false;
		board && (board.style.cursor = 'grab');
		inertia();
		if (isClick(click, clickThreshold) && click.event) onClick(click.event);
		onPanEnd(event);
	}

	function handleTouchStart(e: TouchEvent) {
		onPanStart(e);

		if (e.touches.length === 1) {
			click.start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
			click.end = { x: e.touches[0].clientX, y: e.touches[0].clientY };
			click.event = e;
			if (!singleTouchPan) return;
			setDrag({
				happens: true,
				startX: e.touches[0].clientX - x,
				startY: e.touches[0].clientY - y,
				lastX: e.touches[0].clientX,
				lastY: e.touches[0].clientY
			});
			stopVelocity();
		} else if (e.touches.length === 2) {
			if (!doubleTouchPan) return;
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
	}

	function handleTouchMove(e: TouchEvent) {
		onPan(e);
		if (e.touches.length === 1 && drag.happens) {
			click.end = { x: e.touches[0].clientX, y: e.touches[0].clientY };
			if (!singleTouchPan) return;

			const t = e.touches[0];
			setVelocity({ x: t.clientX - drag.lastX, y: t.clientY - drag.lastY });
			setDrag({ lastX: t.clientX, lastY: t.clientY });

			x = t.clientX - drag.startX;
			y = t.clientY - drag.startY;
		} else if (e.touches.length === 2) {
			click.event = null;
			if (!doubleTouchPan) {
				return;
			}
			const t1 = e.touches[0];
			const t2 = e.touches[1];
			const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
			const requested = applyScaleBounding(
				pinch.scale * (dist / pinch.distance),
				scaleBounds,
				lowerScaleRubber,
				higherScaleRubber
			);

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
	}

	function handleTouchEnd(e: TouchEvent) {
		if (e.touches.length === 0) {
			drag.happens = false;
			scaling.target = clamp(scale, scaleBounds.min, scaleBounds.max);
			scaleSpring();
			inertia();
			if (isClick(click, clickThreshold) && click.event) onClick(click.event);
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
		window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });

		return () => {
			window.removeEventListener('wheel', handleWheel, { capture: true } as any);
			window.removeEventListener('touchmove', handleTouchMove, { capture: true } as any);
		};
	});
</script>

<svelte:body
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	ontouchend={handleTouchEnd}
	ontouchcancel={handleTouchEnd}
/>

<section
	bind:this={board}
	{...rest}
	oncontextmenu={(e) => e.preventDefault()}
	onmousedown={handleMouseDown}
	ontouchstart={handleTouchStart}
>
	<Background scopes={bgScopes} {bgParams} {x} {y} {scale}></Background>
	<div
		style="transform: translate({x}px, {y}px) scale({scale});{willChange
			? ' will-change: transform'
			: ''}"
	>
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
		transform-origin: 0 0;
	}
</style>
