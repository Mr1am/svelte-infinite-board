import type { Velocity } from '$lib/index.js';

export function createVelocity(initial?: Partial<Velocity>) {
	const defaults: Velocity = {
		x: 0,
		y: 0
	}

	const setVelocity = (values: Partial<Velocity>) => {
		for (const key in values) {
			if (key in velocity) (velocity as any)[key] = values[key as keyof Velocity];
		}
	};

	const velocity: Velocity = $state({ ...defaults, ...(initial ?? {}) });

	return { velocity, setVelocity };
}
