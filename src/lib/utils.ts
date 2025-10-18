export function clamp(value: number, max: number, min: number) {
	return Math.min(Math.max(value, max), min);
}

export function rubber(over: number, exponent: number = 0.25, stretch: number = 0.5) {
	const s = Math.sign(over) || 1;
	const a = Math.abs(over);
	return s * Math.pow(a, exponent) * stretch;
}

export function setupPinch(touches: Touch[], element: HTMLElement) {
	const rect = element!.getBoundingClientRect();
	const x = (touches[0].clientX + touches[1].clientX) / 2 - rect.left;
	const y = (touches[0].clientY + touches[1].clientY) / 2 - rect.top;

	const distance = Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY);

	return { x, y, distance };
}
