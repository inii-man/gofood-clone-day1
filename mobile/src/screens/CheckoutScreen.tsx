import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setItems, setStatus, setOrderId } from '../store/orderSlice';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/orderApi';
import { FontAwesome5 } from '@expo/vector-icons';

export default function CheckoutScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const order = useSelector((state: RootState) => state.order);
  const { items: cartItems, totalPrice, removeFromCart } = useCart();

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

  // Handle Checkout (Slide 39)
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

      const result = await createOrder(payload);
      const newOrderId = result.data.id;

      dispatch(setOrderId(newOrderId));
      dispatch(setStatus('success'));

      Alert.alert(
        'Pesanan Dibuat!',
        `Order ID: ${newOrderId}\nDriver sedang menuju restoran.`,
        [
          {
            text: 'Lacak Pesanan',
            onPress: () =>
              navigation.navigate('OrderTracking', { orderId: newOrderId }),
          },
          {
            text: 'Lihat Riwayat',
            onPress: () => navigation.navigate('OrderHistory'),
          },
        ]
      );
    } catch (error: any) {
      dispatch(setStatus('failed'));
      console.error('Checkout error:', error);
      const status = error.response?.status;
      const serverMsg = error.response?.data?.message;
      const msg =
        status === 401
          ? `Gagal 401 Unauthorized: ${serverMsg || 'Token autentikasi tidak ditemukan atau tidak valid.'}`
          : serverMsg || error.message || 'Gagal memproses checkout. Silakan coba lagi.';
      Alert.alert('Checkout Gagal', msg);
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
        <Text style={styles.headerTitle}>Checkout</Text>
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
              ID: {order.orderId}
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
            <Text style={styles.checkoutBtnText}>Pesan Sekarang</Text>
          )}
        </TouchableOpacity>
      </View>
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
    marginBottom: 10,
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
    paddingHorizontal: 28,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnDisabled: {
    opacity: 0.6,
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
