import { CircuitNode, WireConnection, GateType, TruthTableData, TruthTableRow } from '../types/circuit';

export function evaluateGate(type: GateType, inputValues: boolean[]): boolean {
  switch (type) {
    case 'AND':
      return inputValues.length > 0 && inputValues.every(v => v);
    case 'OR':
      return inputValues.length > 0 && inputValues.some(v => v);
    case 'NOT':
      return inputValues.length > 0 ? !inputValues[0] : false;
    case 'NAND':
      return inputValues.length > 0 ? !inputValues.every(v => v) : true;
    case 'NOR':
      return inputValues.length > 0 ? !inputValues.some(v => v) : true;
    case 'XOR':
      if (inputValues.length === 0) return false;
      return inputValues.reduce((acc, curr) => acc !== curr, false);
    case 'XNOR':
      if (inputValues.length === 0) return true;
      return !inputValues.reduce((acc, curr) => acc !== curr, false);
    case 'OUTPUT_LED':
    case 'OUTPUT_PROBE':
      return inputValues.length > 0 ? inputValues[0] : false;
    default:
      return false;
  }
}

/**
 * Propagates logic signals through nodes and wires.
 * Uses relaxation iterations to handle multi-stage circuits and feedback (latches).
 */
export function simulateCircuit(
  nodes: CircuitNode[],
  wires: WireConnection[],
  maxIterations = 16
): { nodes: CircuitNode[]; wires: WireConnection[]; changed: boolean } {
  // Deep clone to avoid mutating input directly during pure simulation
  const nextNodes: CircuitNode[] = JSON.parse(JSON.stringify(nodes));
  const nextWires: WireConnection[] = JSON.parse(JSON.stringify(wires));

  let globalChanged = false;

  for (let iter = 0; iter < maxIterations; iter++) {
    let iterationChanged = false;

    // 1. Update node outputs based on their internal logic and current input values
    for (const node of nextNodes) {
      if (node.type === 'INPUT_SWITCH') {
        const val = Boolean(node.state?.switchValue);
        for (const outPort of node.outputs) {
          if (outPort.value !== val) {
            outPort.value = val;
            iterationChanged = true;
            globalChanged = true;
          }
        }
      } else if (node.type === 'INPUT_CLOCK') {
        const val = Boolean(node.state?.clockState);
        for (const outPort of node.outputs) {
          if (outPort.value !== val) {
            outPort.value = val;
            iterationChanged = true;
            globalChanged = true;
          }
        }
      } else {
        const inVals = node.inputs.map(p => p.value);
        const outVal = evaluateGate(node.type, inVals);

        for (const outPort of node.outputs) {
          if (outPort.value !== outVal) {
            outPort.value = outVal;
            iterationChanged = true;
            globalChanged = true;
          }
        }
      }
    }

    // 2. Propagate values across wires
    for (const wire of nextWires) {
      const fromNode = nextNodes.find(n => n.id === wire.fromNodeId);
      const toNode = nextNodes.find(n => n.id === wire.toNodeId);

      if (!fromNode || !toNode) continue;

      const fromPort = fromNode.outputs.find(p => p.id === wire.fromPortId);
      const toPort = toNode.inputs.find(p => p.id === wire.toPortId);

      if (fromPort && toPort) {
        wire.signal = fromPort.value;
        if (toPort.value !== fromPort.value) {
          toPort.value = fromPort.value;
          iterationChanged = true;
          globalChanged = true;
        }
      }
    }

    if (!iterationChanged) break;
  }

  return { nodes: nextNodes, wires: nextWires, changed: globalChanged };
}

/**
 * Calculates a full truth table for the circuit's switches and LED outputs.
 */
export function generateTruthTable(nodes: CircuitNode[], wires: WireConnection[]): TruthTableData {
  const inputNodes = nodes.filter(n => n.type === 'INPUT_SWITCH');
  const outputNodes = nodes.filter(n => n.type === 'OUTPUT_LED' || n.type === 'OUTPUT_PROBE');

  const inputLabels = inputNodes.map((n, i) => ({
    id: n.id,
    name: n.label || `In ${String.fromCharCode(65 + i)}`,
  }));

  const outputLabels = outputNodes.map((n, i) => ({
    id: n.id,
    name: n.label || `Out ${i + 1}`,
  }));

  if (inputNodes.length === 0 || outputNodes.length === 0) {
    return {
      inputLabels,
      outputLabels,
      rows: [],
      booleanExpression: inputNodes.length === 0 ? 'Tidak ada Input Switch' : 'Tidak ada Output LED',
    };
  }

  // Limit max inputs to 8 to avoid explosive 2^N tables in UI
  const effectiveInputs = inputNodes.slice(0, 8);
  const totalCombinations = 1 << effectiveInputs.length;
  const rows: TruthTableRow[] = [];

  for (let combo = 0; combo < totalCombinations; combo++) {
    // Clone nodes
    const testNodes: CircuitNode[] = JSON.parse(JSON.stringify(nodes));
    const testWires: WireConnection[] = JSON.parse(JSON.stringify(wires));

    const inputRowMap: Record<string, boolean> = {};

    effectiveInputs.forEach((node, bitIdx) => {
      // Bit from MSB to LSB
      const isHigh = Boolean((combo >> (effectiveInputs.length - 1 - bitIdx)) & 1);
      const matched = testNodes.find(n => n.id === node.id);
      if (matched) {
        if (!matched.state) matched.state = {};
        matched.state.switchValue = isHigh;
      }
      inputRowMap[node.id] = isHigh;
    });

    // Run simulation
    const simulated = simulateCircuit(testNodes, testWires, 24);

    const outputRowMap: Record<string, boolean> = {};
    outputNodes.forEach(node => {
      const matched = simulated.nodes.find(n => n.id === node.id);
      const val = matched && matched.inputs.length > 0 ? matched.inputs[0].value : false;
      outputRowMap[node.id] = val;
    });

    rows.push({
      inputs: inputRowMap,
      outputs: outputRowMap,
    });
  }

  // Derive simplified boolean expression for primary output
  const booleanExpression = deriveBooleanEquation(inputLabels, outputLabels, rows);

  return {
    inputLabels,
    outputLabels,
    rows,
    booleanExpression,
  };
}

function deriveBooleanEquation(
  inputs: { id: string; name: string }[],
  outputs: { id: string; name: string }[],
  rows: TruthTableRow[]
): string {
  if (outputs.length === 0 || rows.length === 0) return '';
  const firstOut = outputs[0];

  // Sum of Products (SOP) standard form
  const minterms: string[] = [];
  for (const row of rows) {
    if (row.outputs[firstOut.id]) {
      const termParts = inputs.map(inp => {
        const val = row.inputs[inp.id];
        return val ? inp.name : `¬${inp.name}`;
      });
      minterms.push(`(${termParts.join(' ∧ ')})`);
    }
  }

  if (minterms.length === 0) return `${firstOut.name} = 0`;
  if (minterms.length === rows.length) return `${firstOut.name} = 1`;
  if (minterms.length > 8) return `${firstOut.name} = SOP(${minterms.length} minterms)`;
  return `${firstOut.name} = ${minterms.join(' ∨ ')}`;
}
