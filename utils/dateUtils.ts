/**
 * Date utility functions for Conference Compass
 * Provides consistent timezone-aware date handling across the app
 */

/**
 * Converts a Date to a local YYYY-MM-DD string (NOT UTC)
 * Use this instead of toISOString().split('T')[0]
 */
export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses a date-only string (YYYY-MM-DD) as local midnight, not UTC
 * Avoids the timezone shift issue with new Date('2026-01-20')
 */
export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Parses an ISO timestamp string, returns Date object
 */
export const parseTimestamp = (timestamp: string): Date => {
  return new Date(timestamp);
};

/**
 * Checks if two dates are the same calendar day (local timezone)
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Checks if a date is today (local timezone)
 */
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

/**
 * Gets the start of day (local midnight) for a given date
 */
export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Gets the end of day (23:59:59.999) for a given date
 */
export const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Calculates the day number of a conference (1-indexed)
 * Day 1 is the first day of the conference
 */
export const getConferenceDayNumber = (
  conferenceStartDate: string,
  currentDate: Date = new Date()
): number => {
  const start = startOfDay(parseLocalDate(conferenceStartDate));
  const current = startOfDay(currentDate);

  const diffMs = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Day 1 is when diffDays = 0
  return diffDays + 1;
};

/**
 * Calculates total days of a conference (inclusive)
 */
export const getConferenceTotalDays = (
  startDate: string,
  endDate: string
): number => {
  const start = startOfDay(parseLocalDate(startDate));
  const end = startOfDay(parseLocalDate(endDate));

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Inclusive: Jan 20-22 is 3 days
  return diffDays + 1;
};

/**
 * Checks if current time is within a session's time range
 */
export const isSessionLive = (
  startTime: string,
  endTime: string,
  now: Date = new Date()
): boolean => {
  const start = parseTimestamp(startTime);
  const end = parseTimestamp(endTime);
  return now >= start && now <= end;
};

/**
 * Validates that start date is before or equal to end date
 */
export const isValidDateRange = (
  startDate: string,
  endDate: string
): boolean => {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  return start <= end;
};

/**
 * Validates that a timestamp's start is before its end
 */
export const isValidTimeRange = (
  startTime: string,
  endTime: string
): boolean => {
  const start = parseTimestamp(startTime);
  const end = parseTimestamp(endTime);
  return start < end;
};

/**
 * Formats a date for display using user's locale
 */
export const formatDate = (
  date: Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  return date.toLocaleDateString(undefined, options);
};

/**
 * Formats a time for display using user's locale
 */
export const formatTime = (
  date: Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
};

/**
 * Gets a cached "now" timestamp for use within a single render cycle
 * Call once at the start of render and reuse the value
 */
export const getNow = (): Date => new Date();

/**
 * Gets today's date string in local YYYY-MM-DD format
 */
export const getTodayString = (): string => toLocalDateString(new Date());
