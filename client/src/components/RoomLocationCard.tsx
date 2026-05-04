import { useEffect, useRef } from "react";
import L from "leaflet";

export type RoomLocation = {
  room: string;
  buildingName: string;
  address: string;
  latitude: number;
  longitude: number;
  note: string;
};

type RoomLocationCardProps = {
  location: RoomLocation;
  onClose: () => void;
};

const defaultZoom = 17;

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

    L.circleMarker([location.latitude, location.longitude], {
      radius: 9,
      color: "#1d4ed8",
      fillColor: "#2563eb",
      fillOpacity: 0.9,
      weight: 2,
    })
      .addTo(map)
      .bindPopup(`<strong>${location.buildingName}</strong><br />Room ${location.room}`)
      .openPopup();

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [location]);

  const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=18/${location.latitude}/${location.longitude}`;

  return (
    <section className="room-location-card">
      <div className="room-location-header">
        <div>
          <p className="room-location-eyebrow">Room location</p>
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
          <p><strong>Note:</strong> {location.note}</p>
          <a href={openStreetMapUrl} target="_blank" rel="noreferrer" className="room-location-link">
            Open larger map
          </a>
        </div>

        <div ref={mapElementRef} className="room-location-map" />
      </div>
    </section>
  );
}