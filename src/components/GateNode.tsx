import React from 'react';
import { CircuitNode, Port } from '../types/circuit';
import { GateSymbol } from './GateSymbols';
import { Trash2, Radio } from 'lucide-react';

interface GateNodeProps {
  node: CircuitNode;
  isSelected: boolean;
  connectingSource: {
    nodeId: string;
    portId: string;
    portType: 'output' | 'input';
  } | null;
  onSelect: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onToggleSwitch?: (nodeId: string) => void;
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, portId: string, portType: 'output' | 'input') => void;
  onPortMouseUp: (e: React.MouseEvent, nodeId: string, portId: string, portType: 'output' | 'input') => void;
  onPortClick: (e: React.MouseEvent, nodeId: string, portId: string, portType: 'output' | 'input') => void;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onTouchStart?: (e: React.TouchEvent, nodeId: string) => void;
  onPortTouch?: (e: React.TouchEvent, nodeId: string, portId: string, portType: 'output' | 'input') => void;
}

export const GateNode: React.FC<GateNodeProps> = ({
  node,
  isSelected,
  connectingSource,
  onSelect,
  onDelete,
  onToggleSwitch,
  onPortMouseDown,
  onPortMouseUp,
  onPortClick,
  onMouseDown,
  onTouchStart,
  onPortTouch,
}) => {
  const isSwitch = node.type === 'INPUT_SWITCH';
  const isClock = node.type === 'INPUT_CLOCK';
  const isLED = node.type === 'OUTPUT_LED' || node.type === 'OUTPUT_PROBE';
  const isGate = !isSwitch && !isClock && !isLED;

  const primaryOutput = node.outputs[0];
  const primaryInput = node.inputs[0];
  const isNodeActive = primaryOutput ? primaryOutput.value : primaryInput ? primaryInput.value : false;

  return (
    <div
      id={`node-${node.id}`}
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        position: 'absolute',
      }}
      className={`group select-none cursor-move transition-shadow duration-150 w-[110px] ${
        isSelected ? 'z-30' : 'z-20'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onTouchStart={(e) => onTouchStart?.(e, node.id)}
    >
      <div
        className={`relative flex flex-col items-center bg-slate-900/95 border backdrop-blur-sm rounded-xl px-2 py-2 shadow-lg transition-all w-full min-h-[84px] ${
          isSelected
            ? 'border-sky-400 ring-2 ring-sky-400/30 shadow-sky-500/10'
            : isNodeActive
            ? 'border-sky-500/40 shadow-sky-950/20'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* Node Header Label & Actions */}
        <div className="flex items-center justify-between w-full gap-1 mb-1 px-1">
          <span className="text-[11px] font-semibold tracking-wide text-slate-300 truncate max-w-[80px]">
            {node.label}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition-opacity rounded cursor-pointer"
            title="Hapus komponen"
          >
            <Trash2 size={12} />
          </button>
        </div>

        {/* Node Center Content */}
        <div className="relative flex items-center justify-center w-full min-h-[50px] my-0.5">
          {/* 1. Logic Gates */}
          {isGate && (
            <div className="relative">
              <GateSymbol type={node.type} isActive={isNodeActive} width={76} height={46} />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400 pointer-events-none">
                {node.type}
              </span>
            </div>
          )}

          {/* 2. Input Switch */}
          {isSwitch && (
            <div className="flex flex-col items-center gap-1.5 py-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleSwitch) onToggleSwitch(node.id);
                }}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none cursor-pointer ${
                  node.state?.switchValue ? 'bg-sky-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    node.state?.switchValue ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded transition-colors ${
                  node.state?.switchValue
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {node.state?.switchValue ? 'HIGH (1)' : 'LOW (0)'}
              </span>
            </div>
          )}

          {/* 3. Input Clock */}
          {isClock && (
            <div className="flex flex-col items-center gap-1 py-1">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
                  node.state?.clockState
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
              >
                <Radio size={16} className={node.state?.clockState ? 'animate-pulse' : ''} />
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {node.state?.clockState ? '1 (PULSE)' : '0 (IDLE)'}
              </span>
            </div>
          )}

          {/* 4. Output LED / Probe */}
          {isLED && (
            <div className="flex flex-col items-center gap-1.5 py-1">
              <div className="relative">
                {/* Glow aura */}
                {isNodeActive && (
                  <div className="absolute -inset-2 rounded-full bg-emerald-400/30 blur-md animate-pulse" />
                )}
                {/* Bulb */}
                <div
                  className={`relative w-8 h-8 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                    isNodeActive
                      ? 'bg-emerald-400 border-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.8)]'
                      : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isNodeActive ? 'bg-white/80' : 'bg-slate-900/50'
                    }`}
                  />
                </div>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  isNodeActive
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isNodeActive ? 'ON (1)' : 'OFF (0)'}
              </span>
            </div>
          )}
        </div>

        {/* Input Ports (Left side) */}
        {node.inputs.map((port, idx) => {
          const total = node.inputs.length;
          const topOffset = total === 1 ? 50 : total === 2 ? (idx === 0 ? 32 : 68) : (idx + 1) * (100 / (total + 1));
          const isSource = connectingSource?.nodeId === node.id && connectingSource?.portId === port.id;
          const isCompatibleTarget =
            connectingSource &&
            connectingSource.nodeId !== node.id &&
            connectingSource.portType === 'output';

          return (
            <div
              key={port.id}
              id={`port-${port.id}`}
              style={{
                top: `${topOffset}%`,
                left: '0px',
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-40 flex items-center justify-center cursor-crosshair group/port"
              onMouseDown={(e) => {
                e.stopPropagation();
                onPortMouseDown(e, node.id, port.id, 'input');
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                onPortMouseUp(e, node.id, port.id, 'input');
              }}
              onClick={(e) => {
                e.stopPropagation();
                onPortClick(e, node.id, port.id, 'input');
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                if (onPortTouch) {
                  onPortTouch(e, node.id, port.id, 'input');
                } else {
                  onPortClick(e as any, node.id, port.id, 'input');
                }
              }}
              title={`Input ${port.name}: ${port.value ? '1 (HIGH)' : '0 (LOW)'}`}
            >
              {/* Invisible large hit box for easy clicking & touch */}
              <div className="absolute -inset-3.5 sm:-inset-2.5 z-0" />

              {/* Visual Pin */}
              <div
                className={`relative z-10 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                  isSource
                    ? 'bg-amber-400 border-white ring-4 ring-amber-400/50 scale-125'
                    : isCompatibleTarget
                    ? 'bg-sky-400 border-white ring-4 ring-sky-400/60 scale-125 animate-pulse'
                    : port.value
                    ? 'bg-sky-400 border-sky-200 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                    : 'bg-slate-950 border-slate-500 hover:border-sky-400 hover:scale-125 hover:bg-slate-800'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    port.value ? 'bg-white' : 'bg-slate-400'
                  }`}
                />
              </div>

              {/* Tooltip port label */}
              <span className="absolute -top-5 left-0 text-[10px] font-mono text-slate-300 opacity-0 group-hover/port:opacity-100 pointer-events-none whitespace-nowrap bg-slate-950/90 border border-slate-800 px-1.5 py-0.5 rounded shadow z-50">
                Input {port.name}
              </span>
            </div>
          );
        })}

        {/* Output Ports (Right side) */}
        {node.outputs.map((port, idx) => {
          const total = node.outputs.length;
          const topOffset = total <= 1 ? 50 : (idx + 1) * (100 / (total + 1));
          const isSource = connectingSource?.nodeId === node.id && connectingSource?.portId === port.id;
          const isCompatibleTarget =
            connectingSource &&
            connectingSource.nodeId !== node.id &&
            connectingSource.portType === 'input';

          return (
            <div
              key={port.id}
              id={`port-${port.id}`}
              style={{
                top: `${topOffset}%`,
                right: '0px',
                transform: 'translate(50%, -50%)',
              }}
              className="absolute z-40 flex items-center justify-center cursor-crosshair group/port"
              onMouseDown={(e) => {
                e.stopPropagation();
                onPortMouseDown(e, node.id, port.id, 'output');
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                onPortMouseUp(e, node.id, port.id, 'output');
              }}
              onClick={(e) => {
                e.stopPropagation();
                onPortClick(e, node.id, port.id, 'output');
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                if (onPortTouch) {
                  onPortTouch(e, node.id, port.id, 'output');
                } else {
                  onPortClick(e as any, node.id, port.id, 'output');
                }
              }}
              title={`Output ${port.name}: ${port.value ? '1 (HIGH)' : '0 (LOW)'}`}
            >
              {/* Invisible large hit box for easy clicking & touch */}
              <div className="absolute -inset-3.5 sm:-inset-2.5 z-0" />

              {/* Visual Pin */}
              <div
                className={`relative z-10 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                  isSource
                    ? 'bg-amber-400 border-white ring-4 ring-amber-400/50 scale-125'
                    : isCompatibleTarget
                    ? 'bg-sky-400 border-white ring-4 ring-sky-400/60 scale-125 animate-pulse'
                    : port.value
                    ? 'bg-sky-400 border-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.9)]'
                    : 'bg-slate-950 border-slate-500 hover:border-sky-400 hover:scale-125 hover:bg-slate-800'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    port.value ? 'bg-white' : 'bg-slate-400'
                  }`}
                />
              </div>

              {/* Tooltip port label */}
              <span className="absolute -top-5 right-0 text-[10px] font-mono text-slate-300 opacity-0 group-hover/port:opacity-100 pointer-events-none whitespace-nowrap bg-slate-950/90 border border-slate-800 px-1.5 py-0.5 rounded shadow z-50">
                Output {port.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
