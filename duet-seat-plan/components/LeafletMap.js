'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons issue in Next.js static asset resolutions
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
}

// Custom colored markers for active highlight
const goldIcon = typeof window !== 'undefined' ? new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}) : null;

const redIcon = typeof window !== 'undefined' ? new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}) : null;

const greenIcon = typeof window !== 'undefined' ? new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}) : null;

const defaultBlueIcon = typeof window !== 'undefined' ? new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}) : null;

// Helper component to update map view dynamically and safely
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function LeafletMap({ activeBuilding }) {
  const buildings = [
    {
      id: 'TWB',
      name: 'Textile Workshop Building (TWB)',
      coords: [24.01681776519539, 90.41899675374566],
      icon: greenIcon
    },
    {
      id: 'SASAB',
      name: 'Shahid Abu Sayed Administrative Building (SASAB)',
      coords: [24.01786205652544, 90.41861087525096],
      icon: redIcon
    },
    {
      id: 'SSNIAB',
      name: 'Shahid Syed Nazrul Islam Academic Building (SSNIAB)',
      coords: [24.017386929100123, 90.41894811730583],
      icon: goldIcon
    }
  ];

  let activeId = null;
  let activeCoords = null;
  if (activeBuilding) {
    const text = activeBuilding.toUpperCase();
    if (text.includes('TEXTILE') || text.includes('TWB')) {
      activeId = 'TWB';
    } else if (text.includes('ADMINISTRATIVE') || text.includes('SASAB') || text.includes('SAYED')) {
      activeId = 'SASAB';
    } else {
      activeId = 'SSNIAB';
    }
    
    const b = buildings.find(x => x.id === activeId);
    if (b) activeCoords = b.coords;
  }

  const displayedBuildings = activeId 
    ? buildings.filter(b => b.id === activeId)
    : [];

  return (
    <MapContainer 
      center={[24.017386929100123, 90.41894811730583]} 
      zoom={17} 
      style={{ height: '100%', width: '100%' }}
    >
      <ChangeView center={activeCoords} zoom={18} />
      <TileLayer
        attribution="&copy; Google Maps"
        url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
      />
      {displayedBuildings.map(b => (
        <Marker 
          key={b.id} 
          position={b.coords} 
          icon={b.id === activeId ? b.icon : defaultBlueIcon}
        >
          <Tooltip direction="top" offset={[0, -40]} opacity={1}>
            <div style={{ padding: '2px 4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
              {b.name}
            </div>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
