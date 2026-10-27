import React from 'react';
import { GateType } from '../types/circuit';
import { GateSymbol } from './GateSymbols';
import { ToggleLeft, Radio, Lightbulb, Plus, BookOpen, X } from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onAddComponent: (type: GateType) => void;
  onLoadPreset: (key: string) => void;
  activePresetKey?: string;
}

interface ComponentItem {
  type: GateType;
  title: string;
  category: 'core' | 'input_output' | 'advanced';
  description: string;
  icon?: React.ReactNode;
}

const PALETTE_ITEMS: ComponentItem[] = [
  // Core Requested Gates
  {
    type: 'AND',
    title: 'Gerbang AND',
    category: 'core',
    description: 'Output 1 jika SEMUA input bernilai 1 (A ∧ B)',
  },
  {
    type: 'OR',
    title: 'Gerbang OR',
    category: 'core',
    description: 'Output 1 jika SALAH SATU input bernilai 1 (A ∨ B)',
  },
  {
    type: 'NOT',
    title: 'Gerbang NOT (Inverter)',
    category: 'core',
    description: 'Membalikkan sinyal: 0 jadi 1, 1 jadi 0 (¬A)',
  },

  // Input & Output
  {
    type: 'INPUT_SWITCH',
    title: 'Sakelar Input (0/1)',
    category: 'input_output',
    description: 'Sakelar manual interaktif bernilai biner HIGH/LOW',
    icon: <ToggleLeft size={20} className="text-sky-400" />,
  },
  {
    type: 'INPUT_CLOCK',
    title: 'Pembangkit Clock',
    category: 'input_output',
    description: 'Menghasilkan pulsa osilasi sinyal periodik otomatis',
    icon: <Radio size={20} className="text-amber-400" />,
  },
  {
    type: 'OUTPUT_LED',
    title: 'Lampu LED Output',
    category: 'input_output',
    description: 'Indikator visual menyala terang saat menerima sinyal HIGH',
    icon: <Lightbulb size={20} className="text-emerald-400" />,
  },

  // Advanced Gates
  {
    type: 'NAND',
    title: 'Gerbang NAND',
    category: 'advanced',
    description: 'Universal Gate: Kebalikan AND (¬(A ∧ B))',
  },
  {
    type: 'NOR',
    title: 'Gerbang NOR',
    category: 'advanced',
    description: 'Universal Gate: Kebalikan OR (¬(A ∨ B))',
  },
  {
    type: 'XOR',
    title: 'Gerbang XOR',
    category: 'advanced',
    description: 'Exclusive OR: Output 1 jika input berbeda (A ⊕ B)',
  },
  {
    type: 'XNOR',
    title: 'Gerbang XNOR',
    category: 'advanced',
    description: 'Equivalence: Output 1 jika input bernilai sama',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onClose,
  onAddComponent,
  onLoadPreset,
  activePresetKey,
}) => {
  const [activeTab, setActiveTab] = React.useState<'components' | 'presets'>('components');

  const handleDragStart = (e: React.DragEvent, type: GateType) => {
    e.dataTransfer.setData('application/logikalab-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleSelectComponent = (type: GateType) => {
    onAddComponent(type);
    // On small screens, close the drawer after adding so the user immediately sees the canvas
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  const handleSelectPreset = (key: string) => {
    onLoadPreset(key);
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop Overlay on Mobile & Tablet */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
        />
      )}

      {/* Main Sidebar Drawer */}
      <aside
        className={`w-80 border-r border-slate-800 bg-slate-900/98 flex flex-col h-full shrink-0 select-none transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } fixed lg:static top-0 bottom-0 left-0 z-50 lg:z-20 shadow-2xl lg:shadow-none`}
      >
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between p-3 border-b border-slate-800 lg:hidden bg-slate-950/60">
          <span className="text-xs font-bold text-slate-200">Palet Komponen & Rangkaian</span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Sidebar Mode Tabs */}
        <div className="flex border-b border-slate-800 p-2 gap-1 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('components')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'components'
                ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Plus size={14} />
            Komponen
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BookOpen size={14} />
            Preset Rangkaian
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeTab === 'components' ? (
            <>
              {/* Input & Output */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                  Input & Indikator
                </div>
                <div className="space-y-2">
                  {PALETTE_ITEMS.filter((i) => i.category === 'input_output').map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.type)}
                      onClick={() => handleSelectComponent(item.type)}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-sky-500/50 cursor-pointer active:scale-98 transition-all group shadow-sm"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-sky-300 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gerbang Logika Utama (AND, OR, NOT) */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                    Gerbang Logika Utama
                  </span>
                  <span className="text-[10px] text-slate-400">Standard IEEE</span>
                </div>
                <div className="space-y-2">
                  {PALETTE_ITEMS.filter((i) => i.category === 'core').map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.type)}
                      onClick={() => handleSelectComponent(item.type)}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-sky-500/50 cursor-pointer active:scale-98 transition-all group shadow-sm"
                    >
                      <div className="w-16 h-10 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 p-1 group-hover:border-sky-500/40 transition-colors">
                        <GateSymbol type={item.type} width={50} height={32} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-sky-300 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gerbang Tambahan */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                  Gerbang Turunan & Khusus
                </div>
                <div className="space-y-2">
                  {PALETTE_ITEMS.filter((i) => i.category === 'advanced').map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.type)}
                      onClick={() => handleSelectComponent(item.type)}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-sky-500/50 cursor-pointer active:scale-98 transition-all group shadow-sm"
                    >
                      <div className="w-16 h-10 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 p-1 group-hover:border-sky-500/40 transition-colors">
                        <GateSymbol type={item.type} width={50} height={32} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-sky-300 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Tip */}
              <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-800/30 text-xs text-slate-400 leading-relaxed">
                <span className="font-semibold text-sky-400 block mb-1">Tips Layar Sentuh & PC:</span>
                Di ponsel atau tablet, cukup sentuh komponen untuk menambahkannya ke kanvas, lalu sentuh pin untuk menghubungkan kabel.
              </div>
            </>
          ) : (
            /* Presets Tab */
            <div className="space-y-3">
              <div className="text-[11px] text-slate-400 px-1 mb-2">
                Pilih template rangkaian siap pakai untuk langsung dipelajari dan diuji:
              </div>

              <div
                onClick={() => handleSelectPreset('basic_demo')}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  activePresetKey === 'basic_demo'
                    ? 'bg-sky-950/40 border-sky-500 ring-1 ring-sky-500/30'
                    : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60'
                }`}
              >
                <div className="text-xs font-bold text-slate-200">Demonstrasi AND + OR + NOT</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Kombinasi gerbang dasar dengan sakelar dan lampu LED indikator.
                </div>
              </div>

              <div
                onClick={() => handleSelectPreset('half_adder')}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  activePresetKey === 'half_adder'
                    ? 'bg-sky-950/40 border-sky-500 ring-1 ring-sky-500/30'
                    : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60'
                }`}
              >
                <div className="text-xs font-bold text-slate-200">Half Adder (Penjumlah 1-Bit)</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Penjumlahan biner dengan gerbang XOR (Sum) dan AND (Carry Out).
                </div>
              </div>

              <div
                onClick={() => handleSelectPreset('mux_2to1')}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  activePresetKey === 'mux_2to1'
                    ? 'bg-sky-950/40 border-sky-500 ring-1 ring-sky-500/30'
                    : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60'
                }`}
              >
                <div className="text-xs font-bold text-slate-200">Multiplexer 2-ke-1 (MUX)</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Selektor kanal data digital berdasarkan bit pengatur Select.
                </div>
              </div>

              <div
                onClick={() => handleSelectPreset('alarm_system')}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  activePresetKey === 'alarm_system'
                    ? 'bg-sky-950/40 border-sky-500 ring-1 ring-sky-500/30'
                    : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60'
                }`}
              >
                <div className="text-xs font-bold text-slate-200">Sistem Alarm Keamanan Rumah</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Aplikasi praktis dunia nyata: Sensor Pintu, Gerak, dan Sakelar Master Arming.
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
