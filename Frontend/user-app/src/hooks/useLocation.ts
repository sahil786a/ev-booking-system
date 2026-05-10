import { useCallback, useEffect, useState } from 'react';

import { ensureForegroundPermission, getPermissionStatus } from '../services/locationService';
import type { GeoPosition } from '../services/locationService';

type LocationState =
  | { status: 'unknown' }
  | { status: 'denied' | 'blocked' | 'restricted' | 'unable' | 'idle' | 'prompt' }
  | { status: 'ready'; coords: GeoPosition };

export function useDeviceLocation(enabled: boolean) {
  const [state, setState] = useState<LocationState>({ status: 'unknown' });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setState({ status: 'idle' });
      return null;
    }
    setLoading(true);
    try {
      const coords = await ensureForegroundPermission();
      if (!coords) {
        const granted = await getPermissionStatus();
        setState(granted === 'denied' ? { status: 'denied' } : { status: 'unable' });
        return null;
      }
      const nextState: LocationState = { status: 'ready', coords };
      setState(nextState);
      return coords;
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      refresh().catch(() => setState({ status: 'unable' }));
    }
  }, [enabled, refresh]);

  return { state, loading, refresh };
}
