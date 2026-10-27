import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CircuitNode, WireConnection, GateType } from '../types/circuit';
import { GateNode } from './GateNode';
import { WireOverlay } from './WireOverlay';
import { MiniMap } from './MiniMap';

interface CanvasProps {
  nodes: CircuitNode[];
  wires: WireConnection[];
  zoom: number;
  snapToGrid: boolean;
  selectedNodeId: string | null;
  selectedWireId: string | null;
  onSelectNode: (id: string | null) => void;
  onSelectWire: (id: string | null) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onMoveNodeEnd?: () => void;
  onDeleteNode: (id: string) => void;
  onDeleteWire: (id: string) => void;
  onToggleSwitch: (id: string) => void;
  onConnectWire: (fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string) => void;
  onDropComponent: (type: GateType, x: number, y: number) => void;
  onSetZoom?: (zoom: number) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  nodes,
  wires,
  zoom,
  snapToGrid,
  selectedNodeId,
  selectedWireId,
  onSelectNode,
  onSelectWire,
  onMoveNode,
  onMoveNodeEnd,
  onDeleteNode,
  onDeleteWire,
  onToggleSwitch,
  onConnectWire,
  onDropComponent,
  onSetZoom,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas Dimensions
  const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 1000,
          height: containerRef.current.clientHeight || 700,
        });
      }
    };
    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Pan offsets
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);
  const initialPinchZoomRef = useRef<number>(1);

  // Fit entire circuit into visible view
  const handleFitView = useCallback(() => {
    if (nodes.length === 0) {
      setPan({ x: 40, y: 40 });
      if (onSetZoom) onSetZoom(1);
      return;
    }

    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x + 110));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y + 84));

    const circuitWidth = maxX - minX + 160;
    const circuitHeight = maxY - minY + 160;

    const fitZoom = Math.min(
      1.5,
      Math.max(0.4, Math.min(dimensions.width / circuitWidth, dimensions.height / circuitHeight))
    );

    const targetCenterX = (minX + maxX) / 2;
    const targetCenterY = (minY + maxY) / 2;

    const newPanX = dimensions.width / 2 - targetCenterX * fitZoom;
    const newPanY = dimensions.height / 2 - targetCenterY * fitZoom;

    setPan({ x: newPanX, y: newPanY });
    if (onSetZoom) onSetZoom(+fitZoom.toFixed(2));
  }, [nodes, dimensions, onSetZoom]);

  // Node Dragging
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartPosRef = useRef<{ id: string; x: number; y: number } | null>(null);

  // Connecting Wire State (Supports BOTH click-to-connect AND drag-to-connect)
  const [connectingSource, setConnectingSource] = useState<{
    nodeId: string;
    portId: string;
    portType: 'output' | 'input';
    startX: number;
    startY: number;
  } | null>(null);

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingWireRef = useRef(false);
  const wireDragStartMouseRef = useRef<{ x: number; y: number } | null>(null);

  // Calculate precise center coordinates for any port
  const getPortCenter = (nodeId: string, portId: string, portType: 'output' | 'input') => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const cardWidth = 110;
    const cardHeight = 84;

    let portYOffset = 0.5;
    if (portType === 'output') {
      const idx = node.outputs.findIndex(p => p.id === portId);
      const total = node.outputs.length;
      portYOffset = total <= 1 ? 0.5 : (idx + 1) / (total + 1);
    } else {
      const idx = node.inputs.findIndex(p => p.id === portId);
      const total = node.inputs.length;
      portYOffset = total === 1 ? 0.5 : total === 2 ? (idx === 0 ? 0.32 : 0.68) : (idx + 1) / (total + 1);
    }

    const x = portType === 'output' ? node.x + cardWidth : node.x;
    const y = node.y + cardHeight * portYOffset;

    return { x, y };
  };

  // Cancel connecting with Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && connectingSource) {
        setConnectingSource(null);
        setMousePos(null);
        isDraggingWireRef.current = false;
        wireDragStartMouseRef.current = null;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [connectingSource]);

  // Handle Dragging Node (Mouse Down on Node Card)
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    // If user was in click-to-connect mode, clicking the node background does not drag
    if (connectingSource) {
      e.stopPropagation();
      return;
    }

    e.stopPropagation();
    onSelectNode(nodeId);
    onSelectWire(null);

    const node = nodes.find(n => n.id === nodeId);
    if (!node || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseCanvasX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - rect.top - pan.y) / zoom;

    dragOffsetRef.current = {
      x: mouseCanvasX - node.x,
      y: mouseCanvasY - node.y,
    };
    dragStartPosRef.current = {
      id: nodeId,
      x: node.x,
      y: node.y,
    };
    setDraggingNodeId(nodeId);
  };

  // Handle Touch on Node Card (Dragging node on mobile/tablet)
  const handleNodeTouchStart = (e: React.TouchEvent, nodeId: string) => {
    if (connectingSource) {
      e.stopPropagation();
      return;
    }

    e.stopPropagation();
    onSelectNode(nodeId);
    onSelectWire(null);

    const touch = e.touches[0];
    if (!touch || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touchCanvasX = (touch.clientX - rect.left - pan.x) / zoom;
    const touchCanvasY = (touch.clientY - rect.top - pan.y) / zoom;

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    dragOffsetRef.current = {
      x: touchCanvasX - node.x,
      y: touchCanvasY - node.y,
    };
    dragStartPosRef.current = {
      id: nodeId,
      x: node.x,
      y: node.y,
    };
    setDraggingNodeId(nodeId);
  };

  // Port Touch: handles touch tap for connecting wire
  const handlePortTouch = (
    e: React.TouchEvent,
    targetNodeId: string,
    targetPortId: string,
    targetPortType: 'output' | 'input'
  ) => {
    handlePortClick(e as any, targetNodeId, targetPortId, targetPortType);
  };

  // Port MouseDown: initiates potential drag-to-connect
  const handlePortMouseDown = (
    e: React.MouseEvent,
    nodeId: string,
    portId: string,
    portType: 'output' | 'input'
  ) => {
    e.stopPropagation();
    const pos = getPortCenter(nodeId, portId, portType);

    wireDragStartMouseRef.current = { x: e.clientX, y: e.clientY };
    isDraggingWireRef.current = false;

    // Set initial source if not already active
    if (!connectingSource) {
      setConnectingSource({
        nodeId,
        portId,
        portType,
        startX: pos.x,
        startY: pos.y,
      });
      setMousePos({ x: pos.x, y: pos.y });
    }
  };

  // Port MouseUp: completes drag-to-connect if user dragged to a target port
  const handlePortMouseUp = (
    e: React.MouseEvent,
    targetNodeId: string,
    targetPortId: string,
    targetPortType: 'output' | 'input'
  ) => {
    e.stopPropagation();

    if (connectingSource && isDraggingWireRef.current) {
      // Must be different nodes and opposite port types
      if (
        connectingSource.nodeId !== targetNodeId &&
        connectingSource.portType !== targetPortType
      ) {
        onConnectWire(
          connectingSource.nodeId,
          connectingSource.portId,
          targetNodeId,
          targetPortId
        );
      }
      setConnectingSource(null);
      setMousePos(null);
      isDraggingWireRef.current = false;
      wireDragStartMouseRef.current = null;
    }
  };

  // Port Click: handles click-to-connect mode
  const handlePortClick = (
    e: React.MouseEvent,
    targetNodeId: string,
    targetPortId: string,
    targetPortType: 'output' | 'input'
  ) => {
    e.stopPropagation();

    // If it was already completed by mouseUp from a drag gesture, ignore
    if (isDraggingWireRef.current) {
      isDraggingWireRef.current = false;
      wireDragStartMouseRef.current = null;
      return;
    }

    if (!connectingSource) {
      // 1. Start click-to-connect mode
      const pos = getPortCenter(targetNodeId, targetPortId, targetPortType);
      setConnectingSource({
        nodeId: targetNodeId,
        portId: targetPortId,
        portType: targetPortType,
        startX: pos.x,
        startY: pos.y,
      });
      setMousePos({ x: pos.x, y: pos.y });
    } else {
      // 2. Already connecting
      if (
        connectingSource.nodeId === targetNodeId &&
        connectingSource.portId === targetPortId
      ) {
        // Clicked same port again -> cancel
        setConnectingSource(null);
        setMousePos(null);
        return;
      }

      if (
        connectingSource.nodeId !== targetNodeId &&
        connectingSource.portType !== targetPortType
      ) {
        // Valid target -> connect!
        onConnectWire(
          connectingSource.nodeId,
          connectingSource.portId,
          targetNodeId,
          targetPortId
        );
        setConnectingSource(null);
        setMousePos(null);
      } else if (connectingSource.portType === targetPortType) {
        // Clicked another port of the same type -> switch source to this port
        const pos = getPortCenter(targetNodeId, targetPortId, targetPortType);
        setConnectingSource({
          nodeId: targetNodeId,
          portId: targetPortId,
          portType: targetPortType,
          startX: pos.x,
          startY: pos.y,
        });
        setMousePos({ x: pos.x, y: pos.y });
      }
    }
  };

  // Mouse Move over Canvas
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    const mouseCanvasX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - rect.top - pan.y) / zoom;

    if (draggingNodeId) {
      let newX = mouseCanvasX - dragOffsetRef.current.x;
      let newY = mouseCanvasY - dragOffsetRef.current.y;

      if (snapToGrid) {
        newX = Math.round(newX / 20) * 20;
        newY = Math.round(newY / 20) * 20;
      }

      onMoveNode(draggingNodeId, Math.max(0, newX), Math.max(0, newY));
      return;
    }

    if (connectingSource) {
      setMousePos({
        x: mouseCanvasX,
        y: mouseCanvasY,
      });

      if (wireDragStartMouseRef.current) {
        const dist = Math.hypot(
          e.clientX - wireDragStartMouseRef.current.x,
          e.clientY - wireDragStartMouseRef.current.y
        );
        if (dist > 4) {
          isDraggingWireRef.current = true;
        }
      }
    }
  };

  // Mouse Up on Canvas
  const handleMouseUp = () => {
    setIsPanning(false);

    // Commit node move if dragged
    if (draggingNodeId && dragStartPosRef.current && onMoveNodeEnd) {
      const currentNode = nodes.find(n => n.id === draggingNodeId);
      if (
        currentNode &&
        (currentNode.x !== dragStartPosRef.current.x ||
          currentNode.y !== dragStartPosRef.current.y)
      ) {
        onMoveNodeEnd();
      }
    }
    dragStartPosRef.current = null;
    setDraggingNodeId(null);

    // If user was dragging a wire and released in empty space, cancel
    if (isDraggingWireRef.current) {
      setConnectingSource(null);
      setMousePos(null);
      isDraggingWireRef.current = false;
      wireDragStartMouseRef.current = null;
    }
  };

  // Canvas background mousedown (pan or deselect)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // If in connecting mode, clicking background cancels the draft wire
    if (connectingSource) {
      setConnectingSource(null);
      setMousePos(null);
      isDraggingWireRef.current = false;
      wireDragStartMouseRef.current = null;
      return;
    }

    if (e.button === 0 || e.button === 1) {
      onSelectNode(null);
      onSelectWire(null);
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      };
    }
  };

  // HTML5 Drag and Drop from Sidebar
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/logikalab-type') as GateType;
    if (!type || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let dropX = (e.clientX - rect.left - pan.x) / zoom;
    let dropY = (e.clientY - rect.top - pan.y) / zoom;

    if (snapToGrid) {
      dropX = Math.round(dropX / 20) * 20;
      dropY = Math.round(dropY / 20) * 20;
    }

    onDropComponent(type, Math.max(20, dropX - 55), Math.max(20, dropY - 42));
  };

  // Active Draft Wire calculation
  const draftWireData =
    connectingSource && mousePos
      ? {
          startX: connectingSource.startX,
          startY: connectingSource.startY,
          currentX: mousePos.x,
          currentY: mousePos.y,
          isFromOutput: connectingSource.portType === 'output',
        }
      : null;

  // Touch Start on Canvas (single touch pan or pinch-zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      initialPinchDistRef.current = dist;
      initialPinchZoomRef.current = zoom;
      setIsPanning(false);
      setDraggingNodeId(null);
      return;
    }

    if (e.touches.length === 1) {
      if (connectingSource) {
        setConnectingSource(null);
        setMousePos(null);
        return;
      }
      onSelectNode(null);
      onSelectWire(null);
      setIsPanning(true);
      panStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
    }
  };

  // Touch Move on Canvas (panning, pinch-zooming, or node dragging)
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (e.touches.length === 2 && initialPinchDistRef.current && onSetZoom) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const factor = currentDist / initialPinchDistRef.current;
      const newZoom = Math.min(2.0, Math.max(0.4, +(initialPinchZoomRef.current * factor).toFixed(2)));
      onSetZoom(newZoom);
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (isPanning) {
        setPan({
          x: touch.clientX - panStartRef.current.x,
          y: touch.clientY - panStartRef.current.y,
        });
        return;
      }

      if (draggingNodeId) {
        const touchCanvasX = (touch.clientX - rect.left - pan.x) / zoom;
        const touchCanvasY = (touch.clientY - rect.top - pan.y) / zoom;

        let newX = touchCanvasX - dragOffsetRef.current.x;
        let newY = touchCanvasY - dragOffsetRef.current.y;

        if (snapToGrid) {
          newX = Math.round(newX / 20) * 20;
          newY = Math.round(newY / 20) * 20;
        }

        onMoveNode(draggingNodeId, Math.max(0, newX), Math.max(0, newY));
      }
    }
  };

  // Touch End on Canvas
  const handleTouchEnd = () => {
    initialPinchDistRef.current = null;
    setIsPanning(false);

    if (draggingNodeId && dragStartPosRef.current && onMoveNodeEnd) {
      const currentNode = nodes.find(n => n.id === draggingNodeId);
      if (
        currentNode &&
        (currentNode.x !== dragStartPosRef.current.x ||
          currentNode.y !== dragStartPosRef.current.y)
      ) {
        onMoveNodeEnd();
      }
    }
    dragStartPosRef.current = null;
    setDraggingNodeId(null);
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 h-full overflow-hidden canvas-grid select-none touch-none ${
        connectingSource ? 'cursor-crosshair' : 'cursor-default'
      }`}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Zoom and Pan Transformed Canvas Area */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          width: '5000px',
          height: '4000px',
        }}
        className="will-change-transform"
      >
        {/* Wires Layer */}
        <WireOverlay
          wires={wires}
          nodes={nodes}
          activeDraftWire={draftWireData}
          selectedWireId={selectedWireId}
          onSelectWire={(id) => {
            onSelectWire(id);
            onSelectNode(null);
          }}
          onDeleteWire={onDeleteWire}
        />

        {/* Nodes Layer */}
        {nodes.map((node) => (
          <GateNode
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            connectingSource={connectingSource}
            onSelect={(id) => {
              if (!connectingSource) {
                onSelectNode(id);
                onSelectWire(null);
              }
            }}
            onDelete={onDeleteNode}
            onToggleSwitch={onToggleSwitch}
            onPortMouseDown={handlePortMouseDown}
            onPortMouseUp={handlePortMouseUp}
            onPortClick={handlePortClick}
            onMouseDown={handleNodeMouseDown}
            onTouchStart={handleNodeTouchStart}
            onPortTouch={handlePortTouch}
          />
        ))}
      </div>

      {/* Connection Guide Banner when Connecting Wire */}
      {connectingSource && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in duration-150">
          <div className="bg-sky-950/90 border border-sky-400 text-sky-200 text-xs font-semibold px-4 py-2 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>
              {connectingSource.portType === 'output'
                ? 'Pilih pin INPUT tujuan untuk menghubungkan kabel (atau tekan Esc untuk batal)'
                : 'Pilih pin OUTPUT sumber untuk menghubungkan kabel (atau tekan Esc untuk batal)'}
            </span>
          </div>
        </div>
      )}

      {/* Floating Canvas Hint */}
      {!connectingSource && (
        <div className="absolute bottom-4 left-4 pointer-events-none text-[11px] text-slate-500 bg-slate-950/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800/60">
          Klik atau tarik pin bulat untuk menghubungkan kabel · Klik sakelar untuk ubah nilai biner
        </div>
      )}

      {/* Mini-Map in Bottom-Right Corner */}
      <MiniMap
        nodes={nodes}
        wires={wires}
        pan={pan}
        zoom={zoom}
        containerWidth={dimensions.width}
        containerHeight={dimensions.height}
        selectedNodeId={selectedNodeId}
        onPanChange={setPan}
        onFitView={handleFitView}
      />
    </div>
  );
};
