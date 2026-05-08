import { useEffect, useRef } from "react";
import L from "leaflet";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
});

export type RoomLocation = {
  room: string;
  buildingNumber: number;
  buildingName: string;
  address: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
};

type RoomLocationCardProps = {
  location: RoomLocation;
  onClose: () => void;
};

const defaultZoom = 18;

export default function RoomLocationCard({ location, onClose }: RoomLocationCardProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapElementRef.current) {
      return;
    }

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapElementRef.current, {
      center: [location.latitude, location.longitude],
      zoom: defaultZoom,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.marker([location.latitude, location.longitude])
      .addTo(map)
      .bindPopup(`<strong>${location.buildingName}</strong><br />Room ${location.room}`)
      .openPopup();

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [location]);

  return (
    <section className="room-location-card">
      <div className="room-location-header">
        <div>
          <p className="room-location-eyebrow">Building {location.buildingNumber} · Room location</p>
          <h3>{location.buildingName}</h3>
        </div>
        <button type="button" className="room-location-close" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="room-location-content">
        <div className="room-location-details">
          <p><strong>Room:</strong> {location.room}</p>
          <p><strong>Address:</strong> {location.address}</p>
        </div>

        <div ref={mapElementRef} className="room-location-map" />
      </div>
    </section>
  );
}
