import type { FadeParams } from 'svelte/transition';

export interface ScaleBounds {
	min?: number;
	max?: number;
}

export interface ZoomOptions {
	immediateBlend?: number;
	kick?: number;
	touchpadMultiplier?: number;
	stiffness?: number;
	damping?: number;
}

export interface WheelOptions {
	momentumFactor?: number;
	speed?: number;
}

export interface Velocity {
	x: number;
	y: number;
}

export interface Drag {
	happens: boolean;
	startX: number;
	startY: number;
	lastX: number;
	lastY: number;
}

export interface ZoomAnchor {
	x: number;
	y: number;
}

export interface Pinch {
	distance: number;
	scale: number;
	centerX: number;
	centerY: number;
	offsetX: number;
	offsetY: number;
}

export interface Scaling {
	target: number;
	velocity: number;
	frame: null | number;
}

export interface View {
	x: number;
	y: number;
	scale: number;
}

export interface BoardProps {
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
	onPanEnd?: (e?: MouseEvent | TouchEvent) => any;
	mousePan?: boolean;
	singleTouchPan?: boolean;
	doubleTouchPan?: boolean;
	lowerScaleRubber?: (over: number) => number;
	higherScaleRubber?: (over: number) => number;
	bgScopes?: BgScope[];
	bgParams?: FadeParams;
	board?: HTMLElement | null;
	children?: import('svelte').Snippet;
}

export interface BgScope {
	scale?: number;
	size?: number;
	bg?: string | null;
}
