import { pinch } from '$lib/stores/pinch.svelte.js';
import { zoomAnchor } from '$lib/stores/zoomAnchor.svelte.js';
import { scaling } from '$lib/stores/scaling.svelte.js';
import { Board, type View } from './index.js';

export function clamp(value: number, max: number, min: number) {
	return Math.min(Math.max(value, max), min);
}

export function rubber(over: number, exponent: number = 0.25, stretch: number = 0.5) {
	const s = Math.sign(over) || 1;
	const a = Math.abs(over);
	return s * Math.pow(a, exponent) * stretch;
}

export function setupPinch(t1: Touch, t2: Touch, rect: DOMRect, view: View) {
	pinch.centerX = (t1.clientX + t2.clientX) / 2 - rect.left;
	pinch.centerY = (t1.clientY + t2.clientY) / 2 - rect.top;
	pinch.offsetX = view.x;
	pinch.offsetY = view.y;

	if (scaling.velocity < 0.0001) {
		zoomAnchor.x = pinch.centerX;
		zoomAnchor.y = pinch.centerY;
	}
}

export function stopScaleSpring() {
	if (scaling.frame) {
		cancelAnimationFrame(scaling.frame);
		scaling.frame = null;
	}
	scaling.velocity = 0;
}
