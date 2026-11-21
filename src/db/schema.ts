import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at").notNull().defaultNow();
const updatedAt = () => timestamp("updated_at").notNull().defaultNow();
const stringList = (name: string) => jsonb(name).$type<string[]>().notNull().default([]);

// D-18: no real auth, one mock student. Every user-scoped table still keys on user.id.
export const MOCK_USER = { id: "mock-student", name: "Test Student", email: "student@example.test" } as const;

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const faculty = pgTable("faculty", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  coordinatorName: text("coordinator_name"),
  coordinatorEmail: text("coordinator_email").notNull(),
  sourceUrl: text("source_url").notNull(),
  checkedOn: text("checked_on").notNull(),
});

export const course = pgTable(
  "course",
  {
    // Surrogate id `<FACULTY>-<B|M>-<sheetRow>` (e.g. AC-B-12); codes repeat across faculties.
    id: text("id").primaryKey(),
    facultyCode: text("faculty_code").notNull().references(() => faculty.code),
    level: text("level").notNull(),
    programme: text("programme").notNull(),
    field: text("field"),
    programmeDesc: text("programme_desc"),
    name: text("name").notNull(),
    code: text("code").notNull(),
    studyYear: integer("study_year").notNull(),
    semester: integer("semester").notNull(),
    ects: integer("ects").notNull(),
    listedLanguage: text("listed_language"),
    languageLabel: text("language_label"),
    sourceYear: text("source_year").notNull().default("2026-27"),
    sourceFile: text("source_file").notNull(),
    sourceRow: integer("source_row").notNull(),
    hasSyllabus: boolean("has_syllabus").notNull().default(false),
    // D-20: content-only embedding (name + topics), filled offline.
    topics: stringList("topics"),
    topicsSource: text("topics_source"), // 'inferred' | 'syllabus'
    embedding: vector("embedding", { dimensions: 768 }),
  },
  (t) => [
    index("course_code_idx").on(t.code),
    index("course_semester_idx").on(t.semester),
    index("course_ects_idx").on(t.ects),
    index("course_has_syllabus_idx").on(t.hasSyllabus),
  ],
);

export const syllabus = pgTable("syllabus", {
  courseId: text("course_id")
    .primaryKey()
    .references(() => course.id, { onDelete: "cascade" }),
  docLanguage: text("doc_language"),
  academicYear: text("academic_year"),
  objectives: stringList("objectives"),
  courseTopics: stringList("course_topics"),
  appliedTopics: stringList("applied_topics"),
  localFile: text("local_file").notNull(),
  originalUrl: text("original_url").notNull(),
  downloadedOn: text("downloaded_on"),
});

export const profile = pgTable("profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  homeUniversity: text("home_university"),
  semesterFilter: text("semester_filter").notNull().default("any"),
});

export const homeCourse = pgTable(
  "home_course",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    topics: stringList("topics"),
    ects: real("ects"),
    studyYear: integer("study_year"),
    source: text("source").notNull().default("typed"),
    matchHash: text("match_hash"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("home_course_user_idx").on(t.userId)],
);

export const matchCache = pgTable("match_cache", {
  hash: text("hash").primaryKey(),
  result: jsonb("result").notNull(),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull(),
  createdAt: createdAt(),
});

// D-12: no semester/season column. Winter/Summer always comes from the course row.
export const laItem = pgTable(
  "la_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id),
    homeCourseId: uuid("home_course_id").references(() => homeCourse.id, { onDelete: "set null" }),
    addedAt: timestamp("added_at").notNull().defaultNow(),
  },
  (t) => [unique("la_item_user_course_uq").on(t.userId, t.courseId)],
);

export type User = typeof user.$inferSelect;
export type Course = typeof course.$inferSelect;
export type Faculty = typeof faculty.$inferSelect;
export type Syllabus = typeof syllabus.$inferSelect;
export type HomeCourse = typeof homeCourse.$inferSelect;
export type LaItem = typeof laItem.$inferSelect;
export type Profile = typeof profile.$inferSelect;
