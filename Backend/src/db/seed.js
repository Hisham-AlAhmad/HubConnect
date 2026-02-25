/**
 * Seed script — populates the database with sample data.
 *
 * Run with:  npm run seed
 *
 * LOCAL PostgreSQL (init.sql):
 *   Inserts auth.users with bcrypt-hashed passwords + all public tables.
 *
 * Supabase cloud (supabase_schema.sql):
 *   Skips auth.users (those must be created via Supabase Dashboard →
 *   Authentication → Users). Only seeds public tables.
 *   After creating Supabase Auth users, update the UUID constants below
 *   to match the generated auth.users IDs, then re-run the seed.
 */

import bcrypt from 'bcryptjs';
import sql from './index.js';
import config from '../config/index.js';

/* ── Helper UUIDs ─────────────────────────────────────────── */
const ADMIN_ID       = '00000000-0000-0000-0000-000000000001';
const INSTRUCTOR_ID  = '00000000-0000-0000-0000-000000000002';
const STUDENT_1_ID   = '00000000-0000-0000-0000-000000000003';
const STUDENT_2_ID   = '00000000-0000-0000-0000-000000000004';
const STUDENT_3_ID   = '00000000-0000-0000-0000-000000000005';
const LEADER_ID      = '00000000-0000-0000-0000-000000000006';

/* Detect Supabase connection so we can skip the custom auth.users step */
const isSupabase = (config.databaseUrl ?? '').includes('supabase');

async function seed() {
    console.log('Seeding database …');
    console.log(`  Mode: ${isSupabase ? 'Supabase cloud' : 'Local PostgreSQL'}`);

    /* ── 0. Auth users ──────────────────────────── */
    const authUsers = [
        { id: ADMIN_ID,      email: 'admin@hub.com',      password: 'admin123',  role: 'admin',        full_name: 'Admin User' },
        { id: INSTRUCTOR_ID, email: 'instructor@hub.com', password: 'inst123',   role: 'instructor',   full_name: 'Jane Instructor' },
        { id: STUDENT_1_ID,  email: 'student@hub.com',    password: 'stud123',   role: 'student',      full_name: 'Alice Student' },
        { id: STUDENT_2_ID,  email: 'student2@hub.com',   password: 'stud123',   role: 'student',      full_name: 'Bob Student' },
        { id: STUDENT_3_ID,  email: 'student3@hub.com',   password: 'stud123',   role: 'student',      full_name: 'Charlie Student' },
        { id: LEADER_ID,     email: 'leader@hub.com',     password: 'lead123',   role: 'team_leader',  full_name: 'Team Leader User' },
    ];

    const rounds = config.bcryptRounds ?? 10;

    if (isSupabase) {
        // On Supabase, try a GoTrue-compatible auth.users insert; fall back to minimal
        for (const u of authUsers) {
            try {
                await sql`
                    INSERT INTO auth.users
                        (id, aud, role, email, encrypted_password,
                         email_confirmed_at, created_at, updated_at,
                         raw_app_meta_data, raw_user_meta_data, is_super_admin,
                         confirmation_token, recovery_token, email_change_token_new, email_change)
                    VALUES
                        (${u.id}, 'authenticated', 'authenticated', ${u.email}, '',
                         NOW(), NOW(), NOW(),
                         ${'{"provider":"email","providers":["email"]}'}::jsonb,
                         '{}'::jsonb, false, '', '', '', '')
                    ON CONFLICT (id) DO NOTHING
                `;
            } catch {
                await sql`INSERT INTO auth.users (id, email) VALUES (${u.id}, ${u.email}) ON CONFLICT (id) DO NOTHING`;
            }
        }
        console.log('\n  ⚠  Supabase detected — auth.users rows created (no password).');
        console.log('     Credentials (password_hash + role) are stored in profiles below.');
        console.log('     Demo accounts:');
        for (const u of authUsers) {
            console.log(`       ${u.email}  /  ${u.password}`);
        }
        console.log();
    } else {
        // Local: auth.users only needs id + email (credentials go into profiles)
        for (const u of authUsers) {
            await sql`
                INSERT INTO auth.users (id, email)
                VALUES (${u.id}, ${u.email})
                ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
            `;
        }
        console.log('  Auth users seeded');
    }

    /* ── 1. Organization ────────────────────────── */
    const [org] = await sql`
    INSERT INTO organizations (name, slug, description)
    VALUES ('HubConnect Academy', 'hubconnect-academy', 'Main organization for HubConnect')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;
    const orgId = org.id;
    console.log('  Organization:', orgId);

    /* ── 2. Profiles (with credentials) ────────── */
    // password_hash and role now live in profiles
    for (const u of authUsers) {
        const hash = await bcrypt.hash(u.password, rounds);
        await sql`
            INSERT INTO profiles (id, email, full_name, role, password_hash)
            VALUES (${u.id}, ${u.email}, ${u.full_name}, ${u.role}, ${hash})
            ON CONFLICT (id) DO UPDATE
                SET full_name     = EXCLUDED.full_name,
                    role          = EXCLUDED.role,
                    password_hash = EXCLUDED.password_hash
        `;
    }
    console.log('  Profiles seeded (with credentials)');

    /* ── 3. Organization users ──────────────────── */
    for (const u of authUsers) {
        await sql`
      INSERT INTO organization_users (organization_id, user_id)
      VALUES (${orgId}, ${u.id})
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
        { userId: ADMIN_ID,      role: 'admin' },
        { userId: INSTRUCTOR_ID, role: 'instructor' },
        { userId: STUDENT_1_ID,  role: 'student' },
        { userId: STUDENT_2_ID,  role: 'student' },
        { userId: STUDENT_3_ID,  role: 'student' },
        { userId: LEADER_ID,     role: 'team_leader' },
    ];

    for (const a of roleAssignments) {
        await sql`
      INSERT INTO user_roles (organization_id, user_id, role_id)
      VALUES (${orgId}, ${a.userId}, ${roleIds[a.role]})
      ON CONFLICT (organization_id, user_id, role_id) DO NOTHING
    `;
    }
    console.log('  User roles assigned');

    /* ── 6. Cohort ──────────────────────────────── */
    const [cohort] = await sql`
    INSERT INTO cohorts (organization_id, name, code, start_date, end_date)
    VALUES (${orgId}, 'Cohort 2026-A', 'C2026A', '2026-01-01', '2026-06-30')
    ON CONFLICT DO NOTHING
    RETURNING id
  `;
    const cohortId = cohort?.id;

    if (cohortId) {
        for (const u of authUsers) {
            await sql`
        INSERT INTO user_cohorts (organization_id, user_id, cohort_id)
        VALUES (${orgId}, ${u.id}, ${cohortId})
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
      VALUES (${orgId}, ${courseId}, 'Team Alpha', ${LEADER_ID}, ${INSTRUCTOR_ID})
      ON CONFLICT (course_id, name) DO UPDATE SET team_leader_id = EXCLUDED.team_leader_id
      RETURNING id
    `;
        const teamId = team.id;

        const teamStudents = [STUDENT_1_ID, STUDENT_2_ID, STUDENT_3_ID, LEADER_ID];
        for (const uid of teamStudents) {
            await sql`
        INSERT INTO team_members (organization_id, team_id, user_id)
        VALUES (${orgId}, ${teamId}, ${uid})
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
        INSERT INTO submissions (organization_id, task_id, team_id, submitted_by, status, github_link, comment)
        VALUES (
          ${orgId}, ${task.id}, ${teamId}, ${STUDENT_1_ID},
          'submitted',
          'https://github.com/example/api',
          'Here is our submission!'
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
      INSERT INTO notifications (organization_id, recipient_id, actor_id, notification_type, title, message)
      VALUES (
        ${orgId}, ${STUDENT_1_ID}, ${INSTRUCTOR_ID},
        'task_assigned', 'New Task Assigned',
        'You have been assigned "Build REST API".'
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
