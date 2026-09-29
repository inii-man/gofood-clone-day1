import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { socket, joinOrderRoom } from '../services/socket';
import { getOrderById } from '../services/orderApi';
import { FontAwesome5 } from '@expo/vector-icons';
import TrackingMap from '../components/TrackingMap';

interface DriverLocation {
  latitude: number;
  longitude: number;
  updatedAt?: string;
}

// 12 Titik rute realistis Jakarta (Grand Indonesia/Sudirman -> Flyover Semanggi -> Senayan)
const REALISTIC_DELIVERY_PATH = [
  { lat: -6.2088, lng: 106.8456, desc: 'Driver mengambil pesanan di Restoran', eta: '10-12 Menit', progress: 5 },
  { lat: -6.2108, lng: 106.8443, desc: 'Driver mulai bergerak dari area resto', eta: '10 Menit', progress: 15 },
  { lat: -6.2128, lng: 106.8430, desc: 'Melintasi Bundaran HI / Jl. Thamrin', eta: '9 Menit', progress: 25 },
  { lat: -6.2150, lng: 106.8415, desc: 'Memasuki Jl. Jenderal Sudirman', eta: '8 Menit', progress: 35 },
  { lat: -6.2175, lng: 106.8395, desc: 'Melewati area Dukuh Atas', eta: '7 Menit', progress: 45 },
  { lat: -6.2205, lng: 106.8370, desc: 'Menaiki Flyover Semanggi', eta: '5 Menit', progress: 58 },
  { lat: -6.2230, lng: 106.8352, desc: 'Melintasi kawasan SCBD Sudirman', eta: '4 Menit', progress: 70 },
  { lat: -6.2252, lng: 106.8335, desc: 'Memasuki jalur Senayan / GBK', eta: '3 Menit', progress: 80 },
  { lat: -6.2270, lng: 106.8318, desc: 'Mendekati gerbang gedung tujuan', eta: '2 Menit', progress: 90 },
  { lat: -6.2285, lng: 106.8306, desc: 'Driver berada di depan lobby utama', eta: '1 Menit', progress: 96 },
  { lat: -6.2290, lng: 106.8300, desc: 'Pesanan telah sampai! Selamat menikmati 🎉', eta: 'Tiba', progress: 100 },
];

export default function OrderTrackingScreen({ route, navigation }: any) {
  const orderId = route.params?.orderId;
  const [driverLocation, setDriverLocation] = useState<DriverLocation>({
    latitude: -6.2088,
    longitude: 106.8456,
    updatedAt: new Date().toLocaleTimeString(),
  });
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State untuk Live Driver Simulation di layar ini
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentStatusDesc, setCurrentStatusDesc] = useState(
    'Driver sedang dalam perjalanan mengantarkan pesanan'
  );
  const [eta, setEta] = useState('5 - 10 Menit');
  const simTimerRef = useRef<any>(null);

  // Join socket room & listen for driver location updates (Slide 53 & 54)
  useEffect(() => {
    if (orderId) {
      joinOrderRoom(orderId);

      // Fetch initial order details
      getOrderById(orderId)
        .then((res) => {
          if (res.data) setOrderDetails(res.data);
        })
        .catch((err) => console.log('Fetch order detail err', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    const handleLocationUpdate = (location: any) => {
      console.log('Driver location received via Socket.io:', location);
      setDriverLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        updatedAt: new Date().toLocaleTimeString(),
      });
    };

    socket.on('location-updated', handleLocationUpdate);

    return () => {
      socket.off('location-updated', handleLocationUpdate);
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [orderId]);

  // Fungsi untuk menjalankan simulasi driver bergerak secara langsung
  const toggleSimulation = () => {
    if (isSimulating) {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      setIsSimulating(false);
      return;
    }

    setIsSimulating(true);

    let step = currentStep >= REALISTIC_DELIVERY_PATH.length - 1 ? 0 : currentStep;
    setCurrentStep(step);

    simTimerRef.current = setInterval(() => {
      const point = REALISTIC_DELIVERY_PATH[step];
      setCurrentStatusDesc(point.desc);
      setEta(point.eta);
      setCurrentStep(step);

      // Emit ke backend Socket.io agar terdistribusi ke room (Slide 55 & 56)
      if (orderId) {
        socket.emit('driver-location', {
          orderId,
          latitude: point.lat,
          longitude: point.lng,
        });
      } else {
        // Fallback update lokal
        setDriverLocation({
          latitude: point.lat,
          longitude: point.lng,
          updatedAt: new Date().toLocaleTimeString(),
        });
      }

      step++;
      if (step >= REALISTIC_DELIVERY_PATH.length) {
        if (simTimerRef.current) clearInterval(simTimerRef.current);
        setIsSimulating(false);
      }
    }, 1800);
  };

  const resetSimulation = () => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    setIsSimulating(false);
    setCurrentStep(0);
    const startPoint = REALISTIC_DELIVERY_PATH[0];
    setCurrentStatusDesc(startPoint.desc);
    setEta(startPoint.eta);

    if (orderId) {
      socket.emit('driver-location', {
        orderId,
        latitude: startPoint.lat,
        longitude: startPoint.lng,
      });
    } else {
      setDriverLocation({
        latitude: startPoint.lat,
        longitude: startPoint.lng,
        updatedAt: new Date().toLocaleTimeString(),
      });
    }
  };

  const currentProgress = REALISTIC_DELIVERY_PATH[currentStep]?.progress || 10;

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
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('DriverSimulator', { orderId: orderId })
          }
          style={styles.simButton}
        >
          <Text style={styles.simButtonText}>Manual Sim</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.orderNumber}>
                #{orderId ? orderId.slice(0, 8).toUpperCase() : 'ORD-SAMPLE'}
              </Text>
              <Text style={styles.etaText}>Estimasi tiba: {eta}</Text>
            </View>
            <View style={styles.badgeDelivering}>
              <Text style={styles.badgeText}>
                {currentStep >= REALISTIC_DELIVERY_PATH.length - 1
                  ? 'COMPLETED'
                  : 'DELIVERING'}
              </Text>
            </View>
          </View>

          <Text style={styles.statusDescription}>{currentStatusDesc}</Text>

          {/* Progress Bar Pengantaran */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${currentProgress}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelText}>Restoran</Text>
            <Text style={styles.progressLabelText}>{currentProgress}% Menuju Lokasi</Text>
            <Text style={styles.progressLabelText}>Tujuan</Text>
          </View>
        </View>

        {/* Live Interactive Map Card */}
        <View style={styles.mapCard}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>PETA INTERAKTIF LIVE (OPENSTREETMAP + SOCKET.IO)</Text>
          </View>

          {/* Interactive Map via Leaflet WebView */}
          <TrackingMap driverLocation={driverLocation} />

          {/* Panel Kontrol Simulasi Langsung */}
          <View style={styles.simulationControlBox}>
            <TouchableOpacity
              style={[
                styles.simPlayBtn,
                isSimulating ? styles.simPlayBtnActive : styles.simPlayBtnInactive,
              ]}
              onPress={toggleSimulation}
            >
              <FontAwesome5
                name={isSimulating ? 'pause' : 'motorcycle'}
                size={16}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.simPlayBtnText}>
                {isSimulating ? 'Jeda Pergerakan Driver' : 'Mulai Simulasi Driver Bergerak'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.simResetBtn} onPress={resetSimulation}>
              <FontAwesome5 name="redo-alt" size={14} color="#555" />
            </TouchableOpacity>
          </View>

          {/* Coordinate Details Box */}
          <View style={styles.coordsBox}>
            <View style={styles.coordCol}>
              <Text style={styles.coordLabel}>LATITUDE</Text>
              <Text style={styles.coordValue}>{driverLocation.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.coordDivider} />
            <View style={styles.coordCol}>
              <Text style={styles.coordLabel}>LONGITUDE</Text>
              <Text style={styles.coordValue}>{driverLocation.longitude.toFixed(6)}</Text>
            </View>
          </View>
          <Text style={styles.lastUpdate}>
            Terakhir diperbarui: {driverLocation.updatedAt || 'Baru saja'}
          </Text>
        </View>

        {/* Driver Profile Card */}
        <View style={styles.card}>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <FontAwesome5 name="user" size={24} color="#555" />
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>Budi Santoso</Text>
              <Text style={styles.driverVehicle}>Honda Vario • B 4321 SJK</Text>
              <View style={styles.ratingRow}>
                <FontAwesome5 name="star" solid size={12} color="#F59E0B" />
                <Text style={styles.ratingText}>4.9 (500+ pesanan)</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <FontAwesome5 name="phone" size={16} color="#00AA13" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Details List if loaded */}
        {orderDetails && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
            {orderDetails.items?.map((item: any, idx: number) => (
              <View key={item.id || idx} style={styles.orderItemRow}>
                <Text style={styles.orderItemQty}>{item.quantity}x</Text>
                <Text style={styles.orderItemName}>
                  {item.menuItem?.name || 'Menu'}
                </Text>
                <Text style={styles.orderItemPrice}>
                  Rp {(item.price * item.quantity).toLocaleString()}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalTitle}>Total</Text>
              <Text style={styles.totalValue}>
                Rp {orderDetails.totalPrice?.toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
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
  simButton: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  simButtonText: {
    color: '#00AA13',
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  etaText: {
    fontSize: 13,
    color: '#00AA13',
    fontWeight: '600',
    marginTop: 4,
  },
  badgeDelivering: {
    backgroundColor: '#E1EFFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#1E429F',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    lineHeight: 18,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00AA13',
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressLabelText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  mapCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  simulationControlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  simPlayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  simPlayBtnInactive: {
    backgroundColor: '#00AA13',
  },
  simPlayBtnActive: {
    backgroundColor: '#DC2626',
  },
  simPlayBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  simResetBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  coordsBox: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    marginTop: 14,
    padding: 12,
  },
  coordCol: {
    flex: 1,
    alignItems: 'center',
  },
  coordDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  coordLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  coordValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 2,
  },
  lastUpdate: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 14,
  },
  driverName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  driverVehicle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    color: '#4B5563',
    marginLeft: 4,
  },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginBottom: 10,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  orderItemQty: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#00AA13',
    width: 24,
  },
  orderItemName: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  orderItemPrice: {
    fontSize: 13,
    color: '#1C1C1C',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    marginTop: 8,
  },
  totalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#00AA13',
  },
});
