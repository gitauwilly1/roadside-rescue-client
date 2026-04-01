import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const clientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const garageIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const LiveMap = ({ clientLocation, garageLocation, isActive = false }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const clientMarkerRef = useRef(null);
  const garageMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Default center to Nairobi if no location
    const center = clientLocation 
      ? [clientLocation.latitude || clientLocation.coordinates[1], clientLocation.longitude || clientLocation.coordinates[0]]
      : [-1.2921, 36.8219];

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true
    }).setView(center, 13);
    
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    setMapLoaded(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update client marker
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    
    if (clientLocation) {
      const lat = clientLocation.latitude || clientLocation.coordinates[1];
      const lng = clientLocation.longitude || clientLocation.coordinates[0];
      const position = [lat, lng];

      if (clientMarkerRef.current) {
        clientMarkerRef.current.setLatLng(position);
      } else {
        clientMarkerRef.current = L.marker(position, { icon: clientIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup('<strong>📍 Your Location</strong><br/>Emergency rescue requested here');
      }
      
      // Center map on client if not tracking garage
      if (!garageLocation && isActive) {
        mapInstanceRef.current.setView(position, 14);
      }
    }
  }, [clientLocation, mapLoaded, isActive, garageLocation]);

  // Update garage marker
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    
    if (garageLocation) {
      const lat = garageLocation.latitude || garageLocation.coordinates[1];
      const lng = garageLocation.longitude || garageLocation.coordinates[0];
      const position = [lat, lng];

      if (garageMarkerRef.current) {
        garageMarkerRef.current.setLatLng(position);
      } else {
        garageMarkerRef.current = L.marker(position, { icon: garageIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup('<strong>🚚 Garage Vehicle</strong><br/>En route to your location');
      }
      
      // Center map to show both locations
      if (clientLocation) {
        const clientLat = clientLocation.latitude || clientLocation.coordinates[1];
        const clientLng = clientLocation.longitude || clientLocation.coordinates[0];
        const bounds = L.latLngBounds(
          [clientLat, clientLng],
          [lat, lng]
        );
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [garageLocation, mapLoaded, clientLocation]);

  // Draw route between client and garage
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    if (!clientLocation || !garageLocation) return;

    const clientLat = clientLocation.latitude || clientLocation.coordinates[1];
    const clientLng = clientLocation.longitude || clientLocation.coordinates[0];
    const garageLat = garageLocation.latitude || garageLocation.coordinates[1];
    const garageLng = garageLocation.longitude || garageLocation.coordinates[0];

    // Remove existing route layer
    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
    }

    // Fetch route from OSRM (Open Source Routing Machine)
    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${garageLng},${garageLat};${clientLng},${clientLat}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const routeGeometry = route.geometry;
          
          routeLayerRef.current = L.geoJSON(routeGeometry, {
            style: {
              color: '#dc2626',
              weight: 4,
              opacity: 0.7,
              dashArray: '5, 10'
            }
          }).addTo(mapInstanceRef.current);
          
          // Add distance and duration popup
          const distance = (route.distance / 1000).toFixed(1);
          const duration = Math.round(route.duration / 60);
          
          const popupContent = `
            <div class="text-sm">
              <strong>🚗 Distance:</strong> ${distance} km<br/>
              <strong>⏱️ ETA:</strong> ${duration} min
            </div>
          `;
          
          L.popup()
            .setLatLng([(clientLat + garageLat) / 2, (clientLng + garageLng) / 2])
            .setContent(popupContent)
            .openOn(mapInstanceRef.current);
        }
      } catch (error) {
        console.error('Failed to fetch route:', error);
      }
    };

    fetchRoute();
  }, [clientLocation, garageLocation, mapLoaded]);

  // Calculate distance between two points
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const distance = clientLocation && garageLocation 
    ? calculateDistance(
        clientLocation.latitude || clientLocation.coordinates[1],
        clientLocation.longitude || clientLocation.coordinates[0],
        garageLocation.latitude || garageLocation.coordinates[1],
        garageLocation.longitude || garageLocation.coordinates[0]
      ).toFixed(1)
    : null;

  return (
    <div className="relative w-full">
      <div 
        ref={mapRef} 
        className="w-full h-64 md:h-80 rounded-lg shadow-inner border border-gray-200 z-0"
        style={{ minHeight: '300px', zIndex: 0 }}
      />
      
      {/* Distance Badge - Lower z-index to stay within map */}
      {distance && (
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md z-10">
          <div className="flex items-center gap-2 text-sm">
            <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium text-gray-900">{distance} km away</span>
          </div>
        </div>
      )}
      
      {/* Legend - Lower z-index to stay within map */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md z-10 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-700">Your Location</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">Garage</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-red-500 border border-red-500 border-dashed"></div>
            <span className="text-gray-700">Route</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;