import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  RouteProp,
  useRoute,
  useNavigation,
} from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getMenu } from '../services/api';
import { useCart } from '../context/CartContext';

type DetailRouteProp = RouteProp<
  RootStackParamList,
  'RestaurantDetail'
>;

export default function RestaurantDetailScreen() {
  // Mengambil informasi route untuk mendapatkan parameter yang dikirim dari HomeScreen
  const route = useRoute<DetailRouteProp>();
  // Hook navigasi untuk melakukan aksi seperti 'kembali ke halaman sebelumnya'
  const navigation = useNavigation();
  // Mengambil objek 'restaurant' dari parameter navigasi
  const { restaurant } = route.params;
  const { addToCart, totalItems, totalPrice } = useCart();

  // State untuk menyimpan daftar menu dari API
  const [menuItems, setMenuItems] = useState<any[]>([]);
  // State untuk melacak status loading
  const [loading, setLoading] = useState(true);
  // State untuk menangani pesan error koneksi
  const [error, setError] = useState<string | null>(null);

  // Otomatis dipanggil saat layar Detail dibuka
  useEffect(() => {
    fetchMenu();
  }, []);

  // Fungsi untuk mengambil data menu berdasarkan ID restoran
  const fetchMenu = async () => {
    setLoading(true); // Tampilkan indikator loading
    setError(null);   // Bersihkan error sebelumnya
    try {
      // Panggil API getMenu dengan melempar ID restoran
      const response = await getMenu(restaurant.id);
      // Simpan hasil data menu ke state
      setMenuItems(response.data.data);
    } catch (err) {
      console.error('Error fetching menu:', err);
      // Tampilkan pesan error jika server bermasalah
      setError('Gagal memuat menu dari server');
    } finally {
      // Sembunyikan indikator loading
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Gambar utama restoran di bagian atas layar */}
      <Image source={{ uri: restaurant.image }} style={styles.headerImage} />

      {/* Tombol Back untuk kembali ke HomeScreen */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView style={styles.content}>
        {/* Bagian informasi nama restoran, rating, waktu, ongkir, dll */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>{restaurant.name}</Text>
          <View style={styles.row}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{restaurant.rating}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.meta}>{restaurant.deliveryTime}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.meta}>
              Rp {restaurant.deliveryFee.toLocaleString()}
            </Text>
          </View>
          <Text style={styles.categories}>
            {restaurant.categories.join(' • ')}
          </Text>
        </View>

        <Text style={styles.menuTitle}>Menu Populer</Text>

        {/* Conditional Rendering: Menampilkan daftar menu, loading, atau error */}
        {loading ? (
          <ActivityIndicator size="large" color="#00A651" style={{ marginTop: 20 }} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            {/* Memanggil ulang fetchMenu jika tombol Coba Lagi ditekan */}
            <TouchableOpacity style={styles.retryButton} onPress={fetchMenu}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Looping data menu makanan
          menuItems.map((item) => (
            <View key={item.id} style={styles.menuItem}>
              <View style={styles.menuInfo}>
                <Text style={styles.menuName}>{item.name}</Text>
                <Text style={styles.menuDesc} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.menuPrice}>
                  Rp {item.price.toLocaleString()}
                </Text>
              </View>

              <Image
                source={{ uri: item.image }}
                style={styles.menuImage}
              />

              {/* Tombol Tambah ke Keranjang */}
              <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                  addToCart({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                  })
                }
              >
                <Ionicons name="add" size={20} color="#00A651" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Tombol keranjang jika ada item */}
      {totalItems > 0 && (
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Checkout' as never)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="cart" size={20} color="#fff" />
            <Text style={styles.cartText}>
              Lihat Keranjang ({totalItems})
            </Text>
          </View>
          <Text style={styles.cartPriceText}>
            Rp {totalPrice.toLocaleString()}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#fff',
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    marginLeft: 4,
    fontWeight: '600',
    color: '#333',
  },
  dot: {
    marginHorizontal: 6,
    color: '#888',
  },
  meta: {
    color: '#666',
    fontSize: 13,
  },
  categories: {
    marginTop: 6,
    color: '#888',
    fontSize: 13,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    alignItems: 'center',
  },
  menuInfo: {
    flex: 1,
    marginRight: 12,
  },
  menuName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  menuDesc: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    lineHeight: 18,
  },
  menuPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#00A651',
    marginTop: 8,
  },
  menuImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00A651',
  },
  cartButton: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#00A651',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#00A651',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cartText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  cartPriceText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
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
