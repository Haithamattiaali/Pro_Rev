import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercentage, formatNumber } from '../formatters';

describe('formatters', () => {
  describe('formatPercentage', () => {
    it('handles null values', () => {
      expect(formatPercentage(null)).toBe('0.0%');
    });
    
    it('handles undefined values', () => {
      expect(formatPercentage(undefined)).toBe('0.0%');
    });
    
    it('handles non-numeric strings', () => {
      expect(formatPercentage('abc')).toBe('0.0%');
    });
    
    it('handles empty strings', () => {
      expect(formatPercentage('')).toBe('0.0%');
    });
    
    it('handles NaN', () => {
      expect(formatPercentage(NaN)).toBe('0.0%');
    });
    
    it('handles Infinity', () => {
      expect(formatPercentage(Infinity)).toBe('0.0%');
      expect(formatPercentage(-Infinity)).toBe('0.0%');
    });
    
    it('formats valid numbers correctly', () => {
      expect(formatPercentage(45.678)).toBe('45.7%');
      expect(formatPercentage(0)).toBe('0.0%');
      expect(formatPercentage(-23.4)).toBe('-23.4%');
      expect(formatPercentage(100)).toBe('100.0%');
      expect(formatPercentage(99.99)).toBe('100.0%');
    });
    
    it('handles numeric strings', () => {
      expect(formatPercentage('45.678')).toBe('45.7%');
      expect(formatPercentage('0')).toBe('0.0%');
    });
  });

  describe('formatCurrency', () => {
    it('handles null values', () => {
      expect(formatCurrency(null)).toBe('SAR 0');
    });
    
    it('handles undefined values', () => {
      expect(formatCurrency(undefined)).toBe('SAR 0');
    });
    
    it('handles non-numeric strings', () => {
      expect(formatCurrency('abc')).toBe('SAR 0');
    });
    
    it('handles NaN', () => {
      expect(formatCurrency(NaN)).toBe('SAR 0');
    });
    
    it('handles Infinity', () => {
      expect(formatCurrency(Infinity)).toBe('SAR 0');
      expect(formatCurrency(-Infinity)).toBe('SAR 0');
    });
    
    it('formats valid numbers correctly', () => {
      expect(formatCurrency(1000)).toBe('SAR 1,000');
      expect(formatCurrency(1234567.89)).toBe('SAR 1,234,568');
      expect(formatCurrency(0)).toBe('SAR 0');
      expect(formatCurrency(-5000)).toBe('-SAR 5,000');
    });
  });

  describe('formatNumber', () => {
    it('handles null values', () => {
      expect(formatNumber(null)).toBe('0');
    });
    
    it('handles undefined values', () => {
      expect(formatNumber(undefined)).toBe('0');
    });
    
    it('handles non-numeric strings', () => {
      expect(formatNumber('abc')).toBe('0');
    });
    
    it('handles NaN', () => {
      expect(formatNumber(NaN)).toBe('0');
    });
    
    it('handles Infinity', () => {
      expect(formatNumber(Infinity)).toBe('0');
      expect(formatNumber(-Infinity)).toBe('0');
    });
    
    it('formats valid numbers correctly', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234567.89)).toBe('1,234,567.89');
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(-5000)).toBe('-5,000');
    });
  });
});