/**
 * Ticket Escalation Utilities
 *
 * Implements ticket status transitions and auto-escalation rules.
 *
 * Status flow: Open → In Progress → Resolved → Closed
 * Escalation: High priority not claimed within 2h, Critical within 1h,
 *             any unresolved after 48h.
 *
 * Validates: Requirements 15.5, 15.6, 15.7
 */

import type { TicketStatus } from '@/types/ticket';

/** Valid status transitions */
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
};

/**
 * Returns the list of valid next statuses for a given current status.
 */
export function getValidTransitions(currentStatus: TicketStatus): TicketStatus[] {
  return VALID_TRANSITIONS[currentStatus] ?? [];
}

/**
 * Checks whether a status transition is valid.
 */
export function isValidTransition(
  from: TicketStatus,
  to: TicketStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Escalation thresholds in milliseconds */
const ESCALATION_THRESHOLDS: Record<string, number> = {
  Critical: 1 * 60 * 60 * 1000,  // 1 hour
  High: 2 * 60 * 60 * 1000,      // 2 hours
};

const UNRESOLVED_THRESHOLD = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Determines whether a ticket should be auto-escalated based on
 * its priority, status, and creation time.
 */
export function shouldAutoEscalate(ticket: {
  status: TicketStatus;
  priority?: string;
  createdAt: string;
  assignedToId?: string;
}): boolean {
  const now = Date.now();
  const created = new Date(ticket.createdAt).getTime();
  const elapsed = now - created;

  // Only open/in-progress tickets can be escalated
  if (ticket.status !== 'OPEN' && ticket.status !== 'IN_PROGRESS') {
    return false;
  }

  // Priority-based escalation for unclaimed tickets
  if (ticket.status === 'OPEN' && !ticket.assignedToId && ticket.priority) {
    const threshold = ESCALATION_THRESHOLDS[ticket.priority];
    if (threshold && elapsed > threshold) {
      return true;
    }
  }

  // Any ticket unresolved after 48 hours
  if (elapsed > UNRESOLVED_THRESHOLD) {
    return true;
  }

  return false;
}

/** Human-readable status labels in Spanish */
export const STATUS_TRANSITION_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'Tomar Ticket',
  RESOLVED: 'Marcar Resuelto',
  CLOSED: 'Cerrar Ticket',
};

/** Action labels for transitioning to a status */
export function getTransitionActionLabel(targetStatus: TicketStatus): string {
  return STATUS_TRANSITION_LABELS[targetStatus] ?? targetStatus;
}
