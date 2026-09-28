import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../components/SearchBar';
import CategoryItem from '../components/CategoryItem';
import RestaurantCard from '../components/RestaurantCard';
import { categories } from '../data/dummy';
import { getRestaurants } from '../services/api';

export default function HomeScreen({ navigation }: any) {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getRestaurants();
      setRestaurants(response.data.data);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Lokasi Anda</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={18} color="#00A651" />
            <Text style={styles.location}>Jakarta Selatan</Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </View>
        </View>
        <View style={styles.profileIcon}>
          <Ionicons name="person-circle" size={40} color="#666" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <SearchBar placeholder="Cari restoran atau makanan..." />

        <Text style={styles.sectionTitle}>Kategori</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((cat) => (
            <CategoryItem key={cat.id} name={cat.name} icon={cat.icon} />
          ))}
        </ScrollView>

        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Gratis Ongkir!</Text>
          <Text style={styles.bannerSubtitle}>Pesan sekarang, ongkir Rp 0</Text>
        </View>

        <Text style={styles.sectionTitle}>Restoran Terdekat</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#00A651" style={{ marginTop: 20 }} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchRestaurants}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
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
  profileIcon: {
    padding: 4,
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
