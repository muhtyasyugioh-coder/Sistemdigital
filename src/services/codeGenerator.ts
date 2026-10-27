import { CircuitNode, WireConnection, CodeTemplate, SupportedLanguage } from '../types/circuit';
import { generateTruthTable } from './simulator';

export function generateCodeTemplates(nodes: CircuitNode[], wires: WireConnection[]): Record<SupportedLanguage, CodeTemplate> {
  const inputNodes = nodes.filter(n => n.type === 'INPUT_SWITCH');
  const outputNodes = nodes.filter(n => n.type === 'OUTPUT_LED' || n.type === 'OUTPUT_PROBE');
  const gates = nodes.filter(n => !['INPUT_SWITCH', 'INPUT_CLOCK', 'OUTPUT_LED', 'OUTPUT_PROBE'].includes(n.type));

  const inputNames = inputNodes.map((n, i) => n.label.replace(/[^a-zA-Z0-9_]/g, '_') || `in_${i + 1}`);
  const outputNames = outputNodes.map((n, i) => n.label.replace(/[^a-zA-Z0-9_]/g, '_') || `out_${i + 1}`);

  const truthTable = generateTruthTable(nodes, wires);

  // 1. Python implementation
  const pythonCode = generatePython(inputNames, outputNames, nodes, wires, truthTable);

  // 2. HTML & JavaScript interactive widget
  const htmlJsCode = generateHtmlJs(inputNames, outputNames, nodes, wires);

  // 3. C / C++
  const cppCode = generateCpp(inputNames, outputNames, nodes, wires);

  // 4. Rust
  const rustCode = generateRust(inputNames, outputNames, nodes, wires);

  // 5. Verilog HDL
  const verilogCode = generateVerilog(inputNames, outputNames, nodes, wires);

  return {
    python: {
      language: 'python',
      name: 'Python 3',
      extension: 'py',
      code: pythonCode,
      explanation: 'Implementasi fungsi logika Boolean Python lengkap dengan pemetaan gerbang logika, eksekusi interaktif, dan tabel kebenaran otomatis.',
    },
    html_js: {
      language: 'html_js',
      name: 'HTML5 & JavaScript',
      extension: 'html',
      code: htmlJsCode,
      explanation: 'Widget web interaktif standalone yang dapat langsung dibuka di browser apa saja dengan sakelar toggle dan LED digital menyala.',
    },
    cpp: {
      language: 'cpp',
      name: 'C / C++',
      extension: 'cpp',
      code: cppCode,
      explanation: 'Implementasi performa tinggi untuk mikrokontroler (Arduino/STM32) atau sistem embedded menggunakan operasi bitwise cepat.',
    },
    rust: {
      language: 'rust',
      name: 'Rust',
      extension: 'rs',
      code: rustCode,
      explanation: 'Implementasi aman tipe (type-safe) dengan fungsi murni dan pengujian otomatis unit test (cargo test).',
    },
    verilog: {
      language: 'verilog',
      name: 'Verilog HDL',
      extension: 'v',
      code: verilogCode,
      explanation: 'Modul Hardware Description Language (HDL) standar IEEE untuk sintesis FPGA (Xilinx/Altera) dan ASIC.',
    },
  };
}

function generatePython(
  inputNames: string[],
  outputNames: string[],
  nodes: CircuitNode[],
  wires: WireConnection[],
  tt: ReturnType<typeof generateTruthTable>
): string {
  const inputsArg = inputNames.length > 0 ? inputNames.join(', ') : 'a, b';
  const outName = outputNames[0] || 'result';

  return `#!/usr/bin/env python3
"""
Simulasi Rangkaian Gerbang Logika Digital
Dihasilkan otomatis oleh Sistem Digital SEM 5 Muhtyas Yugi
"""

# Definisi Gerbang Logika Primitif
def gate_and(*inputs: bool) -> bool:
    return all(inputs) if inputs else False

def gate_or(*inputs: bool) -> bool:
    return any(inputs) if inputs else False

def gate_not(val: bool) -> bool:
    return not val

def gate_nand(*inputs: bool) -> bool:
    return not all(inputs) if inputs else True

def gate_nor(*inputs: bool) -> bool:
    return not any(inputs) if inputs else True

def gate_xor(a: bool, b: bool) -> bool:
    return bool(a ^ b)

def gate_xnor(a: bool, b: bool) -> bool:
    return not bool(a ^ b)

# Fungsi Evaluasi Rangkaian Utama
def simulate_circuit(${inputsArg}) -> dict[str, bool]:
    """
    Mengevaluasi sinyal logika rangkaian secara real-time.
    Input: Boolean (True/False atau 1/0)
    Output: Dictionary status pin output
    """
    ${generatePythonLogicBody(nodes, wires, inputNames, outputNames)}

# Pengujian Tabel Kebenaran (Truth Table)
if __name__ == "__main__":
    print("=" * 45)
    print("  SIMULASI RANGKAIAN LOGIKA - SISTEM DIGITAL SEM 5 MUHTYAS YUGI")
    print("=" * 45)
    
    header_inputs = " | ".join(f"{name:^5}" for name in [${inputNames.map(n => `"${n}"`).join(', ')}])
    header_outputs = " | ".join(f"{name:^5}" for name in [${outputNames.map(n => `"${n}"`).join(', ')}])
    print(f"| {header_inputs} || {header_outputs} |")
    print("-" * 45)

    import itertools
    for combo in itertools.product([0, 1], repeat=len([${inputNames.map(n => `"${n}"`).join(', ')}])):
        kwargs = dict(zip([${inputNames.map(n => `"${n}"`).join(', ')}], [bool(c) for c in combo]))
        res = simulate_circuit(**kwargs)
        
        in_str = " | ".join(f"{c:^5}" for c in combo)
        out_str = " | ".join(f"{int(res[k]):^5}" for k in [${outputNames.map(n => `"${n}"`).join(', ')}])
        print(f"| {in_str} || {out_str} |")
        
    print("=" * 45)
`;
}

function generatePythonLogicBody(
  nodes: CircuitNode[],
  wires: WireConnection[],
  inputNames: string[],
  outputNames: string[]
): string {
  if (inputNames.length === 0 || outputNames.length === 0) {
    return 'return {"result": False}';
  }

  const lines: string[] = [];
  lines.push('# Node sinyal internal');

  // Map input nodes
  const nodeOutputVarMap: Record<string, string> = {};
  const inputNodes = nodes.filter(n => n.type === 'INPUT_SWITCH');
  inputNodes.forEach((node, idx) => {
    const varName = inputNames[idx] || `in_${idx + 1}`;
    nodeOutputVarMap[node.id] = `bool(${varName})`;
  });

  // Topological-like evaluation for gates
  const gates = nodes.filter(n => !['INPUT_SWITCH', 'INPUT_CLOCK', 'OUTPUT_LED', 'OUTPUT_PROBE'].includes(n.type));
  
  gates.forEach((gate, gIdx) => {
    const gateVar = `gate_${gate.type.toLowerCase()}_${gIdx + 1}`;
    // Find wires feeding into this gate
    const inputWires = wires.filter(w => w.toNodeId === gate.id);
    const inVars = inputWires.map(w => nodeOutputVarMap[w.fromNodeId] || 'False');

    if (gate.type === 'AND') {
      lines.push(`${gateVar} = gate_and(${inVars.length ? inVars.join(', ') : 'False'})`);
    } else if (gate.type === 'OR') {
      lines.push(`${gateVar} = gate_or(${inVars.length ? inVars.join(', ') : 'False'})`);
    } else if (gate.type === 'NOT') {
      lines.push(`${gateVar} = gate_not(${inVars[0] || 'False'})`);
    } else if (gate.type === 'NAND') {
      lines.push(`${gateVar} = gate_nand(${inVars.length ? inVars.join(', ') : 'False'})`);
    } else if (gate.type === 'NOR') {
      lines.push(`${gateVar} = gate_nor(${inVars.length ? inVars.join(', ') : 'False'})`);
    } else if (gate.type === 'XOR') {
      lines.push(`${gateVar} = gate_xor(${inVars[0] || 'False'}, ${inVars[1] || 'False'})`);
    } else if (gate.type === 'XNOR') {
      lines.push(`${gateVar} = gate_xnor(${inVars[0] || 'False'}, ${inVars[1] || 'False'})`);
    } else {
      lines.push(`${gateVar} = False`);
    }
    nodeOutputVarMap[gate.id] = gateVar;
  });

  // Outputs
  const outputNodes = nodes.filter(n => n.type === 'OUTPUT_LED' || n.type === 'OUTPUT_PROBE');
  const resultEntries = outputNodes.map((outNode, idx) => {
    const outName = outputNames[idx] || `out_${idx + 1}`;
    const feedingWire = wires.find(w => w.toNodeId === outNode.id);
    const srcVar = feedingWire ? nodeOutputVarMap[feedingWire.fromNodeId] || 'False' : 'False';
    return `"${outName}": ${srcVar}`;
  });

  lines.push(`return { ${resultEntries.join(', ')} }`);
  return lines.join('\n    ');
}

function generateHtmlJs(
  inputNames: string[],
  outputNames: string[],
  nodes: CircuitNode[],
  wires: WireConnection[]
): string {
  const switchCheckboxes = inputNames.map((name, i) => `
    <div class="control-row">
      <label class="switch">
        <input type="checkbox" id="switch_${name}" onchange="updateSimulation()">
        <span class="slider"></span>
      </label>
      <span class="label-text">Input <strong>${name}</strong></span>
      <span id="val_${name}" class="badge">0</span>
    </div>
  `).join('');

  const ledOutputs = outputNames.map((name, i) => `
    <div class="led-card">
      <div id="led_${name}" class="led off"></div>
      <div class="led-info">
        <span class="led-name">${name}</span>
        <span id="text_${name}" class="led-status">LOW (0)</span>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simulasi Logika Digital Interaktif</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background: #0b1120; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 24px; }
    .simulator-box { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; width: 100%; max-width: 520px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    h2 { font-size: 20px; margin-bottom: 8px; color: #38bdf8; }
    p.desc { font-size: 13px; color: #94a3b8; margin-bottom: 24px; }
    .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; margin-bottom: 12px; }
    .control-row { display: flex; align-items: center; justify-content: space-between; background: #0f172a; padding: 12px 16px; border-radius: 10px; margin-bottom: 10px; border: 1px solid #1e293b; }
    .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #334155; transition: .3s; border-radius: 24px; }
    .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
    input:checked + .slider { background-color: #0284c7; }
    input:checked + .slider:before { transform: translateX(20px); }
    .badge { font-family: monospace; font-weight: bold; background: #334155; padding: 2px 8px; border-radius: 6px; font-size: 12px; }
    .badge.active { background: #0284c7; color: white; }
    .led-grid { display: grid; gap: 12px; margin-top: 8px; }
    .led-card { display: flex; align-items: center; gap: 16px; background: #0f172a; padding: 16px; border-radius: 10px; border: 1px solid #1e293b; }
    .led { width: 28px; height: 28px; border-radius: 50%; background: #334155; border: 2px solid #475569; transition: all 0.2s ease; }
    .led.on { background: #38bdf8; border-color: #7dd3fc; box-shadow: 0 0 16px #38bdf8, 0 0 32px #0284c7; }
    .led-name { font-weight: 600; font-size: 14px; display: block; }
    .led-status { font-size: 12px; color: #64748b; font-family: monospace; }
  </style>
</head>
<body>

<div class="simulator-box">
  <h2>Sistem Digital SEM 5 Muhtyas Yugi Real-Time Runner</h2>
  <p class="desc">Ubah sakelar input di bawah ini untuk melihat rambatan sinyal digital.</p>

  <div class="section-title">Sakelar Input</div>
  ${switchCheckboxes}

  <div class="section-title" style="margin-top: 24px;">Lampu Output LED</div>
  <div class="led-grid">
    ${ledOutputs}
  </div>
</div>

<script>
// Gerbang Logika Dasar
const AND = (...args) => args.length > 0 && args.every(Boolean);
const OR = (...args) => args.length > 0 && args.some(Boolean);
const NOT = (v) => !v;
const NAND = (...args) => !AND(...args);
const NOR = (...args) => !OR(...args);
const XOR = (a, b) => Boolean(a ^ b);
const XNOR = (a, b) => !XOR(a, b);

function updateSimulation() {
  // 1. Baca nilai switch
  ${inputNames.map(name => `
  const in_${name} = document.getElementById('switch_${name}').checked;
  const badge_${name} = document.getElementById('val_${name}');
  badge_${name}.innerText = in_${name} ? '1' : '0';
  badge_${name}.className = 'badge ' + (in_${name} ? 'active' : '');
  `).join('\n')}

  // 2. Evaluasi sirkuit
  ${generateJsLogicBody(nodes, wires, inputNames, outputNames)}

  // 3. Render indikator LED
  ${outputNames.map(name => `
  const led_${name} = document.getElementById('led_${name}');
  const text_${name} = document.getElementById('text_${name}');
  if (out_${name}) {
    led_${name}.classList.add('on');
    text_${name}.innerText = 'HIGH (1)';
    text_${name}.style.color = '#38bdf8';
  } else {
    led_${name}.classList.remove('on');
    text_${name}.innerText = 'LOW (0)';
    text_${name}.style.color = '#64748b';
  }
  `).join('\n')}
}

// Jalankan inisialisasi awal
updateSimulation();
</script>

</body>
</html>`;
}

function generateJsLogicBody(
  nodes: CircuitNode[],
  wires: WireConnection[],
  inputNames: string[],
  outputNames: string[]
): string {
  const lines: string[] = [];
  const nodeOutputVarMap: Record<string, string> = {};

  const inputNodes = nodes.filter(n => n.type === 'INPUT_SWITCH');
  inputNodes.forEach((node, idx) => {
    const name = inputNames[idx] || `in_${idx + 1}`;
    nodeOutputVarMap[node.id] = `in_${name}`;
  });

  const gates = nodes.filter(n => !['INPUT_SWITCH', 'INPUT_CLOCK', 'OUTPUT_LED', 'OUTPUT_PROBE'].includes(n.type));
  gates.forEach((gate, gIdx) => {
    const gateVar = `gate_${gate.type.toLowerCase()}_${gIdx + 1}`;
    const inputWires = wires.filter(w => w.toNodeId === gate.id);
    const inVars = inputWires.map(w => nodeOutputVarMap[w.fromNodeId] || 'false');

    if (gate.type === 'AND') {
      lines.push(`const ${gateVar} = AND(${inVars.length ? inVars.join(', ') : 'false'});`);
    } else if (gate.type === 'OR') {
      lines.push(`const ${gateVar} = OR(${inVars.length ? inVars.join(', ') : 'false'});`);
    } else if (gate.type === 'NOT') {
      lines.push(`const ${gateVar} = NOT(${inVars[0] || 'false'});`);
    } else if (gate.type === 'NAND') {
      lines.push(`const ${gateVar} = NAND(${inVars.length ? inVars.join(', ') : 'false'});`);
    } else if (gate.type === 'NOR') {
      lines.push(`const ${gateVar} = NOR(${inVars.length ? inVars.join(', ') : 'false'});`);
    } else if (gate.type === 'XOR') {
      lines.push(`const ${gateVar} = XOR(${inVars[0] || 'false'}, ${inVars[1] || 'false'});`);
    } else if (gate.type === 'XNOR') {
      lines.push(`const ${gateVar} = XNOR(${inVars[0] || 'false'}, ${inVars[1] || 'false'});`);
    } else {
      lines.push(`const ${gateVar} = false;`);
    }
    nodeOutputVarMap[gate.id] = gateVar;
  });

  const outputNodes = nodes.filter(n => n.type === 'OUTPUT_LED' || n.type === 'OUTPUT_PROBE');
  outputNodes.forEach((outNode, idx) => {
    const name = outputNames[idx] || `out_${idx + 1}`;
    const feedingWire = wires.find(w => w.toNodeId === outNode.id);
    const srcVar = feedingWire ? nodeOutputVarMap[feedingWire.fromNodeId] || 'false' : 'false';
    lines.push(`const out_${name} = ${srcVar};`);
  });

  return lines.join('\n  ');
}

function generateCpp(
  inputNames: string[],
  outputNames: string[],
  nodes: CircuitNode[],
  wires: WireConnection[]
): string {
  const args = inputNames.map(n => `bool ${n}`).join(', ');
  const outStructFields = outputNames.map(n => `    bool ${n};`).join('\n');

  return `#include <iostream>
#include <iomanip>

struct CircuitOutput {
${outStructFields}
};

CircuitOutput evaluate_circuit(${args}) {
    // Evaluasi sinyal digital dengan operator logika C++
    ${generateCppLogic(nodes, wires, inputNames, outputNames)}
}

int main() {
    std::cout << "--- TABEL KEBENARAN C++ ---\\n";
    // Jalankan kombinasi uji
    ${inputNames.length > 0 ? `
    for (int a = 0; a <= 1; ++a) {
        for (int b = 0; b <= 1; ++b) {
            auto out = evaluate_circuit(${inputNames.map((_, i) => i === 0 ? 'a' : 'b').join(', ')});
            std::cout << "Input: " << a << ", " << b 
                      << " => Output: " << out.${outputNames[0] || 'out_1'} << "\\n";
        }
    }` : 'std::cout << "Rangkaian siap.\\n";'}
    return 0;
}
`;
}

function generateCppLogic(
  nodes: CircuitNode[],
  wires: WireConnection[],
  inputNames: string[],
  outputNames: string[]
): string {
  const lines: string[] = [];
  const nodeOutputVarMap: Record<string, string> = {};

  const inputNodes = nodes.filter(n => n.type === 'INPUT_SWITCH');
  inputNodes.forEach((node, idx) => {
    nodeOutputVarMap[node.id] = inputNames[idx] || `in_${idx + 1}`;
  });

  const gates = nodes.filter(n => !['INPUT_SWITCH', 'INPUT_CLOCK', 'OUTPUT_LED', 'OUTPUT_PROBE'].includes(n.type));
  gates.forEach((gate, gIdx) => {
    const gateVar = `g_${gate.type.toLowerCase()}_${gIdx + 1}`;
    const inputWires = wires.filter(w => w.toNodeId === gate.id);
    const inVars = inputWires.map(w => nodeOutputVarMap[w.fromNodeId] || 'false');

    if (gate.type === 'AND') {
      lines.push(`bool ${gateVar} = ${inVars.length ? inVars.join(' && ') : 'false'};`);
    } else if (gate.type === 'OR') {
      lines.push(`bool ${gateVar} = ${inVars.length ? inVars.join(' || ') : 'false'};`);
    } else if (gate.type === 'NOT') {
      lines.push(`bool ${gateVar} = !(${inVars[0] || 'false'});`);
    } else if (gate.type === 'NAND') {
      lines.push(`bool ${gateVar} = !(${inVars.length ? inVars.join(' && ') : 'false'});`);
    } else if (gate.type === 'NOR') {
      lines.push(`bool ${gateVar} = !(${inVars.length ? inVars.join(' || ') : 'false'});`);
    } else if (gate.type === 'XOR') {
      lines.push(`bool ${gateVar} = (${inVars[0] || 'false'}) ^ (${inVars[1] || 'false'});`);
    } else if (gate.type === 'XNOR') {
      lines.push(`bool ${gateVar} = !((${inVars[0] || 'false'}) ^ (${inVars[1] || 'false'}));`);
    }
    nodeOutputVarMap[gate.id] = gateVar;
  });

  const outputNodes = nodes.filter(n => n.type === 'OUTPUT_LED' || n.type === 'OUTPUT_PROBE');
  const returnAssignments = outputNodes.map((outNode, idx) => {
    const name = outputNames[idx] || `out_${idx + 1}`;
    const feedingWire = wires.find(w => w.toNodeId === outNode.id);
    const srcVar = feedingWire ? nodeOutputVarMap[feedingWire.fromNodeId] || 'false' : 'false';
    return `.${name} = ${srcVar}`;
  });

  lines.push(`return CircuitOutput{ ${returnAssignments.join(', ')} };`);
  return lines.join('\n    ');
}

function generateRust(
  inputNames: string[],
  outputNames: string[],
  nodes: CircuitNode[],
  wires: WireConnection[]
): string {
  const args = inputNames.map(n => `${n}: bool`).join(', ');

  return `/// Simulasi Rangkaian Logika Digital Rust
#[derive(Debug, PartialEq, Eq)]
pub struct CircuitOutputs {
${outputNames.map(n => `    pub ${n}: bool,`).join('\n')}
}

pub fn simulate_circuit(${args}) -> CircuitOutputs {
    // Evaluasi fungsi murni
    ${generateRustLogic(nodes, wires, inputNames, outputNames)}
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_circuit_evaluation() {
        let result = simulate_circuit(${inputNames.map(() => 'true').join(', ')});
        println!("Hasil evaluasi: {:?}", result);
    }
}
`;
}

function generateRustLogic(
  nodes: CircuitNode[],
  wires: WireConnection[],
  inputNames: string[],
  outputNames: string[]
): string {
  const lines: string[] = [];
  const nodeOutputVarMap: Record<string, string> = {};

  const inputNodes = nodes.filter(n => n.type === 'INPUT_SWITCH');
  inputNodes.forEach((node, idx) => {
    nodeOutputVarMap[node.id] = inputNames[idx] || `in_${idx + 1}`;
  });

  const gates = nodes.filter(n => !['INPUT_SWITCH', 'INPUT_CLOCK', 'OUTPUT_LED', 'OUTPUT_PROBE'].includes(n.type));
  gates.forEach((gate, gIdx) => {
    const gateVar = `g_${gate.type.toLowerCase()}_${gIdx + 1}`;
    const inputWires = wires.filter(w => w.toNodeId === gate.id);
    const inVars = inputWires.map(w => nodeOutputVarMap[w.fromNodeId] || 'false');

    if (gate.type === 'AND') {
      lines.push(`let ${gateVar} = ${inVars.length ? inVars.join(' && ') : 'false'};`);
    } else if (gate.type === 'OR') {
      lines.push(`let ${gateVar} = ${inVars.length ? inVars.join(' || ') : 'false'};`);
    } else if (gate.type === 'NOT') {
      lines.push(`let ${gateVar} = !${inVars[0] || 'false'};`);
    } else if (gate.type === 'NAND') {
      lines.push(`let ${gateVar} = !(${inVars.length ? inVars.join(' && ') : 'false'});`);
    } else if (gate.type === 'NOR') {
      lines.push(`let ${gateVar} = !(${inVars.length ? inVars.join(' || ') : 'false'});`);
    } else if (gate.type === 'XOR') {
      lines.push(`let ${gateVar} = ${inVars[0] || 'false'} ^ ${inVars[1] || 'false'};`);
    } else if (gate.type === 'XNOR') {
      lines.push(`let ${gateVar} = !(${inVars[0] || 'false'} ^ ${inVars[1] || 'false'});`);
    }
    nodeOutputVarMap[gate.id] = gateVar;
  });

  const outputNodes = nodes.filter(n => n.type === 'OUTPUT_LED' || n.type === 'OUTPUT_PROBE');
  const returnAssignments = outputNodes.map((outNode, idx) => {
    const name = outputNames[idx] || `out_${idx + 1}`;
    const feedingWire = wires.find(w => w.toNodeId === outNode.id);
    const srcVar = feedingWire ? nodeOutputVarMap[feedingWire.fromNodeId] || 'false' : 'false';
    return `        ${name}: ${srcVar},`;
  });

  lines.push(`CircuitOutputs {\n${returnAssignments.join('\n')}\n    }`);
  return lines.join('\n    ');
}

function generateVerilog(
  inputNames: string[],
  outputNames: string[],
  nodes: CircuitNode[],
  wires: WireConnection[]
): string {
  const inputsDecl = inputNames.map(n => `    input wire ${n},`).join('\n');
  const outputsDecl = outputNames.map((n, i) => `    output wire ${n}${i === outputNames.length - 1 ? '' : ','}`).join('\n');

  return `// Modul Verilog Rangkaian Gerbang Logika (IEEE 1364)
// Cocok untuk sintesis FPGA & simulasi Icarus Verilog / ModelSim

module logic_circuit (
${inputsDecl}
${outputsDecl}
);

    // Kawat Sinyal Internal
    ${generateVerilogAssignments(nodes, wires, inputNames, outputNames)}

endmodule
`;
}

function generateVerilogAssignments(
  nodes: CircuitNode[],
  wires: WireConnection[],
  inputNames: string[],
  outputNames: string[]
): string {
  const lines: string[] = [];
  const nodeOutputVarMap: Record<string, string> = {};

  const inputNodes = nodes.filter(n => n.type === 'INPUT_SWITCH');
  inputNodes.forEach((node, idx) => {
    nodeOutputVarMap[node.id] = inputNames[idx] || `in_${idx + 1}`;
  });

  const gates = nodes.filter(n => !['INPUT_SWITCH', 'INPUT_CLOCK', 'OUTPUT_LED', 'OUTPUT_PROBE'].includes(n.type));
  gates.forEach((gate, gIdx) => {
    const wireName = `w_${gate.type.toLowerCase()}_${gIdx + 1}`;
    const inputWires = wires.filter(w => w.toNodeId === gate.id);
    const inVars = inputWires.map(w => nodeOutputVarMap[w.fromNodeId] || "1'b0");

    lines.push(`wire ${wireName};`);
    if (gate.type === 'AND') {
      lines.push(`assign ${wireName} = ${inVars.length ? inVars.join(' & ') : "1'b0"};`);
    } else if (gate.type === 'OR') {
      lines.push(`assign ${wireName} = ${inVars.length ? inVars.join(' | ') : "1'b0"};`);
    } else if (gate.type === 'NOT') {
      lines.push(`assign ${wireName} = ~(${inVars[0] || "1'b0"});`);
    } else if (gate.type === 'NAND') {
      lines.push(`assign ${wireName} = ~(${inVars.length ? inVars.join(' & ') : "1'b0"});`);
    } else if (gate.type === 'NOR') {
      lines.push(`assign ${wireName} = ~(${inVars.length ? inVars.join(' | ') : "1'b0"});`);
    } else if (gate.type === 'XOR') {
      lines.push(`assign ${wireName} = (${inVars[0] || "1'b0"}) ^ (${inVars[1] || "1'b0"});`);
    } else if (gate.type === 'XNOR') {
      lines.push(`assign ${wireName} = ~(${inVars[0] || "1'b0"} ^ ${inVars[1] || "1'b0"});`);
    }
    nodeOutputVarMap[gate.id] = wireName;
  });

  const outputNodes = nodes.filter(n => n.type === 'OUTPUT_LED' || n.type === 'OUTPUT_PROBE');
  outputNodes.forEach((outNode, idx) => {
    const name = outputNames[idx] || `out_${idx + 1}`;
    const feedingWire = wires.find(w => w.toNodeId === outNode.id);
    const srcVar = feedingWire ? nodeOutputVarMap[feedingWire.fromNodeId] || "1'b0" : "1'b0";
    lines.push(`assign ${name} = ${srcVar};`);
  });

  return lines.join('\n    ');
}
