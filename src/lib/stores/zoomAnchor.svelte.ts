import type { ZoomAnchor } from '$lib/index.js';

export function createZoomAnchor(initial?: Partial<ZoomAnchor>) {
	const defaults: ZoomAnchor = {
		x: 0,
		y: 0
	};

	const setZoomAnchor = (values: Partial<ZoomAnchor>) => {
		Object.assign(zoomAnchor, values);
	};

	const zoomAnchor: ZoomAnchor = $state({ ...defaults, ...(initial ?? {}) });

	return { zoomAnchor, setZoomAnchor };
}
