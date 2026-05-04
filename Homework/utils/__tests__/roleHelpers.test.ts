import { UserRole } from '@/types/auth';
import { hasRole, isAdmin, isSuperAdmin } from '@/utils/roleHelpers';

describe('roleHelpers', () => {
  describe('hasRole', () => {
    it('returns true when role is in the allowed list', () => {
      expect(hasRole(UserRole.TEACHER, [UserRole.TEACHER, UserRole.SUPER_ADMIN])).toBe(true);
    });

    it('returns false when role is not in the allowed list', () => {
      expect(hasRole(UserRole.STUDENT, [UserRole.TEACHER, UserRole.SUPER_ADMIN])).toBe(false);
    });

    it('returns false for null role', () => {
      expect(hasRole(null, [UserRole.TEACHER])).toBe(false);
    });

    it('returns false for undefined role', () => {
      expect(hasRole(undefined, [UserRole.TEACHER])).toBe(false);
    });

    it('returns false for empty string role', () => {
      expect(hasRole('', [UserRole.TEACHER])).toBe(false);
    });

    it('returns false for empty allowed roles array', () => {
      expect(hasRole(UserRole.TEACHER, [])).toBe(false);
    });

    it('works with string role values matching enum', () => {
      expect(hasRole('TEACHER', [UserRole.TEACHER])).toBe(true);
    });
  });

  describe('isAdmin', () => {
    it('returns true for SUPER_ADMIN', () => {
      expect(isAdmin(UserRole.SUPER_ADMIN)).toBe(true);
    });

    it('returns true for SCHOOL_ADMIN', () => {
      expect(isAdmin(UserRole.SCHOOL_ADMIN)).toBe(true);
    });

    it('returns false for TEACHER', () => {
      expect(isAdmin(UserRole.TEACHER)).toBe(false);
    });

    it('returns false for STUDENT', () => {
      expect(isAdmin(UserRole.STUDENT)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isAdmin(null)).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('returns true for SUPER_ADMIN', () => {
      expect(isSuperAdmin(UserRole.SUPER_ADMIN)).toBe(true);
    });

    it('returns false for SCHOOL_ADMIN', () => {
      expect(isSuperAdmin(UserRole.SCHOOL_ADMIN)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isSuperAdmin(null)).toBe(false);
    });
  });
});
