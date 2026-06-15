import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import L from "leaflet";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
});

export default function MapPage() {
  const [params] = useSearchParams();
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const lat = parseFloat(params.get("lat") ?? "");
  const lng = parseFloat(params.get("lng") ?? "");
  const buildingName = params.get("name") ?? "Building";
  const buildingNumber = params.get("building") ?? "";
  const room = params.get("room") ?? "";
  const address = params.get("address") ?? "";

  const valid = !isNaN(lat) && !isNaN(lng);

  useEffect(() => {
    if (!valid || !mapElementRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapElementRef.current, {
      center: [lat, lng],
      zoom: 18,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`<strong>${buildingName}</strong><br />Room ${room}`)
      .openPopup();

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, buildingName, room, valid]);

  if (!valid) {
    return (
      <div className="map-page-error">
        <p>Невалидни или липсващи параметри за местоположение.</p>
      </div>
    );
  }

  return (
    <div className="map-page">
      <div className="map-page-header">
        <div>
          <p className="map-page-eyebrow">Сграда {buildingNumber}</p>
          <h2>{buildingName}</h2>
          {address && <p className="map-page-address">{address}</p>}
          {room && <p className="map-page-room">Зала: {room}</p>}
        </div>
      </div>
      <div ref={mapElementRef} className="map-page-map" />
    </div>
  );
}
