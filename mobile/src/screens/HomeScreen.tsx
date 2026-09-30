import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import SearchBar from '../components/SearchBar';
import CategoryItem from '../components/CategoryItem';
import RestaurantCard from '../components/RestaurantCard';
import { categories } from '../data/dummy';
import { getRestaurants } from '../services/api';
import { socket } from '../services/socket';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  // State untuk menyimpan daftar restoran dari API
  const [restaurants, setRestaurants] = useState<any[]>([]);
  // State untuk menandakan apakah data sedang di-load (proses fetching)
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // State untuk menyimpan pesan error jika koneksi ke server gagal
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk mengambil data restoran dari backend
  const fetchRestaurants = useCallback(async (isPullRefresh = false) => {
    if (!isPullRefresh) setLoading(true);
    setError(null);
    try {
      console.log('🔄 [HOME] Mengambil data restoran terbaru dari backend...');
      const response = await getRestaurants();
      console.log(`✅ [HOME] Berhasil memuat ${response.data.data?.length || 0} restoran.`);
      setRestaurants(response.data.data || []);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('Gagal terhubung ke server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh saat pertama kali dibuka & setiap kali layar Home difokuskan kembali
  useFocusEffect(
    useCallback(() => {
      fetchRestaurants();
    }, [fetchRestaurants])
  );

  // Real-time listener: jika ada update dari backend
  useEffect(() => {
    const handleUpdate = () => {
      console.log('⚡ [SOCKET] Menerima sinyal pembaruan data restoran');
      fetchRestaurants(true);
    };

    socket.on('restaurants-updated', handleUpdate);
    socket.on('data-updated', handleUpdate);

    return () => {
      socket.off('restaurants-updated', handleUpdate);
      socket.off('data-updated', handleUpdate);
    };
  }, [fetchRestaurants]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRestaurants(true);
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {user ? `Halo, ${user.name}` : 'Lokasi Anda'}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={18} color="#00A651" />
            <Text style={styles.location}>Jakarta Selatan</Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('OrderHistory')}
          >
            <FontAwesome5 name="receipt" size={18} color="#1C1C1C" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('DriverSimulator')}
          >
            <FontAwesome5 name="motorcycle" size={18} color="#00AA13" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => logout()}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ScrollView digunakan agar halaman bisa di-scroll ke bawah */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00AA13']}
            tintColor="#00AA13"
          />
        }
      >
        {/* Komponen SearchBar (belum berfungsi untuk pencarian sungguhan, hanya UI) */}
        <SearchBar placeholder="Cari restoran atau makanan..." />


        <Text style={styles.sectionTitle}>Kategori</Text>
        {/* Daftar kategori yang bisa di-scroll menyamping (horizontal) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {/* Looping data kategori dari dummy data */}
          {categories.map((cat) => (
            <CategoryItem key={cat.id} name={cat.name} icon={cat.icon} />
          ))}
        </ScrollView>

        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Gratis Ongkir!</Text>
          <Text style={styles.bannerSubtitle}>Pesan sekarang, ongkir Rp 0</Text>
        </View>

        <Text style={styles.sectionTitle}>Restoran Terdekat</Text>
        
        {/* Conditional Rendering: Menampilkan UI berdasarkan state saat ini */}
        {loading ? (
          // Jika loading = true, tampilkan animasi berputar (ActivityIndicator)
          <ActivityIndicator size="large" color="#00A651" style={{ marginTop: 20 }} />
        ) : error ? (
          // Jika error = true (ada pesan error), tampilkan tombol Coba Lagi
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchRestaurants()}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </TouchableOpacity>

          </View>
        ) : (
          // Jika sukses (loading false & error null), tampilkan daftar restoran
          restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              // Navigasi ke halaman RestaurantDetail saat kartu ditekan, membawa data restaurant
              onPress={() =>
                navigation.navigate('RestaurantDetail', { restaurant })
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 12,
    color: '#888',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  location: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginHorizontal: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    color: '#1a1a1a',
  },
  categoriesContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  banner: {
    backgroundColor: '#00A651',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
    borderRadius: 16,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: '#E8F5E9',
    fontSize: 14,
    marginTop: 4,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 10,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#00A651',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
