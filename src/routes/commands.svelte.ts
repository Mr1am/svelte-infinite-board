import { nodes } from './nodes.svelte.js';
import type { Group, NodeUnion } from '$lib/index.js';
import { history, type Command } from './history.svelte.js';
import { generateId } from './utils.js';

export function createNodeCommand(node: NodeUnion): Command {
	let index = -1;
	return {
		execute() {
			index = nodes.push(node) - 1;
		},
		undo() {
			if (index !== -1) nodes.splice(index, 1);
		},
		redo: this.execute
	};
}

export function deleteNodesCommand(nodeIds: string[]): Command {
	const removed: { node: NodeUnion; index: number }[] = [];
	return {
		execute() {
			removed.length = 0;
			nodeIds.forEach((id) => {
				const i = nodes.findIndex((n) => n.id === id);
				if (i !== -1) {
					removed.push({ node: nodes[i], index: i });
					nodes.splice(i, 1);
				}
			});
		},
		undo() {
			removed.forEach(({ node, index }) => {
				nodes.splice(index, 0, node);
			});
		},
		redo: this.execute
	};
}

export function moveNodesCommand(nodeIds: string[], dx: number, dy: number): Command {
	const oldPos = new Map<string, { x: number; y: number }>();
	return {
		execute() {
			oldPos.clear();
			nodeIds.forEach((id) => {
				const node = nodes.find((n) => n.id === id);
				if (node) {
					oldPos.set(id, { x: node.x, y: node.y });
					node.x += dx;
					node.y += dy;
				}
			});
		},
		undo() {
			nodeIds.forEach((id) => {
				const node = nodes.find((n) => n.id === id);
				const pos = oldPos.get(id);
				if (node && pos) {
					node.x = pos.x;
					node.y = pos.y;
				}
			});
		},
		redo: this.execute
	};
}

export function resizeNodesCommand(
	nodeIds: string[],
	corner: 'tl' | 'tr' | 'bl' | 'br',
	dx: number,
	dy: number
): Command {
	const oldState = new Map<string, { x: number; y: number; w: number; h: number }>();
	return {
		execute() {
			oldState.clear();
			nodeIds.forEach((id) => {
				const node = nodes.find((n) => n.id === id);
				if (node) {
					oldState.set(id, { x: node.x, y: node.y, w: node.w, h: node.h });
					if (corner.includes('l')) node.x += dx;
					if (corner.includes('t')) node.y += dy;
					if (corner.includes('r')) node.w -= dx;
					if (corner.includes('b')) node.h -= dy;
					if (node.w < 20) node.w = 20;
					if (node.h < 20) node.h = 20;
				}
			});
		},
		undo() {
			nodeIds.forEach((id) => {
				const node = nodes.find((n) => n.id === id);
				const state = oldState.get(id);
				if (node && state) {
					node.x = state.x;
					node.y = state.y;
					node.w = state.w;
					node.h = state.h;
				}
			});
		},
		redo: this.execute
	};
}

export function groupNodesCommand(nodeIds: string[]): Command {
	const groupId = generateId();
	const group: Group = {
		id: groupId,
		type: 'group',
		x: 0,
		y: 0,
		w: 0,
		h: 0,
		z: Math.max(...nodes.map((n) => n.z), 0) + 1,
		title: 'Group',
		children: [],
		styles: { bg: '#f0f0f0', fg: '#000', outline: { color: '#999', width: 1 } }
	};
	const removed: { node: NodeUnion; index: number }[] = [];
	return {
		execute() {
			removed.length = 0;
			const children: NodeUnion[] = [];
			let minX = Infinity,
				minY = Infinity,
				maxX = -Infinity,
				maxY = -Infinity;
			nodeIds.forEach((id) => {
				const i = nodes.findIndex((n) => n.id === id);
				if (i !== -1) {
					const node = nodes[i];
					removed.push({ node, index: i });
					children.push(node);
					minX = Math.min(minX, node.x);
					minY = Math.min(minY, node.y);
					maxX = Math.max(maxX, node.x + node.w);
					maxY = Math.max(maxY, node.y + node.h);
					nodes.splice(i, 1);
				}
			});
			group.x = minX;
			group.y = minY;
			group.w = maxX - minX;
			group.h = maxY - minY;
			group.children = children.map((child) => ({ ...child, group }));
			nodes.push(group);
		},
		undo() {
			const groupIndex = nodes.findIndex((n) => n.id === groupId);
			if (groupIndex !== -1) {
				nodes.splice(groupIndex, 1);
				removed.forEach(({ node, index }) => {
					delete (node as any).group;
					nodes.splice(index, 0, node);
				});
			}
		},
		redo: this.execute
	};
}
