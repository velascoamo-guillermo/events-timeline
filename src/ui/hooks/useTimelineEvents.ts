import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Event } from '@/src/domain/models/Event';
import { WatermelonEventStore } from '@/src/infrastructure/db/WatermelonEventStore';
import { getDateLabel, getISODateKey } from '@/src/ui/utils/dateFormatters';
import type { TimelineSection } from '@/src/ui/components/timeline/TimelineList';

interface UseTimelineEventsReturn {
  sections: TimelineSection[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const eventStore = new WatermelonEventStore();

function groupEventsByDate(events: Event[]): TimelineSection[] {
  // Sort events by timestamp descending (newest first)
  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);

  // Group by date
  const groupedMap = new Map<string, Event[]>();

  for (const event of sortedEvents) {
    const dateKey = getISODateKey(event.timestamp);
    const existing = groupedMap.get(dateKey) || [];
    existing.push(event);
    groupedMap.set(dateKey, existing);
  }

  // Convert to sections array
  const sections: TimelineSection[] = [];

  for (const [dateKey, eventsInGroup] of groupedMap) {
    // Use the first event's timestamp to get the label
    const firstEventTimestamp = eventsInGroup[0].timestamp;
    sections.push({
      title: getDateLabel(firstEventTimestamp),
      date: dateKey,
      data: eventsInGroup,
    });
  }

  // Sort sections by date descending (newest first)
  sections.sort((a, b) => b.date.localeCompare(a.date));

  return sections;
}

export function useTimelineEvents(): UseTimelineEventsReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      const allEvents = await eventStore.getAllEvents();
      setEvents(allEvents);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch events'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const sections = useMemo(() => groupEventsByDate(events), [events]);

  return {
    sections,
    isLoading,
    error,
    refresh,
  };
}
