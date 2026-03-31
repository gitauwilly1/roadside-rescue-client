import { useState, useEffect, useCallback } from 'react';

const useLocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [watchId, setWatchId] = useState(null);

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
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude, coordinates: [longitude, latitude] });
        setIsLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError(err.message || 'Unable to get your location');
        setIsLoading(false);
      },
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude, coordinates: [longitude, latitude] });
        setIsLoading(false);
      },
      (err) => {
        console.error('Geolocation watch error:', err);
        setError(err.message || 'Unable to track location');
        setIsLoading(false);
      },
      { enableHighAccuracy, timeout, maximumAge }
    );

    setWatchId(id);
    return id;
  }, [enableHighAccuracy, timeout, maximumAge]);

  const stopWatching = useCallback(() => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  useEffect(() => {
    if (watch) {
      startWatching();
      return () => stopWatching();
    } else {
      getCurrentPosition();
    }
  }, [watch, getCurrentPosition, startWatching, stopWatching]);

  return {
    location,
    error,
    isLoading,
    getCurrentPosition,
    startWatching,
    stopWatching,
  };
};

export default useLocation;