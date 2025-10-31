export interface Action {
	undo: () => void;
	redo: () => void;
}

export function useUndoRedo<T>(initialState: T) {
	let history = $state<Action[]>([]);
	let future = $state<Action[]>([]);
	let current = $state(initialState);

	function push(action: Action) {
		history.push(action);
		future = [];
		action.redo();
	}

	function undo() {
		if (history.length === 0) return;
		const action = history.pop()!;
		future.push(action);
		action.undo();
	}

	function redo() {
		if (future.length === 0) return;
		const action = future.pop()!;
		history.push(action);
		action.redo();
	}

	function clear() {
		history = [];
		future = [];
	}

	return {
		push,
		undo,
		redo,
		clear,
		get canUndo() {
			return history.length > 0;
		},
		get canRedo() {
			return future.length > 0;
		}
	};
}
