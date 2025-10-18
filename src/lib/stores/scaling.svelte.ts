import type { Scaling } from '$lib/index.js';

export function createScaling(initial?: Partial<Scaling>) {
	const defaults: Scaling = {
		target: 0,
		velocity: 0,
		frame: null
	}

	const setScaling = (values: Partial<Scaling>) => {
		for (const key in values) {
			if (key in scaling) (scaling as any)[key] = values[key as keyof Scaling];
		}
	}

	const stopScaling = () => {
		if (scaling.frame) {
			cancelAnimationFrame(scaling.frame);
			scaling.frame = null;
		}
		scaling.velocity = 0;
	}

	const scaling: Scaling = $state({ ...defaults, ...(initial ?? {}) });

	return { scaling, setScaling, stopScaling }
}