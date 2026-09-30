import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext =
  createContext<CartContextType | undefined>(undefined);

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (
    newItem: Omit<CartItem, 'quantity'>
  ) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.id === newItem.id
      );

      if (existing) {
        return prev.map((i) =>
          i.id === newItem.id
            ? {
                ...i,
                quantity: i.quantity + 1,
              }
            : i
        );
      }

      return [
        ...prev,
        {
          ...newItem,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prev) =>
      prev.filter((i) => i.id !== id)
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce(
    (sum, i) => sum + i.quantity,
    0
  );

  const totalPrice = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      'useCart must be used within CartProvider'
    );
  }

  return context;
};
