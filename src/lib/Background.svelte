<script lang="ts">
	import { fade, type FadeParams } from 'svelte/transition';
	import { getCurrentScope, svgToUri, type BgScope } from '$lib/utils.js';
	interface Props {
		scopes?: BgScope[];
		bgParams?: FadeParams;
		x: number;
		y: number;
		scale: number;
		children?: import('svelte').Snippet;
	}

	let {
		scopes = [
			{
				scale: 1,
				size: 256,
				bg: `#111`
			}
		],
		bgParams = { duration: 400 },
		x,
		y,
		scale,
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
		transition:fade={bgParams}
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
