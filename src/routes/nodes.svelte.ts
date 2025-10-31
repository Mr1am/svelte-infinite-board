import type { NodeUnion } from '$lib/index.js';

export const nodes = $state<NodeUnion[]>([]);

export const sortedNodes = () => {
	return [...nodes].sort((a, b) => a.z - b.z);
};
