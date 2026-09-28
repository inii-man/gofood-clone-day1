import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  RouteProp,
  useRoute,
  useNavigation,
} from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { dummyFoodItems } from '../data/dummy';

type DetailRouteProp = RouteProp<
  RootStackParamList,
  'RestaurantDetail'
>;

export default function RestaurantDetailScreen() {
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation();
  const { restaurant } = route.params;

  const menuItems = dummyFoodItems.filter(
    (item) => item.restaurantId === restaurant.id
  );

  return (
    <View style={styles.container}>
      <Image source={{ uri: restaurant.image }} style={styles.headerImage} />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView style={styles.content}>
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

        {menuItems.map((item) => (
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

            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={20} color="#00A651" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.cartButton}>
        <Ionicons name="cart" size={20} color="#fff" />
        <Text style={styles.cartText}>Lihat Keranjang</Text>
      </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
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
    fontSize: 16,
    marginLeft: 8,
  },
});
