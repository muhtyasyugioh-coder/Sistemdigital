import React, { useState } from 'react';
import { Share2, Cpu, Menu, X, Table, Code2, FileCode, Layers } from 'lucide-react';

interface NavbarProps {
  onOpenTruthTable: () => void;
  onOpenCodePlayground: () => void;
  onOpenApiDocs: () => void;
  onOpenShareModal: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenTruthTable,
  onOpenCodePlayground,
  onOpenApiDocs,
  onOpenShareModal,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="h-14 sm:h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-8 z-30 shrink-0">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer lg:hidden shrink-0 ${
                isSidebarOpen
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Buka / Tutup Palet Komponen"
            >
              <Layers size={16} />
            </button>
          )}

          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Cpu size={16} className="sm:w-[18px] sm:h-[18px]" />
          </div>

          <span className="text-xs sm:text-base md:text-lg font-bold tracking-tight text-slate-100 truncate max-w-[170px] sm:max-w-xs md:max-w-none">
            Sistem Digital SEM 5 Muhtyas Yugi
          </span>
        </div>

        {/* Zone 2: Desktop 4 Clean Single-line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-slate-400 shrink-0">
          <button
            onClick={() => {}}
            className="text-sky-400 font-semibold hover:text-sky-300 transition-colors whitespace-nowrap cursor-pointer"
          >
            Laboratorium Sirkuit
          </button>
          <button
            onClick={onOpenTruthTable}
            className="hover:text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            Tabel Kebenaran
          </button>
          <button
            onClick={onOpenCodePlayground}
            className="hover:text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            Simulasi Coding
          </button>
          <button
            onClick={onOpenApiDocs}
            className="hover:text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            Dokumentasi API
          </button>
        </nav>

        {/* Zone 3: Primary Action & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 shadow-sm shadow-sky-600/30 transition-all whitespace-nowrap cursor-pointer"
          >
            <Share2 size={13} className="sm:w-[14px] sm:h-[14px]" />
            <span className="hidden sm:inline">Bagi Rangkaian</span>
            <span className="sm:hidden">Bagi</span>
          </button>

          {/* Mobile Navigation Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors md:hidden cursor-pointer"
            title="Menu Navigasi"
          >
            {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 bg-slate-900/98 border-b border-slate-800 z-40 p-3 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-2 duration-150 space-y-1">
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-sky-400 bg-sky-950/40 border border-sky-800/50"
          >
            <Cpu size={15} />
            <span>Laboratorium Sirkuit</span>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenTruthTable();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Table size={15} className="text-sky-400" />
            <span>Tabel Kebenaran (Truth Table)</span>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenCodePlayground();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Code2 size={15} className="text-sky-300" />
            <span>Simulasi Coding (Python, HTML, C++, Verilog)</span>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenApiDocs();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <FileCode size={15} className="text-emerald-400" />
            <span>Dokumentasi API & Integrasi</span>
          </button>
        </div>
      )}
    </>
  );
};
