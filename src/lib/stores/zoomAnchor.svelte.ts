import type { ZoomAnchor } from '$lib/index.js';

export function createZoomAnchor(initial?: Partial<ZoomAnchor>) {
	const defaults: ZoomAnchor = {
		x: 0,
		y: 0
	}

	const setZoomAnchor = (values: Partial<ZoomAnchor>) => {
		for (const key in values) {
			if (key in zoomAnchor) (zoomAnchor as any)[key] = values[key as keyof ZoomAnchor];
		}
	};

	const zoomAnchor: ZoomAnchor = $state({ ...defaults, ...(initial ?? {}) });

	return { zoomAnchor, setZoomAnchor };
}
