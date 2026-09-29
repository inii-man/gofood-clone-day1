import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('budi@mail.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Silakan masukkan email dan password');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        (error.code === 'ECONNABORTED'
          ? 'Koneksi timeout. Pastikan backend aktif di port 3000 dan di jaringan yang sama.'
          : error.message || 'Login gagal, periksa email dan password Anda');
      Alert.alert('Gagal Masuk', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <FontAwesome5 name="utensils" size={32} color="#fff" />
          </View>
          <Text style={styles.appName}>GoFood</Text>
          <Text style={styles.subtitle}>Selamat datang kembali! Silakan login untuk melanjutkan.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Masuk</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <FontAwesome5 name="envelope" size={16} color="#777" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="nama@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <FontAwesome5 name="lock" size={16} color="#777" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.demoButtonsContainer}>
            <Text style={styles.demoTitle}>Akun Demo Cepat:</Text>
            <View style={styles.demoRow}>
              <TouchableOpacity
                style={[
                  styles.demoChip,
                  email === 'budi@mail.com' && styles.demoChipActive,
                ]}
                onPress={() => {
                  setEmail('budi@mail.com');
                  setPassword('password123');
                }}
              >
                <FontAwesome5
                  name="user"
                  size={12}
                  color={email === 'budi@mail.com' ? '#fff' : '#00AA13'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.demoChipText,
                    email === 'budi@mail.com' && styles.demoChipTextActive,
                  ]}
                >
                  Customer (Budi)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.demoChip,
                  email === 'driver@mail.com' && styles.demoChipActive,
                ]}
                onPress={() => {
                  setEmail('driver@mail.com');
                  setPassword('password123');
                }}
              >
                <FontAwesome5
                  name="motorcycle"
                  size={12}
                  color={email === 'driver@mail.com' ? '#fff' : '#00AA13'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.demoChipText,
                    email === 'driver@mail.com' && styles.demoChipTextActive,
                  ]}
                >
                  Driver (Pak Joko)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Masuk</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Daftar Sekarang</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#00AA13',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#00AA13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1C',
  },
  demoButtonsContainer: {
    marginVertical: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  demoTitle: {
    fontSize: 12,
    color: '#777',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00AA13',
    backgroundColor: '#F0FDF4',
  },
  demoChipActive: {
    backgroundColor: '#00AA13',
    borderColor: '#00AA13',
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00AA13',
  },
  demoChipTextActive: {
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#00AA13',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  linkText: {
    color: '#00AA13',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
