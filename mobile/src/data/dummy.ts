import { Restaurant, FoodItem } from '../types';

export const dummyRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Nasi Goreng Gila',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
    rating: 4.8,
    deliveryTime: '20-30 min',
    deliveryFee: 5000,
    categories: ['Indonesian', 'Rice'],
    isPromo: true,
  },
  {
    id: '2',
    name: 'Burger Bangor',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    rating: 4.5,
    deliveryTime: '25-40 min',
    deliveryFee: 8000,
    categories: ['Western', 'Fast Food'],
    isPromo: false,
  },
  {
    id: '3',
    name: 'Sushi Master',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
    rating: 4.9,
    deliveryTime: '30-45 min',
    deliveryFee: 10000,
    categories: ['Japanese', 'Healthy'],
    isPromo: true,
  },
  {
    id: '4',
    name: 'Ayam Geprek Pak Kumis',
    image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400',
    rating: 4.6,
    deliveryTime: '15-25 min',
    deliveryFee: 3000,
    categories: ['Indonesian', 'Spicy'],
    isPromo: false,
  },
];

export const dummyFoodItems: FoodItem[] = [
  {
    id: '1',
    restaurantId: '1',
    name: 'Nasi Goreng Spesial',
    description: 'Nasi goreng dengan telur, ayam, dan kerupuk',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
    isPopular: true,
  },
  {
    id: '2',
    restaurantId: '1',
    name: 'Nasi Goreng Seafood',
    description: 'Nasi goreng dengan cumi, udang, dan kepiting',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
    isPopular: false,
  },
];

export const categories = [
  { id: '1', name: 'Nasi', icon: 'rice' },
  { id: '2', name: 'Burger', icon: 'hamburger' },
  { id: '3', name: 'Sushi', icon: 'fish' },
  { id: '4', name: 'Pizza', icon: 'pizza-slice' },
  { id: '5', name: 'Dessert', icon: 'ice-cream' },
  { id: '6', name: 'Healthy', icon: 'leaf' },
];
