import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '../types';

interface Props {
  restaurant: Restaurant;
  onPress?: () => void;
}

export default function RestaurantCard({ restaurant, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: restaurant.image }} style={styles.image} />
      {restaurant.isPromo && (
        <View style={styles.promoBadge}>
          <Text style={styles.promoText}>Promo</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{restaurant.name}</Text>
        <View style={styles.row}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.rating}>{restaurant.rating}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.deliveryTime}>{restaurant.deliveryTime}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.categories}>
            {restaurant.categories.join(' • ')}
          </Text>
        </View>
        <Text style={styles.fee}>
          Delivery: Rp {restaurant.deliveryFee.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  promoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  promoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  rating: {
    fontSize: 13,
    marginLeft: 4,
    color: '#333',
    fontWeight: '600',
  },
  dot: {
    marginHorizontal: 6,
    color: '#888',
  },
  deliveryTime: {
    fontSize: 13,
    color: '#666',
  },
  categories: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  fee: {
    fontSize: 12,
    color: '#00A651',
    marginTop: 4,
    fontWeight: '600',
  },
});
