import type { Scaling } from '$lib/index.js';

export function createScaling(
	target = 0,
	velocity = 0,
	frame = 0,
	stiffness = 0.15,
	damping = 0.8
) {
	let onScaleCallback: ((scale: Scaling) => void) | null = null;
	let onScaleEndCallback: ((scale: Scaling) => void) | null = null;

	const setScaling = (values: Partial<Scaling>) => {
		Object.assign(scaling, values);
	};

	function startScaleSpring() {
		if (scaling.frame) cancelAnimationFrame(scaling.frame);

		function step() {
			const diff = scaling.target - scaling.current;
			scaling.velocity += diff * stiffness;
			scaling.velocity *= damping;

			onScaleCallback?.(scaling);

			if (Math.abs(diff) < 0.0001 && Math.abs(scaling.velocity) < 0.0001) {
				onScaleEndCallback?.(scaling);
				setScaling({ velocity: 0, frame: null, current: scaling.target });
				return;
			}

			scaling.frame = requestAnimationFrame(step);
		}

		scaling.frame = requestAnimationFrame(step);
	}

	$effect(() => {
		const hasDiff = Math.abs(scaling.target - scaling.current) > 0.0001;
		const hasVelocity = Math.abs(scaling.velocity) > 0.0001;

		if ((hasDiff || hasVelocity) && !scaling.frame) startScaleSpring();
	});

	const stopScaling = () => {
		if (scaling.frame) {
			cancelAnimationFrame(scaling.frame);
			scaling.frame = null;
		}
		scaling.velocity = 0;
	};

	const scaling: Scaling = $state({ target, velocity, frame, current: target });

	return {
		scaling,
		setScaling,
		stopScaling,
		onScale(cb: (scale: Scaling) => void) {
			onScaleCallback = cb;
			return this;
		},
		onScaleEnd(cb: (scale: Scaling) => void) {
			onScaleEndCallback = cb;
			return this;
		}
	};
}
