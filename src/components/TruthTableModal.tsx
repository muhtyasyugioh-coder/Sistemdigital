import React from 'react';
import { TruthTableData, CircuitNode } from '../types/circuit';
import { X, Copy, Download, Check, Binary } from 'lucide-react';

interface TruthTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  truthTable: TruthTableData;
  currentNodes: CircuitNode[];
}

export const TruthTableModal: React.FC<TruthTableModalProps> = ({
  isOpen,
  onClose,
  truthTable,
  currentNodes,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  // Identify current live row matching active switches
  const currentSwitchValues: Record<string, boolean> = {};
  currentNodes
    .filter(n => n.type === 'INPUT_SWITCH')
    .forEach(n => {
      currentSwitchValues[n.id] = Boolean(n.state?.switchValue);
    });

  const isCurrentRow = (rowInputs: Record<string, boolean>) => {
    return Object.keys(rowInputs).every(
      key => currentSwitchValues[key] === rowInputs[key]
    );
  };

  const handleCopyMarkdown = () => {
    if (truthTable.rows.length === 0) return;

    const headers = [
      ...truthTable.inputLabels.map(l => l.name),
      '|',
      ...truthTable.outputLabels.map(l => l.name),
    ];

    const separator = headers.map(() => '---');

    const lines = [
      `| ${headers.join(' | ')} |`,
      `| ${separator.join(' | ')} |`,
    ];

    truthTable.rows.forEach(row => {
      const vals = [
        ...truthTable.inputLabels.map(l => (row.inputs[l.id] ? '1' : '0')),
        '|',
        ...truthTable.outputLabels.map(l => (row.outputs[l.id] ? '1' : '0')),
      ];
      lines.push(`| ${vals.join(' | ')} |`);
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    if (truthTable.rows.length === 0) return;

    const header = [
      ...truthTable.inputLabels.map(l => l.name),
      ...truthTable.outputLabels.map(l => l.name),
    ].join(',');

    const rows = truthTable.rows.map(row => [
      ...truthTable.inputLabels.map(l => (row.inputs[l.id] ? '1' : '0')),
      ...truthTable.outputLabels.map(l => (row.outputs[l.id] ? '1' : '0')),
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'tabel-kebenaran-logikalab.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Binary size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate">Tabel Kebenaran (Truth Table)</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate hidden sm:block">
                Evaluasi komprehensif seluruh {truthTable.rows.length} kombinasi input biner rangkaian
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
              title="Salin Markdown Tabel"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span className="hidden sm:inline">{copied ? 'Tersalin' : 'Salin Tabel'}</span>
              <span className="sm:hidden">{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
              title="Unduh File CSV"
            >
              <Download size={14} />
              <span>CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
          {/* Boolean Expression Banner */}
          {truthTable.booleanExpression && (
            <div className="p-3 sm:p-4 rounded-xl bg-sky-950/20 border border-sky-800/40 flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                Persamaan Aljabar Boolean (Bentuk SOP)
              </span>
              <div className="font-mono text-xs sm:text-sm text-sky-200 font-semibold tracking-wide break-words">
                {truthTable.booleanExpression}
              </div>
            </div>
          )}

          {truthTable.rows.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Tambahkan minimal 1 Sakelar Input dan 1 Lampu LED Output untuk membuat tabel kebenaran.
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-x-auto no-scrollbar shadow-inner">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-300">
                    <th className="py-2.5 px-4 font-semibold text-center w-12 text-slate-500">#</th>
                    {truthTable.inputLabels.map(l => (
                      <th key={l.id} className="py-2.5 px-4 font-bold text-sky-400 text-center">
                        {l.name}
                      </th>
                    ))}
                    <th className="w-px bg-slate-800 p-0" />
                    {truthTable.outputLabels.map(l => (
                      <th key={l.id} className="py-2.5 px-4 font-bold text-emerald-400 text-center">
                        {l.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {truthTable.rows.map((row, idx) => {
                    const isLive = isCurrentRow(row.inputs);
                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isLive
                            ? 'bg-sky-500/15 text-white font-bold ring-1 ring-inset ring-sky-500/40'
                            : 'hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <td className="py-2 px-4 text-center text-slate-500 text-[11px]">
                          {isLive ? '👉' : idx + 1}
                        </td>
                        {truthTable.inputLabels.map(l => (
                          <td key={l.id} className="py-2 px-4 text-center">
                            <span
                              className={`inline-block w-6 py-0.5 rounded text-center text-xs ${
                                row.inputs[l.id]
                                  ? 'bg-sky-500/20 text-sky-300 font-bold'
                                  : 'text-slate-500'
                              }`}
                            >
                              {row.inputs[l.id] ? '1' : '0'}
                            </span>
                          </td>
                        ))}
                        <td className="w-px bg-slate-800 p-0" />
                        {truthTable.outputLabels.map(l => (
                          <td key={l.id} className="py-2 px-4 text-center">
                            <span
                              className={`inline-block w-6 py-0.5 rounded text-center text-xs ${
                                row.outputs[l.id]
                                  ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                                  : 'text-slate-500'
                              }`}
                            >
                              {row.outputs[l.id] ? '1' : '0'}
                            </span>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Baris dengan tanda 👉 menunjukkan status sinyal rangkaian saat ini.</span>
            <span>Total baris: {truthTable.rows.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
