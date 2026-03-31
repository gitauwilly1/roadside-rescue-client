import { useState, useEffect, useCallback, useRef } from 'react';

const useGeoLocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef(null);
  const isMountedRef = useRef(true);

  const { enableHighAccuracy = true, timeout = 10000, maximumAge = 0, watch = false } = options;

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isMountedRef.current) {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude, coordinates: [longitude, latitude] });
          setIsLoading(false);
        }
      },
      (err) => {
        if (isMountedRef.current) {
          console.error('Geolocation error:', err);
          setError(err.message || 'Unable to get your location');
          setIsLoading(false);
        }
      },
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge]);

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
      (position) => {
        if (isMountedRef.current) {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude, coordinates: [longitude, latitude] });
          setIsLoading(false);
        }
      },
      (err) => {
        if (isMountedRef.current) {
          console.error('Geolocation watch error:', err);
          setError(err.message || 'Unable to track location');
          setIsLoading(false);
        }
      },
      { enableHighAccuracy, timeout, maximumAge }
    );

    watchIdRef.current = id;
    return id;
  }, [enableHighAccuracy, timeout, maximumAge]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

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
  };
};

export default useGeoLocation;