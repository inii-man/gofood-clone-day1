import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface Location {
  latitude: number;
  longitude: number;
}

interface TrackingMapProps {
  driverLocation: Location;
  restaurantLocation?: Location;
  destinationLocation?: Location;
}

export default function TrackingMap({
  driverLocation,
  restaurantLocation = { latitude: -6.2088, longitude: 106.8456 },
  destinationLocation = { latitude: -6.2290, longitude: 106.8300 },
}: TrackingMapProps) {
  const webViewRef = useRef<WebView>(null);

  // Kirim update koordinat baru ke Leaflet map tanpa perlu me-reload halaman webview
  useEffect(() => {
    if (webViewRef.current) {
      const script = `
        if (window.updateDriverLocation) {
          window.updateDriverLocation(${driverLocation.latitude}, ${driverLocation.longitude});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [driverLocation.latitude, driverLocation.longitude]);

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #f0f3f5;
          }
          .leaflet-marker-icon {
            transition: all 1.4s ease-in-out !important;
          }
          .driver-marker {
            background-color: #00AA13;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 19px;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0, 170, 19, 0.5);
            animation: pulse 1.8s infinite;
          }
          .resto-marker {
            background-color: #FF6B00;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 15px;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
          }
          .dest-marker {
            background-color: #EF4444;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 15px;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
          }
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(0, 170, 19, 0.6);
            }
            70% {
              box-shadow: 0 0 0 12px rgba(0, 170, 19, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(0, 170, 19, 0);
            }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const restoLat = ${restaurantLocation.latitude};
          const restoLng = ${restaurantLocation.longitude};
          const destLat = ${destinationLocation.latitude};
          const destLng = ${destinationLocation.longitude};
          const driverLat = ${driverLocation.latitude};
          const driverLng = ${driverLocation.longitude};

          // Inisialisasi Map
          const map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([driverLat, driverLng], 14);

          // Tile Layer OpenStreetMap
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          // Custom Div Icons
          const restoIcon = L.divIcon({
            className: 'custom-icon',
            html: '<div class="resto-marker">🏪</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const destIcon = L.divIcon({
            className: 'custom-icon',
            html: '<div class="dest-marker">📍</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const driverIcon = L.divIcon({
            className: 'custom-icon',
            html: '<div class="driver-marker">🛵</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });

          // Tambahkan Markers
          L.marker([restoLat, restoLng], { icon: restoIcon }).addTo(map).bindPopup('<b>Restoran</b>');
          L.marker([destLat, destLng], { icon: destIcon }).addTo(map).bindPopup('<b>Tujuan Pengiriman</b>');

          const driverMarker = L.marker([driverLat, driverLng], { icon: driverIcon }).addTo(map).bindPopup('<b>Driver</b>');

          // Buat rute garis (Polyline)
          const routeLine = L.polyline([
            [restoLat, restoLng],
            [driverLat, driverLng],
            [destLat, destLng]
          ], {
            color: '#00AA13',
            weight: 4,
            opacity: 0.7,
            dashArray: '8, 8'
          }).addTo(map);

          // Fit bounds agar semua titik terlihat
          map.fitBounds([
            [restoLat, restoLng],
            [destLat, destLng]
          ], { padding: [40, 40] });

          // Handler update lokasi driver
          window.updateDriverLocation = function(newLat, newLng) {
            driverMarker.setLatLng([newLat, newLng]);
            routeLine.setLatLngs([
              [restoLat, restoLng],
              [newLat, newLng],
              [destLat, destLng]
            ]);
            map.panTo([newLat, newLng], { animate: true, duration: 1.0 });
          };
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        nestedScrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  map: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
