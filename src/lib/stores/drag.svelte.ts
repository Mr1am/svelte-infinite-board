import type { Drag } from '$lib/index.js';

export const drag: Drag = $state({
	happens: false,
	startX: 0,
	startY: 0,
	lastX: 0,
	lastY: 0
});