import React from 'react';
import { CircuitNode, WireConnection } from '../types/circuit';

interface WireOverlayProps {
  wires: WireConnection[];
  nodes: CircuitNode[];
  activeDraftWire: {
    fromNodeId?: string;
    fromPortId?: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isFromOutput?: boolean;
  } | null;
  selectedWireId: string | null;
  onSelectWire: (wireId: string) => void;
  onDeleteWire: (wireId: string) => void;
}

export const WireOverlay: React.FC<WireOverlayProps> = ({
  wires,
  nodes,
  activeDraftWire,
  selectedWireId,
  onSelectWire,
  onDeleteWire,
}) => {
  // Exact center coordinate math aligned with GateNode w-[110px] & min-h-[84px]
  const getPortCoordinates = (nodeId: string, portId: string, isOutput: boolean) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const cardWidth = 110;
    const cardHeight = 84;

    let portYOffset = 0.5;
    if (isOutput) {
      const idx = node.outputs.findIndex(p => p.id === portId);
      const total = node.outputs.length;
      portYOffset = total <= 1 ? 0.5 : (idx + 1) / (total + 1);
    } else {
      const idx = node.inputs.findIndex(p => p.id === portId);
      const total = node.inputs.length;
      portYOffset = total === 1 ? 0.5 : total === 2 ? (idx === 0 ? 0.32 : 0.68) : (idx + 1) / (total + 1);
    }

    const x = isOutput ? node.x + cardWidth : node.x;
    const y = node.y + cardHeight * portYOffset;

    return { x, y };
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
      <defs>
        <filter id="glow-high" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Render Established Connected Wires */}
      {wires.map((wire) => {
        const start = getPortCoordinates(wire.fromNodeId, wire.fromPortId, true);
        const end = getPortCoordinates(wire.toNodeId, wire.toPortId, false);

        const dx = Math.max(40, Math.abs(end.x - start.x) * 0.45);
        const pathData = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;

        const isHigh = Boolean(wire.signal);
        const isSelected = selectedWireId === wire.id;

        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        return (
          <g key={wire.id} className="pointer-events-auto group">
            {/* Wider invisible path for easy clicking and selection */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth="20"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelectWire(wire.id);
              }}
            />

            {/* Glowing backdrop when HIGH */}
            {isHigh && (
              <path
                d={pathData}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="6"
                strokeOpacity="0.35"
                filter="url(#glow-high)"
              />
            )}

            {/* Main wire line */}
            <path
              d={pathData}
              fill="none"
              stroke={
                isSelected
                  ? '#f43f5e'
                  : isHigh
                  ? '#38bdf8'
                  : '#475569'
              }
              strokeWidth={isSelected ? '3.5' : isHigh ? '3' : '2'}
              strokeLinecap="round"
              className={isHigh ? 'wire-animated' : ''}
            />

            {/* Delete button on midpoint when hovered or selected */}
            <g
              transform={`translate(${midX - 10}, ${midY - 10})`}
              className={`cursor-pointer transition-opacity ${
                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteWire(wire.id);
              }}
            >
              <circle cx="10" cy="10" r="10" fill="#0f172a" stroke="#f43f5e" strokeWidth="1.5" />
              <line x1="7" y1="7" x2="13" y2="13" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="13" y1="7" x2="7" y2="13" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </g>
        );
      })}

      {/* Render Active Draft Wire following cursor */}
      {activeDraftWire && (() => {
        const sx = activeDraftWire.startX;
        const sy = activeDraftWire.startY;
        const ex = activeDraftWire.currentX;
        const ey = activeDraftWire.currentY;
        const fromOutput = activeDraftWire.isFromOutput !== false;

        const dx = Math.max(30, Math.abs(ex - sx) * 0.45);
        const c1x = fromOutput ? sx + dx : sx - dx;
        const c2x = fromOutput ? ex - dx : ex + dx;
        const pathData = `M ${sx} ${sy} C ${c1x} ${sy}, ${c2x} ${ey}, ${ex} ${ey}`;

        return (
          <g>
            <path
              d={pathData}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              className="wire-animated"
            />
            {/* Pulsing indicator at cursor head */}
            <circle cx={ex} cy={ey} r="5" fill="#38bdf8" fillOpacity="0.4" className="animate-ping" />
            <circle cx={ex} cy={ey} r="3" fill="#38bdf8" />
          </g>
        );
      })()}
    </svg>
  );
};
