import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setItems, setStatus, setOrderId } from '../store/orderSlice';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/orderApi';
import { createPayment, simulatePayment, PaymentData } from '../services/paymentApi';
import { showLocalNotification } from '../services/notification';
import { FontAwesome5 } from '@expo/vector-icons';


const PAYMENT_METHODS = [
  { id: 'QRIS', name: 'QRIS Gopay / BCA / Mandiri', icon: 'qrcode', color: '#00AA13' },
  { id: 'GOPAY', name: 'GoPay Saldo', icon: 'wallet', color: '#00AED6' },
  { id: 'BANK_TRANSFER', name: 'Virtual Account', icon: 'university', color: '#0052CC' },
  { id: 'CASH', name: 'Tunai (Cash on Delivery)', icon: 'money-bill-wave', color: '#EE5253' },
];

export default function CheckoutScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const order = useSelector((state: RootState) => state.order);
  const { items: cartItems, totalPrice, removeFromCart, clearCart } = useCart();

  const [selectedMethod, setSelectedMethod] = useState<string>('QRIS');
  const [activePayment, setActivePayment] = useState<PaymentData | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatingStatus, setSimulatingStatus] = useState<boolean>(false);
  const [paymentComplete, setPaymentComplete] = useState<boolean>(false);

  // Sync cart items to Redux order state (Slide 37)
  useEffect(() => {
    if (cartItems.length > 0) {
      dispatch(
        setItems(
          cartItems.map((item) => ({
            id: item.id,
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          }))
        )
      );
    }
  }, [cartItems, dispatch]);

  const deliveryFee = 10000;
  const grandTotal = totalPrice + (cartItems.length > 0 ? deliveryFee : 0);

  // Handle Checkout & Create Payment (Slide 4, 22, 26, 29)
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Keranjang Kosong', 'Silakan pilih menu terlebih dahulu');
      return;
    }

    try {
      dispatch(setStatus('loading'));
      const payload = cartItems.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      // Step 1: Create Order in Backend
      const orderResult = await createOrder(payload);
      const newOrderId = orderResult.data.id;

      dispatch(setOrderId(newOrderId));

      // Notifikasi 1: ORDER_CREATED (Slide 19)
      showLocalNotification(
        '📦 Pesanan Dibuat',
        `Pesanan #${newOrderId.slice(0, 8)} berhasil dibuat. Menunggu pembayaran.`
      );

      // Step 2: Create Payment in Backend (Slide 26 & 29)
      const paymentResult = await createPayment(newOrderId, selectedMethod);
      setActivePayment(paymentResult.data);
      dispatch(setStatus('success'));

      // Buka modal simulator pembayaran
      setIsSimulatorOpen(true);
    } catch (error: any) {
      dispatch(setStatus('failed'));
      console.error('Checkout error:', error);
      const status = error.response?.status;
      const serverMsg = error.response?.data?.message;
      const msg =
        status === 401
          ? `Gagal 401: ${serverMsg || 'Sesi login berakhir. Silakan login kembali.'}`
          : serverMsg || error.message || 'Gagal memproses pesanan. Silakan coba lagi.';
      Alert.alert('Checkout Gagal', msg);
    }
  };

  // Step 3: Simulate Payment (Slide 27, 30, 31, 32)
  const handleSimulatePayment = async (status: 'PAID' | 'FAILED') => {
    if (!activePayment) return;

    try {
      setSimulatingStatus(true);
      const result = await simulatePayment(activePayment.id, status);
      setActivePayment(result.data);

      if (status === 'PAID') {
        setPaymentComplete(true);
        clearCart();

        // Notifikasi 2: PAYMENT_SUCCESS (Slide 19 & 33)
        showLocalNotification(
          '💳 Pembayaran Berhasil! 🎉',
          `Pesanan #${activePayment.orderId.slice(0, 8)} sudah dikonfirmasi.`
        );

        // Notifikasi 3: ORDER_CONFIRMED (Slide 19 & 33)
        setTimeout(() => {
          showLocalNotification(
            '🍳 Pesanan Diproses',
            'Restaurant sedang menyiapkan pesanan Anda.'
          );
        }, 2200);

        Alert.alert(
          'Pembayaran Berhasil! 🎉',
          `Pesanan #${activePayment.orderId.slice(0, 8)} telah dikonfirmasi dan notifikasi push telah dikirim ke perangkat Anda.`,


          [
            {
              text: 'Lacak Pesanan',
              onPress: () => {
                setIsSimulatorOpen(false);
                navigation.navigate('OrderTracking', { orderId: activePayment.orderId });
              },
            },
            {
              text: 'Lihat Riwayat',
              onPress: () => {
                setIsSimulatorOpen(false);
                navigation.navigate('OrderHistory');
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Pembayaran Gagal',
          'Simulasi pembayaran ditandai GAGAL. Anda dapat mencoba lagi.'
        );
      }
    } catch (err: any) {
      console.error('Simulate payment error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Gagal memproses simulasi pembayaran');
    } finally {
      setSimulatingStatus(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <FontAwesome5 name="arrow-left" size={18} color="#1C1C1C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout & Pembayaran</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Delivery Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome5 name="map-marker-alt" size={16} color="#00AA13" />
            <Text style={styles.cardTitle}>Alamat Pengantaran</Text>
          </View>
          <Text style={styles.addressText}>
            Jl. Jend. Sudirman Kav. 52-53, Senayan, Jakarta Selatan
          </Text>
          <Text style={styles.addressNote}>Catatan: Diantar ke lobby utama</Text>
        </View>

        {/* Order Status Banner */}
        <View style={styles.statusBanner}>
          <Text style={styles.statusLabel}>Order Status:</Text>
          <View
            style={[
              styles.badge,
              order.status === 'loading'
                ? styles.badge_loading
                : order.status === 'success'
                ? styles.badge_success
                : order.status === 'failed'
                ? styles.badge_failed
                : styles.badge_idle,
            ]}
          >
            <Text style={styles.badgeText}>{order.status.toUpperCase()}</Text>
          </View>
          {order.orderId && (
            <Text style={styles.orderIdText} numberOfLines={1}>
              ID: #{order.orderId.slice(0, 8)}
            </Text>
          )}
        </View>

        {/* Items Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome5 name="shopping-bag" size={16} color="#00AA13" />
            <Text style={styles.cardTitle}>Ringkasan Pesanan ({cartItems.length} menu)</Text>
          </View>

          {cartItems.length === 0 ? (
            <Text style={styles.emptyCartText}>
              Belum ada item di keranjang. Silakan pilih menu di restoran.
            </Text>
          ) : (
            cartItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>
                    Rp {item.price.toLocaleString()} x {item.quantity}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  Rp {(item.price * item.quantity).toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Payment Method Selector Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome5 name="credit-card" size={16} color="#00AA13" />
            <Text style={styles.cardTitle}>Metode Pembayaran</Text>
          </View>
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentOption,
                  isSelected && styles.paymentOptionSelected,
                ]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={[styles.methodIconBox, { backgroundColor: `${method.color}15` }]}>
                  <FontAwesome5 name={method.icon} size={16} color={method.color} />
                </View>
                <Text style={[styles.methodText, isSelected && styles.methodTextSelected]}>
                  {method.name}
                </Text>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Payment Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rincian Pembayaran</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Harga Makanan</Text>
            <Text style={styles.priceVal}>Rp {totalPrice.toLocaleString()}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Biaya Pengiriman</Text>
            <Text style={styles.priceVal}>
              Rp {(cartItems.length > 0 ? deliveryFee : 0).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.grandTotalVal}>Rp {grandTotal.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Place Order Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotalLabel}>Total Belanja</Text>
          <Text style={styles.bottomTotalVal}>Rp {grandTotal.toLocaleString()}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.checkoutBtn,
            (cartItems.length === 0 || order.status === 'loading') &&
              styles.checkoutBtnDisabled,
          ]}
          onPress={handleCheckout}
          disabled={cartItems.length === 0 || order.status === 'loading'}
        >
          {order.status === 'loading' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutBtnText}>Lanjut ke Pembayaran</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Payment Simulator Modal (Day 3 Feature - Slide 22, 27, 30) */}
      <Modal
        visible={isSimulatorOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSimulatorOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleBox}>
                <FontAwesome5 name="receipt" size={18} color="#00AA13" />
                <Text style={styles.modalTitle}>Simulator Pembayaran</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsSimulatorOpen(false)}
                style={styles.modalCloseBtn}
              >
                <FontAwesome5 name="times" size={16} color="#666" />
              </TouchableOpacity>
            </View>

            {activePayment && (
              <View style={styles.modalBody}>
                <View style={styles.paymentCard}>
                  <Text style={styles.paymentStatusBadge}>
                    Status: {activePayment.status}
                  </Text>
                  <Text style={styles.paymentAmountLabel}>Total Tagihan</Text>
                  <Text style={styles.paymentAmount}>
                    Rp {activePayment.amount.toLocaleString()}
                  </Text>
                  <View style={styles.paymentMetaRow}>
                    <Text style={styles.paymentMetaKey}>Metode:</Text>
                    <Text style={styles.paymentMetaVal}>{activePayment.method}</Text>
                  </View>
                  <View style={styles.paymentMetaRow}>
                    <Text style={styles.paymentMetaKey}>Order ID:</Text>
                    <Text style={styles.paymentMetaVal}>#{activePayment.orderId.slice(0, 8)}</Text>
                  </View>
                  <View style={styles.paymentMetaRow}>
                    <Text style={styles.paymentMetaKey}>Payment ID:</Text>
                    <Text style={styles.paymentMetaVal}>#{activePayment.id.slice(0, 8)}</Text>
                  </View>
                </View>

                {simulatingStatus ? (
                  <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#00AA13" />
                    <Text style={{ marginTop: 10, color: '#666' }}>
                      Memproses simulator pembayaran...
                    </Text>
                  </View>
                ) : paymentComplete ? (
                  <View style={styles.successBox}>
                    <FontAwesome5 name="check-circle" size={48} color="#00AA13" />
                    <Text style={styles.successTitle}>Pembayaran Selesai!</Text>
                    <Text style={styles.successSub}>
                      Status pesanan telah berubah menjadi CONFIRMED. Notifikasi push dikirimkan.
                    </Text>
                    <TouchableOpacity
                      style={styles.trackOrderBtn}
                      onPress={() => {
                        setIsSimulatorOpen(false);
                        navigation.navigate('OrderTracking', { orderId: activePayment.orderId });
                      }}
                    >
                      <FontAwesome5 name="map-marked-alt" size={16} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.trackOrderBtnText}>Lacak Pesanan Sekarang</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.simulatorActions}>
                    <Text style={styles.simulatorInstruction}>
                      Pilih hasil simulasi pembayaran di bawah ini:
                    </Text>

                    <TouchableOpacity
                      style={styles.paidBtn}
                      onPress={() => handleSimulatePayment('PAID')}
                    >
                      <FontAwesome5 name="check" size={16} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.paidBtnText}>Simulasi Berhasil (PAID)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.failedBtn}
                      onPress={() => handleSimulatePayment('FAILED')}
                    >
                      <FontAwesome5 name="times" size={16} color="#EE5253" style={{ marginRight: 8 }} />
                      <Text style={styles.failedBtnText}>Simulasi Gagal (FAILED)</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  addressNote: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badge_idle: {
    backgroundColor: '#E5E7EB',
  },
  badge_loading: {
    backgroundColor: '#FEF3C7',
  },
  badge_success: {
    backgroundColor: '#D1FAE5',
  },
  badge_failed: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  orderIdText: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#00AA13',
    fontWeight: '600',
    maxWidth: 150,
  },
  emptyCartText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginVertical: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1C',
  },
  itemPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  paymentOptionSelected: {
    borderColor: '#00AA13',
    backgroundColor: '#F0FDF4',
  },
  methodIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  methodText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  methodTextSelected: {
    fontWeight: 'bold',
    color: '#00AA13',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#00AA13',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00AA13',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  priceLabel: {
    fontSize: 13,
    color: '#666',
  },
  priceVal: {
    fontSize: 13,
    color: '#1C1C1C',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00AA13',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
  },
  bottomTotalLabel: {
    fontSize: 12,
    color: '#666',
  },
  bottomTotalVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  checkoutBtn: {
    backgroundColor: '#00AA13',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnDisabled: {
    opacity: 0.6,
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 14,
    marginBottom: 16,
  },
  modalHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginLeft: 8,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    paddingVertical: 4,
  },
  paymentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  paymentStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  paymentAmountLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginVertical: 4,
  },
  paymentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  paymentMetaKey: {
    fontSize: 12,
    color: '#64748B',
  },
  paymentMetaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  simulatorInstruction: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 12,
    textAlign: 'center',
  },
  simulatorActions: {
    gap: 10,
  },
  paidBtn: {
    backgroundColor: '#00AA13',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  failedBtn: {
    borderWidth: 1.5,
    borderColor: '#EE5253',
    backgroundColor: '#FFF5F5',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  failedBtnText: {
    color: '#EE5253',
    fontWeight: 'bold',
    fontSize: 15,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginTop: 12,
    marginBottom: 6,
  },
  successSub: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  trackOrderBtn: {
    backgroundColor: '#00AA13',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  trackOrderBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
