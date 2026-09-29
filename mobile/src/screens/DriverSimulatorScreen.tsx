import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { socket } from '../services/socket';
import { FontAwesome5 } from '@expo/vector-icons';

export default function DriverSimulatorScreen({ route, navigation }: any) {
  const initialOrderId = route.params?.orderId || '';
  const [orderId, setOrderId] = useState(initialOrderId);
  const [latitude, setLatitude] = useState('-6.2088');
  const [longitude, setLongitude] = useState('106.8456');
  const [isSimulating, setIsSimulating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const simTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 19)]);
  };

  const sendLocation = (lat?: number, lng?: number) => {
    if (!orderId.trim()) {
      Alert.alert('Perhatian', 'Masukkan Order ID terlebih dahulu');
      return;
    }

    const currentLat = lat !== undefined ? lat : parseFloat(latitude);
    const currentLng = lng !== undefined ? lng : parseFloat(longitude);

    if (isNaN(currentLat) || isNaN(currentLng)) {
      Alert.alert('Error', 'Latitude atau Longitude tidak valid');
      return;
    }

    // Emit driver-location event (Slide 55)
    socket.emit('driver-location', {
      orderId: orderId.trim(),
      latitude: currentLat,
      longitude: currentLng,
    });

    addLog(`Sent location: ${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}`);
  };

  const waypoints = [
    { title: 'Restoran', lat: -6.2088, lng: 106.8456 },
    { title: 'Jalan Raya Sudirman', lat: -6.2140, lng: 106.8415 },
    { title: 'Simpang Semanggi', lat: -6.2205, lng: 106.8370 },
    { title: 'Dekat Lokasi', lat: -6.2255, lng: 106.8330 },
    { title: 'Tiba di Tujuan', lat: -6.2290, lng: 106.8300 },
  ];

  const handleSelectWaypoint = (point: { title: string; lat: number; lng: number }) => {
    setLatitude(point.lat.toString());
    setLongitude(point.lng.toString());
    sendLocation(point.lat, point.lng);
  };

  const toggleAutoSimulate = () => {
    if (isSimulating) {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      setIsSimulating(false);
      addLog('Simulasi otomatis dihentikan');
      return;
    }

    if (!orderId.trim()) {
      Alert.alert('Perhatian', 'Masukkan Order ID terlebih dahulu');
      return;
    }

    setIsSimulating(true);
    let step = 0;
    addLog('Simulasi otomatis dimulai');

    simTimerRef.current = setInterval(() => {
      const pt = waypoints[step % waypoints.length];
      setLatitude(pt.lat.toString());
      setLongitude(pt.lng.toString());
      sendLocation(pt.lat, pt.lng);
      step++;
      if (step >= waypoints.length) {
        if (simTimerRef.current) clearInterval(simTimerRef.current);
        setIsSimulating(false);
        addLog('Simulasi selesai (Driver telah tiba)');
      }
    }, 2500);
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
        <Text style={styles.headerTitle}>Driver Simulator</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.noticeCard}>
          <FontAwesome5 name="info-circle" size={18} color="#00AA13" />
          <Text style={styles.noticeText}>
            Simulator ini mengirimkan event <Text style={{ fontWeight: 'bold' }}>driver-location</Text> melalui Socket.io ke customer secara real-time.
          </Text>
        </View>

        {/* Inputs */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data Pengiriman Lokasi</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Order ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 123 atau ID dari checkout"
              value={orderId}
              onChangeText={setOrderId}
            />
          </View>

          <View style={styles.coordRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Send Location Button */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => sendLocation()}
          >
            <FontAwesome5 name="paper-plane" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Kirim Lokasi</Text>
          </TouchableOpacity>

          {/* Auto Simulator Button */}
          <TouchableOpacity
            style={[styles.simBtn, isSimulating && styles.simBtnStop]}
            onPress={toggleAutoSimulate}
          >
            <FontAwesome5
              name={isSimulating ? 'stop' : 'play'}
              size={14}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.simBtnText}>
              {isSimulating ? 'Hentikan Simulasi' : 'Jalankan Rute Otomatis (5 Titik)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Presets */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preset Titik Perjalanan</Text>
          {waypoints.map((pt, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.waypointRow}
              onPress={() => handleSelectWaypoint(pt)}
            >
              <View style={styles.waypointBadge}>
                <Text style={styles.waypointIdx}>{idx + 1}</Text>
              </View>
              <View style={styles.waypointInfo}>
                <Text style={styles.waypointTitle}>{pt.title}</Text>
                <Text style={styles.waypointCoords}>
                  {pt.lat}, {pt.lng}
                </Text>
              </View>
              <FontAwesome5 name="chevron-right" size={12} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Console Logs */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Event Logs</Text>
          <View style={styles.logsBox}>
            {logs.length === 0 ? (
              <Text style={styles.emptyLogText}>Belum ada event dikirim.</Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} style={styles.logText}>
                  {log}
                </Text>
              ))
            )}
          </View>
        </View>
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#1B5E20',
    marginLeft: 10,
    lineHeight: 18,
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
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  coordRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#111827',
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#00AA13',
    borderRadius: 10,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  simBtn: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  simBtnStop: {
    backgroundColor: '#DC2626',
  },
  simBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  waypointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  waypointBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  waypointIdx: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
  },
  waypointInfo: {
    flex: 1,
  },
  waypointTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  waypointCoords: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  logsBox: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
  },
  emptyLogText: {
    color: '#94A3B8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  logText: {
    color: '#38BDF8',
    fontFamily: 'monospace',
    fontSize: 11,
    marginBottom: 4,
  },
});
