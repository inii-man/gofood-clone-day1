import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OrderState {
  items: any[];
  status: 'idle' | 'loading' | 'success' | 'failed';
  orderId: string | null;
}

const initialState: OrderState = {
  items: [],
  status: 'idle',
  orderId: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setItems(state, action: PayloadAction<any[]>) {
      state.items = action.payload;
    },
    setStatus(state, action: PayloadAction<OrderState['status']>) {
      state.status = action.payload;
    },
    setOrderId(state, action: PayloadAction<string | null>) {
      state.orderId = action.payload;
    },
    resetOrder(state) {
      state.items = [];
      state.status = 'idle';
      state.orderId = null;
    },
  },
});

export const { setItems, setStatus, setOrderId, resetOrder } = orderSlice.actions;
export default orderSlice.reducer;
