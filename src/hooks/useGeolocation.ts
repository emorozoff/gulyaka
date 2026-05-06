import { useEffect, useState } from 'react';

export type GeolocationState = {
  position: GeolocationPosition | null;
  error: string | null;
  permission: PermissionState | 'unknown';
};

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    permission: 'unknown',
  });

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, error: 'Геолокация не поддерживается' }));
      return;
    }

    let cancelled = false;

    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((status) => {
          if (cancelled) return;
          setState((s) => ({ ...s, permission: status.state }));
          status.onchange = () => {
            if (!cancelled) setState((s) => ({ ...s, permission: status.state }));
          };
        })
        .catch(() => {});
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        if (!cancelled) setState({ position: pos, error: null, permission: 'granted' });
      },
      (err) => {
        if (!cancelled) setState((s) => ({ ...s, error: err.message }));
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(id);
    };
  }, []);

  return state;
}
