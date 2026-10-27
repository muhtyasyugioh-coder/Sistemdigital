import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Grid,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Undo2,
  Redo2,
  Table,
  Code2,
  FileCode,
  Share2,
  Download,
  Upload,
  Layers,
} from 'lucide-react';

interface ToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  isClockRunning: boolean;
  onToggleClock: () => void;
  hasSelection: boolean;
  onDeleteSelected: () => void;
  onClearCanvas: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenTruthTable: () => void;
  onOpenCodePlayground: () => void;
  onOpenApiDocs: () => void;
  onOpenShareModal: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  circuitName: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  snapToGrid,
  onToggleSnap,
  isClockRunning,
  onToggleClock,
  hasSelection,
  onDeleteSelected,
  onClearCanvas,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenTruthTable,
  onOpenCodePlayground,
  onOpenApiDocs,
  onOpenShareModal,
  onExportJson,
  onImportJson,
  circuitName,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  return (
    <div className="min-h-12 sm:h-14 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 z-20 overflow-x-auto no-scrollbar shrink-0 select-none">
      {/* Left: Component Drawer Toggle + Circuit Info & Edit Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mobile/Tablet Component Toggle */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer lg:hidden shrink-0 ${
              isSidebarOpen
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Buka / Tutup Palet Komponen"
          >
            <Layers size={14} className="text-sky-400" />
            <span className="text-[11px] font-bold">Komponen</span>
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-bold text-slate-200 tracking-wide truncate max-w-[140px] md:max-w-none">
            {circuitName}
          </span>
          <span className="text-[10px] text-slate-400 hidden md:inline">· Real-time</span>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Undo & Redo Controls */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 rounded text-xs font-medium transition-all ${
              canUndo
                ? 'text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer'
                : 'text-slate-600 opacity-40 cursor-not-allowed'
            }`}
            title="Urungkan (Undo) · Ctrl+Z"
          >
            <Undo2 size={13} />
            <span className="hidden xl:inline text-[11px]">Undo</span>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 rounded text-xs font-medium transition-all ${
              canRedo
                ? 'text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer'
                : 'text-slate-600 opacity-40 cursor-not-allowed'
            }`}
            title="Ulangi (Redo) · Ctrl+Y atau Ctrl+Shift+Z"
          >
            <Redo2 size={13} />
            <span className="hidden xl:inline text-[11px]">Redo</span>
          </button>
        </div>

        {/* Clock Oscillation Play/Pause */}
        <button
          onClick={onToggleClock}
          className={`flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-md text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            isClockRunning
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
          }`}
          title={isClockRunning ? 'Jeda Osilasi Clock' : 'Jalankan Osilasi Clock'}
        >
          {isClockRunning ? <Pause size={13} /> : <Play size={13} />}
          <span className="hidden sm:inline">Clock </span>
          <span>{isClockRunning ? 'Aktif' : 'Jeda'}</span>
        </button>

        {/* Delete selection */}
        {hasSelection && (
          <button
            onClick={onDeleteSelected}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-rose-950/50 text-rose-300 border border-rose-800/60 hover:bg-rose-900/50 transition-all cursor-pointer shrink-0"
            title="Hapus elemen yang dipilih (Del)"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Hapus</span>
          </button>
        )}

        {/* Clear canvas */}
        <button
          onClick={onClearCanvas}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          title="Bersihkan kanvas"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Center: Canvas View Controls */}
      <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-950/60 p-0.5 sm:p-1 rounded-lg border border-slate-800 shrink-0">
        <button
          onClick={onZoomOut}
          className="p-1 sm:p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Perkecil Kanvas"
        >
          <ZoomOut size={13} />
        </button>
        <button
          onClick={onResetZoom}
          className="px-1.5 sm:px-2 text-[10px] sm:text-[11px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Reset Zoom ke 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={onZoomIn}
          className="p-1 sm:p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Perbesar Kanvas"
        >
          <ZoomIn size={13} />
        </button>

        <div className="h-3 w-px bg-slate-800 mx-0.5 sm:mx-1" />

        <button
          onClick={onToggleSnap}
          className={`p-1 sm:p-1.5 rounded transition-colors cursor-pointer ${
            snapToGrid ? 'text-sky-400 bg-sky-950/50' : 'text-slate-400 hover:text-slate-200'
          }`}
          title={`Snap ke Grid: ${snapToGrid ? 'ON' : 'OFF'}`}
        >
          <Grid size={13} />
        </button>
      </div>

      {/* Right: Modals & Export Features */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Truth Table */}
        <button
          onClick={onOpenTruthTable}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-all hover:border-slate-600 cursor-pointer"
          title="Buka Tabel Kebenaran"
        >
          <Table size={13} className="text-sky-400" />
          <span className="hidden md:inline">Tabel Kebenaran</span>
          <span className="md:hidden">Tabel</span>
        </button>

        {/* Code Generator & Simulator */}
        <button
          onClick={onOpenCodePlayground}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 border border-sky-800/60 transition-all cursor-pointer"
          title="Simulasi Coding Multi-Bahasa"
        >
          <Code2 size={13} />
          <span className="hidden md:inline">Simulasi Coding</span>
          <span className="md:hidden">Coding</span>
        </button>

        {/* Developer API Docs */}
        <button
          onClick={onOpenApiDocs}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          title="Dokumentasi API & Integrasi"
        >
          <FileCode size={13} className="text-emerald-400" />
          <span className="hidden xl:inline">Dokumentasi </span>
          <span>API</span>
        </button>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Share & Save */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-sm shadow-sky-600/30 transition-all cursor-pointer"
          title="Bagikan & Simpan Rangkaian"
        >
          <Share2 size={13} />
          <span className="hidden sm:inline">Bagikan</span>
        </button>

        {/* Quick JSON Export */}
        <button
          onClick={onExportJson}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
          title="Ekspor File JSON"
        >
          <Download size={13} />
        </button>

        {/* Quick JSON Import */}
        <button
          onClick={onImportJson}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
          title="Impor File JSON"
        >
          <Upload size={13} />
        </button>
      </div>
    </div>
  );
};
