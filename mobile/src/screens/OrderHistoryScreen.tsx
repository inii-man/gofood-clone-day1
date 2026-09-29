import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { api } from '../services/api';
import { FontAwesome5 } from '@expo/vector-icons';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem?: {
    name: string;
    image: string;
  };
}

interface Order {
  id: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderHistoryScreen({ navigation }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get('/orders');
      if (response.data?.data) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return { bg: '#DEF7EC', text: '#03543F' };
      case 'DELIVERING':
        return { bg: '#E1EFFE', text: '#1E429F' };
      case 'PREPARING':
      case 'READY':
        return { bg: '#FEF08A', text: '#854D0E' };
      case 'CANCELLED':
        return { bg: '#FDE8E8', text: '#9B1C1C' };
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusStyle = getStatusColor(item.status);
    const dateFormatted = new Date(item.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>
              #ORD-{item.id.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={styles.orderDate}>{dateFormatted}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Item snippet */}
        <View style={styles.itemsSummary}>
          {item.items && item.items.length > 0 ? (
            item.items.map((orderItem, idx) => (
              <Text key={orderItem.id || idx} style={styles.itemLine}>
                {orderItem.quantity}x {orderItem.menuItem?.name || 'Menu Item'}
              </Text>
            ))
          ) : (
            <Text style={styles.itemLine}>Detail pesanan</Text>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>Total Pembayaran</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalAmount}>
              Rp {item.totalPrice.toLocaleString()}
            </Text>
            <View style={styles.trackLink}>
              <Text style={styles.trackLinkText}>Lacak</Text>
              <FontAwesome5 name="chevron-right" size={12} color="#00AA13" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <FontAwesome5 name="arrow-left" size={18} color="#1C1C1C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Pesanan</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('DriverSimulator')}
          style={styles.simButton}
        >
          <FontAwesome5 name="motorcycle" size={16} color="#00AA13" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00AA13" />
          <Text style={styles.loadingText}>Memuat riwayat...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <FontAwesome5 name="clipboard-list" size={48} color="#CCC" />
          <Text style={styles.emptyTitle}>Belum Ada Pesanan</Text>
          <Text style={styles.emptySubtitle}>
            Pesanan yang Anda buat akan muncul di sini.
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.exploreBtnText}>Mulai Pesan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#00AA13']}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FA',
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
  simButton: {
    padding: 6,
  },
  listContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  exploreBtn: {
    backgroundColor: '#00AA13',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  exploreBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  orderDate: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  itemsSummary: {
    marginBottom: 12,
  },
  itemLine: {
    fontSize: 13,
    color: '#4B5563',
    marginVertical: 2,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 11,
    color: '#777',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  trackLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00AA13',
    marginRight: 4,
  },
});
