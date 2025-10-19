import type { BgScope } from '$lib/types.js';

export function clamp(value: number, max: number, min: number) {
	return Math.min(Math.max(value, max), min);
}

export function rubber(over: number, exponent: number = 0.25, stretch: number = 0.5) {
	const s = Math.sign(over) || 1;
	const a = Math.abs(over);
	return s * Math.pow(a, exponent) * stretch;
}

export function setupPinch(touches: Touch[], element: HTMLElement) {
	const rect = element!.getBoundingClientRect();
	const x = (touches[0].clientX + touches[1].clientX) / 2 - rect.left;
	const y = (touches[0].clientY + touches[1].clientY) / 2 - rect.top;

	const distance = Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY);

	return { x, y, distance };
}

export const svgToUri = (svg: string) =>
	`url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

export function getCurrentScope(scale: number, list?: BgScope[]) {
	if (!Array.isArray(list) || list.length === 0) {
		return { scale: 0, size: 128, bg: null };
	}
	const sorted = [...list].sort((a, b) => (a.scale ?? 0) - (b.scale ?? 0));
	let pick = sorted[0];
	for (const s of sorted) {
		if ((scale ?? 0) >= (s.scale ?? 0)) pick = s;
		else break;
	}
	return pick;
}

export function boardToScreenCoords(coords: {x: number; y: number}, x: number, y: number, scale: number) {
	return {
		x: coords.x * scale + x,
		y: coords.y * scale + y,
	};
}

export function screenToBoardCoords(coords: {x: number; y: number}, x: number, y: number, scale: number) {
	return {
		x: (coords.x - x) / scale,
		y: (coords.y - y) / scale,
	};
}

