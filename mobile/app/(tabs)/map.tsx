import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import MapView, { Marker, Callout, type Region } from "react-native-maps";
import { api } from "@/services/api";
import { mapStyles as styles } from "@/styles/map";

interface Building {
  id: number;
  number: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

// Centre the initial camera on the first building's area; fallback to TU Sofia
const DEFAULT_REGION: Region = {
  latitude: 42.657,
  longitude: 23.353,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

function openNavigation(b: Building) {
  const label = encodeURIComponent(b.name);
  Linking.openURL(`https://maps.google.com/?q=${b.latitude},${b.longitude}(${label})`).catch(() => {});
}

export default function MapScreen() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  function loadBuildings() {
    api
      .get<Building[]>("/buildings")
      .then((data) => {
        setBuildings(data);
        setError(null);
        if (data.length > 0) {
          mapRef.current?.animateToRegion(
            {
              latitude: data[0].latitude,
              longitude: data[0].longitude,
              latitudeDelta: 0.012,
              longitudeDelta: 0.012,
            },
            400,
          );
        }
      })
      .catch(() => setError("Неуспешно зареждане на сградите. Опитайте отново."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBuildings();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Зареждане на картата...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => { setLoading(true); loadBuildings(); }}
        >
          <Text style={styles.retryText}>Опитай отново</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header} pointerEvents="none">
        <Text style={styles.title}>Кампус</Text>
      </View>

      <MapView ref={mapRef} style={styles.map} initialRegion={DEFAULT_REGION}>
        {buildings.map((b) => (
          <Marker
            key={b.id}
            coordinate={{ latitude: b.latitude, longitude: b.longitude }}
            title={b.name}
            pinColor="#1e3a8a"
          >
            <Callout
              onPress={() => openNavigation(b)}
              tooltip
            >
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{b.name}</Text>
                <Text style={styles.calloutAddress}>{b.address}</Text>
                <TouchableOpacity
                  style={styles.navigateBtn}
                  onPress={() => openNavigation(b)}
                >
                  <Text style={styles.navigateBtnText}>Навигирай</Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}
