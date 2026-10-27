import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CircuitNode, WireConnection, GateType, CircuitData } from './types/circuit';
import { simulateCircuit, generateTruthTable } from './services/simulator';
import { PRESET_CIRCUITS } from './services/presets';
import { decodeCircuitFromHash } from './utils/urlSharing';
import { useCircuitHistory } from './hooks/useCircuitHistory';
import { Navbar } from './components/Navbar';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { TruthTableModal } from './components/TruthTableModal';
import { CodePlaygroundModal } from './components/CodePlaygroundModal';
import { ApiDocsModal } from './components/ApiDocsModal';
import { ShareModal } from './components/ShareModal';

export default function App() {
  const initialPreset = PRESET_CIRCUITS.basic_demo;
  const initialSimulated = simulateCircuit(initialPreset.nodes, initialPreset.wires);

  // Circuit State
  const [circuitName, setCircuitName] = useState(initialPreset.name);
  const [nodes, setNodes] = useState<CircuitNode[]>(initialSimulated.nodes);
  const [wires, setWires] = useState<WireConnection[]>(initialSimulated.wires);
  const [activePresetKey, setActivePresetKey] = useState<string>('basic_demo');

  // History State Manager
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    recordState,
    resetHistory,
  } = useCircuitHistory({
    nodes: initialSimulated.nodes,
    wires: initialSimulated.wires,
    circuitName: initialPreset.name,
  });

  // Transient Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 1500);
  }, []);

  // Canvas View Controls
  const [zoom, setZoom] = useState(1);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);

  // Simulation Clock
  const [isClockRunning, setIsClockRunning] = useState(false);

  // Modals & Panels
  const [isTruthTableOpen, setIsTruthTableOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isApiDocsOpen, setIsApiDocsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Hidden File Input for quick JSON import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial Load: check if URL contains shared circuit in hash
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const decoded = decodeCircuitFromHash(window.location.hash);
      if (decoded) {
        const name = decoded.name || 'Rangkaian Bersama';
        setCircuitName(name);
        const simulated = simulateCircuit(decoded.nodes, decoded.wires);
        setNodes(simulated.nodes);
        setWires(simulated.wires);
        setActivePresetKey('');
        resetHistory({
          nodes: simulated.nodes,
          wires: simulated.wires,
          circuitName: name,
        });
      }
    }
  }, [resetHistory]);

  // 2. Real-time simulation updates
  const updateSimulation = useCallback((currentNodes: CircuitNode[], currentWires: WireConnection[]) => {
    const result = simulateCircuit(currentNodes, currentWires);
    setNodes(result.nodes);
    setWires(result.wires);
  }, []);

  // 3. Apply modification and record in history
  const applyModification = useCallback(
    (nextNodes: CircuitNode[], nextWires: WireConnection[], name: string = circuitName) => {
      const simulated = simulateCircuit(nextNodes, nextWires);
      setNodes(simulated.nodes);
      setWires(simulated.wires);
      recordState({
        nodes: simulated.nodes,
        wires: simulated.wires,
        circuitName: name,
      });
    },
    [circuitName, recordState]
  );

  // Undo Handler
  const handleUndo = useCallback(() => {
    const previous = undo();
    if (previous) {
      const simulated = simulateCircuit(previous.nodes, previous.wires);
      setNodes(simulated.nodes);
      setWires(simulated.wires);
      if (previous.circuitName) setCircuitName(previous.circuitName);
      setSelectedNodeId(prev => (previous.nodes.some(n => n.id === prev) ? prev : null));
      setSelectedWireId(prev => (previous.wires.some(w => w.id === prev) ? prev : null));
      showToast('Urungkan (Undo)');
    }
  }, [undo, showToast]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    const next = redo();
    if (next) {
      const simulated = simulateCircuit(next.nodes, next.wires);
      setNodes(simulated.nodes);
      setWires(simulated.wires);
      if (next.circuitName) setCircuitName(next.circuitName);
      setSelectedNodeId(prev => (next.nodes.some(n => n.id === prev) ? prev : null));
      setSelectedWireId(prev => (next.wires.some(w => w.id === prev) ? prev : null));
      showToast('Ulangi (Redo)');
    }
  }, [redo, showToast]);

  // 4. Periodic Clock generator tick (does not pollute history with clock ticks)
  useEffect(() => {
    if (!isClockRunning) return;

    const interval = setInterval(() => {
      setNodes(prevNodes => {
        let clockToggled = false;
        const nextNodes = prevNodes.map(node => {
          if (node.type === 'INPUT_CLOCK') {
            clockToggled = true;
            const current = Boolean(node.state?.clockState);
            return {
              ...node,
              state: {
                ...node.state,
                clockState: !current,
              },
            };
          }
          return node;
        });

        if (clockToggled) {
          const simulated = simulateCircuit(nextNodes, wires);
          setWires(simulated.wires);
          return simulated.nodes;
        }
        return prevNodes;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isClockRunning, wires]);

  // Keyboard Shortcuts (Delete, Escape, Undo/Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Undo / Redo Shortcuts
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          return;
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          handleRedo();
          return;
        }
      }

      // Delete elements
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          handleDeleteNode(selectedNodeId);
        } else if (selectedWireId) {
          handleDeleteWire(selectedWireId);
        }
      } else if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setSelectedWireId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedWireId, handleUndo, handleRedo]);

  // Add Component to Canvas
  const handleAddComponent = (type: GateType, initialX?: number, initialY?: number) => {
    const id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const x = initialX !== undefined ? initialX : 280 + Math.random() * 100;
    const y = initialY !== undefined ? initialY : 180 + Math.random() * 80;

    let label = type.toString();
    const inputs: CircuitNode['inputs'] = [];
    const outputs: CircuitNode['outputs'] = [];
    const state: CircuitNode['state'] = {};

    if (type === 'INPUT_SWITCH') {
      label = `Switch ${nodes.filter(n => n.type === 'INPUT_SWITCH').length + 1}`;
      outputs.push({ id: `p_${id}_out`, name: 'Q', type: 'output', value: false });
      state.switchValue = false;
    } else if (type === 'INPUT_CLOCK') {
      label = `Clock 1Hz`;
      outputs.push({ id: `p_${id}_out`, name: 'CLK', type: 'output', value: false });
      state.clockState = false;
    } else if (type === 'OUTPUT_LED') {
      label = `LED ${nodes.filter(n => n.type === 'OUTPUT_LED').length + 1}`;
      inputs.push({ id: `p_${id}_in`, name: 'IN', type: 'input', value: false });
    } else if (type === 'OUTPUT_PROBE') {
      label = `Probe ${nodes.filter(n => n.type === 'OUTPUT_PROBE').length + 1}`;
      inputs.push({ id: `p_${id}_in`, name: 'IN', type: 'input', value: false });
    } else if (type === 'NOT') {
      label = 'NOT';
      inputs.push({ id: `p_${id}_in1`, name: 'A', type: 'input', value: false });
      outputs.push({ id: `p_${id}_out`, name: 'Y', type: 'output', value: true });
    } else {
      // 2-input gates (AND, OR, NAND, NOR, XOR, XNOR)
      inputs.push({ id: `p_${id}_in1`, name: 'A', type: 'input', value: false });
      inputs.push({ id: `p_${id}_in2`, name: 'B', type: 'input', value: false });
      outputs.push({ id: `p_${id}_out`, name: 'Y', type: 'output', value: false });
    }

    const newNode: CircuitNode = {
      id,
      type,
      label,
      x,
      y,
      inputs,
      outputs,
      state,
    };

    const nextNodes = [...nodes, newNode];
    setSelectedNodeId(id);
    setSelectedWireId(null);
    applyModification(nextNodes, wires);
  };

  // Move Node live while dragging
  const handleMoveNode = (id: string, x: number, y: number) => {
    setNodes(prev =>
      prev.map(node => (node.id === id ? { ...node, x, y } : node))
    );
  };

  // Commit Node Move on drag release
  const handleMoveNodeEnd = () => {
    recordState({
      nodes,
      wires,
      circuitName,
    });
  };

  // Delete Node
  const handleDeleteNode = (id: string) => {
    const nextNodes = nodes.filter(n => n.id !== id);
    const nextWires = wires.filter(w => w.fromNodeId !== id && w.toNodeId !== id);
    if (selectedNodeId === id) setSelectedNodeId(null);
    applyModification(nextNodes, nextWires);
  };

  // Delete Wire
  const handleDeleteWire = (wireId: string) => {
    const nextWires = wires.filter(w => w.id !== wireId);
    if (selectedWireId === wireId) setSelectedWireId(null);
    applyModification(nodes, nextWires);
  };

  // Toggle Input Switch
  const handleToggleSwitch = (nodeId: string) => {
    const nextNodes = nodes.map(node => {
      if (node.id === nodeId && node.type === 'INPUT_SWITCH') {
        const current = Boolean(node.state?.switchValue);
        return {
          ...node,
          state: {
            ...node.state,
            switchValue: !current,
          },
        };
      }
      return node;
    });

    applyModification(nextNodes, wires);
  };

  // Connect Wire
  const handleConnectWire = (
    fromNodeId: string,
    fromPortId: string,
    toNodeId: string,
    toPortId: string
  ) => {
    // Avoid self-connection on same node
    if (fromNodeId === toNodeId) return;

    const n1 = nodes.find(n => n.id === fromNodeId);
    const n2 = nodes.find(n => n.id === toNodeId);
    if (!n1 || !n2) return;

    let sourceNodeId = fromNodeId;
    let sourcePortId = fromPortId;
    let targetNodeId = toNodeId;
    let targetPortId = toPortId;

    const p1IsOutput = n1.outputs.some(p => p.id === fromPortId);
    const p2IsInput = n2.inputs.some(p => p.id === toPortId);

    if (!p1IsOutput || !p2IsInput) {
      // Check if user connected from input to output
      const p1IsInput = n1.inputs.some(p => p.id === fromPortId);
      const p2IsOutput = n2.outputs.some(p => p.id === toPortId);

      if (p1IsInput && p2IsOutput) {
        sourceNodeId = toNodeId;
        sourcePortId = toPortId;
        targetNodeId = fromNodeId;
        targetPortId = fromPortId;
      } else {
        showToast('Koneksi harus antara Output dan Input');
        return;
      }
    }

    // Digital logic rule: an input port can only receive from 1 driver
    // Remove any existing wire connected to this target input port
    const filteredWires = wires.filter(
      w => !(w.toNodeId === targetNodeId && w.toPortId === targetPortId)
    );

    const newWire: WireConnection = {
      id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fromNodeId: sourceNodeId,
      fromPortId: sourcePortId,
      toNodeId: targetNodeId,
      toPortId: targetPortId,
      signal: false,
    };

    const nextWires = [...filteredWires, newWire];
    applyModification(nodes, nextWires);
    showToast('Kabel berhasil terhubung');
  };

  // Load Preset
  const handleLoadPreset = (key: string) => {
    const preset = PRESET_CIRCUITS[key];
    if (!preset) return;

    setCircuitName(preset.name);
    setActivePresetKey(key);
    setSelectedNodeId(null);
    setSelectedWireId(null);
    applyModification(preset.nodes, preset.wires, preset.name);
  };

  // Load Circuit from Modal (Share/JSON)
  const handleLoadCircuit = (circuitData: CircuitData) => {
    const name = circuitData.name || 'Rangkaian Logika';
    setCircuitName(name);
    setActivePresetKey('');
    setSelectedNodeId(null);
    setSelectedWireId(null);
    applyModification(circuitData.nodes, circuitData.wires, name);
  };

  // Clear Canvas
  const handleClearCanvas = () => {
    setSelectedNodeId(null);
    setSelectedWireId(null);
    setActivePresetKey('');
    applyModification([], [], 'Kanvas Kosong');
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(2.0, +(prev + 0.1).toFixed(2)));
  const handleZoomOut = () => setZoom(prev => Math.max(0.4, +(prev - 0.1).toFixed(2)));
  const handleResetZoom = () => setZoom(1);

  // Quick JSON export download
  const handleDirectExportJson = () => {
    const currentCircuitData: CircuitData = {
      version: '1.0.0',
      name: circuitName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes,
      wires,
    };
    const jsonStr = JSON.stringify(currentCircuitData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${circuitName.toLowerCase().replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Quick JSON file input trigger
  const handleDirectImportJson = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.nodes) && Array.isArray(parsed.wires)) {
          handleLoadCircuit(parsed);
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Current circuit data object for modals
  const currentCircuitData: CircuitData = {
    version: '1.0.0',
    name: circuitName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes,
    wires,
  };

  const truthTableData = generateTruthTable(nodes, wires);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-slate-100 overflow-hidden relative">
      {/* Hidden File Input for JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="bg-slate-900/95 border border-sky-500/40 text-sky-300 text-xs font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur-md">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <Navbar
        onOpenTruthTable={() => setIsTruthTableOpen(true)}
        onOpenCodePlayground={() => setIsCodeModalOpen(true)}
        onOpenApiDocs={() => setIsApiDocsOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Workspace Action Toolbar */}
      <Toolbar
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(prev => !prev)}
        isClockRunning={isClockRunning}
        onToggleClock={() => setIsClockRunning(prev => !prev)}
        hasSelection={Boolean(selectedNodeId || selectedWireId)}
        onDeleteSelected={() => {
          if (selectedNodeId) handleDeleteNode(selectedNodeId);
          if (selectedWireId) handleDeleteWire(selectedWireId);
        }}
        onClearCanvas={handleClearCanvas}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenTruthTable={() => setIsTruthTableOpen(true)}
        onOpenCodePlayground={() => setIsCodeModalOpen(true)}
        onOpenApiDocs={() => setIsApiDocsOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onExportJson={handleDirectExportJson}
        onImportJson={handleDirectImportJson}
        circuitName={circuitName}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Workspace: Sidebar Palette + Drag-and-Drop Canvas */}
      <main className="flex-1 flex overflow-hidden relative">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onAddComponent={(type) => handleAddComponent(type)}
          onLoadPreset={handleLoadPreset}
          activePresetKey={activePresetKey}
        />

        <Canvas
          nodes={nodes}
          wires={wires}
          zoom={zoom}
          snapToGrid={snapToGrid}
          selectedNodeId={selectedNodeId}
          selectedWireId={selectedWireId}
          onSelectNode={setSelectedNodeId}
          onSelectWire={setSelectedWireId}
          onMoveNode={handleMoveNode}
          onMoveNodeEnd={handleMoveNodeEnd}
          onDeleteNode={handleDeleteNode}
          onDeleteWire={handleDeleteWire}
          onToggleSwitch={handleToggleSwitch}
          onConnectWire={handleConnectWire}
          onDropComponent={handleAddComponent}
          onSetZoom={setZoom}
        />
      </main>

      {/* Modals */}
      <TruthTableModal
        isOpen={isTruthTableOpen}
        onClose={() => setIsTruthTableOpen(false)}
        truthTable={truthTableData}
        currentNodes={nodes}
      />

      <CodePlaygroundModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        nodes={nodes}
        wires={wires}
      />

      <ApiDocsModal
        isOpen={isApiDocsOpen}
        onClose={() => setIsApiDocsOpen(false)}
        nodes={nodes}
        wires={wires}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        circuit={currentCircuitData}
        onLoadCircuit={handleLoadCircuit}
      />
    </div>
  );
}
