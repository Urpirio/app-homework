// Feature: homework-app-integration, Property 36: Review visibility respects access controls
/**
 * Property 36: Review visibility respects access controls
 *
 * For any review with a given visibility setting (PUBLIC or CONFIDENTIAL)
 * and any viewer with a given role, the review should be visible to the
 * viewer if and only if:
 *   - the viewer has SCHOOL_ADMIN or SUPER_ADMIN role, OR
 *   - the viewer is the reviewed user AND visibility is PUBLIC.
 *
 * CONFIDENTIAL reviews should never be visible to the reviewed user
 * (unless they are admin).
 *
 * **Validates: Requirements 16.3, 16.7**
 */

import {
    canViewReview,
    type ReviewVisibility,
    type UserRole,
} from '@/utils/reviewVisibility';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const allRolesArb: fc.Arbitrary<UserRole> = fc.constantFrom(
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'TEACHER',
  'STUDENT',
  'SUPPORT',
);

const adminRolesArb: fc.Arbitrary<UserRole> = fc.constantFrom('SUPER_ADMIN', 'SCHOOL_ADMIN');

const nonAdminRolesArb: fc.Arbitrary<UserRole> = fc.constantFrom('TEACHER', 'STUDENT', 'SUPPORT');

const visibilityArb: fc.Arbitrary<ReviewVisibility> = fc.constantFrom('PUBLIC', 'CONFIDENTIAL');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 36: Review visibility respects access controls', () => {
  it('admins can always view any review regardless of visibility', () => {
    fc.assert(
      fc.property(
        adminRolesArb,
        fc.uuid(),
        fc.uuid(),
        visibilityArb,
        (viewerRole, viewerId, reviewedUserId, visibility) => {
          const result = canViewReview({
            viewerRole,
            viewerId,
            reviewedUserId,
            visibility,
          });
          expect(result).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('reviewed user can see their own PUBLIC review (non-admin)', () => {
    fc.assert(
      fc.property(
        nonAdminRolesArb,
        fc.uuid(),
        (viewerRole, userId) => {
          const result = canViewReview({
            viewerRole,
            viewerId: userId,
            reviewedUserId: userId,
            visibility: 'PUBLIC',
          });
          expect(result).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('CONFIDENTIAL reviews are never visible to non-admin reviewed user', () => {
    fc.assert(
      fc.property(
        nonAdminRolesArb,
        fc.uuid(),
        (viewerRole, userId) => {
          const result = canViewReview({
            viewerRole,
            viewerId: userId,
            reviewedUserId: userId,
            visibility: 'CONFIDENTIAL',
          });
          expect(result).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('non-admin users cannot see reviews of other users', () => {
    fc.assert(
      fc.property(
        nonAdminRolesArb,
        fc.uuid(),
        fc.uuid(),
        visibilityArb,
        (viewerRole, viewerId, reviewedUserId, visibility) => {
          // Ensure viewer is NOT the reviewed user
          fc.pre(viewerId !== reviewedUserId);

          const result = canViewReview({
            viewerRole,
            viewerId,
            reviewedUserId,
            visibility,
          });
          expect(result).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('visibility decision is deterministic for the same inputs', () => {
    fc.assert(
      fc.property(
        allRolesArb,
        fc.uuid(),
        fc.uuid(),
        visibilityArb,
        (viewerRole, viewerId, reviewedUserId, visibility) => {
          const params = { viewerRole, viewerId, reviewedUserId, visibility };
          const result1 = canViewReview(params);
          const result2 = canViewReview(params);
          expect(result1).toBe(result2);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('admin reviewed user can see their own CONFIDENTIAL review', () => {
    fc.assert(
      fc.property(
        adminRolesArb,
        fc.uuid(),
        (viewerRole, userId) => {
          const result = canViewReview({
            viewerRole,
            viewerId: userId,
            reviewedUserId: userId,
            visibility: 'CONFIDENTIAL',
          });
          expect(result).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
