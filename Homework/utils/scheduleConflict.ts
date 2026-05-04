/**
 * Schedule Conflict Detection Utility
 *
 * Pure function that checks whether a new schedule entry overlaps with
 * existing schedules on the same day and classroom. Two time ranges
 * overlap when entry1.startTime < entry2.endTime AND entry2.startTime < entry1.endTime.
 *
 * Property 32: Schedule conflict detection identifies overlapping time slots.
 * Validates: Requirements 12.8, 19.7
 */

import type { Schedule } from '../types/schedule';

export interface ConflictResult {
  /** Whether a conflict was detected */
  hasConflict: boolean;
  /** The existing schedule(s) that conflict with the new entry */
  conflictingSchedules: Schedule[];
}

export interface NewScheduleInput {
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
}

/**
 * Parse a time string (HH:MM or HH:MM:SS) into total minutes since midnight.
 * Returns NaN for invalid input.
 */
export function parseTimeToMinutes(time: string): number {
  if (!time || typeof time !== 'string') return NaN;
  const parts = time.split(':');
  if (parts.length < 2) return NaN;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return NaN;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return NaN;
  return hours * 60 + minutes;
}

/**
 * Check if two time ranges overlap.
 * Two ranges [s1, e1) and [s2, e2) overlap when s1 < e2 AND s2 < e1.
 */
function timeRangesOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number,
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Detect whether a new schedule entry conflicts with any existing schedules.
 *
 * A conflict exists when:
 * 1. Both entries are on the same day (case-insensitive comparison)
 * 2. Both entries are in the same room (when room is specified on both)
 * 3. Their time ranges overlap
 *
 * @param newSchedule - The schedule entry being created
 * @param existingSchedules - All current schedule entries to check against
 * @returns ConflictResult with hasConflict flag and list of conflicting schedules
 */
export function detectScheduleConflict(
  newSchedule: NewScheduleInput,
  existingSchedules: Schedule[],
): ConflictResult {
  const newStart = parseTimeToMinutes(newSchedule.startTime);
  const newEnd = parseTimeToMinutes(newSchedule.endTime);

  // If the new schedule has invalid times, no conflict can be determined
  if (isNaN(newStart) || isNaN(newEnd) || newStart >= newEnd) {
    return { hasConflict: false, conflictingSchedules: [] };
  }

  const newDay = newSchedule.day.toLowerCase().trim();
  const newRoom = newSchedule.room?.toLowerCase().trim();

  const conflictingSchedules: Schedule[] = [];

  for (const existing of existingSchedules) {
    // Must be on the same day
    if (existing.day.toLowerCase().trim() !== newDay) continue;

    // Must be in the same room (only check when both have a room specified)
    if (newRoom && existing.room) {
      if (existing.room.toLowerCase().trim() !== newRoom) continue;
    } else if (!newRoom || !existing.room) {
      // If either has no room, we still check for time overlap on the same day
      // to catch potential conflicts in unspecified rooms
    }

    const existStart = parseTimeToMinutes(existing.startTime);
    const existEnd = parseTimeToMinutes(existing.endTime);

    if (isNaN(existStart) || isNaN(existEnd)) continue;

    if (timeRangesOverlap(newStart, newEnd, existStart, existEnd)) {
      conflictingSchedules.push(existing);
    }
  }

  return {
    hasConflict: conflictingSchedules.length > 0,
    conflictingSchedules,
  };
}
