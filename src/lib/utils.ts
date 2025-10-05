export function clamp(value: number, max: number, min: number) {
	return Math.min(Math.max(value, max), min);
}

export function rubber(over: number, exponent: number = 0.25, stretch: number = 0.5) {
	const s = Math.sign(over) || 1;
	const a = Math.abs(over);
	return s * Math.pow(a, exponent) * stretch;
}