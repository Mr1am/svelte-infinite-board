import type { Drag } from '$lib/index.js';

export function createDrag(initial?: Partial<Drag>) {
	const defaults: Drag = {
		happens: false,
		startX: 0,
		startY: 0,
		lastX: 0,
		lastY: 0
	}
	const setDrag = (values: Partial<Drag>) => {
		for (const key in values) {
			if (key in drag) (drag as any)[key] = values[key as keyof Drag];
		}
	};

	const drag: Drag = $state({ ...defaults, ...(initial ?? {}) });

	return { drag, setDrag };
}
