import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
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

const LiveMap = ({ clientLocation, garageLocation, isActive = false, onRouteCalculated }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const clientMarkerRef = useRef(null);
  const garageMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const center = clientLocation 
      ? [clientLocation.latitude || clientLocation.coordinates[1], clientLocation.longitude || clientLocation.coordinates[0]]
      : [-1.2921, 36.8219];

    const map = L.map(mapRef.current).setView(center, 13);
    
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
          .bindPopup('<strong>📍 Your Location</strong><br/>Emergency rescue location');
      }
    }
  }, [clientLocation, mapLoaded]);

  // Update garage marker and calculate route
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
      
      // Calculate route if both locations exist
      if (clientLocation) {
        calculateRoute();
      }
    }
  }, [garageLocation, mapLoaded]);

  // Calculate route between client and garage
  const calculateRoute = async () => {
    if (!clientLocation || !garageLocation) return;

    const clientLat = clientLocation.latitude || clientLocation.coordinates[1];
    const clientLng = clientLocation.longitude || clientLocation.coordinates[0];
    const garageLat = garageLocation.latitude || garageLocation.coordinates[1];
    const garageLng = garageLocation.longitude || garageLocation.coordinates[0];

    // Remove existing route layer
    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
    }

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
            opacity: 0.8,
            dashArray: '5, 10'
          }
        }).addTo(mapInstanceRef.current);
        
        const dist = (route.distance / 1000).toFixed(1);
        const dur = Math.round(route.duration / 60);
        
        setDistance(dist);
        setDuration(dur);
        
        if (onRouteCalculated) {
          onRouteCalculated({ distance: dist, duration: dur });
        }
        
        // Fit bounds to show entire route
        const bounds = L.latLngBounds(
          [garageLat, garageLng],
          [clientLat, clientLng]
        );
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (error) {
      console.error('Failed to fetch route:', error);
    }
  };

  // Recalculate route when locations change
  useEffect(() => {
    if (clientLocation && garageLocation && mapLoaded) {
      calculateRoute();
    }
  }, [clientLocation, garageLocation, mapLoaded]);

  return (
    <div className="relative w-full">
      <div 
        ref={mapRef} 
        className="w-full h-64 md:h-80 rounded-lg shadow-inner border border-gray-200"
        style={{ minHeight: '300px' }}
      />
      
      {/* ETA Card */}
      {(distance || duration) && (
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md z-10">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 font-medium">ESTIMATED ARRIVAL</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="font-semibold text-gray-900">{distance} km</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-gray-900">{duration} min</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md z-10 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-700">You</span>
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