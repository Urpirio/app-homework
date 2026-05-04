/**
 * Zod Validation Schemas
 *
 * Client-side validation schemas that mirror backend DTO validation rules.
 * Used with the useForm() hook for field-level and form-level validation.
 *
 * Validates: Requirements 9.1, 9.2, 9.6
 */

import { z } from 'zod';

/**
 * Task creation/editing schema.
 * Mirrors backend Task DTO validation rules.
 */
export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  description: z.string().optional(),
  dueDate: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date > new Date();
      },
      { message: 'Due date must be a valid future date' }
    ),
  maxGrade: z
    .number()
    .min(0, 'Max grade must be at least 0')
    .max(100, 'Max grade must be at most 100')
    .default(100),
  type: z.enum(['ASSIGNMENT', 'EXAM', 'NOTE', 'QUIZ'], {
    error: 'Type must be ASSIGNMENT, EXAM, NOTE, or QUIZ',
  }),
  projectId: z.string().uuid('Project ID must be a valid UUID'),
});

/**
 * Institution creation/editing schema.
 * Mirrors backend Institution DTO validation rules.
 */
export const institutionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be at most 200 characters'),
  address: z
    .string()
    .max(500, 'Address must be at most 500 characters')
    .optional(),
  logoUrl: z
    .string()
    .url('Logo URL must be a valid URL')
    .optional()
    .or(z.literal('')),
});

/**
 * Support ticket creation schema.
 * Mirrors backend Ticket DTO validation rules.
 */
export const ticketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be at most 2000 characters'),
  category: z.string().min(1, 'Category is required'),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
export type InstitutionFormValues = z.infer<typeof institutionSchema>;
export type TicketFormValues = z.infer<typeof ticketSchema>;
