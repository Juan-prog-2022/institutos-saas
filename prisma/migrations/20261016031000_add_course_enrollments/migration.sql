CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Enrollment" ("id", "studentId", "courseId", "tenantId")
SELECT
    'legacy-' || md5("studentId" || '|' || "courseId"),
    "studentId",
    "courseId",
    "tenantId"
FROM (
    SELECT "studentId", "courseId", "tenantId"
    FROM "Grade"
    WHERE "courseId" IS NOT NULL
    UNION
    SELECT "studentId", "courseId", "tenantId"
    FROM "Attendance"
    WHERE "courseId" IS NOT NULL
) AS "courseStudents";

CREATE UNIQUE INDEX "Enrollment_studentId_courseId_key" ON "Enrollment"("studentId", "courseId");
CREATE INDEX "Enrollment_tenantId_idx" ON "Enrollment"("tenantId");
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
