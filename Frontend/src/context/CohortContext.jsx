import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

export const CohortContext = createContext(null);

/**
 * Mock cohort data.
 * In production this comes from the backend; the context ensures isolation.
 */
const MOCK_COHORTS = [
    {
        id: 'coh-1',
        name: 'Spring 2026 Cohort',
        startDate: '2026-01-15',
        endDate: '2026-06-15',
        status: 'active',
        enrolledStudentIds: ['3', '4'], // student & team-leader demo users
        assignedInstructorIds: ['2'],   // instructor demo user
    },
    {
        id: 'coh-2',
        name: 'Fall 2025 Cohort',
        startDate: '2025-08-01',
        endDate: '2025-12-31',
        status: 'finished',
        enrolledStudentIds: ['10', '11'],
        assignedInstructorIds: [],
    },
];

export const CohortProvider = ({ children }) => {
    const { user } = useAuth();
    const [currentCohort, setCurrentCohort] = useState(null);
    const [cohorts, setCohorts] = useState(MOCK_COHORTS);

    // Automatically resolve the active cohort for the current user
    useEffect(() => {
        if (!user) {
            setCurrentCohort(null);
            return;
        }

        if (user.role === 'admin') {
            // Admin can see all – default to the first active
            const active = cohorts.find((c) => c.status === 'active');
            setCurrentCohort(active || cohorts[0] || null);
        } else if (user.role === 'instructor') {
            // Instructor – find a cohort they are assigned to
            const assigned = cohorts.find(
                (c) => c.status === 'active' && c.assignedInstructorIds.includes(user.id)
            );
            setCurrentCohort(assigned || null);
        } else {
            // Students / team leaders – find the cohort they belong to
            const enrolled = cohorts.find(
                (c) => c.status === 'active' && c.enrolledStudentIds.includes(user.id)
            );
            setCurrentCohort(enrolled || null);
        }
    }, [user, cohorts]);

    /* ── CRUD helpers ──────────────────────────────────────── */

    const createCohort = useCallback((data) => {
        if (!user || user.role !== 'admin') return null;
        const newCohort = {
            id: `coh-${Date.now()}`,
            status: 'active',
            enrolledStudentIds: [],
            assignedInstructorIds: [],
            ...data,
        };
        setCohorts((prev) => [...prev, newCohort]);
        return { data: newCohort };
    }, [user]);

    const updateCohort = useCallback((cohortId, data) => {
        setCohorts((prev) =>
            prev.map((c) => (c.id === cohortId ? { ...c, ...data } : c))
        );
    }, []);

    const deleteCohort = useCallback((cohortId) => {
        setCohorts((prev) => prev.filter((c) => c.id !== cohortId));
    }, []);

    const assignInstructorToCohort = useCallback((cohortId, instructorId) => {
        setCohorts((prev) =>
            prev.map((c) => {
                if (c.id !== cohortId) return c;
                if (c.assignedInstructorIds.includes(instructorId)) return c;
                return { ...c, assignedInstructorIds: [...c.assignedInstructorIds, instructorId] };
            })
        );
    }, []);

    const removeInstructorFromCohort = useCallback((cohortId, instructorId) => {
        setCohorts((prev) =>
            prev.map((c) => {
                if (c.id !== cohortId) return c;
                return { ...c, assignedInstructorIds: c.assignedInstructorIds.filter((id) => id !== instructorId) };
            })
        );
    }, []);

    /**
     * Check if a given studentId is visible to the current user.
     * Students from a different cohort are hidden.
     */
    const isStudentVisible = (studentId) => {
        if (!currentCohort) return true;
        return currentCohort.enrolledStudentIds.includes(studentId);
    };

    /**
     * Filter an array of users to only those enrolled in the current cohort.
     */
    const filterByCohort = (users) => {
        if (!currentCohort) return users;
        return users.filter((u) => currentCohort.enrolledStudentIds.includes(u.id));
    };

    const value = {
        cohorts,
        currentCohort,
        setCurrentCohort,
        createCohort,
        updateCohort,
        deleteCohort,
        assignInstructorToCohort,
        removeInstructorFromCohort,
        isStudentVisible,
        filterByCohort,
    };

    return (
        <CohortContext.Provider value={value}>
            {children}
        </CohortContext.Provider>
    );
};

export const useCohort = () => {
    const ctx = useContext(CohortContext);
    if (!ctx) throw new Error('useCohort must be used within CohortProvider');
    return ctx;
};

export default CohortContext;
