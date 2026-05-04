# Implementation Plan: Homework App Integration

## Overview

This plan implements the complete integration between the React Native/Expo 54 frontend and NestJS 11 backend, organized into 6 workstreams. Each workstream builds incrementally, starting with backend endpoints (no frontend dependency), then shared infrastructure, then screen-by-screen frontend integration.

The expanded design includes authentication/authorization flows, file management, validation/error handling, performance/offline support, analytics/visualization, support system workflows, notification deep linking, and 40 correctness properties validated via fast-check property-based tests.

**Language:** TypeScript (both frontend and backend)

## Tasks

- [x] 1. Implement missing backend endpoints (Workstream 3)
  - [x] 1.1 Implement institution management endpoints (PUT, DELETE, admin assignment)
    - Add `PUT /institutions/{id}` in InstitutionsController with SUPER_ADMIN/SCHOOL_ADMIN guard
    - Add `DELETE /institutions/{id}` with soft-delete and cascading deactivation (SUPER_ADMIN only)
    - Add `POST /institutions/{id}/admins` to assign SCHOOL_ADMIN role (SUPER_ADMIN only)
    - Add `DELETE /institutions/{id}/admins/{adminId}` to remove SCHOOL_ADMIN role with minimum-admin validation
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 11.1, 11.7_

  - [x] 1.2 Implement subject management endpoints (PUT, DELETE)
    - Add `PUT /subjects/{id}` in SubjectsController with TEACHER/SCHOOL_ADMIN guard
    - Add `DELETE /subjects/{id}` with cascading handling of tasks, submissions, and units (SCHOOL_ADMIN only)
    - _Requirements: 17.5, 17.6, 13.1, 13.7_

  - [x] 1.3 Implement teacher-specific endpoints
    - Add `GET /teachers/{id}/students` returning DISTINCT student list with pagination and classroom filtering
    - Add `GET /teachers/{id}/subjects` returning assigned subjects with classroom context, student counts, and stats
    - _Requirements: 17.7, 17.8, 3.5, 3.6_

  - [x] 1.4 Implement user tickets endpoint (complete empty implementation)
    - Complete `GET /users/{id}/tickets` in UsersController/UsersService with pagination, status/category/priority filtering
    - _Requirements: 17.9, 15.10_

  - [x] 1.5 Implement review detail endpoint
    - Add `GET /reviews/{id}` in ReviewsController returning individual review with rating, comments, ticket info, reviewer data
    - _Requirements: 17.10, 15.13_

  - [x] 1.6 Implement unit tasks endpoint
    - Add `GET /units/{unitId}/tasks` returning paginated tasks within a unit, with status/deadline filtering
    - _Requirements: 17.11, 4.4_

  - [x] 1.7 Implement calendar tasks endpoint
    - Add `GET /tasks/calendar` accepting startDate/endDate params, filtering by user role (student=enrolled, teacher=assigned)
    - Return tasks mapped by date with project name and color
    - _Requirements: 17.12, 19.10_

  - [x] 1.8 Implement chat management endpoints
    - Add `DELETE /messages/{conversationId}/history` for soft-delete of chat history (user-scoped)
    - Add `GET /subjects/chats` returning subject-based group chat list with participant count and last message
    - _Requirements: 17.13, 17.14, 2.7_

  - [x] 1.9 Implement notification preferences endpoint
    - Add `PUT /user/notification-preferences` in UsersController with All authenticated guard
    - Accept NotificationPreferences DTO (assignments, grades, messages, system, deadlines, emailNotifications booleans)
    - Store preferences in user profile or dedicated preferences table
    - Add `GET /user/notification-preferences` to retrieve current settings
    - _Requirements: 5.5_ | _Design: Notification Deep Linking Design_

  - [x] 1.10 Write unit tests for new backend endpoints
    - Test institution CRUD with role guards (SUPER_ADMIN, SCHOOL_ADMIN)
    - Test subject PUT/DELETE with cascade behavior
    - Test teacher endpoints with DISTINCT student deduplication
    - Test calendar endpoint date range filtering and role-based scoping
    - Test chat history soft-delete user isolation
    - Test notification preferences round-trip
    - _Requirements: 17.1–17.14, 5.5_


- [x] 2. Checkpoint — Backend endpoints verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Frontend shared infrastructure (Workstream 5 — Cross-Cutting Concerns)
  - [x] 3.1 Set up React Query provider and Axios interceptor with token refresh
    - Install `@tanstack/react-query` and configure QueryClientProvider in app root
    - Configure default cache times (staleTime: 5min, cacheTime: 30min), retry: 3, retryDelay exponential backoff
    - Implement token refresh interceptor with `isRefreshing` flag and `failedQueue` array per design
    - On 401: attempt refresh via `POST /auth/refresh`; on success replay queued requests; on failure clear SecureStore and navigate to `/auth/login?sessionExpired=true`
    - _Requirements: 10.1, 7.1, 7.2, 4.9_ | _Design: Authentication & Authorization Design — Token Refresh Flow_

  - [x] 3.2 Implement SessionTimeoutProvider
    - Create `SessionTimeoutProvider` wrapping app root with 60-second interval check
    - Track last user interaction timestamp via touch events and navigation
    - At 25 minutes inactivity: show warning modal with "Continue" button that resets timer
    - At 30 minutes inactivity: trigger automatic logout (clear SecureStore, reset React Query cache, navigate to login)
    - Pause timer on `AppState` background; resume on foreground
    - _Requirements: 7.7_ | _Design: Authentication & Authorization Design — Session Timeout_

  - [x] 3.3 Implement role-based navigation guards (useRouteGuard hook)
    - Create `ROUTE_PERMISSIONS` map defining allowed roles per route path
    - Create `useRouteGuard()` hook that checks current user role against permissions on navigation
    - Unauthorized access redirects to user's default home screen with toast message
    - Dynamically hide tab bar tabs not permitted for current role
    - Conditional rendering of action buttons based on role (e.g., "Grade" only for TEACHER)
    - _Requirements: 7.3, 7.4, 7.6_ | _Design: Authentication & Authorization Design — Role-Based Navigation Guards_

  - [x] 3.4 Implement InstitutionContext for SUPER_ADMIN context switching
    - Create `InstitutionContext` React context storing currently selected `institutionId`
    - Add institution selector dropdown in admin dashboard header
    - On institution change: update context, invalidate all institution-scoped React Query caches, refetch dashboard data
    - SCHOOL_ADMIN users: fixed institutionId from profile, no selector shown
    - All admin API calls include `institutionId` from context as query parameter
    - _Requirements: 7.6_ | _Design: Authentication & Authorization Design — Institutional Context Switching_

  - [x] 3.5 Create shared TypeScript interfaces
    - Create `types/submission.ts`, `types/message.ts`, `types/library.ts`, `types/ticket.ts`, `types/review.ts`, `types/schedule.ts`, `types/institution.ts`, `types/classroom.ts`, `types/notification.ts`
    - Match interfaces to backend Prisma models and API response contracts from design document
    - Add `NotificationPreferences` interface for the new preferences endpoint
    - _Requirements: 4.8, 9.1_

  - [x] 3.6 Create React Query hook modules (service layer)
    - Create `hooks/api/useAuth.ts` — login, profile, token refresh
    - Create `hooks/api/useTasks.ts` — task CRUD, calendar queries with `useInfiniteQuery` for lists
    - Create `hooks/api/useSubmissions.ts` — submit, grade, fetch by task
    - Create `hooks/api/useProjects.ts` — project/subject listing
    - Create `hooks/api/useMessages.ts` — chat history with `useInfiniteQuery` (50 per page, reverse chronological)
    - Create `hooks/api/useNotifications.ts` — notification CRUD, real-time push, preferences
    - Create `hooks/api/useLibrary.ts` — books, categories, loans with `useInfiniteQuery`
    - Create `hooks/api/useSchedules.ts` — schedule CRUD
    - Create `hooks/api/useInstitutions.ts` — institution management
    - Create `hooks/api/useClassrooms.ts` — classroom management
    - Create `hooks/api/useUsers.ts` — user management, teacher endpoints with `useInfiniteQuery`
    - Create `hooks/api/useTickets.ts` — support ticket CRUD
    - Create `hooks/api/useReviews.ts` — review CRUD, stats
    - Create `hooks/api/useUploads.ts` — file upload with progress
    - All list hooks use `useInfiniteQuery` with `getNextPageParam` per pagination design
    - _Requirements: 10.1, 10.2, 10.4, 4.9_ | _Design: Performance & Offline Design — Pagination Strategy_

  - [x] 3.7 Implement Socket.io client manager
    - Create `utils/socket.ts` with SocketManager: connect/disconnect, JWT auth from SecureStore
    - Implement event handlers: onNewMessage, onNewNotification, sendMessage, joinProject, emitTyping
    - Integrate with React Query cache invalidation on real-time events
    - _Requirements: 2.1, 5.2, 10.3_

  - [x] 3.8 Implement useFileUpload hook with progress tracking
    - Create `hooks/api/useUploads.ts` with `useFileUpload()` hook per design
    - Track progress via `onUploadProgress` callback, expose `progress` (0-100) and `status` (idle/uploading/success/error)
    - Client-side file validation: max 50MB, allowed MIME types (jpg, png, gif, pdf, doc, docx, xls, xlsx, ppt, pptx, mp4, mov)
    - Create `UploadProgressBar` component with percentage text and estimated time remaining
    - _Requirements: 8.1, 8.2, 8.5, 1.3_ | _Design: File Management Design — File Upload with Progress Tracking_

  - [x] 3.9 Implement file preview components by MIME type
    - Create `ImagePreview` — thumbnail in list, tap opens full-screen `expo-image` viewer with zoom/pan
    - Create `VideoPreview` — play icon overlay, tap opens `expo-av` video player
    - Create `PDFPreview` — PDF icon with filename, tap opens via `expo-web-browser` or system viewer
    - Create `FileIcon` — generic file icon with extension label, tap triggers download
    - Implement download flow: `expo-file-system.downloadAsync` → `expo-sharing.shareAsync`
    - _Requirements: 8.3, 8.4, 2.5_ | _Design: File Management Design — File Preview and Download_

  - [x] 3.10 Implement Zod validation schemas
    - Create `validation/schemas.ts` with `taskSchema`, `institutionSchema`, `ticketSchema` per design
    - Create lightweight `useForm()` hook accepting Zod schema for field-level (on blur) and form-level (on submit) validation
    - Display field-specific error messages below each field with red highlight styling
    - _Requirements: 9.1, 9.2, 9.6_ | _Design: Validation & Error Handling Design — Validation Strategy_

  - [x] 3.11 Implement categorizeError() and withRetry() utilities
    - Create `utils/errorHandler.ts` with `categorizeError(error: AxiosError): CategorizedError` per design
    - Categories: network, timeout, auth, permission, server, validation, unknown
    - Each category maps to: userMessage, retryable flag, action (retry/login/back/contact_support/fix_input)
    - Create `utils/retry.ts` with `withRetry<T>(fn, options)` using exponential backoff (baseDelay * 2^attempt + jitter, capped at maxDelay)
    - _Requirements: 9.3, 9.4_ | _Design: Validation & Error Handling Design — Error Categorization, Retry Mechanism_

  - [x] 3.12 Implement form state preservation and draft auto-save
    - Use `usePreventRemove` from Expo Router to warn on dirty form navigation
    - Implement draft auto-save to `AsyncStorage` with key `draft:{formType}:{entityId}` for long forms (ticket creation, task creation)
    - Restore draft on screen mount if exists
    - Form state preserved on API submission failure (no data loss on validation failure)
    - _Requirements: 9.7_ | _Design: Validation & Error Handling Design — Form State Preservation_

  - [x] 3.13 Implement offline queue with background sync
    - Create offline queue storing `QueuedAction` objects in `AsyncStorage` under key `offline_queue`
    - Use `NetInfo` listener to detect connectivity changes
    - On reconnection: process queue FIFO, remove successful actions, retry failed with backoff
    - Register `expo-background-fetch` periodic task (15min interval) for: processing offline queue, prefetching notification count, syncing read status
    - On app resume (`AppState` → 'active'): immediately run sync cycle
    - Show pending action count badge and offline indicator banner
    - _Requirements: 10.3, 10.7_ | _Design: Performance & Offline Design — Offline Queue, Background Sync_

  - [x] 3.14 Implement image optimization before upload
    - Use `expo-image-manipulator` to resize before upload: avatars max 200x200px JPEG 0.7, chat attachments max 1200px longest side JPEG 0.8, task resources original size
    - Use `expo-image` for display with progressive loading (blur placeholder → full), memory-based LRU cache (100MB), disk caching for avatars/logos
    - _Requirements: 10.6_ | _Design: Performance & Offline Design — Image Optimization_

  - [x] 3.15 Create shared UI components for loading, error, and empty states
    - Create skeleton screen components for lists (tasks, books, users)
    - Create `ErrorState` component with categorized messages (from `categorizeError`), icon matching category, and action button (Retry/Login/Back/Contact Support)
    - Create empty state component with contextual illustrations
    - Implement 5-layer error handling: Axios interceptor (global) → React Query error boundaries → Screen-level error states → Form validation errors → Global ErrorBoundary
    - _Requirements: 4.7, 9.3, 9.4, 10.5_ | _Design: Error Handling Strategy (5 layers)_

  - [x] 3.16 Implement notification deep linking and badge management
    - Create `utils/notificationRouter.ts` with `getDeepLinkRoute(payload: NotificationPayload): string` per design
    - Route TASK → `/tasks/{entityId}`, SUBMISSION_GRADED → `/tasks/{metadata.taskId}`, PROJECT → `/projects/{entityId}`, ALERT+ticket → `/support/ticket/{entityId}`, etc.
    - Create `hooks/useNotificationBadge.ts` with polling fallback (60s) + WebSocket real-time increment
    - Wire badge count to tab bar via `tabBarBadge` option; decrement on read, reset on mark-all-read
    - Handle background notification taps via `expo-notifications` → `getDeepLinkRoute()` on app resume
    - _Requirements: 5.2, 5.6, 5.7_ | _Design: Notification Deep Linking Design_

  - [x] 3.17 Write property tests for shared infrastructure (Properties 1, 5, 10, 13, 15, 16, 24, 25)
    - **Property 1: File validation accepts/rejects correctly by type and size** — `__tests__/properties/fileValidation.property.test.ts`
    - **Validates: Requirements 1.3, 8.2, 8.5**
    - **Property 5: Multimedia preview component selection by MIME type** — `__tests__/properties/mimeTypePreview.property.test.ts`
    - **Validates: Requirements 2.5, 8.3**
    - **Property 10: API error categorization is exhaustive and deterministic** — `__tests__/properties/errorCategorization.property.test.ts`
    - **Validates: Requirements 9.3**
    - **Property 13: Notification deep link routing resolves to valid screen paths** — `__tests__/properties/deepLinkRouting.property.test.ts`
    - **Validates: Requirements 5.6**
    - **Property 15: Role-based access control is consistent** — `__tests__/properties/roleAccessControl.property.test.ts`
    - **Validates: Requirements 6.3, 7.3, 7.4**
    - **Property 16: Role-specific navigation routing** — `__tests__/properties/roleNavigation.property.test.ts`
    - **Validates: Requirements 6.8**
    - **Property 24: Client-side validation agrees with Zod schema** — `__tests__/properties/zodValidation.property.test.ts`
    - **Validates: Requirements 9.1, 9.2, 9.6**
    - **Property 25: Retry delay follows exponential backoff** — `__tests__/properties/retryBackoff.property.test.ts`
    - **Validates: Requirements 9.4**

  - [x] 3.18 Write property tests for auth and offline (Properties 19, 20, 21, 26, 27, 28, 29)
    - **Property 19: Token refresh on 401 replays queued requests** — `__tests__/properties/tokenRefresh.property.test.ts`
    - **Validates: Requirements 7.2, 7.5**
    - **Property 20: Session timeout triggers after inactivity threshold** — `__tests__/properties/sessionTimeout.property.test.ts`
    - **Validates: Requirements 7.7**
    - **Property 21: Institutional context switch invalidates scoped data** — `__tests__/properties/institutionContextSwitch.property.test.ts`
    - **Validates: Requirements 7.6**
    - **Property 26: Form state preserved after submission error** — `__tests__/properties/formStatePreservation.property.test.ts`
    - **Validates: Requirements 9.7**
    - **Property 27: Pagination returns at most pageSize items** — `__tests__/properties/pagination.property.test.ts`
    - **Validates: Requirements 10.2**
    - **Property 28: Offline queue processes actions in FIFO order on reconnection** — `__tests__/properties/offlineQueue.property.test.ts`
    - **Validates: Requirements 10.3, 10.7**
    - **Property 29: Image optimization reduces file size** — `__tests__/properties/imageOptimization.property.test.ts`
    - **Validates: Requirements 10.6**

  - [x] 3.19 Write unit tests for React Query hooks, socket manager, and auth flows
    - Test hook query/mutation configurations and infinite query pagination
    - Test socket connection lifecycle and event handling
    - Test file upload progress tracking and error states
    - Test SessionTimeoutProvider timer logic
    - Test useRouteGuard with various role/route combinations
    - _Requirements: 10.1, 2.1, 8.1, 7.2, 7.7_


- [x] 4. Checkpoint — Shared infrastructure verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Mock data elimination — Projects and Units screens (Workstream 1)
  - [x] 5.1 Remove MOCK_SUBJECTS from `projects/index.tsx`
    - Replace `MOCK_SUBJECTS` fallback with `useProjects` React Query hook
    - Add proper empty-state UI when no projects exist
    - Add error-state UI with retry when API fails (no mock fallback, Property 11)
    - _Requirements: 4.1, 4.7_

  - [x] 5.2 Remove MOCK_UNITS and mock ID prefix logic from `projects/[id]/index.tsx`
    - Remove 'm' prefix branching logic for mock IDs
    - Fetch unit data from `GET /subjects/{id}` and `GET /subjects/{id}/tasks` via hooks
    - Add loading skeleton and error states
    - _Requirements: 4.2, 4.7_

  - [x] 5.3 Remove MOCK_STUDENTS from `projects/[id]/students.tsx`
    - Replace mock data with `GET /teachers/{id}/students` endpoint (implemented in task 1.3)
    - Remove mock ID prefix logic
    - Add pagination support via `useInfiniteQuery` and empty state
    - _Requirements: 4.3, 3.6_

  - [x] 5.4 Remove MOCK_UNIT_TASKS from `projects/[id]/unit/[unitId].tsx`
    - Replace mock data with `GET /units/{unitId}/tasks` endpoint (implemented in task 1.6)
    - Use React Query hook for all unit IDs (no mock key matching)
    - Add loading and error states
    - _Requirements: 4.4, 4.7_

  - [x] 5.5 Remove mock tasks and setTimeout simulation from `tasks/[id].tsx`
    - Remove hardcoded 't1'/'t2' mock tasks and `setTimeout()` submission
    - Fetch task data from `GET /tasks/{id}` via React Query hook
    - Wire submission to `POST /submissions` with file upload via `useFileUpload` hook (task 3.8)
    - Add upload progress indicator (UploadProgressBar) and submission confirmation UI
    - Support file versioning via `PATCH /submissions/{id}` for resubmissions before deadline
    - _Requirements: 4.5, 1.1, 1.2, 1.3, 1.4, 8.7_ | _Design: File Management Design — File Versioning_

  - [x] 5.6 Remove MOCK_GRADES from `grades.tsx`
    - Replace hardcoded grades with real API data (aggregate from submissions or dedicated endpoint)
    - Make period selector functional with date-range filtering
    - Add loading skeleton and empty state for no grades
    - _Requirements: 4.6, 4.7_

  - [x] 5.7 Write property tests for mock elimination (Properties 2, 3, 11, 22, 23)
    - **Property 2: Submission creates a retrievable record (round-trip)** — `__tests__/properties/submissionRoundTrip.property.test.ts`
    - **Validates: Requirements 1.2, 1.4**
    - **Property 3: Grading round-trip — grade published by teacher is visible to student** — `__tests__/properties/gradingRoundTrip.property.test.ts`
    - **Validates: Requirements 1.6, 3.8**
    - **Property 11: Error state shown instead of mock data on API failure** — `__tests__/properties/noMockFallback.property.test.ts`
    - **Validates: Requirements 4.7**
    - **Property 22: File organization follows context-based path convention** — `__tests__/properties/filePathConvention.property.test.ts`
    - **Validates: Requirements 8.6**
    - **Property 23: Submission versioning preserves history** — `__tests__/properties/submissionVersioning.property.test.ts`
    - **Validates: Requirements 8.7**

  - [x] 5.8 Write integration tests for mock-eliminated screens
    - Test projects list renders from API data and shows empty/error states
    - Test task submission flow end-to-end (file upload + submission creation)
    - Test grades screen with period filtering
    - _Requirements: 4.1–4.9_

- [x] 6. Checkpoint — Mock data elimination verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Real-time communication integration (Workstream 2)
  - [x] 7.1 Integrate chat screen with Socket.io and message history
    - Wire `chat/[id].tsx` to Socket.io client manager (task 3.7)
    - Fetch message history from `GET /messages/{id}` or `GET /messages/project/{id}` based on `type` query param
    - Use `useInfiniteQuery` for message history (50 per page, reverse chronological)
    - Implement real-time message sending via socket emit + `POST /messages/{id}?type=user|project`
    - Display dynamic headers: "En línea" for user chats, "Chat de Aula" for project chats (Property 6)
    - Add KeyboardAvoidingView to prevent keyboard obstruction
    - _Requirements: 2.1, 2.2, 2.3, 2.8, 2.9_

  - [x] 7.2 Implement multimedia messaging
    - Add file/image picker in chat input
    - Upload media via `useFileUpload` hook (task 3.8) then send message with attachment reference
    - Display multimedia previews using file preview components (task 3.9): ImagePreview, VideoPreview, PDFPreview, FileIcon
    - Implement full-screen image viewer on tap
    - _Requirements: 2.4, 2.5_

  - [x] 7.3 Implement chat actions and management
    - Add long-press copy text action on messages
    - Implement chat history clearing via `DELETE /messages/{id}/history` (task 1.8)
    - Add typing indicators via socket emitTyping
    - _Requirements: 2.6, 2.7_

  - [x] 7.4 Integrate real-time notifications via WebSocket
    - Listen for `newNotification` events on socket connection
    - Update notification badge counts on tab bar in real-time via `useNotificationBadge` hook (task 3.16)
    - Invalidate React Query notification cache on new events
    - Implement deep linking from notification tap to relevant screen via `getDeepLinkRoute()` (task 3.16)
    - _Requirements: 5.2, 5.6, 5.7_

  - [x] 7.5 Implement notification preferences screen
    - Create settings screen with toggle switches for each preference category (assignments, grades, messages, system, deadlines, emailNotifications)
    - Wire to `PUT /user/notification-preferences` (task 1.9) and `GET /user/notification-preferences`
    - Cache preferences locally for immediate UI reflection
    - _Requirements: 5.5_ | _Design: Notification Deep Linking Design — Notification Preferences_

  - [x] 7.6 Write property tests for real-time communication (Properties 4, 6, 12, 14)
    - **Property 4: Chat message round-trip** — `__tests__/properties/chatMessageRoundTrip.property.test.ts`
    - **Validates: Requirements 2.3, 2.4**
    - **Property 6: Chat context header matches chat type** — `__tests__/properties/chatContextHeader.property.test.ts`
    - **Validates: Requirements 2.8**
    - **Property 12: Notification badge count increments on new notification** — `__tests__/properties/notificationBadge.property.test.ts`
    - **Validates: Requirements 5.2**
    - **Property 14: Notification preferences round-trip** — `__tests__/properties/notificationPrefs.property.test.ts`
    - **Validates: Requirements 5.5**

  - [x] 7.7 Write unit tests for real-time communication
    - Test socket connection/disconnection lifecycle
    - Test message send/receive flow with cache invalidation
    - Test notification badge update on WebSocket event
    - _Requirements: 2.1–2.9, 5.2_

- [x] 8. Checkpoint — Real-time communication verified
  - Ensure all tests pass, ask the user if questions arise.


- [x] 9. Library and Calendar screen integration (Workstream 4 — Part 1)
  - [x] 9.1 Integrate library screen (`library.tsx`)
    - Wire to `GET /library/books` with search and category filtering via `useInfiniteQuery` (20 per page)
    - Integrate `GET /library/categories` for category browsing with book counts
    - Add debounced search input with real-time filtering
    - Implement pull-to-refresh and skeleton loading states
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.10_

  - [x] 9.2 Integrate book detail screen (`book/[id].tsx`)
    - Wire to `GET /library/books/{id}` for comprehensive book info
    - Implement loan request via `POST /library/books/{id}/loan` with confirmation
    - Implement book return via `POST /library/books/{id}/return` with status update
    - Display active loans, loan history, and overdue indicators
    - Handle unavailability with expected return date message
    - _Requirements: 18.5, 18.6, 18.7, 18.8, 18.9_

  - [x] 9.3 Integrate calendar screen (`calendar.tsx`)
    - Wire to `GET /schedules` for academic timetable entries
    - Wire to `GET /tasks/calendar` (task 1.7) for task deadlines by date range
    - Merge schedule entries and task deadlines client-side into unified `CalendarEvent[]` array (Property 9)
    - Render unified calendar with color-coded events (schedules vs deadlines vs events)
    - Implement monthly/weekly views with swipe navigation and "today" button
    - Add day detail view on date tap showing all events with times
    - Navigate to `/tasks/{id}` on task deadline tap
    - Show deadline proximity indicators for tasks within 48 hours (Property 33)
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.9_

  - [x] 9.4 Implement calendar schedule management (teacher role)
    - Add schedule creation via `POST /schedules` with day, time, subject, classroom
    - Add schedule deletion via `DELETE /schedules/{id}` with undo capability
    - Implement schedule conflict detection: client-side check for overlapping time slots on same day/classroom (Property 32)
    - Display badge counts on calendar tab for upcoming deadlines
    - _Requirements: 19.7, 19.8, 12.8_

  - [x] 9.5 Write property tests for library and calendar (Properties 9, 30, 31, 32, 33)
    - **Property 9: Calendar event merge preserves all sources** — `__tests__/properties/calendarMerge.property.test.ts`
    - **Validates: Requirements 3.13, 19.2**
    - **Property 30: Book loan/return round-trip restores availability** — `__tests__/properties/bookLoanRoundTrip.property.test.ts`
    - **Validates: Requirements 18.6, 18.7**
    - **Property 31: Schedule CRUD round-trip** — `__tests__/properties/scheduleCrud.property.test.ts`
    - **Validates: Requirements 19.7, 19.8**
    - **Property 32: Schedule conflict detection identifies overlapping time slots** — `__tests__/properties/scheduleConflict.property.test.ts`
    - **Validates: Requirements 12.8**
    - **Property 33: Deadline proximity indicator shown for tasks within 48 hours** — `__tests__/properties/deadlineProximity.property.test.ts`
    - **Validates: Requirements 19.9**

  - [x] 9.6 Write unit tests for library and calendar integration
    - Test book search with debounced API calls
    - Test loan/return flow with availability status updates
    - Test calendar date range queries and event rendering
    - _Requirements: 18.1–18.10, 19.1–19.10_

- [x] 10. Checkpoint — Library and Calendar verified
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Admin and institution management screens (Workstream 4 — Part 2)
  - [x] 11.1 Integrate admin dashboard (`admin/dashboard`)
    - Implement `AdminDashboard` component structure per design: DashboardHeader, StatsGrid (2x3), QuickNavTiles, ActivityFeed, AlertsBanner, AnalyticsPreview
    - Display institution-wide statistics: user counts by role, active projects, task completion rates
    - Show role-appropriate data (SUPER_ADMIN=global with institution selector from InstitutionContext, SCHOOL_ADMIN=institution-specific)
    - Add quick access navigation tiles with badge indicators for pending actions
    - Display recent activity feed with timestamps and user attribution, sorted by timestamp descending (Property 40)
    - _Requirements: 14.1, 14.2, 14.3, 14.5_ | _Design: Frontend Screen Designs — Admin Dashboard_

  - [x] 11.2 Implement admin analytics panel with charts
    - Install `react-native-chart-kit` for Expo-compatible charting
    - Create `AnalyticsPanel` with `DateRangeSelector` (presets: 7d, 30d, 90d, custom)
    - Implement `EnrollmentTrendChart` (line — new users per month)
    - Implement `GradeDistributionChart` (bar — grade ranges across institution)
    - Implement `TaskCompletionChart` (pie — TODO/IN_PROGRESS/DONE percentages)
    - Add KPI cards: AvgResponseTime, SubmissionRate, EngagementScore
    - _Requirements: 14.6, 14.7_ | _Design: Analytics & Visualization Design — Dashboard Layouts_

  - [x] 11.3 Implement data export functionality
    - Install `papaparse` for CSV export, `xlsx` (SheetJS) for Excel export
    - Implement CSV export: serialize data from React Query cache via `papaparse` stringify
    - Implement Excel export: formatted reports with multiple sheets via `xlsx`
    - Implement PDF export: render HTML template with chart images (via `react-native-view-shot`), generate PDF via `expo-print`
    - Use `expo-sharing.shareAsync(filePath)` for all export formats
    - Add export format dropdown on report/analytics screens
    - _Requirements: 14.9_ | _Design: Analytics & Visualization Design — Data Export Design_

  - [x] 11.4 Implement customizable dashboard widgets
    - Install `react-native-draggable-flatlist` for widget reordering
    - Store widget layout in `AsyncStorage` under key `dashboard_layout:{userId}`
    - Available widgets: StatsGrid, EnrollmentChart, GradeDistribution, ActivityFeed, TicketQueue, TaskCompletion, RecentSubmissions
    - Default layout per role; user customizations override defaults
    - "Reset to Default" button restores role-based default layout
    - _Requirements: 14.10_ | _Design: Analytics & Visualization Design — Customizable Widgets_

  - [x] 11.5 Integrate institution management screens
    - Wire institution list to `GET /institutions` with search → `InstitutionCard` grid (logo, name, address, counts)
    - Wire institution creation modal to `POST /institutions` with logo upload via `useFileUpload` hook
    - Wire institution detail to `GET /institutions/{id}` + `GET /institutions/{id}/stats` with tabs (Overview, Classrooms, Users, Settings)
    - Wire institution edit to `PUT /institutions/{id}` (task 1.1)
    - Wire institution settings to admin assignment: list current SCHOOL_ADMINs, "Add Admin" user search modal → `POST /institutions/{id}/admins`, remove → `DELETE /institutions/{id}/admins/{adminId}` with confirmation
    - Implement institutional metrics visualization: enrollment trend line, activity heatmap, performance comparison bar chart
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.7, 11.8_ | _Design: Frontend Screen Designs — Institution Management_

  - [x] 11.6 Integrate classroom management screens
    - Wire classroom list to `GET /classrooms/institution/{instId}` → classroom cards (name, description, student/subject counts)
    - Wire classroom creation to `POST /classrooms` with teacher assignment (searchable dropdown from `GET /users?institutionId={id}&role=TEACHER`)
    - Wire classroom detail to `GET /classrooms/{id}` + `GET /classrooms/{id}/subjects` with tabs (Subjects, Students, Schedule)
    - Implement subject addition within classroom via `POST /subjects/classroom/{classId}` with form (name, teacher, description, grading criteria)
    - Implement schedule tab: weekly grid with day × time slot, "Add Schedule" modal with conflict detection (Property 32)
    - _Requirements: 12.1, 12.2, 12.4, 12.6, 12.8_ | _Design: Frontend Screen Designs — Classroom Management_

  - [x] 11.7 Integrate subject management screens
    - Wire subject detail to `GET /subjects/{id}` + `GET /subjects/{id}/stats` + `GET /subjects/{id}/tasks`
    - Display header (subject name, teacher, classroom), stats row (avgGrade, totalTasks, submittedTasks, studentCount)
    - Show recent submissions list with status badges, task listing with filters (by unit, status, type)
    - Wire subject edit to `PUT /subjects/{id}` (task 1.2) with pre-populated form, cache invalidation on success
    - Wire subject deletion to `DELETE /subjects/{id}` (task 1.2) with confirmation dialog
    - Implement unit system integration: unit cards with name/task count/completion %, navigation to `/projects/{subjectId}/unit/{unitId}`
    - _Requirements: 13.1, 13.3, 13.4, 13.6, 13.7_ | _Design: Frontend Screen Designs — Subject Management_

  - [x] 11.8 Integrate user management screens
    - Wire user list to `GET /users` with `useInfiniteQuery` (20 per page) and filter bar: role dropdown, institution dropdown (SUPER_ADMIN only), search text
    - Implement user creation via `POST /auth/register` and `POST /auth/institutional-user`
    - Wire user detail screens with role-specific routing per `navigateToUserDetail()` function (Property 16)
    - Implement bulk enrollment via `/admin/institution/{id}/enroll-student`
    - Implement CSV import flow: `expo-document-picker` → `papaparse` client-side parsing → validation preview table → sequential `POST /auth/register` (batched, 10 concurrent) → progress bar → summary
    - _Requirements: 6.1, 6.2, 6.6, 6.7, 6.8_ | _Design: Frontend Screen Designs — User Management_

  - [~] 11.9 Write property tests for admin screens (Properties 17, 18, 38, 39, 40)
    - **Property 17: CSV import parsing extracts valid user records** — `__tests__/properties/csvParsing.property.test.ts`
    - **Validates: Requirements 6.6, 12.3**
    - **Property 18: List filtering returns only matching items** — `__tests__/properties/listFiltering.property.test.ts`
    - **Validates: Requirements 6.2, 15.4, 18.2, 18.4**
    - **Property 38: Data export round-trip preserves content** — `__tests__/properties/dataExportRoundTrip.property.test.ts`
    - **Validates: Requirements 14.9**
    - **Property 39: Dashboard widget layout round-trip** — `__tests__/properties/widgetLayout.property.test.ts`
    - **Validates: Requirements 14.10**
    - **Property 40: Activity feed is sorted by timestamp descending** — `__tests__/properties/activityFeedOrder.property.test.ts`
    - **Validates: Requirements 14.5**

  - [~] 11.10 Write unit tests for admin management screens
    - Test institution CRUD flow with role guards
    - Test classroom creation with student enrollment
    - Test user filtering and role-based routing
    - Test chart rendering with mock data
    - Test CSV import parsing and validation
    - _Requirements: 11.1–11.8, 12.1–12.8, 13.1–13.8, 6.1–6.10_


- [ ] 12. Teacher dashboard and analytics (Workstream 4 — Part 3)
  - [~] 12.1 Implement teacher dashboard screen
    - Create `/teacher/dashboard` with component structure per design: DashboardHeader, StatsRow (4 tiles), QuickActions (4 tiles), SubjectsList (horizontal scroll), PendingSubmissions (max 5), UpcomingDeadlines (max 5)
    - Wire StatsRow to: Total Students (from `/teachers/{id}/students` total), Active Subjects (from `/teachers/{id}/subjects` total), Pending Grading (aggregated pending count), Avg Performance (weighted avgGrade)
    - Wire SubjectsList to `GET /teachers/{id}/subjects` → SubjectCard (name, classroom, studentCount, taskCount, avgGrade)
    - Wire PendingSubmissions to iterated `GET /submissions/task/{taskId}` per subject
    - Wire UpcomingDeadlines to `GET /tasks/calendar` for teacher's subjects
    - _Requirements: 3.2, 3.3, 3.4_ | _Design: Frontend Screen Designs — Teacher Dashboard_

  - [~] 12.2 Implement teacher analytics with charts
    - Create `PerformanceAnalytics` component accessible from dashboard "View Analytics" action tile
    - Create `TeacherAnalyticsPanel` with `SubjectSelector` dropdown (filter by subject or "All")
    - Implement `GradeDistributionChart` (bar — histogram of grade ranges 0-20, 21-40, …, 81-100)
    - Implement `ProgressTrendChart` (line — weekly submission count + avg grade trend)
    - Implement `SubjectComparisonChart` (horizontal bar — avgGrade per subject)
    - Add `StudentPerformanceTable` (sortable — name, avgGrade, submissionRate, trend arrow)
    - _Requirements: 3.12, 3.13_ | _Design: Analytics & Visualization Design — Teacher Analytics Panel_

  - [~] 12.3 Implement GradingStatsCard component
    - Create `GradingStatsCard` displaying: averageGrade, completionRate, pendingCount, totalSubmissions
    - Compute stats client-side from `GET /submissions/task/{taskId}` aggregated across tasks in a subject
    - Display as 4-cell grid with circular progress indicators for rates and numeric values for counts
    - Show on both teacher dashboard and individual subject detail screens
    - _Requirements: 3.8, 3.10_ | _Design: Frontend Screen Designs — Grading Statistics Display_

  - [~] 12.4 Integrate teacher subject and student listing
    - Wire teacher subjects screen to `GET /teachers/{id}/subjects` with classroom context and stats
    - Wire teacher students screen to `GET /teachers/{id}/students` with filtering by classroom/subject
    - Display individual student cards with recent submissions, grades, and communication links
    - Ensure no duplicate student IDs across subjects (Property 7)
    - _Requirements: 3.5, 3.6, 3.7_

  - [~] 12.5 Write property tests for teacher dashboard (Properties 7, 8, 9)
    - **Property 7: Teacher student roster contains no duplicates** — `__tests__/properties/teacherStudentDistinct.property.test.ts`
    - **Validates: Requirements 3.6**
    - **Property 8: Grading statistics are mathematically correct** — `__tests__/properties/gradingStats.property.test.ts`
    - **Validates: Requirements 3.10, 14.1, 14.7, 15.11**
    - **Property 9: Calendar event merge preserves all sources** (shared with task 9.5, verify teacher calendar integration)
    - **Validates: Requirements 3.13, 19.2**

  - [~] 12.6 Write unit tests for teacher dashboard
    - Test dashboard data aggregation from multiple endpoints
    - Test student deduplication across subjects
    - Test grading statistics calculations
    - Test chart rendering with sample data
    - _Requirements: 3.1–3.14_

- [ ] 13. Support system integration (Workstream 4 — Part 4)
  - [~] 13.1 Integrate support ticket creation with Zod validation
    - Create `/support/create-ticket` screen with component structure per design: CategoryPicker, PriorityPicker, TitleInput, DescriptionInput, AttachmentSection, SubmitButton
    - Validate form via `ticketSchema` (Zod) before submission
    - Upload attachments via `useFileUpload` hook first, then create ticket with `fileUrl` references via `POST /tickets`
    - Display confirmation with tracking number and expected response time based on priority
    - Implement draft auto-save for ticket description (task 3.12)
    - _Requirements: 15.1, 15.2, 15.3_ | _Design: Support System Design — Ticket Creation Form_

  - [~] 13.2 Integrate support ticket list and detail
    - Wire ticket list to `GET /tickets` with search/filter by status, category, priority via `useInfiniteQuery`
    - Wire ticket detail to `GET /tickets/{id}` with full history and status timeline
    - Display user's ticket history with status indicators and tracking numbers
    - _Requirements: 15.4, 15.5_

  - [~] 13.3 Implement support staff dashboard
    - Create `/support/dashboard` with component structure per design: DashboardHeader, KPIRow (4 tiles), TicketQueue, EscalatedTickets, PerformanceChart
    - Wire KPIRow to: Resolved Today, Avg Response Time, Queue Length, Satisfaction Rating (from reviews avg)
    - Wire TicketQueue to `GET /users/{id}/tickets` (task 1.4) sorted by priority then date
    - Wire EscalatedTickets to filtered list (high/critical priority with escalation indicator)
    - Implement PerformanceChart (bar chart: tickets resolved per day, last 7 days) via `react-native-chart-kit`
    - _Requirements: 15.9, 15.10, 15.11_ | _Design: Frontend Screen Designs — Support Dashboard_

  - [~] 13.4 Implement ticket escalation workflow
    - Implement ticket status transitions: Open → In Progress → Resolved → Closed
    - Implement manual escalation button with escalation note
    - Implement auto-escalation rules: High priority not claimed within 2h, Critical within 1h, any unresolved after 48h
    - Escalation triggers notification to SCHOOL_ADMIN and all SUPPORT staff
    - _Requirements: 15.5, 15.6, 15.7_ | _Design: Support System Design — Ticket Escalation Workflow_

  - [~] 13.5 Implement review integration with ticket closure
    - On ticket status → CLOSED: trigger notification to ticket creator with deep link to `/support/review/{ticketId}`
    - Create review form: 1-5 star rating, comment field, category-specific feedback toggles (Responsiveness, Technical Competence, Communication)
    - Submit via `POST /reviews` with `ticketId` and `userId`
    - Implement 7-day reminder notification if no review; 14-day expiry for review prompt
    - Wire review display to `GET /reviews/{id}` (task 1.5) and `GET /users/{id}/reviews`
    - Display review analytics: average ratings, distribution charts, chronological history
    - _Requirements: 15.12, 15.13, 15.14, 15.15_ | _Design: Support System Design — Review Integration with Ticket Closure_

  - [~] 13.6 Integrate general user review system
    - Create `/admin/user/{userId}/create-review` with multi-dimensional rating form per design: RatingDimensions (Academic, Behavior, Participation, Technical Skills), OverallRating (computed avg), WrittenFeedback, ImprovementRecommendations, GoalSetting
    - Implement review templates loaded by target user role: student template vs teacher template (Property 37)
    - Create template selector dropdown that pre-fills dimension labels from `constants/reviewTemplates.ts`
    - Wire review history display via `/admin/user/{userId}/reviews` with role-based visibility (Property 36)
    - Implement review confidentiality: PUBLIC (visible to reviewed user) vs CONFIDENTIAL (admin-only)
    - _Requirements: 16.1, 16.2, 16.3, 16.6, 16.7_ | _Design: Support System Design — Review Form Design_

  - [ ]* 13.7 Write property tests for support system (Properties 34, 35, 36, 37)
    - **Property 34: Ticket tracking numbers are unique** — `__tests__/properties/ticketTrackingUnique.property.test.ts`
    - **Validates: Requirements 15.2**
    - **Property 35: Ticket escalation triggers on time threshold** — `__tests__/properties/ticketEscalation.property.test.ts`
    - **Validates: Requirements 15.6**
    - **Property 36: Review visibility respects access controls** — `__tests__/properties/reviewVisibility.property.test.ts`
    - **Validates: Requirements 16.3, 16.7**
    - **Property 37: Review template matches target user role** — `__tests__/properties/reviewTemplate.property.test.ts`
    - **Validates: Requirements 16.2, 16.6**

  - [ ]* 13.8 Write unit tests for support and review system
    - Test ticket creation and status transition flow
    - Test review submission with rating validation
    - Test role-based review visibility
    - Test escalation timer logic
    - _Requirements: 15.1–15.16, 16.1–16.7_

- [~] 14. Checkpoint — Admin, teacher, and support screens verified
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Role-based access and authentication hardening (Workstream 6)
  - [~] 15.1 Wire role-based navigation guards end-to-end
    - Integrate `useRouteGuard` hook (task 3.3) into all admin/teacher/support screen layouts
    - Verify unauthorized access redirects to user's default home screen with toast
    - Verify tab bar dynamically hides unauthorized tabs
    - Verify conditional rendering hides action buttons per role
    - Test with all 5 roles: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, SUPPORT
    - _Requirements: 7.3, 7.4, 7.6_

  - [~] 15.2 Wire token lifecycle and session management end-to-end
    - Verify token refresh interceptor (task 3.1) handles concurrent 401s correctly with `isRefreshing` flag and `failedQueue`
    - Verify SessionTimeoutProvider (task 3.2) shows warning at 25min and logs out at 30min
    - Verify automatic logout clears SecureStore, resets React Query cache, navigates to login
    - Validate institutional access for all API calls (InstitutionContext from task 3.4)
    - _Requirements: 7.2, 7.5, 7.7, 7.8_

  - [~] 15.3 Wire comprehensive form validation end-to-end
    - Integrate Zod schemas (task 3.10) into all form screens: registration, task creation, institution setup, ticket creation
    - Verify real-time field validation on blur with field-specific error messages
    - Verify form state preservation during errors via draft auto-save (task 3.12)
    - Validate cross-field consistency: date ranges, grade ranges (0-100), file sizes (≤50MB)
    - _Requirements: 9.1, 9.2, 9.6, 9.7_

  - [~] 15.4 Wire error handling and offline support end-to-end
    - Verify `categorizeError()` (task 3.11) is used in all screen-level error states
    - Verify `withRetry()` (task 3.11) is configured in React Query global defaults
    - Verify offline queue (task 3.13) processes actions on reconnection
    - Verify background sync (task 3.13) runs on app resume and via `expo-background-fetch`
    - Verify offline indicator banner shows when disconnected with cached data display
    - _Requirements: 9.3, 9.4, 9.5, 10.3, 10.7_

  - [ ]* 15.5 Write end-to-end integration tests for auth and error handling
    - Test role-based route protection (unauthorized redirect) for all 5 roles
    - Test token refresh flow with request retry queue
    - Test offline queue and sync behavior
    - Test form validation with error preservation
    - Test 5-layer error handling cascade
    - _Requirements: 7.1–7.8, 9.1–9.7, 10.1–10.7_

- [~] 16. Final checkpoint — Full integration verified
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Workstream 3 (backend endpoints) has no frontend dependency and should be completed first
- Workstream 5 (shared infrastructure) is a prerequisite for all frontend integration work
- Each screen integration removes mock data AND adds proper loading/error/empty states
- The existing integrations (home, notifications, teacher grading) remain untouched
- Property-based tests use `fast-check` library with minimum 100 iterations per property
- Each property test file is tagged: `// Feature: homework-app-integration, Property {N}: {title}`
- All React Query hooks use `useInfiniteQuery` for list endpoints with consistent pagination patterns
- The 5-layer error handling strategy (Axios interceptor → React Query boundaries → Screen-level → Form validation → Global ErrorBoundary) is implemented in task 3.15 and wired in task 15.4
- New endpoint `PUT /user/notification-preferences` (task 1.9) was discovered during design review and is not in the original 14 missing endpoints
- All 40 correctness properties from the design document are covered across tasks 3.17, 3.18, 5.7, 7.6, 9.5, 11.9, 12.5, and 13.7

