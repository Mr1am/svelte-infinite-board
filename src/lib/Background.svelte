<script module lang="ts">
	export const svgToUri = (svg: string) =>
		`url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

	export type Scope = { scale?: number; size?: number; bg?: string | null };

	export function getCurrentScope(scale: number, list?: Scope[]) {
		if (!Array.isArray(list) || list.length === 0) {
			return { scale: 0, size: 128, bg: null };
		}
		const sorted = [...list].sort((a, b) => (a.scale ?? 0) - (b.scale ?? 0));
		let pick = sorted[0];
		for (const s of sorted) {
			if ((scale ?? 0) >= (s.scale ?? 0)) pick = s;
			else break;
		}
		return pick;
	}
</script>

<script lang="ts">
	import { fade } from 'svelte/transition';
	interface Props {
		scale?: number;
		x?: number;
		y?: number;
		scopes?: Scope[];
		fadeDuration?: number;
		children?: import('svelte').Snippet;
	}

	let {
		scale = 1,
		x = 0,
		y = 0,
		scopes = [
			{
				scale: 1,
				size: 256,
				bg: `#111`
			}
		],
		fadeDuration = 400,
		...rest
	}: Props = $props();

	let currentScope = $derived(getCurrentScope(scale ?? 1, scopes));

	const bgPattern = $derived.by(() => {
		if (!currentScope.bg) return '';
		if (currentScope.bg.startsWith('<svg')) return `background-image: ${svgToUri(currentScope.bg)}`;
		return `background-color: ${currentScope.bg}`;
	})
	const bgSize = $derived(scale * (currentScope.size ?? 128));
</script>

{#key currentScope}
	<div
		transition:fade={{ duration: fadeDuration }}
		style='background-size: {bgSize}px; background-position: {x}px {y}px; {bgPattern}'
		aria-hidden="true"
		{...rest}
	></div>
{/key}

<style>
	div {
		position: absolute;
		inset: 0;
		pointer-events: none;
		user-select: none;
		background-repeat: repeat;
	}
</style>
