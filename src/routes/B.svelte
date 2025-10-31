<script lang="ts">
	import { Board, type Textable } from '$lib/index.js';
	import Selection from './Selection.svelte';
	import { nodes, sortedNodes } from './nodes.svelte.js';
	import { selectedIds, selecting, clearSelection, setSelection, toggleSelection, selectInRect } from './selection.svelte.js';
	import { history } from './history.svelte.js';
	import { createNodeCommand, deleteNodesCommand, moveNodesCommand, resizeNodesCommand, groupNodesCommand } from './commands.svelte.js';
	import { hitTest, generateId, getSelectedNodes } from './utils.js';

	let {tool = 'select'}: {tool: 'select' | 'rect' | 'text'} = $props();

	let board: any = null;
	let sel: any = null;

	let startEvent: MouseEvent | TouchEvent | null = null;
	let startPos = $state<{ x: number; y: number } | null>(null);
	let currentPos = $state<{ x: number; y: number } | null>(null);
	let dragStart = $state<{ x: number; y: number } | null>(null);
	let isDragging = $state(false);
	let resizeCorner: 'tl' | 'tr' | 'bl' | 'br' | null = null;
	let selectionStarted = $state(false);
	let threshold = 8;
	let b = null;

	function toBoard(e: MouseEvent | TouchEvent) {
		if (!board) return { x: 0, y: 0 };
		const rect = b.getBoundingClientRect();
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
		return board.screenToBoard(clientX - rect.left, clientY - rect.top);
	}

	function handlePanStart(e: any) {
		if (e.button === 2 || e.touches?.length > 1) return;
		startEvent = e;
		const pos = toBoard(e);
		startPos = { x: pos.x, y: pos.y };
		currentPos = { x: pos.x, y: pos.y };
		selectionStarted = false;

		if (tool === 'select') {
			const hit = hitTest(sortedNodes(), pos.x, pos.y);
			if (hit) {
				const append = e.ctrlKey || e.metaKey || e.shiftKey;
				toggleSelection(hit.id, append);
				const node = hit;
				dragStart = { x: pos.x - node.x, y: pos.y - node.y };
				isDragging = true;
				return;
			}
		}

		if (tool === 'rect') {
			return;
		}
	}

	function handlePan(e: any) {
		if (!startPos || !currentPos) return;
		const pos = toBoard(e);
		currentPos = { x: pos.x, y: pos.y };

		const dx = Math.abs(pos.x - startPos.x);
		const dy = Math.abs(pos.y - startPos.y);

		if (!selectionStarted && dx > threshold && tool === 'select' && !isDragging) {
			selectionStarted = true;
			sel.enter(startEvent);
			selecting.happens = (true);
		}

		if (selectionStarted) {
			sel.update(e);
		}

		if (isDragging && selectedIds.length > 0) {
			const first = sortedNodes().find(n => n.id === selectedIds[0]);
			if (first && dragStart) {
				const deltaX = pos.x - dragStart.x - first.x;
				const deltaY = pos.y - dragStart.y - first.y;
			}
		}

		if (tool === 'rect' && dx > threshold) {
		}
	}

	function handlePanEnd(e: any) {
		if (!startPos || !currentPos) return;

		const endPos = toBoard(e);
		const dx = Math.abs(endPos.x - startPos.x);
		const dy = Math.abs(endPos.y - startPos.y);

		if (selectionStarted) {
			sel.end();
			const rect = sel.selection;
			if (rect.start && rect.end) {
				const boardRect = {
					x: Math.min(rect.start.x!, rect.end.x!),
					y: Math.min(rect.start.y!, rect.end.y!),
					w: Math.abs(rect.end.x! - rect.start.x!),
					h: Math.abs(rect.end.y! - rect.start.y!),
				};
				const append = e.ctrlKey || e.metaKey || e.shiftKey;
				selectInRect(boardRect, append, true);
			}
			selecting.happens = (false);
			selectionStarted = false;
		}

		else if (dx <= threshold && dy <= threshold && tool === 'select') {
			const hit = hitTest(sortedNodes(), startPos.x, startPos.y);
			const append = e.ctrlKey || e.metaKey || e.shiftKey;
			if (hit) {
				toggleSelection(hit.id, append);
			} else {
				if (!append) clearSelection();
			}
		}

		if (isDragging && selectedIds.length > 0) {
			const first = sortedNodes().find(n => n.id === selectedIds[0]);
			if (first && startPos) {
				const dx = endPos.x - startPos.x;
				const dy = endPos.y - startPos.y;
				if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
					history.add(moveNodesCommand(selectedIds, dx, dy));
				}
			}
		}

		if (tool === 'rect' && dx > 10 && dy > 10) {
			const node: Textable = {
				id: generateId(),
				type: 'textable',
				x: Math.min(startPos.x, endPos.x),
				y: Math.min(startPos.y, endPos.y),
				w: Math.abs(endPos.x - startPos.x),
				h: Math.abs(endPos.y - startPos.y),
				z: Math.max(...sortedNodes().map(n => n.z), 0) + 1,
				content: '',
				styles: { bg: '#fffbe6', fg: '#000', outline: { color: '#000', width: 1 } },
			};
			history.add(createNodeCommand(node));
		}

		startPos = null;
		currentPos = null;
		dragStart = null;
		isDragging = false;
		resizeCorner = null;
	}

	function handleResizeStart(corner: 'tl' | 'tr' | 'bl' | 'br', e: MouseEvent) {
		e.stopPropagation();
		resizeCorner = corner;
		const pos = toBoard(e);
		startPos = { x: pos.x, y: pos.y };
	}

		const handleKey = (e: KeyboardEvent) => {
			if (selectedIds.length === 0) return;
			if (e.key === 'Delete') {
				e.preventDefault();
				history.add(deleteNodesCommand(selectedIds));
				clearSelection();
			}
			if (e.key === 'g' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				if (selectedIds.length > 1) {
					history.add(groupNodesCommand(selectedIds));
					clearSelection();
				}
			}
			if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				if (e.shiftKey) history.redo();
				else history.undo();
			}
			if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				history.redo();
			}
		};

	let isSelecting = $derived(selecting.happens);
</script>

<svelte:window onkeydown={handleKey}></svelte:window>

<Board
	bind:this={board}
	bind:board={b}
	mousePan={!selecting && !isDragging}
	singleTouchPan={!selecting && !isDragging}
	doubleTouchPan={true}
	onPanStart={handlePanStart}
	onPan={handlePan}
	onPanEnd={handlePanEnd}
>
	{#each sortedNodes() as node (node.id)}
		{@const isSelected = selectedIds.includes(node.id)}
		{@const inGroup = node.group !== undefined}
		<div
			style:position="absolute"
			style:left={`${node.x}px`}
			style:top={`${node.y}px`}
			style:width={`${node.w}px`}
			style:height={`${node.h}px`}
			style:background={node.type === 'textable' ? node.styles.bg : (node.type === 'group' ? node.styles.bg : 'transparent')}
			style:border={`1px solid ${isSelected ? '#3b82f6' : (node.styles?.outline?.color || 'transparent')}`}
			style:z-index={node.z}
			style:padding={node.type === 'textable' ? '0.5rem' : '0'}
			style:cursor={tool === 'select' ? 'move' : 'crosshair'}
			class:selected={isSelected}
			class:group={node.type === 'group'}
		>
			{#if node.type === 'textable'}
				<div contenteditable={isSelected} style:color={node.styles.fg}>
					{node.content}
				</div>
			{:else if node.type === 'group'}
				{node.title}
			{/if}

			{#if isSelected && tool === 'select'}
				<div class="handles">
					<div class="handle tl" onmousedown={(e) => handleResizeStart('tl', e)}></div>
					<div class="handle tr" onmousedown={(e) => handleResizeStart('tr', e)}></div>
					<div class="handle bl" onmousedown={(e) => handleResizeStart('bl', e)}></div>
					<div class="handle br" onmousedown={(e) => handleResizeStart('br', e)}></div>
				</div>
			{/if}
		</div>
	{/each}
</Board>

<Selection
	board={board}
	bind:selecting={isSelecting}
	bind:this={sel}
	scroll={{ threshold: 50, speed: 15 }}
/>

<style>
	.selected {
		outline: 2px solid #3b82f6;
		outline-offset: -1px;
	}
	.group {
		border-style: dashed;
	}
	.handles {
		position: absolute;
		inset: -4px;
		pointer-events: none;
	}
	.handle {
		position: absolute;
		width: 8px;
		height: 8px;
		background: white;
		border: 1px solid #3b82f6;
		pointer-events: all;
	}
	.tl { top: 0; left: 0; cursor: nwse-resize; }
	.tr { top: 0; right: 0; cursor: nesw-resize; }
	.bl { bottom: 0; left: 0; cursor: nesw-resize; }
	.br { bottom: 0; right: 0; cursor: nwse-resize; }
</style>