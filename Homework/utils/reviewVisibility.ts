/**
 * Review Visibility Utilities
 *
 * Implements access control logic for user reviews.
 * Reviews can be PUBLIC or CONFIDENTIAL, and visibility depends
 * on the viewer's role and relationship to the reviewed user.
 *
 * Validates: Requirements 16.3, 16.7
 */

export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'SUPPORT';
export type ReviewVisibility = 'PUBLIC' | 'CONFIDENTIAL';

export interface CanViewReviewParams {
  viewerRole: UserRole;
  viewerId: string;
  reviewedUserId: string;
  visibility: ReviewVisibility;
}

/**
 * Determines whether a viewer can see a given review.
 *
 * Rules:
 * - SUPER_ADMIN and SCHOOL_ADMIN can always view any review.
 * - For PUBLIC reviews: the reviewed user can view their own review.
 * - For CONFIDENTIAL reviews: only admins (SUPER_ADMIN, SCHOOL_ADMIN) can view.
 *   The reviewed user themselves cannot see CONFIDENTIAL reviews (unless they are admin).
 */
export function canViewReview(params: CanViewReviewParams): boolean {
  const { viewerRole, viewerId, reviewedUserId, visibility } = params;

  // Admins can always view any review
  if (viewerRole === 'SUPER_ADMIN' || viewerRole === 'SCHOOL_ADMIN') {
    return true;
  }

  // For PUBLIC reviews, the reviewed user can see their own review
  if (visibility === 'PUBLIC' && viewerId === reviewedUserId) {
    return true;
  }

  // CONFIDENTIAL reviews are never visible to non-admin users
  // Non-admin, non-self viewers cannot see any review
  return false;
}
