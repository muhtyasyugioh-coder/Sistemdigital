import React from 'react';
import { GateType } from '../types/circuit';

interface GateSymbolProps {
  type: GateType;
  width?: number;
  height?: number;
  isActive?: boolean;
}

export const GateSymbol: React.FC<GateSymbolProps> = ({
  type,
  width = 80,
  height = 50,
  isActive = false,
}) => {
  const strokeColor = isActive ? '#38bdf8' : '#94a3b8';
  const fillColor = isActive ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.85)';

  switch (type) {
    case 'AND':
      return (
        <svg width={width} height={height} viewBox="0 0 80 50" fill="none" className="overflow-visible">
          <path
            d="M 15 5 L 45 5 C 60 5, 65 15, 65 25 C 65 35, 60 45, 45 45 L 15 45 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'OR':
      return (
        <svg width={width} height={height} viewBox="0 0 80 50" fill="none" className="overflow-visible">
          <path
            d="M 15 5 C 28 15, 28 35, 15 45 C 38 45, 54 36, 68 25 C 54 14, 38 5, 15 5 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'NOT':
      return (
        <svg width={width} height={height} viewBox="0 0 80 50" fill="none" className="overflow-visible">
          <polygon
            points="18,7 18,43 56,25"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle
            cx="62"
            cy="25"
            r="4.5"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
        </svg>
      );

    case 'NAND':
      return (
        <svg width={width} height={height} viewBox="0 0 80 50" fill="none" className="overflow-visible">
          <path
            d="M 15 5 L 40 5 C 54 5, 58 15, 58 25 C 58 35, 54 45, 40 45 L 15 45 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle
            cx="64"
            cy="25"
            r="4.5"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
        </svg>
      );

    case 'NOR':
      return (
        <svg width={width} height={height} viewBox="0 0 80 50" fill="none" className="overflow-visible">
          <path
            d="M 15 5 C 26 15, 26 35, 15 45 C 36 45, 50 36, 60 25 C 50 14, 36 5, 15 5 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle
            cx="66"
            cy="25"
            r="4.5"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
        </svg>
      );

    case 'XOR':
      return (
        <svg width={width} height={height} viewBox="0 0 80 50" fill="none" className="overflow-visible">
          {/* Back extra curved line */}
          <path
            d="M 10 5 C 23 15, 23 35, 10 45"
            stroke={strokeColor}
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M 18 5 C 30 15, 30 35, 18 45 C 40 45, 54 36, 68 25 C 54 14, 40 5, 18 5 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'XNOR':
      return (
        <svg width={width} height={height} viewBox="0 0 80 50" fill="none" className="overflow-visible">
          <path
            d="M 10 5 C 22 15, 22 35, 10 45"
            stroke={strokeColor}
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M 18 5 C 28 15, 28 35, 18 45 C 38 45, 50 36, 60 25 C 50 14, 38 5, 18 5 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle
            cx="66"
            cy="25"
            r="4.5"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
        </svg>
      );

    default:
      return (
        <svg width={width} height={height} viewBox="0 0 80 50" fill="none">
          <rect x="15" y="8" width="50" height="34" rx="6" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        </svg>
      );
  }
};
