import type { Pinch } from '$lib/index.js';

export function createPinch(initial?: Partial<Pinch>) {
	const defaults: Pinch = {
		distance: 0,
		scale: 1,
		centerX: 0,
		centerY: 0,
		offsetX: 0,
		offsetY: 0
	};

	const setPinch = (values: Partial<Pinch>) => {
		for (const key in values) {
			if (key in pinch) (pinch as any)[key] = values[key as keyof Pinch];
		}
	};

	const pinch: Pinch = $state({ ...defaults, ...(initial ?? {}) });

	return { pinch, setPinch };
}
