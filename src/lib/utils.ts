import type { BgScope, ScaleBounds } from '$lib/types.js';

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
	const centerX = (touches[0].clientX + touches[1].clientX) / 2 - rect.left;
	const centerY = (touches[0].clientY + touches[1].clientY) / 2 - rect.top;

	const distance = Math.hypot(
		touches[1].clientX - touches[0].clientX,
		touches[1].clientY - touches[0].clientY
	);

	return { centerX, centerY, distance };
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

export function boardToScreenCoords(
	coords: { x: number; y: number },
	x: number,
	y: number,
	scale: number
) {
	return {
		x: coords.x * scale + x,
		y: coords.y * scale + y
	};
}

export function screenToBoardCoords(
	coords: { x: number; y: number },
	x: number,
	y: number,
	scale: number
) {
	return {
		x: (coords.x - x) / scale,
		y: (coords.y - y) / scale
	};
}

export function setDelta(event: WheelEvent, scale: number) {
	return {
		x: (event.deltaMode === 1 ? 2 : 0.12) * event.deltaX * Math.max(1, Math.min(1.75, 1 / scale)),
		y: (event.deltaMode === 1 ? 2 : 0.12) * event.deltaY * Math.max(1, Math.min(1.75, 1 / scale))
	};
}

export function isBoardUnderEvent(e: Event, board: any) {
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

export function isClick(
	positions: {start: {x: number; y: number}, end: {x: number; y: number}},
	threshold: number
) {
	const dx = Math.abs(positions.start.x - positions.end.x);
	const dy = Math.abs(positions.start.y - positions.end.y);
	const distance = Math.sqrt(dx * dx + dy * dy);
	return distance < threshold;
}

export const viewByPinch = (
	center: number,
	offset: number,
	pinchScale: number,
	requestedScale: number
) => center - (center - offset) * (requestedScale / pinchScale);

export const dragDelta = (positions: number[], dragStart: number) =>
	(positions[0] + positions[2]) / 2 - dragStart;


/**
 * Applies rubberbanding to a requested scale value based on the provided bounds.
 * If the requested scale is below the minimum bound, it applies the lower rubber function.
 * If above the maximum bound, it applies the higher rubber function.
 * Handles cases where min or max bounds are undefined (no adjustment in those directions).
 *
 * @param {number} requested - The requested scale value.
 * @param {ScaleBounds} bounds - The scale bounds with optional min and max.
 * @param {(over: number) => number} lowerScaleRubber - Function to compute lower rubberband offset.
 * @param {(over: number) => number} higherScaleRubber - Function to compute higher rubberband offset.
 * @returns {number} The adjusted scale value after applying bounds and rubberbanding.
 */
export function applyScaleBounding(
	requested: number,
	bounds: ScaleBounds,
	lowerScaleRubber: (over: number) => number,
	higherScaleRubber: (over: number) => number
): number {
	if (bounds.min !== undefined && requested < bounds.min) {
		return bounds.min + lowerScaleRubber(requested - bounds.min);
	} else if (bounds.max !== undefined && requested > bounds.max) {
		return bounds.max + higherScaleRubber(requested - bounds.max);
	}
	return requested;
}