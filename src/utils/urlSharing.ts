import { CircuitData } from '../types/circuit';

export function encodeCircuitToHash(circuit: CircuitData): string {
  try {
    const jsonString = JSON.stringify(circuit);
    const encoded = encodeURIComponent(jsonString);
    const base64 = btoa(encoded);
    return base64;
  } catch (err) {
    console.error('Failed to encode circuit to hash', err);
    return '';
  }
}

export function decodeCircuitFromHash(hash: string): CircuitData | null {
  try {
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
    const params = new URLSearchParams(cleanHash);
    const dataStr = params.get('circuit') || cleanHash;

    if (!dataStr) return null;

    const decoded = atob(dataStr);
    const jsonString = decodeURIComponent(decoded);
    const parsed = JSON.parse(jsonString);

    if (Array.isArray(parsed.nodes) && Array.isArray(parsed.wires)) {
      return parsed as CircuitData;
    }
    return null;
  } catch (err) {
    console.error('Failed to decode circuit from hash', err);
    return null;
  }
}
