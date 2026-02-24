import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

export const CourseContext = createContext(null);

/* ── Mock data ─────────────────────────────────────────────── */
const MOCK_COURSES = [
    {
        id: 'crs-1',
        name: 'Spring 2026 Training',
        createdBy: '2',  // instructor
        createdDate: '2026-01-15',
        endDate: '2026-06-30',
        status: 'active',
        cohortId: 'coh-1',
        teams: [
            {
                id: 'ct-1',
                name: 'Team Alpha',
                leaderId: '4',  // leader user
                members: ['3', '4'],
                firstSubmissionDate: '2026-02-01',
                lastSubmissionDate: '2026-02-18',
            },
            {
                id: 'ct-2',
                name: 'Team Beta',
                leaderId: null,
                members: [],
                firstSubmissionDate: null,
                lastSubmissionDate: null,
            },
        ],
        tasks: [
            {
                id: 'cst-1',
                title: 'Setup project repo',
                description: 'Initialize the team repository with proper README and folder structure.',
                priority: 'high',
                status: 'done',
                createdBy: '4',       // team leader
                assignedTeamId: 'ct-1',
                createdAt: '2026-02-01',
            },
            {
                id: 'cst-2',
                title: 'Draft wireframes',
                description: 'Create basic wireframes for the main dashboard and login page.',
                priority: 'medium',
                status: 'in_progress',
                createdBy: '4',
                assignedTeamId: 'ct-1',
                createdAt: '2026-02-10',
            },
        ],
    },
    {
        id: 'crs-2',
        name: 'Fall 2025 Cohort',
        createdBy: '1',  // admin
        createdDate: '2025-08-01',
        endDate: '2025-12-31',
        status: 'finished',
        cohortId: 'coh-2',
        teams: [],
        tasks: [],
    },
];

export const CourseProvider = ({ children }) => {
    const { user } = useAuth();
    const [courses, setCourses] = useState(MOCK_COURSES);
    const [activeCourse, setActiveCourse] = useState(null);

    // Resolve default active course
    useEffect(() => {
        if (!user) { setActiveCourse(null); return; }
        const active = courses.find((c) => c.status === 'active');
        setActiveCourse(active || null);
    }, [user, courses]);

    /* ── CRUD helpers ──────────────────────────────────────── */

    const createCourse = useCallback((data) => {
        // Only admin/instructor can create
        if (!user || !['admin', 'instructor'].includes(user.role)) return null;

        // Check: instructor cannot have two active courses
        if (user.role === 'instructor') {
            const existingActive = courses.find(
                (c) => c.createdBy === user.id && c.status === 'active'
            );
            if (existingActive) {
                return { error: 'You already have an active course. Finish it before creating a new one.' };
            }
        }

        const newCourse = {
            id: `crs-${Date.now()}`,
            createdBy: user.id,
            createdDate: new Date().toISOString().split('T')[0],
            status: 'active',
            teams: [],
            tasks: [],
            ...data,
        };
        setCourses((prev) => [...prev, newCourse]);
        return { data: newCourse };
    }, [user, courses]);

    const updateCourse = useCallback((courseId, data) => {
        setCourses((prev) =>
            prev.map((c) => (c.id === courseId ? { ...c, ...data } : c))
        );
    }, []);

    const finishCourse = useCallback((courseId) => {
        updateCourse(courseId, { status: 'finished' });
    }, [updateCourse]);

    /* ── Team helpers ──────────────────────────────────────── */

    const addTeamToCourse = useCallback((courseId, team) => {
        setCourses((prev) =>
            prev.map((c) => {
                if (c.id !== courseId) return c;
                return { ...c, teams: [...c.teams, { id: `ct-${Date.now()}`, members: [], firstSubmissionDate: null, lastSubmissionDate: null, leaderId: null, ...team }] };
            })
        );
    }, []);

    const assignTeamLeader = useCallback((courseId, teamId, studentId) => {
        setCourses((prev) =>
            prev.map((c) => {
                if (c.id !== courseId) return c;
                return {
                    ...c,
                    teams: c.teams.map((t) =>
                        t.id === teamId ? { ...t, leaderId: studentId } : t
                    ),
                };
            })
        );
    }, []);

    const addMemberToTeam = useCallback((courseId, teamId, studentId) => {
        // Student can only belong to one team per course
        setCourses((prev) =>
            prev.map((c) => {
                if (c.id !== courseId) return c;
                const alreadyInTeam = c.teams.some((t) => t.members.includes(studentId));
                if (alreadyInTeam) return c; // prevent duplicate
                return {
                    ...c,
                    teams: c.teams.map((t) =>
                        t.id === teamId ? { ...t, members: [...t.members, studentId] } : t
                    ),
                };
            })
        );
    }, []);

    const removeMemberFromTeam = useCallback((courseId, teamId, studentId) => {
        setCourses((prev) =>
            prev.map((c) => {
                if (c.id !== courseId) return c;
                return {
                    ...c,
                    teams: c.teams.map((t) =>
                        t.id === teamId
                            ? { ...t, members: t.members.filter((m) => m !== studentId), leaderId: t.leaderId === studentId ? null : t.leaderId }
                            : t
                    ),
                };
            })
        );
    }, []);

    /* ── Task helpers (team-leader tasks) ──────────────────── */

    const addTaskToCourse = useCallback((courseId, task) => {
        const newTask = {
            id: `cst-${Date.now()}`,
            status: 'todo',
            createdAt: new Date().toISOString(),
            ...task,
        };
        setCourses((prev) =>
            prev.map((c) => {
                if (c.id !== courseId) return c;
                return { ...c, tasks: [...c.tasks, newTask] };
            })
        );
        return newTask;
    }, []);

    const updateTaskInCourse = useCallback((courseId, taskId, data) => {
        setCourses((prev) =>
            prev.map((c) => {
                if (c.id !== courseId) return c;
                return {
                    ...c,
                    tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, ...data } : t)),
                };
            })
        );
    }, []);

    /* ── Role helpers (course-scoped) ──────────────────────── */

    /**
     * Check if the current user is a team leader in the given course.
     * Returns the team object they lead, or null.
     */
    const getLeadingTeam = useCallback((courseId) => {
        if (!user) return null;
        const course = courses.find((c) => c.id === courseId);
        if (!course) return null;
        return course.teams.find((t) => t.leaderId === user.id) || null;
    }, [user, courses]);

    const isTeamLeaderInCourse = useCallback((courseId) => {
        return !!getLeadingTeam(courseId);
    }, [getLeadingTeam]);

    const value = {
        courses,
        activeCourse,
        setActiveCourse,
        createCourse,
        updateCourse,
        finishCourse,
        addTeamToCourse,
        assignTeamLeader,
        addMemberToTeam,
        removeMemberFromTeam,
        addTaskToCourse,
        updateTaskInCourse,
        getLeadingTeam,
        isTeamLeaderInCourse,
    };

    return (
        <CourseContext.Provider value={value}>
            {children}
        </CourseContext.Provider>
    );
};

export const useCourse = () => {
    const ctx = useContext(CourseContext);
    if (!ctx) throw new Error('useCourse must be used within CourseProvider');
    return ctx;
};

export default CourseContext;
