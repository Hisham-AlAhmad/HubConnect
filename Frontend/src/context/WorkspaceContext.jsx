import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

export const WorkspaceContext = createContext(null);

/* ── Mock data ─────────────────────────────────────────────── */
const MOCK_WORKSPACES = [
    {
        id: 'ws-1',
        name: 'Spring 2026 Training',
        createdBy: '2',  // instructor
        createdDate: '2026-01-15',
        endDate: '2026-06-30',
        status: 'active',
        internshipId: 'int-1',
        teams: [
            {
                id: 'wt-1',
                name: 'Team Alpha',
                leaderId: '4',  // leader user
                members: ['3', '4'],
                firstSubmissionDate: '2026-02-01',
                lastSubmissionDate: '2026-02-18',
            },
            {
                id: 'wt-2',
                name: 'Team Beta',
                leaderId: null,
                members: [],
                firstSubmissionDate: null,
                lastSubmissionDate: null,
            },
        ],
        tasks: [
            {
                id: 'wst-1',
                title: 'Setup project repo',
                description: 'Initialize the team repository with proper README and folder structure.',
                priority: 'high',
                status: 'done',
                createdBy: '4',       // team leader
                assignedTeamId: 'wt-1',
                createdAt: '2026-02-01',
            },
            {
                id: 'wst-2',
                title: 'Draft wireframes',
                description: 'Create basic wireframes for the main dashboard and login page.',
                priority: 'medium',
                status: 'in_progress',
                createdBy: '4',
                assignedTeamId: 'wt-1',
                createdAt: '2026-02-10',
            },
        ],
    },
    {
        id: 'ws-2',
        name: 'Fall 2025 Cohort',
        createdBy: '1',  // admin
        createdDate: '2025-08-01',
        endDate: '2025-12-31',
        status: 'finished',
        internshipId: 'int-2',
        teams: [],
        tasks: [],
    },
];

export const WorkspaceProvider = ({ children }) => {
    const { user } = useAuth();
    const [workspaces, setWorkspaces] = useState(MOCK_WORKSPACES);
    const [activeWorkspace, setActiveWorkspace] = useState(null);

    // Resolve default active workspace
    useEffect(() => {
        if (!user) { setActiveWorkspace(null); return; }
        const active = workspaces.find((ws) => ws.status === 'active');
        setActiveWorkspace(active || null);
    }, [user, workspaces]);

    /* ── CRUD helpers ──────────────────────────────────────── */

    const createWorkspace = useCallback((data) => {
        // Only admin/instructor can create
        if (!user || !['admin', 'instructor'].includes(user.role)) return null;

        // Check: instructor cannot have two active workspaces
        if (user.role === 'instructor') {
            const existingActive = workspaces.find(
                (ws) => ws.createdBy === user.id && ws.status === 'active'
            );
            if (existingActive) {
                return { error: 'You already have an active workspace. Finish it before creating a new one.' };
            }
        }

        const newWs = {
            id: `ws-${Date.now()}`,
            createdBy: user.id,
            createdDate: new Date().toISOString().split('T')[0],
            status: 'active',
            teams: [],
            tasks: [],
            ...data,
        };
        setWorkspaces((prev) => [...prev, newWs]);
        return { data: newWs };
    }, [user, workspaces]);

    const updateWorkspace = useCallback((wsId, data) => {
        setWorkspaces((prev) =>
            prev.map((ws) => (ws.id === wsId ? { ...ws, ...data } : ws))
        );
    }, []);

    const finishWorkspace = useCallback((wsId) => {
        updateWorkspace(wsId, { status: 'finished' });
    }, [updateWorkspace]);

    /* ── Team helpers ──────────────────────────────────────── */

    const addTeamToWorkspace = useCallback((wsId, team) => {
        setWorkspaces((prev) =>
            prev.map((ws) => {
                if (ws.id !== wsId) return ws;
                return { ...ws, teams: [...ws.teams, { id: `wt-${Date.now()}`, members: [], firstSubmissionDate: null, lastSubmissionDate: null, leaderId: null, ...team }] };
            })
        );
    }, []);

    const assignTeamLeader = useCallback((wsId, teamId, studentId) => {
        setWorkspaces((prev) =>
            prev.map((ws) => {
                if (ws.id !== wsId) return ws;
                return {
                    ...ws,
                    teams: ws.teams.map((t) =>
                        t.id === teamId ? { ...t, leaderId: studentId } : t
                    ),
                };
            })
        );
    }, []);

    const addMemberToTeam = useCallback((wsId, teamId, studentId) => {
        // Student can only belong to one team per workspace
        setWorkspaces((prev) =>
            prev.map((ws) => {
                if (ws.id !== wsId) return ws;
                const alreadyInTeam = ws.teams.some((t) => t.members.includes(studentId));
                if (alreadyInTeam) return ws; // prevent duplicate
                return {
                    ...ws,
                    teams: ws.teams.map((t) =>
                        t.id === teamId ? { ...t, members: [...t.members, studentId] } : t
                    ),
                };
            })
        );
    }, []);

    const removeMemberFromTeam = useCallback((wsId, teamId, studentId) => {
        setWorkspaces((prev) =>
            prev.map((ws) => {
                if (ws.id !== wsId) return ws;
                return {
                    ...ws,
                    teams: ws.teams.map((t) =>
                        t.id === teamId
                            ? { ...t, members: t.members.filter((m) => m !== studentId), leaderId: t.leaderId === studentId ? null : t.leaderId }
                            : t
                    ),
                };
            })
        );
    }, []);

    /* ── Task helpers (team-leader tasks) ──────────────────── */

    const addTaskToWorkspace = useCallback((wsId, task) => {
        const newTask = {
            id: `wst-${Date.now()}`,
            status: 'todo',
            createdAt: new Date().toISOString(),
            ...task,
        };
        setWorkspaces((prev) =>
            prev.map((ws) => {
                if (ws.id !== wsId) return ws;
                return { ...ws, tasks: [...ws.tasks, newTask] };
            })
        );
        return newTask;
    }, []);

    const updateTaskInWorkspace = useCallback((wsId, taskId, data) => {
        setWorkspaces((prev) =>
            prev.map((ws) => {
                if (ws.id !== wsId) return ws;
                return {
                    ...ws,
                    tasks: ws.tasks.map((t) => (t.id === taskId ? { ...t, ...data } : t)),
                };
            })
        );
    }, []);

    /* ── Role helpers (workspace-scoped) ───────────────────── */

    /**
     * Check if the current user is a team leader in the given workspace.
     * Returns the team object they lead, or null.
     */
    const getLeadingTeam = useCallback((wsId) => {
        if (!user) return null;
        const ws = workspaces.find((w) => w.id === wsId);
        if (!ws) return null;
        return ws.teams.find((t) => t.leaderId === user.id) || null;
    }, [user, workspaces]);

    const isTeamLeaderInWorkspace = useCallback((wsId) => {
        return !!getLeadingTeam(wsId);
    }, [getLeadingTeam]);

    const value = {
        workspaces,
        activeWorkspace,
        setActiveWorkspace,
        createWorkspace,
        updateWorkspace,
        finishWorkspace,
        addTeamToWorkspace,
        assignTeamLeader,
        addMemberToTeam,
        removeMemberFromTeam,
        addTaskToWorkspace,
        updateTaskInWorkspace,
        getLeadingTeam,
        isTeamLeaderInWorkspace,
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = () => {
    const ctx = useContext(WorkspaceContext);
    if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
    return ctx;
};

export default WorkspaceContext;
