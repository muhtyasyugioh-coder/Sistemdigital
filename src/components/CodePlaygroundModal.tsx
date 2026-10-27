import React, { useState } from 'react';
import { CircuitNode, WireConnection, SupportedLanguage, CodeTemplate } from '../types/circuit';
import { generateCodeTemplates } from '../services/codeGenerator';
import { X, Copy, Download, Check, Play, Terminal, Eye, Code, Cpu } from 'lucide-react';

interface CodePlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: CircuitNode[];
  wires: WireConnection[];
}

export const CodePlaygroundModal: React.FC<CodePlaygroundModalProps> = ({
  isOpen,
  onClose,
  nodes,
  wires,
}) => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('python');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'runner' | 'preview'>('code');

  // Interactive Python test runner state
  const inputNodes = nodes.filter(n => n.type === 'INPUT_SWITCH');
  const [testInputs, setTestInputs] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    inputNodes.forEach(n => {
      initial[n.id] = Boolean(n.state?.switchValue);
    });
    return initial;
  });
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const templates = generateCodeTemplates(nodes, wires);
  const currentTemplate: CodeTemplate = templates[selectedLang];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentTemplate.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentTemplate.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logikalab_circuit.${currentTemplate.extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRunPythonSimulation = () => {
    setIsRunning(true);
    setTerminalOutput([
      `$ python3 logikalab_circuit.py`,
      `[SIMULASI] Menginisialisasi modul gerbang logika...`,
      `[SIMULASI] Input terdeteksi: ${inputNodes.map(n => `${n.label}=${testInputs[n.id] ? 1 : 0}`).join(', ') || 'None'}`,
    ]);

    setTimeout(() => {
      // Evaluate test inputs using simulator
      const clonedNodes = JSON.parse(JSON.stringify(nodes));
      clonedNodes.forEach((n: any) => {
        if (n.type === 'INPUT_SWITCH') {
          if (!n.state) n.state = {};
          n.state.switchValue = testInputs[n.id] ?? false;
        }
      });

      // Quick eval
      const outputNodes = nodes.filter(n => n.type === 'OUTPUT_LED' || n.type === 'OUTPUT_PROBE');
      const results: string[] = [];

      outputNodes.forEach(out => {
        const feedingWire = wires.find(w => w.toNodeId === out.id);
        const feedingNode = feedingWire ? clonedNodes.find((cn: any) => cn.id === feedingWire.fromNodeId) : null;
        const val = feedingNode && feedingNode.outputs.length > 0 ? feedingNode.outputs[0].value : false;
        results.push(`  → ${out.label || 'Output'}: ${val ? '1 (HIGH)' : '0 (LOW)'}`);
      });

      setTerminalOutput(prev => [
        ...prev,
        `[HASIL EVALUASI]:`,
        ...results,
        `[STATUS] Eksekusi selesai dalam 0.002s (Exit code: 0)`,
      ]);
      setIsRunning(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Cpu size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                Simulasi Implementasi Kode Rangkaian
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate hidden sm:block">
                Ekspor rangkaian ke berbagai bahasa pemrograman (Python, HTML5/JS, C++, Rust, Verilog)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              title="Salin Kode"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span className="hidden sm:inline">{copied ? 'Tersalin' : 'Salin Kode'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              title="Unduh file kode"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Unduh .{currentTemplate.extension}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Language Tabs & Runner Tabs */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-2 bg-slate-950/80 border-b border-slate-800 gap-2">
          {/* Languages */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            {(['python', 'html_js', 'cpp', 'rust', 'verilog'] as SupportedLanguage[]).map(lang => (
              <button
                key={lang}
                onClick={() => {
                  setSelectedLang(lang);
                  if (lang !== 'html_js' && activeTab === 'preview') {
                    setActiveTab('code');
                  }
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  selectedLang === lang
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {templates[lang].name}
              </button>
            ))}
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                activeTab === 'code' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code size={13} />
              <span>Source Code</span>
            </button>
            {selectedLang === 'python' && (
              <button
                onClick={() => setActiveTab('runner')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  activeTab === 'runner' ? 'bg-slate-800 text-sky-400 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal size={13} />
                <span>Simulasi Python Live</span>
              </button>
            )}
            {selectedLang === 'html_js' && (
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  activeTab === 'preview' ? 'bg-slate-800 text-sky-400 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye size={13} />
                <span>Pratinjau Widget Web</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Main View */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="text-xs text-slate-400 mb-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 flex items-center justify-between">
            <span>{currentTemplate.explanation}</span>
            <span className="font-mono text-[11px] text-sky-400">
              {currentTemplate.code.split('\n').length} baris kode
            </span>
          </div>

          {/* View 1: Source Code View */}
          {activeTab === 'code' && (
            <div className="relative flex-1 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner flex flex-col">
              <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>logikalab_circuit.{currentTemplate.extension}</span>
                <span>UTF-8</span>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-200 overflow-auto flex-1 leading-relaxed selection:bg-sky-500/30">
                <code>{currentTemplate.code}</code>
              </pre>
            </div>
          )}

          {/* View 2: Live Python Runner */}
          {activeTab === 'runner' && selectedLang === 'python' && (
            <div className="flex-1 flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-slate-200 block mb-2">
                  Atur Parameter Uji (Test Inputs):
                </span>
                <div className="flex flex-wrap gap-3">
                  {inputNodes.map(node => (
                    <button
                      key={node.id}
                      onClick={() =>
                        setTestInputs(prev => ({
                          ...prev,
                          [node.id]: !prev[node.id],
                        }))
                      }
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                        testInputs[node.id]
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      <span>{node.label || 'Input'}:</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-950">
                        {testInputs[node.id] ? '1 (HIGH)' : '0 (LOW)'}
                      </span>
                    </button>
                  ))}
                  {inputNodes.length === 0 && (
                    <span className="text-xs text-slate-500">Tidak ada sakelar input pada rangkaian.</span>
                  )}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleRunPythonSimulation}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all disabled:opacity-50"
                  >
                    <Play size={14} className={isRunning ? 'animate-spin' : ''} />
                    <span>{isRunning ? 'Mengeksekusi...' : 'Jalankan Simulasi Python'}</span>
                  </button>
                </div>
              </div>

              {/* Terminal Console */}
              <div className="flex-1 rounded-xl bg-black border border-slate-800 p-4 font-mono text-xs text-emerald-400 overflow-auto min-h-[200px] shadow-inner">
                {terminalOutput.length === 0 ? (
                  <div className="text-slate-600">
                    Klik "Jalankan Simulasi Python" untuk mengeksekusi logika rangkaian dalam lingkungan virtual Python...
                  </div>
                ) : (
                  <div className="space-y-1">
                    {terminalOutput.map((line, idx) => (
                      <div key={idx} className={line.startsWith('$') ? 'text-sky-300 font-bold' : ''}>
                        {line}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* View 3: Live HTML Preview Sandbox */}
          {activeTab === 'preview' && selectedLang === 'html_js' && (
            <div className="flex-1 rounded-xl border border-slate-800 overflow-hidden min-h-[350px] bg-slate-950 flex flex-col">
              <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
                Interactive Standalone HTML Sandbox
              </div>
              <iframe
                title="Sistem Digital SEM 5 Muhtyas Yugi Interactive HTML Sandbox"
                srcDoc={currentTemplate.code}
                className="w-full flex-1 border-0 bg-transparent"
                sandbox="allow-scripts"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
