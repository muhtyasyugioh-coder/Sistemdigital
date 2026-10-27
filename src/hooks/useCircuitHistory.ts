import { useState, useCallback, useRef } from 'react';
import { CircuitNode, WireConnection } from '../types/circuit';

export interface HistorySnapshot {
  nodes: CircuitNode[];
  wires: WireConnection[];
  circuitName: string;
  description?: string;
}

const MAX_HISTORY_STEPS = 50;

export function useCircuitHistory(initialSnapshot: HistorySnapshot) {
  const [past, setPast] = useState<HistorySnapshot[]>([]);
  const [present, setPresent] = useState<HistorySnapshot>(initialSnapshot);
  const [future, setFuture] = useState<HistorySnapshot[]>([]);

  // Ref to always access latest present inside callbacks without stale closures
  const presentRef = useRef<HistorySnapshot>(initialSnapshot);
  presentRef.current = present;

  const pastRef = useRef<HistorySnapshot[]>([]);
  pastRef.current = past;

  const futureRef = useRef<HistorySnapshot[]>([]);
  futureRef.current = future;

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  /**
   * Pushes a new snapshot into history, clearing the future stack.
   */
  const recordState = useCallback((newSnapshot: HistorySnapshot) => {
    const current = presentRef.current;

    // Check if new state has any actual meaningful change
    const nodesUnchanged =
      current.nodes.length === newSnapshot.nodes.length &&
      JSON.stringify(current.nodes) === JSON.stringify(newSnapshot.nodes);
    const wiresUnchanged =
      current.wires.length === newSnapshot.wires.length &&
      JSON.stringify(current.wires) === JSON.stringify(newSnapshot.wires);
    const nameUnchanged = current.circuitName === newSnapshot.circuitName;

    if (nodesUnchanged && wiresUnchanged && nameUnchanged) {
      return;
    }

    setPast(prevPast => {
      const updated = [...prevPast, current];
      if (updated.length > MAX_HISTORY_STEPS) {
        return updated.slice(updated.length - MAX_HISTORY_STEPS);
      }
      return updated;
    });

    setPresent(newSnapshot);
    setFuture([]); // Clear redo stack on new user modification
  }, []);

  /**
   * Reverts to the previous snapshot in the history stack.
   */
  const undo = useCallback((): HistorySnapshot | null => {
    if (pastRef.current.length === 0) return null;

    const previous = pastRef.current[pastRef.current.length - 1];
    const newPast = pastRef.current.slice(0, pastRef.current.length - 1);

    setPast(newPast);
    setFuture(prevFuture => [presentRef.current, ...prevFuture]);
    setPresent(previous);

    return previous;
  }, []);

  /**
   * Re-applies the next snapshot in the history stack.
   */
  const redo = useCallback((): HistorySnapshot | null => {
    if (futureRef.current.length === 0) return null;

    const next = futureRef.current[0];
    const newFuture = futureRef.current.slice(1);

    setFuture(newFuture);
    setPast(prevPast => [...prevPast, presentRef.current]);
    setPresent(next);

    return next;
  }, []);

  /**
   * Resets history completely (e.g. when opening a brand new preset or empty project)
   */
  const resetHistory = useCallback((newInitialSnapshot: HistorySnapshot) => {
    setPast([]);
    setPresent(newInitialSnapshot);
    setFuture([]);
  }, []);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    recordState,
    resetHistory,
    historyStats: {
      undoCount: past.length,
      redoCount: future.length,
    },
  };
}
