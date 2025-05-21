// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import rustCalcInit, { calculate } from 'rust-calc';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

beforeAll(async () => {
  // Construct the path to the .wasm file relative to this test file
  const wasmPath = path.resolve(__dirname, '../../../rust-calc/pkg/rust_calc_bg.wasm');
  // Read the .wasm file
  const wasmBuffer = fs.readFileSync(wasmPath);
  // Initialize the WASM module with the buffer
  // The rustCalcInit function (default export of rust_calc.js) can accept an ArrayBuffer
  await rustCalcInit(wasmBuffer.buffer);
});

describe('rust-calc WASM module', () => {
  describe('Basic Arithmetic', () => {
    it('should add two numbers', () => {
      expect(calculate('2 + 3')).toBe(5);
    });
    it('should subtract two numbers', () => {
      expect(calculate('10 - 4')).toBe(6);
    });
    it('should multiply two numbers', () => {
      expect(calculate('3 * 4')).toBe(12);
    });
    it('should divide two numbers', () => {
      expect(calculate('15 / 3')).toBe(5);
    });
  });

  describe('Complex Expressions', () => {
    it('should handle order of operations', () => {
      expect(calculate('2 + 3 * 4')).toBe(14);
    });
    it('should handle parentheses', () => {
      expect(calculate('(2 + 3) * 4')).toBe(20);
    });
    it('should handle nested parentheses', () => {
      expect(calculate('10 / (2 + 3)')).toBe(2);
    });
  });

  describe('Mathematical Functions', () => {
    it('should calculate sine', () => {
      expect(calculate('sin(0)')).toBe(0);
    });
    it('should calculate cosine', () => {
      expect(calculate('cos(0)')).toBe(1);
    });
    it('should calculate square root', () => {
      expect(calculate('sqrt(16)')).toBe(4);
    });
    it('should calculate power', () => {
      expect(calculate('2^3')).toBe(8);
    });
  });

  describe('Negative Numbers', () => {
    it('should handle negative numbers in addition', () => {
      expect(calculate('-5 + 3')).toBe(-2);
    });
    it('should handle negative numbers in multiplication', () => {
      expect(calculate('5 * -2')).toBe(-10);
    });
  });

  describe('Decimal Numbers', () => {
    it('should handle decimal multiplication', () => {
      expect(calculate('3.14 * 2')).toBe(6.28);
    });
    it('should handle decimal division', () => {
      expect(calculate('10 / 4')).toBe(2.5);
    });
  });

  describe('Error Cases', () => {
    it('should throw error for invalid expression', () => {
      expect(() => calculate('invalid')).toThrow();
    });
    it('should throw error for incomplete expression', () => {
      expect(() => calculate('2 +')).toThrow();
    });
    it('should throw error for expression starting with operator', () => {
      expect(() => calculate('/ 2')).toThrow();
    });
    it('should throw error for multiple operators', () => {
      expect(() => calculate('2 * * 3')).toThrow();
    });
  });
}); 