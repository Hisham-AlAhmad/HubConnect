/**
 * Seed script — populates the database with sample data.
 *
 * Run with:  npm run seed
 *
 * NOTE: This script uses raw SQL via the `postgres` driver.
 *       Supabase auth.users rows are NOT created here (those
 *       live inside Supabase Auth). We insert only into public
 *       tables and reference hard-coded UUIDs so foreign keys
 *       are satisfied. Adjust the UUIDs below to match real
 *       auth.users rows in your Supabase project.
 */

import sql from '../db/index.js';

/* ── Helper UUIDs (replace with real auth.users ids) ── */
const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const INSTRUCTOR_ID = '00000000-0000-0000-0000-000000000002';
const STUDENT_1_ID = '00000000-0000-0000-0000-000000000003';
const STUDENT_2_ID = '00000000-0000-0000-0000-000000000004';
const STUDENT_3_ID = '00000000-0000-0000-0000-000000000005';

async function seed() {
    console.log('Seeding database …');

    /* ── 1. Organization ────────────────────────── */
    const [org] = await sql`
    INSERT INTO organizations (name, slug, description, created_by)
    VALUES ('HubConnect Academy', 'hubconnect-academy', 'Main organization for HubConnect', ${ADMIN_ID})
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;
    const orgId = org.id;
    console.log('  Organization:', orgId);

    /* ── 2. Profiles ────────────────────────────── */
    const profiles = [
        { id: ADMIN_ID, email: 'admin@hub.com', full_name: 'Admin User' },
        { id: INSTRUCTOR_ID, email: 'instructor@hub.com', full_name: 'Jane Instructor' },
        { id: STUDENT_1_ID, email: 'student1@hub.com', full_name: 'Alice Student' },
        { id: STUDENT_2_ID, email: 'student2@hub.com', full_name: 'Bob Student' },
        { id: STUDENT_3_ID, email: 'student3@hub.com', full_name: 'Charlie Student' },
    ];

    for (const p of profiles) {
        await sql`
      INSERT INTO profiles (id, email, full_name)
      VALUES (${p.id}, ${p.email}, ${p.full_name})
      ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name
    `;
    }
    console.log('  Profiles seeded');

    /* ── 3. Organization users ──────────────────── */
    for (const p of profiles) {
        await sql`
      INSERT INTO organization_users (organization_id, user_id)
      VALUES (${orgId}, ${p.id})
      ON CONFLICT (organization_id, user_id) DO NOTHING
    `;
    }
    console.log('  Organization users linked');

    /* ── 4. Roles ───────────────────────────────── */
    const roleNames = ['admin', 'instructor', 'student', 'team_leader'];
    const roleIds = {};

    for (const name of roleNames) {
        const [role] = await sql`
      INSERT INTO roles (organization_id, name, is_system_role)
      VALUES (${orgId}, ${name}, true)
      ON CONFLICT (organization_id, name) DO UPDATE SET is_system_role = true
      RETURNING id
    `;
        roleIds[name] = role.id;
    }
    console.log('  Roles seeded');

    /* ── 5. Assign roles ────────────────────────── */
    const roleAssignments = [
        { userId: ADMIN_ID, role: 'admin' },
        { userId: INSTRUCTOR_ID, role: 'instructor' },
        { userId: STUDENT_1_ID, role: 'student' },
        { userId: STUDENT_2_ID, role: 'student' },
        { userId: STUDENT_3_ID, role: 'student' },
    ];

    for (const a of roleAssignments) {
        await sql`
      INSERT INTO user_roles (organization_id, user_id, role_id, assigned_by)
      VALUES (${orgId}, ${a.userId}, ${roleIds[a.role]}, ${ADMIN_ID})
      ON CONFLICT (organization_id, user_id, role_id) DO NOTHING
    `;
    }
    console.log('  User roles assigned');

    /* ── 6. Cohort ──────────────────────────────── */
    const [cohort] = await sql`
    INSERT INTO cohorts (organization_id, name, code, start_date, end_date, created_by)
    VALUES (${orgId}, 'Cohort 2026-A', 'C2026A', '2026-01-01', '2026-06-30', ${ADMIN_ID})
    ON CONFLICT DO NOTHING
    RETURNING id
  `;
    const cohortId = cohort?.id;

    if (cohortId) {
        for (const p of profiles) {
            await sql`
        INSERT INTO user_cohorts (organization_id, user_id, cohort_id, created_by)
        VALUES (${orgId}, ${p.id}, ${cohortId}, ${ADMIN_ID})
        ON CONFLICT (organization_id, user_id, cohort_id) DO NOTHING
      `;
        }
        console.log('  Cohort seeded');
    }

    /* ── 7. Course ──────────────────────────────── */
    const [course] = await sql`
    INSERT INTO courses (organization_id, cohort_id, name, description, created_by)
    VALUES (${orgId}, ${cohortId}, 'Full-Stack Web Development', 'Learn to build modern web apps', ${INSTRUCTOR_ID})
    ON CONFLICT DO NOTHING
    RETURNING id
  `;
    const courseId = course?.id;
    console.log('  Course seeded');

    /* ── 8. Team ────────────────────────────────── */
    if (courseId) {
        const [team] = await sql`
      INSERT INTO teams (organization_id, course_id, name, team_leader_id, created_by)
      VALUES (${orgId}, ${courseId}, 'Team Alpha', ${STUDENT_1_ID}, ${INSTRUCTOR_ID})
      ON CONFLICT (course_id, name) DO UPDATE SET team_leader_id = EXCLUDED.team_leader_id
      RETURNING id
    `;
        const teamId = team.id;

        const teamStudents = [STUDENT_1_ID, STUDENT_2_ID, STUDENT_3_ID];
        for (const uid of teamStudents) {
            await sql`
        INSERT INTO team_members (organization_id, team_id, user_id, created_by)
        VALUES (${orgId}, ${teamId}, ${uid}, ${INSTRUCTOR_ID})
        ON CONFLICT (team_id, user_id) DO NOTHING
      `;
        }
        console.log('  Team & members seeded');

        /* ── 9. Task ──────────────────────────────── */
        const [task] = await sql`
      INSERT INTO tasks (organization_id, course_id, team_id, title, description, priority, due_date, created_by)
      VALUES (
        ${orgId}, ${courseId}, ${teamId},
        'Build REST API', 'Create an Express REST API with all CRUD endpoints.',
        'high', '2026-03-15', ${INSTRUCTOR_ID}
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

        if (task) {
            /* ── 10. Submission ─────────────────────── */
            await sql`
        INSERT INTO submissions (organization_id, task_id, team_id, submitted_by, status, github_link, comment, created_by)
        VALUES (
          ${orgId}, ${task.id}, ${teamId}, ${STUDENT_1_ID},
          'submitted',
          'https://github.com/example/api',
          'Here is our submission!',
          ${STUDENT_1_ID}
        )
        ON CONFLICT DO NOTHING
      `;
            console.log('  Task & submission seeded');
        }

        /* ── 11. Chat room & message ──────────────── */
        const [room] = await sql`
      INSERT INTO chat_rooms (organization_id, room_name, room_type, course_id, team_id, created_by)
      VALUES (${orgId}, 'Team Alpha Chat', 'team', ${courseId}, ${teamId}, ${INSTRUCTOR_ID})
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

        if (room) {
            await sql`
        INSERT INTO messages (organization_id, chat_room_id, sender_id, content)
        VALUES (${orgId}, ${room.id}, ${STUDENT_1_ID}, 'Hey team, let''s get started!')
      `;
            console.log('  Chat room & message seeded');
        }

        /* ── 12. Notification ─────────────────────── */
        await sql`
      INSERT INTO notifications (organization_id, recipient_id, actor_id, notification_type, title, message, created_by)
      VALUES (
        ${orgId}, ${STUDENT_1_ID}, ${INSTRUCTOR_ID},
        'task_assigned', 'New Task Assigned',
        'You have been assigned "Build REST API".',
        ${INSTRUCTOR_ID}
      )
      ON CONFLICT DO NOTHING
    `;
        console.log('  Notification seeded');
    }

    console.log('\nSeeding complete!');
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
