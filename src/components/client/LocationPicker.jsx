import React, { useState } from 'react';
import useGeoLocation from '../../hooks/useLocation';

const LocationPicker = ({ address, onAddressChange, onCoordinatesChange, disabled = false }) => {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  
  const { getCurrentPosition, error: geoError } = useGeoLocation({ watch: false });

  const getCurrentLocation = async () => {
    setIsLocating(true);
    setLocationError('');

    try {
      // Get current position using the hook's method
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      const coordinates = [longitude, latitude];
      
      // Reverse geocode to get address
      const addressResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const addressData = await addressResponse.json();
      const formattedAddress = addressData.display_name || `${latitude}, ${longitude}`;
      
      // Update form with location data
      onAddressChange(formattedAddress);
      onCoordinatesChange({ coordinates });
      
      setIsLocating(false);
    } catch (err) {
      console.error('Geolocation error:', err);
      
      let errorMessage = '';
      if (err.code === 1) {
        errorMessage = 'Location access denied. Please enable location services in your browser settings.';
      } else if (err.code === 2) {
        errorMessage = 'Location unavailable. Please check your GPS signal.';
      } else if (err.code === 3) {
        errorMessage = 'Location request timed out. Please check your connection.';
      } else {
        errorMessage = 'Unable to get your location. Please enter address manually.';
      }
      
      setLocationError(errorMessage);
      setIsLocating(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Your Location Address *
      </label>
      <div className="relative">
        <input
          type="text"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="e.g., Mombasa Road, Near Gate A, Nairobi"
          className="input-primary pr-28"
          disabled={disabled}
          required
        />
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={disabled || isLocating}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isLocating ? (
            <span className="flex items-center gap-1">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Locating...
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Use My Location
            </span>
          )}
        </button>
      </div>
      {locationError && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {locationError}
        </p>
      )}
      <p className="text-xs text-gray-500">
         We'll use your device location to find nearby garages for faster response
      </p>
    </div>
  );
};

export default LocationPicker;