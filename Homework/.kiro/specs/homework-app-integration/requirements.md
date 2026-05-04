# Requirements Document

## Introduction

The Homework educational application requires complete integration between its React Native/Expo frontend and NestJS backend to eliminate critical inconsistencies and enable full end-to-end functionality. The application serves educational institutions with role-based access for administrators, teachers, students, and support staff to manage projects, assignments, submissions, and communications.

Based on comprehensive documentation analysis and deep frontend code audit, the system has a mix of screens already integrated with real APIs, screens using mock data as fallback, and screens fully simulated. This document consolidates all requirements, eliminating redundancies and reflecting the actual state of each frontend screen.

### Technical Notes: Critical Architecture Findings

> **Frontend Integration Status (Verified by Code Audit):**
>
> - **Screens using real API:** `home.tsx` (`api.get('/auth/profile')`, `api.get('/projects')`), `_layout.tsx` (tabs, `api.get('/auth/profile')`), `notifications.tsx` (full CRUD: `GET /notifications`, `PATCH /notifications/mark-all-read`, `PATCH /notifications/{id}/read`, `PATCH /collaborators/{id}/accept|reject`), `tasks/[taskId]/submissions.tsx` (teacher grading: `GET /submissions/task/{taskId}`, `PATCH /submissions/{id}/grade`)
> - **Screens with mock data fallback:** `projects/index.tsx` (`MOCK_SUBJECTS`), `projects/[id]/index.tsx` (`MOCK_UNITS`, mock ID prefix 'm'), `projects/[id]/students.tsx` (`MOCK_STUDENTS`), `projects/[id]/unit/[unitId].tsx` (`MOCK_UNIT_TASKS`)
> - **Screens fully simulated:** `tasks/[id].tsx` (mock tasks 't1','t2', `setTimeout()` submission simulation — does NOT call `POST /submissions` or `POST /uploads`), `grades.tsx` (`MOCK_GRADES` hardcoded, period selector non-functional)
> - **Screens not yet verified:** `chat/[id].tsx`, `collaborators.tsx`, `calendar.tsx`, `library.tsx`, `book/[id].tsx`, `collaborator/[id].tsx`, `scanner.tsx`, `files/[id].tsx`, all `admin/*` screens, `support.tsx`, `profile.tsx`, `edit-profile.tsx`, `security.tsx`, `appearance.tsx`
>
> **Classroom/Project/Subject Relationship:** The backend has a dedicated `Classroom` model (Prisma) separate from `Project`. Subjects are created within classrooms via `POST /subjects/classroom/:classId`. The frontend historically referred to "aulas" as "projects," but the current schema maintains both as distinct entities.
>
> **Backend Endpoints with Missing CRUD Operations:** `PUT /institutions/{id}` and `DELETE /institutions/{id}` do not exist (only GET/POST); `PUT /subjects/{id}` and `DELETE /subjects/{id}` do not exist (only POST/GET); `GET /users/{id}/tickets` is declared in the controller but has an empty implementation.
>
> **Teacher-Specific Endpoints:** The endpoints `/teachers/{id}/students` and `/teachers/{id}/subjects` do not exist as separate routes. Teacher data is embedded within `GET /users/{id}/profile` via `UsersService.getTeacherProfile()`. Dedicated endpoints are needed for pagination and filtering.
>
> **Attendance Data is Hardcoded:** Both student and teacher profiles return hardcoded attendance strings ("95%", "98%"). No real attendance tracking model or endpoint exists.
>
> **Frontend API Configuration:** The frontend uses axios with JWT interceptor pointing to `https://app-homework-production.up.railway.app`. Tokens are stored via `expo-secure-store`.
>
> **WebSocket Gateway:** A Socket.io gateway exists in the messages module but the frontend does not connect to it yet.

## Glossary

- **Frontend_App**: The React Native/Expo mobile application with role-based navigation
- **Backend_API**: The NestJS server with PostgreSQL/Prisma database including WebSocket support
- **Submission_System**: The task submission and grading functionality with file upload support
- **Chat_System**: Real-time messaging using Socket.io with multimedia support and project/user contexts
- **Notification_System**: System-wide notification delivery mechanism with categorization
- **Mock_Data**: Simulated data (MOCK_SUBJECTS, MOCK_UNITS, MOCK_STUDENTS, MOCK_UNIT_TASKS, MOCK_GRADES, mock task IDs) used as fallback in frontend screens that must be eliminated
- **Real_Time_Connection**: Socket.io WebSocket connection for live chat and notifications
- **Grading_Interface**: Teacher interface for evaluating student submissions with feedback
- **Data_Synchronization**: Process of keeping frontend and backend data consistent across all screens
- **Institution_Management**: Multi-tenant administrative system for managing educational institutions
- **Classroom_System**: System for creating and managing classrooms/groups within institutions
- **Subject_Management**: System for managing academic subjects within classrooms with teacher assignment
- **Ticket_System**: Support ticket management with priority, categorization, escalation, and quality tracking
- **User_Review_System**: System for evaluating and providing feedback on users and support services with rating scales
- **Role_Management**: System for managing user roles (SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, SUPPORT) and user lifecycle
- **Admin_Dashboard**: Administrative interface with statistics, analytics, reporting, and data visualization
- **Teacher_Dashboard**: Teacher-specific interface with subject management, student tracking, grading, and performance analytics
- **Support_Dashboard**: Support staff interface with ticket queues, performance metrics, and workflow management
- **Library_System**: Book catalog and loan management (backend fully implemented: GET /library/books, GET /library/categories, GET /library/books/{id}, POST /library/books/{id}/loan, POST /library/books/{id}/return; frontend not yet integrated)
- **Schedule_System**: Academic schedule management (backend implemented: GET /schedules, POST /schedules, DELETE /schedules/{id}; frontend not yet integrated)
- **Unit_System**: Pedagogical units within subjects for organizing tasks hierarchically
- **Calendar_View**: Frontend calendar component aggregating schedules and task deadlines into a unified date-based view
- **Missing_Endpoints**: Backend API routes required by frontend screens but not yet implemented
- **Prisma_Schema**: The database schema including models: User, Institution, Classroom, Project, Task, Unit, Schedule, Book, BookCategory, BookLoan, Submission, Notification, Collaborator, ProjectMember, Message, Attachment, Ticket, Review
- **User_Fields**: The User model includes specialty, bio, parentName, parentPhone, and classroomId fields available for profile display and editing


## Requirements

### Requirement 1: Task Submission Integration with File Management

**User Story:** As a student, I want to submit assignments with files through the real backend API, so that my submissions are properly stored, tracked, and can be graded by teachers with comprehensive feedback.

**Current State:** The student task detail screen `tasks/[id].tsx` is fully simulated — mock task IDs ('t1', 't2') use hardcoded data and the submission modal uses `setTimeout()` instead of calling `POST /submissions` or `POST /uploads`. However, the teacher-facing screen `tasks/[taskId]/submissions.tsx` is already integrated with `GET /submissions/task/{taskId}` and `PATCH /submissions/{id}/grade`.

#### Acceptance Criteria

1. WHEN a student accesses task details via `/tasks/{id}`, THE Frontend_App SHALL fetch task information from Backend_API endpoint `GET /tasks/{id}` including title, description, deadline, resources, and existing submission status, replacing all mock task data and ID-prefix-based branching logic
2. WHEN a student submits an assignment, THE Frontend_App SHALL send multipart/form-data to Backend_API endpoint `POST /submissions` including file attachment, optional comments, and task reference, replacing the current `setTimeout()` simulation
3. THE Frontend_App SHALL support file upload progress indicators and validate file types and sizes according to Backend_API constraints before submission
4. WHEN a submission is successful, THE Frontend_App SHALL display confirmation, update task status to "submitted", and show submission date in the task detail view
5. IF submission fails due to deadline expiration, THEN THE Frontend_App SHALL display a specific error message and prevent further submission attempts
6. WHEN a teacher grades the submission via the already-integrated `tasks/[taskId]/submissions.tsx` screen, THE Frontend_App SHALL display the grade and feedback in the student's task detail view
7. THE Frontend_App SHALL support downloading task resources and submitted files through Backend_API file serving endpoints

### Requirement 2: Real-Time Chat Implementation with Multimedia Support

**User Story:** As a user, I want to communicate in real-time with other users through individual and group chats with multimedia support, so that I can collaborate effectively on educational projects and receive immediate responses.

**Current State:** The `chat/[id].tsx` screen has not been verified for API integration. The WebSocket gateway exists in the backend messages module but the frontend does not connect to it yet.

#### Acceptance Criteria

1. WHEN the Frontend_App starts, THE Chat_System SHALL establish Socket.io connection to Backend_API WebSocket gateway for real-time messaging
2. WHEN accessing chat via `/chat/{id}?type=user|project`, THE Frontend_App SHALL fetch message history from Backend_API endpoint `GET /messages/{id}` or `GET /messages/project/{id}` based on chat type
3. WHEN a user sends a text message, THE Chat_System SHALL broadcast it via `POST /messages/{id}?type=user|project` and display immediately to all connected participants
4. WHEN a user sends multimedia (images, videos, documents), THE Frontend_App SHALL first upload files via `POST /uploads` then send message with attachment reference
5. THE Frontend_App SHALL display multimedia messages with appropriate previews: full-screen image viewer, video play icons, and document download links
6. WHEN users join or leave project chats, THE Chat_System SHALL notify other participants with system messages
7. THE Frontend_App SHALL support message actions including copy text via long press and chat history clearing via `DELETE /messages/{id}`
8. THE Frontend_App SHALL show dynamic context headers: "En línea" status for individual chats and "Chat de Aula" for project group chats
9. THE Frontend_App SHALL use KeyboardAvoidingView to prevent keyboard obstruction of current messages

### Requirement 3: Teacher Experience — Profile, Subjects, Students, Grading, and Dashboard

**User Story:** As a teacher, I want a unified experience covering my profile, assigned subjects, student management, grading interface, and performance dashboard, so that I can efficiently manage all my teaching responsibilities from a centralized set of screens.

**Current State:** The teacher grading screen `tasks/[taskId]/submissions.tsx` is already integrated with `GET /submissions/task/{taskId}` and `PATCH /submissions/{id}/grade` (functional modal with grade and feedback). Teacher profile data is served through `GET /users/{teacherId}` via `UsersService.getTeacherProfile()` — no dedicated `/teachers/` endpoints exist. Attendance data is hardcoded ("98%").

#### Acceptance Criteria

**Profile and Dashboard:**
1. THE Frontend_App SHALL provide teacher profile access via `/admin/institution/{instId}/teacher/{teacherId}` displaying personal details, teaching statistics, and performance metrics from Backend_API endpoint `GET /users/{teacherId}` via `UsersService.getTeacherProfile()`
2. THE Frontend_App SHALL provide a teacher-specific dashboard via `/teacher/dashboard` displaying active classes, pending submissions for grading, upcoming deadlines, and student performance summaries with role-based access control
3. WHEN accessing the teacher dashboard, THE Frontend_App SHALL show real-time statistics including total students across all subjects, average class performance, task completion rates, and comparative performance indicators
4. THE Frontend_App SHALL display quick action tiles for common teacher tasks including creating assignments, accessing gradebook, viewing pending submissions, and generating progress reports

**Subject and Student Management:**
5. THE Frontend_App SHALL provide comprehensive subject listing via `/admin/institution/{instId}/teacher/{teacherId}/subjects` displaying all assigned subjects with classroom assignments, student enrollment counts, and recent activity indicators. **NOTE: A dedicated `GET /teachers/{teacherId}/subjects` endpoint MUST be implemented; subject data is currently embedded in the teacher profile response**
6. THE Frontend_App SHALL display the teacher's complete student roster via `/admin/institution/{instId}/teacher/{teacherId}/students` with filtering by classroom, subject, and performance level using DISTINCT queries to prevent student duplication. **NOTE: A dedicated `GET /teachers/{teacherId}/students` endpoint MUST be implemented**
7. THE Frontend_App SHALL provide individual student cards with quick access to student profiles, recent submissions, current grades, and direct communication options

**Grading:**
8. THE Frontend_App SHALL maintain the existing grading integration in `tasks/[taskId]/submissions.tsx` using `GET /submissions/task/{taskId}` and `PATCH /submissions/{id}/grade` with the functional grading modal (numerical grade 0-100, written feedback)
9. THE Grading_Interface SHALL support downloading submitted files for offline review and provide file preview capabilities
10. THE Frontend_App SHALL display grading statistics including average grades, completion rates, and pending submissions count for each task
11. WHEN grades are published, THE Notification_System SHALL automatically notify students of their results

**Analytics:**
12. THE Frontend_App SHALL provide interactive performance analytics with visual charts showing grade distributions, student progress trends, and subject-wise performance comparisons
13. THE Frontend_App SHALL integrate calendar functionality showing teaching schedule, assignment deadlines, and institutional events with notification integration
14. THE Frontend_App SHALL display teacher performance metrics including average grades given, task completion rates for assigned subjects, and attendance tracking. **NOTE: Attendance data is currently hardcoded as "98%" in the backend; real attendance tracking requires a new model and endpoints**


### Requirement 4: Complete Mock Data Elimination with Real API Integration

**User Story:** As a developer, I want all frontend screens to use real backend APIs with proper error handling, so that the application displays accurate, live data and provides reliable functionality across all features.

**Current State (Verified by Code Audit):**
- `projects/index.tsx`: Uses `MOCK_SUBJECTS` as fallback when `api.get('/projects')` fails or returns empty
- `projects/[id]/index.tsx`: Uses `MOCK_UNITS` for units; if project ID starts with 'm' (mock), uses hardcoded data entirely
- `projects/[id]/students.tsx`: Uses `MOCK_STUDENTS` as fallback when project ID starts with 'm'
- `projects/[id]/unit/[unitId].tsx`: Uses `MOCK_UNIT_TASKS` when unitId matches mock data keys; otherwise calls `api.get('/units/{unitId}/tasks')`
- `tasks/[id].tsx`: Uses hardcoded mock tasks ('t1', 't2') with full simulation including `setTimeout()` for submission — does NOT call real API
- `grades.tsx`: Uses `MOCK_GRADES` entirely; period selector is non-functional; no backend endpoint for grades by period exists
- Screens already on real API (no action needed): `home.tsx`, `_layout.tsx`, `notifications.tsx`, `tasks/[taskId]/submissions.tsx`

#### Acceptance Criteria

1. THE Frontend_App SHALL remove `MOCK_SUBJECTS` from `projects/index.tsx` and rely exclusively on `api.get('/projects')` with proper empty-state and error-state UI instead of mock fallback
2. THE Frontend_App SHALL remove `MOCK_UNITS` and mock ID prefix logic ('m1', 'm2') from `projects/[id]/index.tsx`, fetching all unit data from Backend_API endpoints
3. THE Frontend_App SHALL remove `MOCK_STUDENTS` and mock ID prefix logic from `projects/[id]/students.tsx`, fetching student data from Backend_API endpoints
4. THE Frontend_App SHALL remove `MOCK_UNIT_TASKS` from `projects/[id]/unit/[unitId].tsx` and use `api.get('/units/{unitId}/tasks')` exclusively for all unit IDs
5. THE Frontend_App SHALL remove all mock task data ('t1', 't2') and `setTimeout()` submission simulation from `tasks/[id].tsx`, replacing with real `GET /tasks/{id}` and `POST /submissions` API calls
6. THE Frontend_App SHALL remove `MOCK_GRADES` from `grades.tsx` and integrate with a real Backend_API endpoint for student grades by period, with a functional period selector
7. WHEN Backend_API is unavailable, THE Frontend_App SHALL display appropriate loading states with skeleton screens and error states with retry mechanisms instead of falling back to mock data
8. THE Data_Synchronization SHALL ensure all CRUD operations use proper Backend_API endpoints with consistent error handling and validation feedback
9. THE Frontend_App SHALL implement proper caching strategies using React Query or similar for frequently accessed data like user profiles and project lists

### Requirement 5: Comprehensive Notification System Integration

**User Story:** As a user, I want to receive real-time notifications categorized by type with proper delivery tracking, so that I stay informed about assignments, grades, messages, and system updates relevant to my role.

**Current State:** The `notifications.tsx` screen is already integrated with the real API: `GET /notifications`, `PATCH /notifications/mark-all-read`, `PATCH /notifications/{id}/read`, `PATCH /collaborators/{id}/accept`, `PATCH /collaborators/{id}/reject`. Remaining gaps: real-time WebSocket push for new notifications and deep linking to relevant screens.

#### Acceptance Criteria

1. THE Frontend_App SHALL maintain the existing notification screen integration with Backend_API endpoints `GET /notifications`, `PATCH /notifications/mark-all-read`, `PATCH /notifications/{id}/read`, and collaborator accept/reject endpoints
2. WHEN new notifications arrive, THE Notification_System SHALL push updates in real-time via WebSocket connection and update badge counts on relevant tabs without requiring manual refresh
3. THE Notification_System SHALL categorize notifications by type: ASSIGNMENT (new tasks), GRADE (graded submissions), MESSAGE (chat notifications), SYSTEM (administrative updates), and DEADLINE (approaching due dates)
4. WHEN users perform actions that generate notifications (task creation, grading, messaging), THE Backend_API SHALL create and distribute notifications to relevant users based on their roles and institutional relationships
5. THE Frontend_App SHALL support notification preferences allowing users to configure which types of notifications they receive via `PUT /user/notification-preferences`
6. THE Notification_System SHALL include deep linking to relevant screens when notifications are tapped (task details, chat, grades)
7. THE Frontend_App SHALL display notification timestamps with relative time formatting and group notifications by date

### Requirement 6: User and Role Management with Institutional Context

**User Story:** As an administrator, I want comprehensive user management with hierarchical role assignment, institutional context, and member lifecycle management, so that I can maintain proper access control, user organization, and security across the multi-tenant platform.

**Consolidation Note:** This requirement merges the previous "Member Management" (Req 6) and "User and Role Management" (Req 17) requirements, which both addressed user CRUD, role assignment, and institutional filtering.

#### Acceptance Criteria

1. THE Role_Management SHALL provide comprehensive CRUD operations via Backend_API endpoints: `GET /users` (with institutional filtering), `POST /auth/register` (role-based creation), `PUT /users/{id}` (profile/role updates), with support for all roles (SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, SUPPORT)
2. WHEN managing users via `/admin/users`, THE Role_Management SHALL support advanced filtering by role, institution, activity status, and registration date with real-time search capabilities
3. THE Role_Management SHALL enforce strict hierarchical permissions: SUPER_ADMIN manages all users globally, SCHOOL_ADMIN manages users within their institution only, TEACHER can view assigned students and colleagues
4. THE Role_Management SHALL display user activity tracking including last login, active projects, and performance metrics via dedicated user detail endpoints
5. WHEN adding or removing members, THE Role_Management SHALL use Backend_API collaborator endpoints with proper role validation and institutional context filtering
6. THE Role_Management SHALL support bulk operations including student enrollment via `/admin/institution/{id}/enroll-student`, CSV import with duplicate detection, batch role assignments, and account activation/deactivation with audit logging
7. THE Role_Management SHALL provide advanced search and filtering by role (STUDENT, TEACHER, SUPPORT, SCHOOL_ADMIN), institution, and activity status
8. THE Frontend_App SHALL redirect to role-specific detail screens: students to `/admin/institution/{instId}/student/{userId}`, teachers to `/admin/institution/{instId}/teacher/{userId}`, support to `/admin/institution/{instId}/support/{userId}`
9. WHEN member data changes (role updates, enrollments), THE Frontend_App SHALL refresh displays automatically and notify affected users
10. THE Role_Management SHALL integrate with institutional management to automatically assign users to appropriate institutions, classrooms, and subjects based on their roles

### Requirement 7: Enhanced Authentication and Authorization with Multi-Tenancy

**User Story:** As a user, I want consistent authentication behavior with proper multi-tenant support across all features, so that my access permissions work reliably and securely throughout the application based on my role and institutional context.

#### Acceptance Criteria

1. THE Frontend_App SHALL use JWT tokens from Backend_API `/auth/login` for all authenticated requests and store institutional context from user profile
2. WHEN tokens expire, THE Frontend_App SHALL attempt refresh via `/auth/refresh` or redirect to login with proper state preservation
3. THE Frontend_App SHALL enforce role-based access control matching Backend_API permissions: SUPER_ADMIN (all institutions), SCHOOL_ADMIN (own institution), TEACHER (assigned subjects), STUDENT (enrolled projects)
4. THE Frontend_App SHALL validate user permissions before displaying restricted features and hide unauthorized navigation options dynamically
5. WHEN authentication fails, THE Frontend_App SHALL clear local state, remove stored tokens, and redirect to login with appropriate error messaging
6. THE Frontend_App SHALL support institutional context switching for SUPER_ADMIN users while maintaining security boundaries
7. THE Frontend_App SHALL implement session timeout warnings and automatic logout for security compliance
8. THE Frontend_App SHALL validate institutional access for all API calls and handle cross-institution access attempts gracefully

### Requirement 8: Advanced File Upload and Management System

**User Story:** As a user, I want to upload, manage, and share files for assignments and projects with proper security and organization, so that I can effectively collaborate and submit work with multimedia support.

#### Acceptance Criteria

1. THE Frontend_App SHALL integrate with Backend_API file upload endpoint `POST /uploads` supporting multipart/form-data for all file operations including task resources, submissions, and chat attachments
2. WHEN uploading files, THE Frontend_App SHALL display upload progress bars, validate file types (documents, images, videos) and sizes according to Backend_API constraints, and show estimated completion times
3. THE Frontend_App SHALL support file preview functionality: image thumbnails, video play buttons, document icons, and full-screen viewers for multimedia content
4. THE Frontend_App SHALL provide file download capabilities through Backend_API serving endpoints with proper authentication and access control based on user roles
5. WHEN file operations fail, THE Frontend_App SHALL provide specific error messages (file too large, unsupported format, network error) and offer retry mechanisms with exponential backoff
6. THE Frontend_App SHALL organize files by context: task resources (teacher uploads), submissions (student uploads), and chat attachments with proper categorization
7. THE Frontend_App SHALL support file versioning for submissions allowing students to replace files before deadlines and teachers to access submission history
8. THE Frontend_App SHALL implement secure file sharing with temporary URLs and access logging for administrative oversight


### Requirement 9: Comprehensive Data Validation and Error Handling

**User Story:** As a user, I want consistent data validation with clear, actionable error messages and robust error recovery, so that I understand what went wrong and can successfully complete my tasks without frustration.

#### Acceptance Criteria

1. THE Frontend_App SHALL implement client-side validation matching Backend_API validation rules for all forms including user registration, task creation, and institutional setup with real-time field validation
2. WHEN validation fails, THE Frontend_App SHALL display field-specific error messages with clear instructions for correction and highlight invalid fields with appropriate styling
3. THE Frontend_App SHALL handle network errors gracefully with categorized user feedback: connection timeouts, server errors (500), authentication failures (401), and permission errors (403)
4. THE Frontend_App SHALL implement intelligent retry mechanisms with exponential backoff for failed API requests and provide manual retry buttons for user-initiated actions
5. WHEN server errors occur, THE Frontend_App SHALL log detailed error information for debugging while displaying user-friendly messages and suggested next steps
6. THE Frontend_App SHALL validate data consistency across related fields (start/end dates, grade ranges, file size limits) and provide contextual help tooltips
7. THE Frontend_App SHALL implement form state preservation during errors allowing users to correct issues without losing entered data

### Requirement 10: Performance Optimization and Offline Capabilities

**User Story:** As a user, I want the application to perform optimally with smart caching and offline functionality, so that I can use it effectively even with poor connectivity and experience fast, responsive interactions.

#### Acceptance Criteria

1. THE Frontend_App SHALL implement intelligent caching using React Query for frequently accessed data including user profiles, project lists, and institutional information with appropriate cache invalidation strategies
2. THE Frontend_App SHALL use pagination for large data sets from Backend_API with configurable page sizes: user lists (20 per page), task lists (15 per page), and message history (50 per page)
3. WHEN offline, THE Frontend_App SHALL display cached data with clear offline indicators and queue actions (message sending, task submissions) for synchronization when connection is restored
4. THE Frontend_App SHALL optimize API calls by implementing request deduplication, batch requests where possible, and lazy loading for non-critical data like user avatars and file previews
5. THE Frontend_App SHALL provide comprehensive loading indicators including skeleton screens for lists, progress bars for file operations, and spinner overlays for form submissions
6. THE Frontend_App SHALL implement image optimization with automatic resizing, compression, and progressive loading for better performance on mobile networks
7. THE Frontend_App SHALL use background sync for non-critical operations like analytics tracking and notification status updates

### Requirement 11: Comprehensive Institution Management System

**User Story:** As a SUPER_ADMIN or SCHOOL_ADMIN, I want to manage educational institutions with complete administrative control and detailed statistics, so that I can configure, monitor, and oversee institutional operations effectively across multiple tenants.

#### Acceptance Criteria

1. THE Institution_Management SHALL provide CRUD operations via Backend_API endpoints: `GET /institutions` (list with search), `POST /institutions` (create), `GET /institutions/{id}` (details), accessible only to SUPER_ADMIN users. **NOTE: `PUT /institutions/{id}` and `DELETE /institutions/{id}` do not currently exist and MUST be implemented before frontend edit.tsx and settings.tsx screens**
2. WHEN creating an institution via `/admin/institutions`, THE Institution_Management SHALL support logo upload, address configuration, administrative settings, and initial SCHOOL_ADMIN assignment through integrated modal forms
3. THE Institution_Management SHALL display institution cards with logos, names, addresses, and real-time statistics including user counts (`_count.users`) and classroom counts (`_count.projects`) from Backend_API aggregation
4. WHEN viewing institution details via `/admin/institution/{id}`, THE Institution_Management SHALL show comprehensive dashboard with statistics (students, teachers, classrooms, average grades), quick action buttons, and navigation to sub-management screens
5. THE Institution_Management SHALL enforce hierarchical permissions where SUPER_ADMIN manages all institutions globally and SCHOOL_ADMIN users can only access their assigned institution
6. THE Institution_Management SHALL support bulk operations including student enrollment, teacher assignment, and classroom creation through dedicated workflow screens
7. THE Institution_Management SHALL provide institution-specific configuration including academic calendars, grading scales, and notification preferences via `/admin/institution/{id}/settings`. **NOTE: `POST /institutions/{id}/admins` and `DELETE /institutions/{id}/admins/{adminId}` do not exist and MUST be implemented**
8. THE Institution_Management SHALL track and display institutional metrics including enrollment trends, activity levels, and performance indicators

### Requirement 12: Advanced Classroom Management System

**User Story:** As a SCHOOL_ADMIN or TEACHER, I want to create and manage classrooms with subject assignment and performance tracking, so that I can organize students effectively and monitor academic progress across different groups and subjects.

#### Acceptance Criteria

1. THE Classroom_System SHALL provide CRUD operations via Backend_API endpoints: `GET /classrooms` (institutional list), `POST /classrooms` (create), `GET /classrooms/{classId}` (details), accessible through `/admin/institution/{id}/classrooms`
2. WHEN creating a classroom via `/admin/institution/{id}/create-classroom`, THE Classroom_System SHALL allow configuration of classroom name, description, teacher assignments, and initial student enrollment with validation for institutional context
3. THE Classroom_System SHALL support bulk student enrollment through `/admin/institution/{id}/enroll-student` with CSV import capabilities and duplicate detection
4. WHEN viewing classroom details via `/admin/institution/{id}/classroom/{classId}`, THE Classroom_System SHALL display assigned subjects from `GET /classrooms/{classId}/subjects` with performance indicators and average grades per subject
5. THE Classroom_System SHALL enforce role-based permissions where SCHOOL_ADMIN can manage all classrooms in their institution and TEACHER users can only manage classrooms where they are assigned
6. THE Classroom_System SHALL provide subject management within classrooms including adding new subjects via `/admin/institution/{id}/classroom/{classId}/add-subject` and assigning teachers to specific subjects
7. THE Classroom_System SHALL display classroom statistics including student count, subject count, overall performance metrics, and activity indicators
8. THE Classroom_System SHALL support classroom scheduling integration with the existing Schedule_System for timetable management and conflict detection

### Requirement 13: Comprehensive Subject Management System

**User Story:** As a TEACHER or SCHOOL_ADMIN, I want to manage academic subjects with detailed pedagogical oversight and task management, so that I can organize curriculum effectively and track student progress with comprehensive analytics.

#### Acceptance Criteria

1. THE Subject_Management SHALL provide operations via Backend_API endpoints: `POST /subjects/classroom/:classId` (create within classroom), `GET /subjects/{subjectId}/details` (comprehensive details), `GET /subjects/{subjectId}/tasks` (task listing), `GET /subjects/{subjectId}/stats` (statistics). **NOTE: `PUT /subjects/{id}` and `DELETE /subjects/{id}` do not currently exist and MUST be implemented**
2. WHEN creating a subject via `/admin/institution/{id}/classroom/{classId}/add-subject`, THE Subject_Management SHALL allow configuration of subject name, teacher assignment, curriculum details, and grading criteria with institutional validation
3. THE Subject_Management SHALL display comprehensive subject details via `/admin/institution/{id}/classroom/{classId}/subject/{subjectId}` including statistics (average grade, total tasks, submitted tasks, student count), assigned teachers, and recent activity
4. WHEN viewing subject details, THE Subject_Management SHALL show recent submissions with status indicators (Graded/Pending), student names, task names, and grades from the `recentSubmissions` array in Backend_API response
5. THE Subject_Management SHALL allow teachers to manage only their assigned subjects while SCHOOL_ADMIN can manage all subjects in their institution
6. THE Subject_Management SHALL integrate with the existing Unit_System for pedagogical unit management within subjects and support task creation through `/admin/institution/{id}/classroom/{classId}/subject/{subjectId}/tasks`
7. THE Subject_Management SHALL provide subject editing capabilities via `/admin/institution/{id}/classroom/{classId}/subject/{subjectId}/edit` including teacher reassignment, curriculum updates, and grading scale modification
8. THE Subject_Management SHALL generate detailed reports for subject performance including grade distributions, completion rates, and comparative analysis across classrooms

### Requirement 14: Admin Dashboard and Analytics

**User Story:** As an administrator, I want a comprehensive dashboard with real-time statistics, interactive analytics, reporting capabilities, and data visualization, so that I can monitor system health, track institutional performance, generate reports, and make data-driven decisions.

**Consolidation Note:** This requirement merges the previous "Admin Dashboard" (Req 14) and "Reporting and Analytics" (Req 18) requirements, which both addressed statistics visualization, data export, and institutional metrics.

#### Acceptance Criteria

**Dashboard:**
1. THE Admin_Dashboard SHALL display institution-wide statistics via `/admin/dashboard` including user counts by role, active projects, task completion rates, and system health metrics from Backend_API institutional metrics endpoints
2. WHEN accessing the dashboard, THE Admin_Dashboard SHALL show role-appropriate data: SUPER_ADMIN sees global statistics across all institutions, SCHOOL_ADMIN sees their institution-specific metrics
3. THE Admin_Dashboard SHALL provide quick access navigation tiles to user management (`/admin/users`), institution management (`/admin/institutions`), classroom oversight, and support tools with badge indicators for pending actions
4. THE Admin_Dashboard SHALL display real-time notifications and alerts for system issues, pending support tickets, overdue tasks, and administrative actions requiring attention
5. THE Admin_Dashboard SHALL show recent activity feeds including new user registrations, task submissions, grade publications, and system events with timestamps and user attribution

**Analytics and Reporting:**
6. THE Admin_Dashboard SHALL include interactive data visualization charts for enrollment trends, activity patterns, grade distributions, and performance metrics using responsive chart libraries
7. THE Admin_Dashboard SHALL track and display key performance indicators including task completion rates (by subject/classroom), user engagement metrics (login frequency, activity duration), and educational outcome trends
8. THE Admin_Dashboard SHALL support flexible report generation with filtering by date ranges, institution/classroom/subject hierarchies, user roles, and performance criteria
9. THE Admin_Dashboard SHALL support data export functionality for reports and analytics with multiple format options (PDF, Excel, CSV)
10. THE Admin_Dashboard SHALL provide customizable dashboard widgets allowing administrators to configure their preferred metrics display and layout preferences


### Requirement 15: Support System — Tickets, Staff Management, Reviews, and Dashboard

**User Story:** As a user, I want to create and track support tickets with detailed categorization; as support staff, I want to manage tickets efficiently with a dedicated dashboard and performance tracking; and as an administrator, I want to monitor support quality through reviews and analytics, so that the entire support lifecycle is covered from ticket creation to quality assurance.

**Consolidation Note:** This requirement merges the previous "Support Ticket System" (Req 15), "Support Staff Management" (Req 21), "Support Service Review" (Req 22), "Enhanced Ticket System" (Req 23), and "Support Dashboard" (Req 25) requirements, which collectively addressed overlapping ticket management, staff profiles, service reviews, and dashboard functionality.

#### Acceptance Criteria

**Ticket Creation and Tracking (User-facing):**
1. THE Ticket_System SHALL allow users to create support tickets via `/support/create-ticket` with categories (Technical, Academic, Account, General), priority levels (Low, Medium, High, Critical), and detailed descriptions with file attachments
2. WHEN a ticket is created, THE Ticket_System SHALL generate unique tracking numbers, notify appropriate SUPPORT staff via Backend_API endpoint `POST /tickets`, and send confirmation to the user with expected response times
3. THE Ticket_System SHALL maintain complete ticket history including status changes, support responses, user replies, and resolution details with timestamps and staff attribution via `GET /tickets/{id}/history`
4. THE Ticket_System SHALL support comprehensive ticket search and filtering by category, priority, status, assignment, and date ranges

**Ticket Management (Support Staff):**
5. THE Ticket_System SHALL provide SUPPORT users with comprehensive ticket management interface via `/admin/tickets` showing ticket queues, assignment capabilities, status updates (Open, In Progress, Resolved, Closed), and response tracking
6. THE Ticket_System SHALL support ticket escalation workflows with automatic escalation for high-priority tickets and manual escalation capabilities for complex issues requiring specialized attention
7. THE Ticket_System SHALL implement intelligent ticket routing assigning tickets to appropriate support staff based on category expertise, current workload, and availability status
8. THE Ticket_System SHALL integrate with the Notification_System to alert users of ticket updates and support staff of new tickets or urgent issues

**Support Staff Profiles and Dashboard:**
9. THE Frontend_App SHALL provide support staff profiles via `/admin/institution/{instId}/support/{userId}` displaying personal details, support statistics (tickets resolved, average response time, user satisfaction rating), and performance metrics from Backend_API endpoint `GET /users/{id}/profile`
10. THE Frontend_App SHALL provide support staff dashboard via `/support/dashboard` displaying active ticket queues, pending assignments, escalated issues, and personal performance metrics with real-time updates. **NOTE: `GET /users/{id}/tickets` is declared in UsersController but has an EMPTY implementation; MUST be completed**
11. WHEN accessing the support dashboard, THE Frontend_App SHALL show key performance indicators including tickets resolved today, average response time, current queue length, and user satisfaction ratings with trend analysis

**Service Reviews and Quality:**
12. THE User_Review_System SHALL allow users to rate support interactions via dedicated review forms with 1-5 star rating scales, detailed comment fields, and category-specific feedback (responsiveness, technical competence, communication quality)
13. WHEN accessing support staff reviews via `GET /users/{id}/reviews`, THE Frontend_App SHALL display comprehensive review analytics including average ratings, review count, rating distribution charts, and chronological review history. **NOTE: `GET /reviews/{reviewId}` does NOT exist in the backend ReviewsController; only create, findAllForTechnician, and getStats are implemented. This endpoint MUST be added**
14. THE Ticket_System SHALL integrate review system with ticket resolution workflow, automatically prompting users to provide feedback after ticket closure
15. THE Frontend_App SHALL provide review analytics dashboard for administrators showing support team performance metrics, service quality trends, and comparative analysis across support staff members
16. THE Frontend_App SHALL generate support analytics reports including resolution time metrics, category distribution analysis, staff performance tracking, and satisfaction trends

### Requirement 16: User Review and Evaluation System

**User Story:** As an administrator or teacher, I want to conduct comprehensive user reviews and evaluations with detailed feedback mechanisms, so that I can provide structured feedback, track performance improvements, and maintain quality standards across the educational platform.

**Scope Note:** This requirement covers general user reviews (student evaluations, teacher assessments, administrative reviews). Support-specific service reviews are covered in Requirement 15.

#### Acceptance Criteria

1. THE User_Review_System SHALL allow authorized users (TEACHER, SCHOOL_ADMIN, SUPER_ADMIN) to create comprehensive reviews via `/admin/user/{userId}/create-review` with multi-dimensional rating scales (1-5 stars), written feedback, and performance categories (Academic, Behavior, Participation, Technical Skills)
2. WHEN creating reviews, THE User_Review_System SHALL support structured evaluation forms with predefined criteria, custom comments, improvement recommendations, and goal-setting capabilities
3. THE User_Review_System SHALL display review history and aggregate ratings via `/admin/user/{userId}/reviews` with role-based visibility: teachers see their student reviews, administrators see institutional reviews, users see their own received reviews
4. THE User_Review_System SHALL notify users when they receive reviews through the Notification_System and allow appropriate responses or acknowledgments
5. THE User_Review_System SHALL generate comprehensive review reports and analytics for administrative decision-making including performance trends and comparative analysis
6. THE User_Review_System SHALL support review templates for different user types (student evaluations, teacher assessments) with customizable criteria
7. THE User_Review_System SHALL maintain review confidentiality and access controls ensuring only authorized personnel can view sensitive evaluation data with audit logging

### Requirement 17: Missing Backend Endpoints Implementation

**User Story:** As a developer, I want all backend API endpoints required by the frontend screens to be fully implemented, so that frontend integration can proceed without blockers and all CRUD operations function end-to-end.

#### Acceptance Criteria

1. THE Backend_API SHALL implement `PUT /institutions/{id}` endpoint to allow SUPER_ADMIN and SCHOOL_ADMIN users to update institution details (name, address, logo, settings), returning the updated institution object with validation for required fields
2. THE Backend_API SHALL implement `DELETE /institutions/{id}` endpoint to allow SUPER_ADMIN users to soft-delete institutions with cascading deactivation of associated users, classrooms, and subjects, requiring confirmation
3. THE Backend_API SHALL implement `POST /institutions/{id}/admins` endpoint to allow SUPER_ADMIN users to assign SCHOOL_ADMIN role to existing users within an institution, with validation that the target user exists and belongs to the institution
4. THE Backend_API SHALL implement `DELETE /institutions/{id}/admins/{adminId}` endpoint to allow SUPER_ADMIN users to remove SCHOOL_ADMIN role from users, with validation that at least one admin remains assigned
5. THE Backend_API SHALL implement `PUT /subjects/{id}` endpoint to allow TEACHER and SCHOOL_ADMIN users to update subject details (name, description, teacher assignment, grading criteria), returning the updated subject object
6. THE Backend_API SHALL implement `DELETE /subjects/{id}` endpoint to allow SCHOOL_ADMIN users to remove subjects from classrooms, with cascading handling of associated tasks, submissions, and units
7. THE Backend_API SHALL implement `GET /teachers/{id}/students` endpoint returning a DISTINCT list of all students taught by the teacher across all assigned subjects, with pagination, search by name/classroom, and filtering to avoid duplicate entries
8. THE Backend_API SHALL implement `GET /teachers/{id}/subjects` endpoint returning all subjects assigned to the teacher with classroom context, student counts per subject, and performance statistics, with pagination support
9. THE Backend_API SHALL complete the empty `GET /users/{id}/tickets` endpoint implementation in UsersController/UsersService to return paginated ticket history for support staff members with filtering by status, category, priority, and date range
10. THE Backend_API SHALL implement `GET /reviews/{reviewId}` endpoint to return individual review details including rating, comments, linked ticket information, reviewer data (with privacy controls), and timestamps
11. THE Backend_API SHALL implement `GET /units/{unitId}/tasks` endpoint to return all tasks within a pedagogical unit, with pagination and filtering by status and deadline, supporting the hierarchical subject > unit > task navigation
12. THE Backend_API SHALL implement `GET /tasks/calendar` endpoint returning tasks mapped by date for calendar view rendering, accepting date range parameters (startDate, endDate) and filtering by user role (student sees enrolled tasks, teacher sees assigned subject tasks)
13. THE Backend_API SHALL implement `DELETE /messages/{conversationId}/history` endpoint to allow users to clear their chat history for a specific conversation, performing a soft-delete that only affects the requesting user's view
14. THE Backend_API SHALL implement `GET /subjects/chats` endpoint returning a list of subject-based group chat contexts available to the authenticated user, including subject name, classroom name, participant count, and last message preview

### Requirement 18: School Library Frontend Integration

**User Story:** As a student or teacher, I want to browse the school library catalog, search for books, view book details, and manage book loans through the mobile app, so that I can access library resources digitally without visiting the physical library.

**Current State:** Backend is fully implemented (GET /library/books, GET /library/categories, GET /library/books/{id}, POST /library/books/{id}/loan, POST /library/books/{id}/return). Frontend `library.tsx` and `book/[id].tsx` screens have not been verified for integration.

#### Acceptance Criteria

1. THE Frontend_App SHALL integrate the library screen (`library.tsx`) with Backend_API endpoint `GET /library/books` displaying a searchable, filterable book catalog with cover images, titles, authors, availability status, and category badges
2. WHEN a user searches for books, THE Frontend_App SHALL send search queries to `GET /library/books?search={query}` and display results with real-time filtering as the user types, with debounced API calls
3. THE Frontend_App SHALL integrate category browsing with Backend_API endpoint `GET /library/categories` displaying all available book categories with book counts per category
4. WHEN a user selects a category, THE Frontend_App SHALL fetch filtered books via `GET /library/books?category={categoryId}` and display category-specific book listings with sorting options (title, author, availability)
5. THE Frontend_App SHALL integrate the book detail screen (`book/[id].tsx`) with Backend_API endpoint `GET /library/books/{id}` displaying comprehensive book information including title, author, ISBN, description, cover image, availability status, and loan history
6. WHEN a student requests a book loan, THE Frontend_App SHALL send the request to Backend_API endpoint `POST /library/books/{id}/loan` and display confirmation with expected return date and updated availability status
7. WHEN a user returns a book, THE Frontend_App SHALL send the return request to Backend_API endpoint `POST /library/books/{id}/return` and update the book's availability status with confirmation feedback
8. THE Frontend_App SHALL display the user's active loans and loan history with return deadlines, overdue indicators, and renewal options
9. IF a book loan request fails due to unavailability, THEN THE Frontend_App SHALL display a clear message indicating the book is currently on loan with the expected return date
10. THE Frontend_App SHALL implement proper loading states with skeleton screens for the book catalog, category list, and book detail views, with pull-to-refresh functionality

### Requirement 19: Calendar and Schedule Frontend Integration

**User Story:** As a student or teacher, I want to view my academic schedule and task deadlines in a unified calendar view, so that I can plan my time effectively and never miss important dates, classes, or assignment deadlines.

**Current State:** Backend schedule endpoints are implemented (GET /schedules, POST /schedules, DELETE /schedules/{id}). Frontend `calendar.tsx` has not been verified for integration. No dedicated `GET /tasks/calendar` endpoint exists yet (see Requirement 17, criterion 12).

#### Acceptance Criteria

1. THE Frontend_App SHALL integrate the calendar screen (`calendar.tsx`) with Backend_API endpoint `GET /schedules` to display the user's academic schedule entries mapped to their corresponding days and time slots
2. WHEN a user views the calendar, THE Frontend_App SHALL aggregate data from both `GET /schedules` (academic timetable) and task deadlines from `GET /projects` with their associated tasks to render a unified calendar view with color-coded event types
3. THE Frontend_App SHALL display calendar events with visual differentiation: class schedules in one color, task deadlines in another, and institutional events in a third, with a legend explaining the color coding
4. WHEN a user taps a calendar date, THE Frontend_App SHALL show a detailed day view listing all events for that date including class times, task deadlines with submission status, and any scheduled meetings
5. WHEN a user taps a specific task deadline in the calendar, THE Frontend_App SHALL navigate to the task detail screen (`/tasks/{id}`) showing full task information and submission status
6. THE Frontend_App SHALL support monthly and weekly calendar views with swipe navigation between periods and a "today" quick-return button
7. WHEN a teacher creates a new schedule entry, THE Frontend_App SHALL send the data to Backend_API endpoint `POST /schedules` with day, time, subject, and classroom information, and update the calendar view immediately
8. WHEN a schedule entry is deleted, THE Frontend_App SHALL send the request to Backend_API endpoint `DELETE /schedules/{id}` and remove the entry from the calendar view with undo capability
9. THE Frontend_App SHALL display deadline proximity indicators on the calendar showing upcoming task deadlines within the next 48 hours with warning colors and badge counts on the calendar tab icon
10. IF no dedicated `GET /tasks/calendar` endpoint exists, THEN THE Frontend_App SHALL compose the calendar data client-side by fetching schedules from `GET /schedules` and extracting task deadlines from project/subject task listings, with appropriate caching to minimize API calls. **NOTE: A dedicated `GET /tasks/calendar` backend endpoint is recommended and specified in Requirement 17, criterion 12**