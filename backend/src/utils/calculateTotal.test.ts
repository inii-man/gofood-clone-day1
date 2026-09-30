import { calculateTotal } from './calculateTotal';

describe('calculateTotal', () => {
  it('calculates order total', () => {
    // Item 10000 x 2 dan 5000 x 1 -> expect 25000
    const items = [
      { price: 10000, quantity: 2 },
      { price: 5000, quantity: 1 },
    ];
    expect(calculateTotal(items)).toBe(25000);
  });

  it('returns zero for empty cart', () => {
    expect(calculateTotal([])).toBe(0);
  });
});
