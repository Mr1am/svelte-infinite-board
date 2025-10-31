import type { NodeUnion } from '$lib/index.js';
import {nodes} from './nodes.svelte.js';
import {selectedIds} from './selection.svelte.js';

export function hitTest(nodes: NodeUnion[], x: number, y: number): NodeUnion | null {
	for (let i = nodes.length - 1; i >= 0; i--) {
		const n = nodes[i];
		if (x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) {
			return n;
		}
	}
	return null;
}

export function generateId(): string {
	return Math.random().toString(36).slice(2, 9);
}

export function getSelectedNodes() {
	return nodes.filter((n) => selectedIds.includes(n.id));
}