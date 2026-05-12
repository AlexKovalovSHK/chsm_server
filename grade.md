# Grade Management API (for Frontend Developers)

This document outlines the API endpoints for managing grades, including individual grade entries and gradebooks. The primary entities are `GradeEntry` (individual score for a student/subject) and `Gradebook` (a summary or official record of an enrollment's grades).

## 1. GradeController (Manages individual GradeEntry records)

This controller is responsible for CRUD operations on `GradeEntry` records. Each `GradeEntry` represents a single grade received by a student for a specific subject within an enrollment.

**Base URL:** `/grades`

### 1.1. GradeEntry Model & DTOs

#### GradeEntry Schema (from `prisma/schema.prisma`)
```/dev/null/prisma.schema.prisma#L141-152
model GradeEntry {
  id           String   @id @default(uuid()) @db.Uuid
  enrollmentId String   @map("enrollment_id") @db.Uuid
  subjectId    String   @map("subject_id") @db.Uuid
  value        Int
  source       String? // Например, "Google Classroom" или "Manual"
  recordedAt   DateTime @default(now()) @map("recorded_at")

  enrollment Enrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  subject    Subject    @relation(fields: [subjectId], references: [id])

  @@map("grade_entries")
}
```

#### CreateGradeDto (`chsm_classroom_integrations/src/grade/dto/create-grade.dto.ts`)
Used for creating new grade entries.

| Field          | Type     | Required | Description                                     | Constraints                                         | Example Value                            |
| :------------- | :------- | :------- | :---------------------------------------------- | :-------------------------------------------------- | :--------------------------------------- |
| `enrollmentId` | `string` | Yes      | UUID of the enrollment record.                  | `@IsUUID()`, `@IsNotEmpty()`                        | `"a1b2c3d4-e5f6-7890-1234-567890abcdef"` |
| `subjectId`    | `string` | Yes      | UUID of the subject.                            | `@IsUUID()`, `@IsNotEmpty()`                        | `"f1e2d3c4-b5a6-9876-5432-10fedcba9876"` |
| `value`        | `number` | Yes      | The numerical grade.                            | `@IsInt()`, `@Min(0)`, `@Max(100)`, `@IsNotEmpty()` | `85`                                     |
| `source`       | `string` | Yes      | Source of the grade (e.g., "Manual", "Homework"). | `@IsString()`, `@IsNotEmpty()`                      | `"Manual Entry - Midterm Exam"`          |

#### UpdateGradeDto (`chsm_classroom_integrations/src/grade/dto/update-grade.dto.ts`)
Used for updating existing grade entries. All fields are optional.

| Field          | Type     | Required | Description                     | Constraints                                         | Example Value                            |
| :------------- | :------- | :------- | :------------------------------ | :-------------------------------------------------- | :--------------------------------------- |
| `enrollmentId` | `string` | No       | UUID of the enrollment record.  | `@IsUUID()`, `@IsOptional()`                        | `"a1b2c3d4-e5f6-7890-1234-567890abcdef"` |
| `subjectId`    | `string` | No       | UUID of the subject.            | `@IsUUID()`, `@IsOptional()`                        | `"f1e2d3c4-b5a6-9876-5432-10fedcba9876"` |
| `value`        | `number` | No       | The numerical grade.            | `@IsInt()`, `@Min(0)`, `@Max(100)`, `@IsOptional()` | `92`                                     |
| `source`       | `string` | No       | Source of the grade.            | `@IsString()`, `@IsOptional()`                      | `"Manual Entry - Midterm Exam (Revised)"`|

### 1.2. Endpoints

#### `POST /grades` - Create a new GradeEntry
- **Description:** Creates a new grade record.
- **Request Body:** `CreateGradeDto`
- **Response:** `GradeEntry` object (201 Created)

**Example Request:**
```json
{
    "enrollmentId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "subjectId": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
    "value": 85,
    "source": "Manual Entry - Midterm Exam"
}
```

#### `GET /grades` - Get all GradeEntries
- **Description:** Retrieves a list of all grade entries.
- **Response:** `GradeEntry[]` (200 OK)

#### `GET /grades/:id` - Get a GradeEntry by ID
- **Description:** Retrieves a single grade entry by its UUID.
- **Path Params:** `id` (UUID of the grade entry)
- **Response:** `GradeEntry` object (200 OK) or 404 Not Found.

#### `GET /grades/enrollment/:enrollmentId` - Get GradeEntries by Enrollment ID
- **Description:** Retrieves all grade entries associated with a specific enrollment.
- **Path Params:** `enrollmentId` (UUID of the enrollment)
- **Response:** `GradeEntry[]` (200 OK)

#### `GET /grades/subject/:subjectId` - Get GradeEntries by Subject ID
- **Description:** Retrieves all grade entries associated with a specific subject.
- **Path Params:** `subjectId` (UUID of the subject)
- **Response:** `GradeEntry[]` (200 OK)

#### `PUT /grades/:id` - Update a GradeEntry by ID
- **Description:** Updates an existing grade entry.
- **Path Params:** `id` (UUID of the grade entry)
- **Request Body:** `UpdateGradeDto`
- **Response:** Updated `GradeEntry` object (200 OK) or 404 Not Found.

**Example Request (partial update):**
```json
{
    "value": 92,
    "source": "Manual Entry - Midterm Exam (Revised)"
}
```

#### `DELETE /grades/:id` - Delete a GradeEntry by ID
- **Description:** Deletes a grade entry by its UUID.
- **Path Params:** `id` (UUID of the grade entry)
- **Response:** Empty body (204 No Content) or 404 Not Found.

---

## 2. GradebookController (Manages Gradebook records)

This controller handles `Gradebook` records, which typically represent a final or summary record of a student's performance within an enrollment, with a specific status (e.g., DRAFT, SUBMITTED, APPROVED).

**Base URL:** `/gradebooks`

### 2.1. Gradebook Model & DTOs

#### Gradebook Schema (from `prisma/schema.prisma`)
```/dev/null/prisma.schema.prisma#L155-164
model Gradebook {
  id           String          @id @default(uuid()) @db.Uuid
  enrollmentId String          @map("enrollment_id") @db.Uuid
  status       GradebookStatus @default(DRAFT)
  approvedAt   DateTime?       @map("approved_at")
  approvedBy   String?         @map("approved_by") // ID админа или имя

  enrollment Enrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)

  @@map("gradebooks")
}
```
**`GradebookStatus` Enum:** `PLANNED`, `ACTIVE`, `COMPLETED`, `ARCHIVED` (Note: `GradebookStatus` has `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED` in schema, please use those values)

#### CreateGradebookDto (`chsm_classroom_integrations/src/grades/gradebooks/dto/create-gradebook.dto.ts`)
Used for creating new gradebook records.

| Field          | Type                | Required | Description                                                    | Constraints                                                | Example Value                            |
| :------------- | :------------------ | :------- | :------------------------------------------------------------- | :--------------------------------------------------------- | :--------------------------------------- |
| `enrollmentId` | `string`            | Yes      | UUID of the enrollment record.                                 | `@IsUUID()`, `@IsNotEmpty()`                               | `"a1b2c3d4-e5f6-7890-1234-567890abcdef"` |
| `status`       | `GradebookStatus` | No       | Current status of the gradebook (e.g., `DRAFT`, `APPROVED`). | `@IsEnum(GradebookStatus)`, `@IsOptional()`                | `"DRAFT"`                                |
| `approvedAt`   | `string`            | No       | ISO-8601 date string for approval.                             | `@IsDateString()`, `@IsOptional()`                         | `"2023-10-27T14:30:00.000Z"`             |
| `approvedBy`   | `string`            | No       | Identifier of the approver (e.g., admin ID or name).           | `@IsString()`, `@IsOptional()`                             | `"admin@school.local"`                   |

#### UpdateGradebookDto (`chsm_classroom_integrations/src/grades/gradebooks/dto/update-gradebook.dto.ts`)
Used for updating existing gradebook records. All fields are optional. Extends `PartialType(CreateGradebookDto)`.

| Field          | Type                | Required | Description                                     | Constraints                                | Example Value                            |
| :------------- | :------------------ | :------- | :---------------------------------------------- | :----------------------------------------- | :--------------------------------------- |
| `enrollmentId` | `string`            | No       | UUID of the enrollment record.                  | `@IsUUID()`, `@IsOptional()`               | `"a1b2c3d4-e5f6-7890-1234-567890abcdef"` |
| `status`       | `GradebookStatus` | No       | Current status of the gradebook.                | `@IsEnum(GradebookStatus)`, `@IsOptional()`| `"APPROVED"`                             |
| `approvedAt`   | `string`            | No       | ISO-8601 date string for approval.              | `@IsDateString()`, `@IsOptional()`         | `"2023-10-27T15:00:00.000Z"`             |
| `approvedBy`   | `string`            | No       | Identifier of the approver.                     | `@IsString()`, `@IsOptional()`             | `"another_admin@school.local"`           |

### 2.2. Endpoints (Based on standard CRUD for Gradebook)

#### `POST /gradebooks` - Create a new Gradebook
- **Description:** Creates a new gradebook record for an enrollment.
- **Request Body:** `CreateGradebookDto`
- **Response:** `Gradebook` object (201 Created)

**Example Request:**
```json
{
    "enrollmentId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "status": "DRAFT"
}
```

#### `GET /gradebooks` - Get all Gradebooks
- **Description:** Retrieves a list of all gradebooks.
- **Response:** `Gradebook[]` (200 OK)

#### `GET /gradebooks/:id` - Get a Gradebook by ID
- **Description:** Retrieves a single gradebook by its UUID.
- **Path Params:** `id` (UUID of the gradebook)
- **Response:** `Gradebook` object (200 OK) or 404 Not Found.

#### `PUT /gradebooks/:id` - Update a Gradebook by ID
- **Description:** Updates an existing gradebook.
- **Path Params:** `id` (UUID of the gradebook)
- **Request Body:** `UpdateGradebookDto`
- **Response:** Updated `Gradebook` object (200 OK) or 404 Not Found.

**Example Request (partial update):**
```json
{
    "status": "APPROVED",
    "approvedAt": "2023-10-27T15:00:00.000Z",
    "approvedBy": "admin_user_id"
}
```

#### `DELETE /gradebooks/:id` - Delete a Gradebook by ID
- **Description:** Deletes a gradebook by its UUID.
- **Path Params:** `id` (UUID of the gradebook)
- **Response:** Empty body (204 No Content) or 404 Not Found.

---

## 3. General Notes for Frontend

*   **Authentication/Authorization:** All endpoints will likely require proper authentication (e.g., JWT token in `Authorization` header) and authorization based on user roles (student, teacher, admin).
*   **Error Handling:** Expect standard HTTP error codes (e.g., 400 Bad Request for validation errors, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error). Error bodies will typically be JSON objects with `statusCode`, `message`, and `error` fields.
*   **UUIDs:** All IDs (`id`, `enrollmentId`, `subjectId`) are UUIDs.
*   **Date Formats:** `approvedAt` and `recordedAt` fields are ISO-8601 date strings.
*   **Validation:** DTOs are validated on the backend using `class-validator` decorators. Ensure frontend inputs adhere to these constraints to avoid `400 Bad Request` errors.
*   **Interactions:**
    *   To display a student's grades for a specific course, you would first fetch the `enrollmentId` for that student and course, then use `GET /grades/enrollment/:enrollmentId`.
    *   To view a summary of grades, you might query `GET /gradebooks` or `GET /gradebooks/:id` if you need the official status of an enrollment's grade.

This document provides a comprehensive overview of the grade-related APIs for frontend integration.