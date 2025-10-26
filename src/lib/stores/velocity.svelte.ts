import type { Velocity } from '$lib/index.js';

export function createVelocity(x = 0, y = 0, friction = 0.92) {
	let animationFrame = 0;
	let onInertiaCallback: (() => void) | null = null;
	let onInertiaEndCallback: (() => void) | null = null;

	const velocity = $state({ x, y });

	const setVelocity = (values: Partial<Velocity>) => {
		Object.assign(velocity, values);
	}

	const cancelVelocity = () => {
		if (animationFrame) cancelAnimationFrame(animationFrame);
	}

	const inertia = () => {
		cancelVelocity();

		const step = () => {
			onInertiaCallback?.();

			velocity.x *= friction;
			velocity.y *= friction;

			if (Math.abs(velocity.x) > 0.0001 || Math.abs(velocity.y) > 0.0001) {
				animationFrame = requestAnimationFrame(step);
			} else {
				setVelocity({ x: 0, y: 0 });
				animationFrame = 0;
				onInertiaEndCallback?.();
			}
		};

		animationFrame = requestAnimationFrame(step);
	};

	return {
		velocity,
		setVelocity,
		cancelVelocity,
		inertia,
		onInertia(cb: () => void) {
			onInertiaCallback = cb;
			return this;
		},
		onInertiaEnd(cb: () => void) {
			onInertiaEndCallback = cb;
			return this;
		}
	};
}