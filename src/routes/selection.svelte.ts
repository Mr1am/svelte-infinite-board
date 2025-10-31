import type { NodeUnion } from '$lib/index.js';
import { sortedNodes } from './nodes.svelte.js';
export const selectedIds = $state<string[]>([]);

export const selecting = $state({happens: false});

export function clearSelection() {
	selectedIds.length = 0;
}

export function setSelection(ids: string[], append: boolean) {
	if (!append) selectedIds.length = 0;
	ids.forEach((id) => {
		if (!selectedIds.includes(id)) selectedIds.push(id);
	});
}

export function toggleSelection(id: string, append: boolean) {
	if (!append) {
		selectedIds.length = 0;
	}
	const idx = selectedIds.indexOf(id);
	if (idx === -1) selectedIds.push(id);
	else selectedIds.splice(idx, 1);
}

export function selectInRect(
	rect: { x: number; y: number; w: number; h: number },
	append: boolean,
	partial: boolean = true
) {
	if (!append) selectedIds.length = 0;
	sortedNodes.forEach((node) => {
		const nx1 = node.x,
			ny1 = node.y,
			nx2 = node.x + node.w,
			ny2 = node.y + node.h;
		const rx1 = rect.x,
			ry1 = rect.y,
			rx2 = rect.x + rect.w,
			ry2 = rect.y + rect.h;
		const inside = nx1 >= rx1 && nx2 <= rx2 && ny1 >= ry1 && ny2 <= ry2;
		const intersects = nx1 < rx2 && nx2 > rx1 && ny1 < ry2 && ny2 > ry1;
		if (partial ? intersects : inside) {
			if (!selectedIds.includes(node.id)) selectedIds.push(node.id);
		}
	});
}