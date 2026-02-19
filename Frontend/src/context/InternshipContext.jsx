import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';

export const InternshipContext = createContext(null);

/**
 * Mock internship data.
 * In production this comes from the backend; the context ensures isolation.
 */
const MOCK_INTERNSHIPS = [
    {
        id: 'int-1',
        name: 'Spring 2026 Internship',
        startDate: '2026-01-15',
        endDate: '2026-06-15',
        status: 'active',
        enrolledStudentIds: ['3', '4'], // student & team-leader demo users
    },
    {
        id: 'int-2',
        name: 'Fall 2025 Internship',
        startDate: '2025-08-01',
        endDate: '2025-12-31',
        status: 'finished',
        enrolledStudentIds: ['10', '11'],
    },
];

export const InternshipProvider = ({ children }) => {
    const { user } = useAuth();
    const [currentInternship, setCurrentInternship] = useState(null);
    const [internships, setInternships] = useState(MOCK_INTERNSHIPS);

    // Automatically resolve the active internship for the current user
    useEffect(() => {
        if (!user) {
            setCurrentInternship(null);
            return;
        }

        if (user.role === 'admin' || user.role === 'instructor') {
            // Admins / instructors can see all – default to the first active
            const active = internships.find((i) => i.status === 'active');
            setCurrentInternship(active || internships[0] || null);
        } else {
            // Students / team leaders – find the internship they belong to
            const enrolled = internships.find(
                (i) => i.status === 'active' && i.enrolledStudentIds.includes(user.id)
            );
            setCurrentInternship(enrolled || null);
        }
    }, [user, internships]);

    /**
     * Check if a given studentId is visible to the current user.
     * Students from a different internship are hidden.
     */
    const isStudentVisible = (studentId) => {
        if (!currentInternship) return true; // no internship context → show all
        return currentInternship.enrolledStudentIds.includes(studentId);
    };

    /**
     * Filter an array of users to only those enrolled in the current internship.
     */
    const filterByInternship = (users) => {
        if (!currentInternship) return users;
        return users.filter((u) => currentInternship.enrolledStudentIds.includes(u.id));
    };

    const value = {
        internships,
        currentInternship,
        setCurrentInternship,
        isStudentVisible,
        filterByInternship,
    };

    return (
        <InternshipContext.Provider value={value}>
            {children}
        </InternshipContext.Provider>
    );
};

export const useInternship = () => {
    const ctx = useContext(InternshipContext);
    if (!ctx) throw new Error('useInternship must be used within InternshipProvider');
    return ctx;
};

export default InternshipContext;
