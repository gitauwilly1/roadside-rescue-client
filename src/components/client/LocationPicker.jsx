import React, { useState, useEffect } from 'react';

const LocationPicker = ({ address, onAddressChange, onCoordinatesChange, disabled = false }) => {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const getCurrentLocation = () => {
    setIsLocating(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onCoordinatesChange({ coordinates: [longitude, latitude] });
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError('Unable to get your location. Please enter address manually.');
        setIsLocating(false);
      }
    );
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
          className="input-primary pr-24"
          disabled={disabled}
          required
        />
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={disabled || isLocating}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLocating ? '📍 Locating...' : '📍 Use My Location'}
        </button>
      </div>
      {locationError && (
        <p className="text-xs text-red-500">{locationError}</p>
      )}
      <p className="text-xs text-gray-500">
        We'll use your device location to find nearby garages for faster response
      </p>
    </div>
  );
};

export default LocationPicker;