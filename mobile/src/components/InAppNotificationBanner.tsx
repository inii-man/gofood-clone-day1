import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onLocalNotification } from '../services/notification';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export default function InAppNotificationBanner() {
  const [notification, setNotification] = useState<NotificationPayload | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = onLocalNotification((payload) => {
      setNotification(payload);

      // Reset & animate in
      translateY.setValue(-120);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Clear previous timer and auto-hide after 4.5 seconds
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        hideBanner();
      }, 4500);
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const hideBanner = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setNotification(null);
    });
  };

  if (!notification) return null;

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
      <Animated.View
        style={[
          styles.bannerContainer,
          {
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={hideBanner}
          style={styles.bannerContent}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="notifications" size={20} color="#fff" />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.appName}>GOFOOD</Text>
              <Text style={styles.timeLabel}>sekarang</Text>
            </View>
            <Text style={styles.titleText} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={styles.bodyText} numberOfLines={2}>
              {notification.body}
            </Text>
          </View>
          <TouchableOpacity onPress={hideBanner} style={styles.closeBtn}>
            <Ionicons name="close" size={18} color="#666" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
  },
  bannerContainer: {
    marginHorizontal: 14,
    marginTop: Platform.OS === 'android' ? 36 : 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#00AA13',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  appName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00AA13',
    letterSpacing: 0.8,
  },
  timeLabel: {
    fontSize: 10,
    color: '#9E9E9E',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  bodyText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 6,
  },
});
