import React, { useState, useEffect } from 'react';
import { CircuitData, CircuitNode, WireConnection } from '../types/circuit';
import { encodeCircuitToHash } from '../utils/urlSharing';
import { X, Copy, Check, Download, Upload, Bookmark, Trash2, FolderOpen, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  circuit: CircuitData;
  onLoadCircuit: (circuit: CircuitData) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  circuit,
  onLoadCircuit,
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'export_json' | 'import_json' | 'saved'>('share');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [saveName, setSaveName] = useState(circuit.name || 'Rangkaian Logika Saya');
  const [jsonPasteInput, setJsonPasteInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Local storage saved circuits
  const [savedCircuits, setSavedCircuits] = useState<{ id: string; name: string; date: string; data: CircuitData }[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('logikalab_saved_circuits');
      if (stored) {
        setSavedCircuits(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate share URL
  const hash = encodeCircuitToHash(circuit);
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#circuit=${hash}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(circuit, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(circuit.name || 'logikalab_circuit').toLowerCase().replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(circuit, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.nodes) && Array.isArray(parsed.wires)) {
          onLoadCircuit(parsed);
          onClose();
        } else {
          setJsonError('Format file JSON tidak valid. Memerlukan properti nodes dan wires.');
        }
      } catch (err: any) {
        setJsonError(`Gagal membaca JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyPastedJson = () => {
    try {
      setJsonError('');
      const parsed = JSON.parse(jsonPasteInput);
      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.wires)) {
        onLoadCircuit(parsed);
        onClose();
      } else {
        setJsonError('Struktur JSON harus memiliki array nodes dan wires.');
      }
    } catch (err: any) {
      setJsonError(`Sintaks JSON tidak valid: ${err.message}`);
    }
  };

  const handleSaveToLocal = () => {
    if (!saveName.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      name: saveName.trim(),
      date: new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      data: {
        ...circuit,
        name: saveName.trim(),
        updatedAt: new Date().toISOString(),
      },
    };

    const updated = [newItem, ...savedCircuits.filter(c => c.name !== saveName.trim())];
    setSavedCircuits(updated);
    localStorage.setItem('logikalab_saved_circuits', JSON.stringify(updated));
    setActiveTab('saved');
  };

  const handleDeleteSaved = (id: string) => {
    const updated = savedCircuits.filter(c => c.id !== id);
    setSavedCircuits(updated);
    localStorage.setItem('logikalab_saved_circuits', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Simpan & Bagikan Desain Rangkaian
              </h3>
              <p className="text-xs text-slate-400">
                Bagikan via tautan URL, ekspor format JSON, atau simpan ke pustaka lokal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center px-4 sm:px-6 py-2 bg-slate-950/80 border-b border-slate-800 gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('share')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'share'
                ? 'bg-slate-800 text-sky-400 border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 size={14} />
            Tautan Berbagi URL
          </button>
          <button
            onClick={() => setActiveTab('export_json')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'export_json'
                ? 'bg-slate-800 text-sky-400 border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download size={14} />
            Ekspor JSON
          </button>
          <button
            onClick={() => setActiveTab('import_json')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'import_json'
                ? 'bg-slate-800 text-sky-400 border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload size={14} />
            Impor JSON
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-slate-800 text-sky-400 border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark size={14} />
            Pustaka Lokal ({savedCircuits.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Tab 1: Share Link */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-200 text-sm block">Tautan Langsung Rangkaian</span>
                <p className="text-slate-400 leading-relaxed text-xs">
                  Seluruh susunan gerbang logika, koneksi kabel, dan posisi dienkripsi langsung ke dalam tautan URL. Siapa pun yang membuka tautan ini dapat langsung menguji dan mengedit rangkaian tanpa perlu login!
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all shrink-0"
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Tersalin!' : 'Salin Tautan'}</span>
                </button>
              </div>

              {/* Quick Save to Local */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <span className="font-bold text-slate-200 text-xs block">
                  Simpan ke Perangkat Lokal (Browser)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Nama desain rangkaian..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={handleSaveToLocal}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shrink-0"
                  >
                    <Bookmark size={14} />
                    <span>Simpan</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Export JSON */}
          {activeTab === 'export_json' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-200 text-sm block">Ekspor Format JSON Standar</span>
                <p className="text-slate-400 leading-relaxed text-xs">
                  Format JSON memungkinkan kolaborasi antar pengembang, integrasi ke pipeline CI/CD, atau pencadangan file proyek sirkuit logika Anda.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDownloadJson}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-sm"
                >
                  <Download size={15} />
                  <span>Unduh File .JSON</span>
                </button>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                >
                  {copiedJson ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                  <span>{copiedJson ? 'Tersalin' : 'Salin JSON ke Clipboard'}</span>
                </button>
              </div>

              {/* Preview JSON */}
              <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                  Pratinjau Struktur Data JSON ({circuit.nodes.length} Nodes, {circuit.wires.length} Wires)
                </div>
                <pre className="p-4 font-mono text-[11px] text-slate-300 max-h-48 overflow-auto">
                  <code>{JSON.stringify(circuit, null, 2)}</code>
                </pre>
              </div>
            </div>
          )}

          {/* Tab 3: Import JSON */}
          {activeTab === 'import_json' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-200 text-sm block">Impor Desain dari File atau Teks JSON</span>
                <p className="text-slate-400 leading-relaxed text-xs">
                  Unggah file `.json` atau tempelkan teks JSON untuk memuat rangkaian ke dalam kanvas kerja secara instan.
                </p>
              </div>

              {/* Upload file */}
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 hover:border-sky-500/60 rounded-xl bg-slate-950/40 cursor-pointer transition-colors group">
                <Upload size={24} className="text-slate-500 group-hover:text-sky-400 mb-2 transition-colors" />
                <span className="font-semibold text-slate-200">Klik untuk memilih file JSON</span>
                <span className="text-[11px] text-slate-500 mt-1">Mendukung format export Sistem Digital SEM 5 Muhtyas Yugi (*.json)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Or paste text */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-300 text-xs block">
                  Atau Tempelkan Teks JSON:
                </span>
                <textarea
                  rows={4}
                  value={jsonPasteInput}
                  onChange={(e) => setJsonPasteInput(e.target.value)}
                  placeholder='{"nodes": [...], "wires": [...]}'
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
                />
                {jsonError && (
                  <div className="text-rose-400 text-xs bg-rose-950/30 p-2.5 rounded-lg border border-rose-900/40">
                    {jsonError}
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handleApplyPastedJson}
                    disabled={!jsonPasteInput.trim()}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-40 transition-all"
                  >
                    Terapkan JSON ke Kanvas
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Saved Circuits Library */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs">
                  Rangkaian Tersimpan di Browser ({savedCircuits.length})
                </span>
              </div>

              {savedCircuits.length === 0 ? (
                <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Belum ada rangkaian yang disimpan di pustaka lokal ini.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {savedCircuits.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-200 text-xs truncate">{item.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Disimpan: {item.date} · {item.data.nodes?.length || 0} Komponen
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onLoadCircuit(item.data);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 transition-colors"
                        >
                          <FolderOpen size={13} />
                          <span>Buka</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSaved(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
