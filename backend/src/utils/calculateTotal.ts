export interface CartItemTotal {
  price: number;
  quantity: number;
}

export const calculateTotal = (items: CartItemTotal[]): number => {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};
