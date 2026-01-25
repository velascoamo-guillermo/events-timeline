import { useEffect } from 'react';
import { eventTracker } from '@/src/infrastructure/tracking/EventTracker';

export function useEventTracker() {
  useEffect(() => {
    eventTracker.startTracking();

    return () => {
      eventTracker.stopTracking();
    };
  }, []);
}
