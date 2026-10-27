import React, { useState } from 'react';
import { CircuitNode, WireConnection } from '../types/circuit';
import { simulateCircuit, generateTruthTable } from '../services/simulator';
import { X, Copy, Check, Send, Code, Globe, FileCode, CheckCircle2 } from 'lucide-react';

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: CircuitNode[];
  wires: WireConnection[];
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({
  isOpen,
  onClose,
  nodes,
  wires,
}) => {
  const [activeTab, setActiveTab] = useState<'rest' | 'tester' | 'embed'>('rest');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Live API Tester state
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isCallingApi, setIsCallingApi] = useState(false);
  const [apiLatency, setApiLatency] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://api.logikalab.dev';

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleTestLiveApi = async () => {
    setIsCallingApi(true);
    const startTime = performance.now();
    try {
      const res = await fetch('/api/v1/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes,
          wires,
          maxIterations: 16,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      const endTime = performance.now();
      setApiLatency(Math.round(endTime - startTime));
      setTestResponse({
        status: res.status,
        statusText: res.statusText || 'OK',
        source: 'Backend API / Vercel Serverless',
        data,
      });
    } catch (err: any) {
      // Graceful fallback to client simulation if deployed on static host
      const endTime = performance.now();
      const simResult = simulateCircuit(nodes, wires, 16);
      const truthTable = generateTruthTable(simResult.nodes, simResult.wires);
      setApiLatency(Math.round(endTime - startTime));
      setTestResponse({
        status: 200,
        statusText: 'OK (Klien Lokal)',
        source: 'Simulator Engine Lokal (Browser)',
        data: {
          success: true,
          nodes: simResult.nodes,
          wires: simResult.wires,
          changed: simResult.changed,
          truthTable,
          keterangan: 'Hasil dihitung melalui engine simulasi browser lokal (Cepat & Offline-ready).',
        },
      });
    } finally {
      setIsCallingApi(false);
    }
  };

  const curlExample = `curl -X POST "${currentHost}/api/v1/simulate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "nodes": ${JSON.stringify(nodes.slice(0, 3), null, 2)},
    "wires": ${JSON.stringify(wires.slice(0, 2), null, 2)}
  }'`;

  const jsFetchExample = `// Integrasi JavaScript / TypeScript
async function runLogicSimulation() {
  const response = await fetch("${currentHost}/api/v1/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nodes: circuitNodes,
      wires: circuitWires,
      maxIterations: 16
    })
  });
  
  const result = await response.json();
  console.log("Status Sinyal:", result.nodes);
  console.log("Tabel Kebenaran:", result.truthTable);
}`;

  const pythonExample = `# Integrasi Python 3 dengan Requests
import requests

payload = {
    "nodes": circuit_nodes,
    "wires": circuit_wires,
    "maxIterations": 16
}

response = requests.post("${currentHost}/api/v1/simulate", json=payload)
data = response.json()

print("Status Simulasi:", data["success"])
print("Persamaan Boolean:", data["truthTable"]["booleanExpression"])`;

  const embedHtmlCode = `<!-- Embed Sistem Digital SEM 5 Muhtyas Yugi Simulator Widget -->
<iframe 
  src="${currentHost}/?embed=true" 
  width="100%" 
  height="600" 
  frameborder="0" 
  style="border-radius: 12px; border: 1px solid #334155;"
  allow="clipboard-write"
></iframe>

<script>
// Komunikasi Dua Arah dengan Simulator via postMessage
window.addEventListener('message', (event) => {
  if (event.data?.type === 'LOGIKALAB_STATE_CHANGE') {
    console.log('Update Rangkaian:', event.data.payload);
  }
});
</script>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileCode size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                Dokumentasi API & Integrasi Pengembang
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate hidden sm:block">
                Spesifikasi REST API, SDK, konsol live tester, dan protokol embed iframe
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center px-4 sm:px-6 py-2 bg-slate-950/80 border-b border-slate-800 gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('rest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'rest'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe size={14} />
            REST API Reference
          </button>
          <button
            onClick={() => setActiveTab('tester')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'tester'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send size={14} />
            Konsol Uji Live (Tester)
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'embed'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code size={14} />
            Embed Iframe & PostMessage
          </button>
        </div>

        {/* Tab 1: REST API */}
        {activeTab === 'rest' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 text-xs">
            {/* Overview */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200 text-sm block">Base URL</span>
              <code className="text-emerald-400 font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800 block w-max">
                {currentHost}/api/v1
              </code>
              <p className="text-slate-400 leading-relaxed text-xs">
                Sistem Digital SEM 5 Muhtyas Yugi menyediakan REST API berkecepatan tinggi yang mendukung pemanggilan tanpa otentikasi (CORS aktif), memungkinkan platform pembelajaran, LMS, atau aplikasi web pihak ketiga mengevaluasi sirkuit digital secara komputasi awan.
              </p>
            </div>

            {/* Endpoints Table */}
            <div>
              <span className="font-bold text-slate-200 text-sm block mb-3">Daftar Endpoint Publik</span>
              <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                <div className="p-3 bg-slate-950/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono">
                      POST
                    </span>
                    <span className="font-mono text-slate-200">/api/v1/simulate</span>
                  </div>
                  <span className="text-slate-400 text-xs">Simulasi rangkaian & generate tabel kebenaran</span>
                </div>

                <div className="p-3 bg-slate-950/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                      GET
                    </span>
                    <span className="font-mono text-slate-200">/api/v1/presets</span>
                  </div>
                  <span className="text-slate-400 text-xs">Daftar preset rangkaian logika siap pakai</span>
                </div>

                <div className="p-3 bg-slate-950/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono">
                      POST
                    </span>
                    <span className="font-mono text-slate-200">/api/v1/generate-code</span>
                  </div>
                  <span className="text-slate-400 text-xs">Kompilasi rangkaian ke kode Python/C++/Rust/Verilog</span>
                </div>
              </div>
            </div>

            {/* Code Snippets */}
            <div className="space-y-4">
              <span className="font-bold text-slate-200 text-sm block">Contoh Kode Integrasi</span>

              {/* cURL */}
              <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-400">cURL Terminal Command</span>
                  <button
                    onClick={() => copyToClipboard(curlExample, 1)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    {copiedIndex === 1 ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedIndex === 1 ? 'Disalin' : 'Salin'}</span>
                  </button>
                </div>
                <pre className="p-4 font-mono text-xs text-slate-300 overflow-auto">
                  <code>{curlExample}</code>
                </pre>
              </div>

              {/* JavaScript */}
              <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-400">JavaScript / TypeScript Fetch</span>
                  <button
                    onClick={() => copyToClipboard(jsFetchExample, 2)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    {copiedIndex === 2 ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedIndex === 2 ? 'Disalin' : 'Salin'}</span>
                  </button>
                </div>
                <pre className="p-4 font-mono text-xs text-slate-300 overflow-auto">
                  <code>{jsFetchExample}</code>
                </pre>
              </div>

              {/* Python */}
              <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-400">Python 3 (Requests)</span>
                  <button
                    onClick={() => copyToClipboard(pythonExample, 3)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    {copiedIndex === 3 ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedIndex === 3 ? 'Disalin' : 'Salin'}</span>
                  </button>
                </div>
                <pre className="p-4 font-mono text-xs text-slate-300 overflow-auto">
                  <code>{pythonExample}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Tester */}
        {activeTab === 'tester' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-200 text-xs block mb-1">
                  Uji Langsung Endpoint /api/v1/simulate
                </span>
                <p className="text-xs text-slate-400">
                  Mengirimkan sirkuit aktif ({nodes.length} node, {wires.length} kabel) ke backend server Express.
                </p>
              </div>
              <button
                onClick={handleTestLiveApi}
                disabled={isCallingApi}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all disabled:opacity-50 shrink-0 cursor-pointer w-full sm:w-auto justify-center"
              >
                <Send size={14} className={isCallingApi ? 'animate-spin' : ''} />
                <span>{isCallingApi ? 'Mengirim...' : 'Kirim Permintaan Uji'}</span>
              </button>
            </div>

            {testResponse && (
              <div className="flex-1 rounded-xl bg-slate-950 border border-slate-800 flex flex-col overflow-hidden min-h-[220px]">
                <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs font-mono flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Status: {testResponse.status} {testResponse.statusText}</span>
                    {testResponse.source && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                        {testResponse.source}
                      </span>
                    )}
                  </div>
                  {apiLatency !== null && <span className="text-slate-400">Latency: {apiLatency}ms</span>}
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-300 overflow-auto flex-1 leading-relaxed">
                  <code>{JSON.stringify(testResponse.data, null, 2)}</code>
                </pre>
              </div>
            )}
            {!testResponse && (
              <div className="flex-1 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center p-8 text-center text-slate-500 text-xs min-h-[200px]">
                Klik "Kirim Permintaan Uji" untuk mengecek respons payload JSON dari server backend secara real-time.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Embed Iframe */}
        {activeTab === 'embed' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 text-xs">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200 text-sm block">Integrasi Iframe & PostMessage</span>
              <p className="text-slate-400 leading-relaxed text-xs">
                Semua platform blog, LMS (Moodle, Canvas), atau dokumentasi sekolah dapat menyematkan simulator Sistem Digital SEM 5 Muhtyas Yugi langsung ke dalam halaman web mereka tanpa dependensi eksternal.
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                <span className="font-mono text-[11px] text-slate-400">Kode HTML IFrame Embed</span>
                <button
                  onClick={() => copyToClipboard(embedHtmlCode, 4)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                >
                  {copiedIndex === 4 ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedIndex === 4 ? 'Disalin' : 'Salin'}</span>
                </button>
              </div>
              <pre className="p-4 font-mono text-xs text-slate-300 overflow-auto">
                <code>{embedHtmlCode}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
