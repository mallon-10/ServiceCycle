"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

const MARKER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
  <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26c0-7.7-6.3-14-14-14z" fill="#5b8def"/>
  <circle cx="14" cy="14" r="6" fill="#0b1220"/>
</svg>`;

const markerIcon = new Icon({
  iconUrl: `data:image/svg+xml,${encodeURIComponent(MARKER_SVG)}`,
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -36],
});

export type MapCustomer = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  assetCount: number;
  completedVisits: number;
  technicianNames: string[];
};

export function OperationsMap({ customers }: { customers: MapCustomer[] }) {
  const center: [number, number] =
    customers.length > 0
      ? [customers[0].latitude, customers[0].longitude]
      : [-14.235, -51.9253]; // geographic center of Brazil, fallback when nothing is geocoded yet

  return (
    <div className="h-[600px] w-full overflow-hidden rounded-lg border border-border">
      <MapContainer
        center={center}
        zoom={customers.length > 0 ? 5 : 4}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {customers.map((customer) => (
          <Marker
            key={customer.id}
            position={[customer.latitude, customer.longitude]}
            icon={markerIcon}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{customer.name}</div>
                <div>{customer.assetCount} ativo(s) monitorado(s)</div>
                <div>{customer.completedVisits} visita(s) concluída(s)</div>
                {customer.technicianNames.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    Técnicos: {customer.technicianNames.join(", ")}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
