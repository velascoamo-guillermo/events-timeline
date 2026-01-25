/**
 * Date formatting utilities for the timeline UI
 */

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getDateLabel(timestamp: number): string {
  const eventDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(eventDate, today)) {
    return 'Today';
  }

  if (isSameDay(eventDate, yesterday)) {
    return 'Yesterday';
  }

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };

  // Only include year if it's not the current year
  if (eventDate.getFullYear() !== today.getFullYear()) {
    options.year = 'numeric';
  }

  return eventDate.toLocaleDateString('en-US', options);
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getISODateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}
