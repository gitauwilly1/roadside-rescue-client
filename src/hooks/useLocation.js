import { useState, useEffect, useCallback, useRef } from 'react';

const useGeoLocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef(null);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);

  const { enableHighAccuracy = false, timeout = 5000, maximumAge = 60000, watch = false } = options;

  const handleSuccess = useCallback((position) => {
    if (isMountedRef.current) {
      const { latitude, longitude } = position.coords;
      setLocation({ 
        latitude, 
        longitude, 
        coordinates: [longitude, latitude],
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      });
      setIsLoading(false);
      setError(null);
      retryCountRef.current = 0;
    }
  }, []);

  const handleError = useCallback((err) => {
    if (isMountedRef.current) {
      console.error('Geolocation error:', err);
      
      let errorMessage = '';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable location services to find nearby garages.';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable. Please check your GPS signal.';
          break;
        case err.TIMEOUT:
          errorMessage = 'Location request timed out. Please check your connection and try again.';
          break;
        default:
          errorMessage = 'Unable to get your location. Please enter address manually.';
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  }, []);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsLoading(true);
    setError(null);

    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy, timeout, maximumAge }
    );

    watchIdRef.current = id;
    return id;
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const retry = useCallback(() => {
    if (retryCountRef.current < 3) {
      retryCountRef.current++;
      console.log(`Retrying location fetch (attempt ${retryCountRef.current})...`);
      getCurrentPosition();
    }
  }, [getCurrentPosition]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (watch) {
      startWatching();
    } else {
      getCurrentPosition();
    }

    return () => {
      isMountedRef.current = false;
      stopWatching();
    };
  }, [watch, startWatching, getCurrentPosition, stopWatching]);

  return {
    location,
    error,
    isLoading,
    getCurrentPosition,
    startWatching,
    stopWatching,
    retry,
  };
};

export default useGeoLocation;