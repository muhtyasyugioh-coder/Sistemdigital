export type GateType = 
  | 'AND' 
  | 'OR' 
  | 'NOT' 
  | 'NAND' 
  | 'NOR' 
  | 'XOR' 
  | 'XNOR' 
  | 'INPUT_SWITCH' 
  | 'INPUT_CLOCK' 
  | 'OUTPUT_LED' 
  | 'OUTPUT_PROBE';

export type PortType = 'input' | 'output';

export interface Port {
  id: string;
  name: string;
  type: PortType;
  value: boolean;
}

export interface CircuitNode {
  id: string;
  type: GateType;
  label: string;
  x: number;
  y: number;
  inputs: Port[];
  outputs: Port[];
  state?: {
    switchValue?: boolean;
    clockFreqHz?: number;
    clockState?: boolean;
    color?: string;
  };
}

export interface WireConnection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
  signal?: boolean;
}

export interface CircuitData {
  version: string;
  name: string;
  description?: string;
  nodes: CircuitNode[];
  wires: WireConnection[];
  createdAt: string;
  updatedAt: string;
}

export interface TruthTableRow {
  inputs: Record<string, boolean>;
  outputs: Record<string, boolean>;
}

export interface TruthTableData {
  inputLabels: { id: string; name: string }[];
  outputLabels: { id: string; name: string }[];
  rows: TruthTableRow[];
  booleanExpression?: string;
}

export type SupportedLanguage = 'python' | 'html_js' | 'cpp' | 'rust' | 'verilog';

export interface CodeTemplate {
  language: SupportedLanguage;
  name: string;
  extension: string;
  code: string;
  explanation: string;
}
