import type { Scaling } from '$lib/index.js';

export const scaling: Scaling = $state({
	target: 0,
	velocity: 0,
	frame: null
})