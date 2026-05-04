/**
 * Tests for Zod validation schemas
 *
 * Validates: Requirements 9.1, 9.2, 9.6
 */

import { institutionSchema, taskSchema, ticketSchema } from '../schemas';

describe('taskSchema', () => {
  const validTask = {
    title: 'Math Homework',
    type: 'ASSIGNMENT' as const,
    maxGrade: 100,
    projectId: '550e8400-e29b-41d4-a716-446655440000',
  };

  it('should accept a valid task with required fields', () => {
    const result = taskSchema.safeParse(validTask);
    expect(result.success).toBe(true);
  });

  it('should accept a task with all optional fields', () => {
    const result = taskSchema.safeParse({
      ...validTask,
      description: 'Complete exercises 1-10',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty title', () => {
    const result = taskSchema.safeParse({ ...validTask, title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const titleError = result.error.issues.find((i) => i.path[0] === 'title');
      expect(titleError?.message).toBe('Title is required');
    }
  });

  it('should reject title exceeding 200 characters', () => {
    const result = taskSchema.safeParse({ ...validTask, title: 'a'.repeat(201) });
    expect(result.success).toBe(false);
    if (!result.success) {
      const titleError = result.error.issues.find((i) => i.path[0] === 'title');
      expect(titleError?.message).toBe('Title must be at most 200 characters');
    }
  });

  it('should reject a past due date', () => {
    const result = taskSchema.safeParse({
      ...validTask,
      dueDate: '2020-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const dueDateError = result.error.issues.find((i) => i.path[0] === 'dueDate');
      expect(dueDateError?.message).toBe('Due date must be a valid future date');
    }
  });

  it('should reject invalid due date string', () => {
    const result = taskSchema.safeParse({
      ...validTask,
      dueDate: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('should accept undefined due date', () => {
    const result = taskSchema.safeParse({ ...validTask, dueDate: undefined });
    expect(result.success).toBe(true);
  });

  it('should reject maxGrade below 0', () => {
    const result = taskSchema.safeParse({ ...validTask, maxGrade: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const gradeError = result.error.issues.find((i) => i.path[0] === 'maxGrade');
      expect(gradeError?.message).toBe('Max grade must be at least 0');
    }
  });

  it('should reject maxGrade above 100', () => {
    const result = taskSchema.safeParse({ ...validTask, maxGrade: 101 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const gradeError = result.error.issues.find((i) => i.path[0] === 'maxGrade');
      expect(gradeError?.message).toBe('Max grade must be at most 100');
    }
  });

  it('should default maxGrade to 100 when not provided', () => {
    const { maxGrade, ...taskWithoutGrade } = validTask;
    const result = taskSchema.safeParse(taskWithoutGrade);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxGrade).toBe(100);
    }
  });

  it('should reject invalid task type', () => {
    const result = taskSchema.safeParse({ ...validTask, type: 'HOMEWORK' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const typeError = result.error.issues.find((i) => i.path[0] === 'type');
      expect(typeError?.message).toBe('Type must be ASSIGNMENT, EXAM, NOTE, or QUIZ');
    }
  });

  it('should accept all valid task types', () => {
    for (const type of ['ASSIGNMENT', 'EXAM', 'NOTE', 'QUIZ']) {
      const result = taskSchema.safeParse({ ...validTask, type });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid projectId UUID', () => {
    const result = taskSchema.safeParse({ ...validTask, projectId: 'not-a-uuid' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const idError = result.error.issues.find((i) => i.path[0] === 'projectId');
      expect(idError?.message).toBe('Project ID must be a valid UUID');
    }
  });
});

describe('institutionSchema', () => {
  it('should accept a valid institution with name only', () => {
    const result = institutionSchema.safeParse({ name: 'MIT' });
    expect(result.success).toBe(true);
  });

  it('should accept a valid institution with all fields', () => {
    const result = institutionSchema.safeParse({
      name: 'MIT',
      address: '77 Massachusetts Ave, Cambridge, MA',
      logoUrl: 'https://example.com/logo.png',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = institutionSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path[0] === 'name');
      expect(nameError?.message).toBe('Name is required');
    }
  });

  it('should reject name exceeding 200 characters', () => {
    const result = institutionSchema.safeParse({ name: 'a'.repeat(201) });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path[0] === 'name');
      expect(nameError?.message).toBe('Name must be at most 200 characters');
    }
  });

  it('should reject address exceeding 500 characters', () => {
    const result = institutionSchema.safeParse({
      name: 'MIT',
      address: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const addrError = result.error.issues.find((i) => i.path[0] === 'address');
      expect(addrError?.message).toBe('Address must be at most 500 characters');
    }
  });

  it('should reject invalid logo URL', () => {
    const result = institutionSchema.safeParse({
      name: 'MIT',
      logoUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const urlError = result.error.issues.find((i) => i.path[0] === 'logoUrl');
      expect(urlError?.message).toBe('Logo URL must be a valid URL');
    }
  });

  it('should accept empty string for logoUrl', () => {
    const result = institutionSchema.safeParse({
      name: 'MIT',
      logoUrl: '',
    });
    expect(result.success).toBe(true);
  });
});

describe('ticketSchema', () => {
  const validTicket = {
    title: 'Login issue',
    description: 'I cannot log in to my account since yesterday',
    category: 'Technical',
  };

  it('should accept a valid ticket', () => {
    const result = ticketSchema.safeParse(validTicket);
    expect(result.success).toBe(true);
  });

  it('should reject empty title', () => {
    const result = ticketSchema.safeParse({ ...validTicket, title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const titleError = result.error.issues.find((i) => i.path[0] === 'title');
      expect(titleError?.message).toBe('Title is required');
    }
  });

  it('should reject title exceeding 200 characters', () => {
    const result = ticketSchema.safeParse({ ...validTicket, title: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('should reject description shorter than 10 characters', () => {
    const result = ticketSchema.safeParse({ ...validTicket, description: 'short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const descError = result.error.issues.find((i) => i.path[0] === 'description');
      expect(descError?.message).toBe('Description must be at least 10 characters');
    }
  });

  it('should reject description exceeding 2000 characters', () => {
    const result = ticketSchema.safeParse({
      ...validTicket,
      description: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const descError = result.error.issues.find((i) => i.path[0] === 'description');
      expect(descError?.message).toBe('Description must be at most 2000 characters');
    }
  });

  it('should reject empty category', () => {
    const result = ticketSchema.safeParse({ ...validTicket, category: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const catError = result.error.issues.find((i) => i.path[0] === 'category');
      expect(catError?.message).toBe('Category is required');
    }
  });
});
