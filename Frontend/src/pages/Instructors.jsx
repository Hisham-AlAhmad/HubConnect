import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCohort } from '../context/CohortContext';
import Avatar from '../components/Avatar';
import {
    Users, Search, Shield, ChevronDown, GraduationCap, BookOpen, Mail
} from 'lucide-react';

/**
 * Instructors Page
 * Admin can view all instructors and their assigned cohorts.
 */

/* ── Demo instructor data ─────────────────────────────────── */
const MOCK_INSTRUCTORS = [
    { id: '2', name: 'Instructor User', email: 'instructor@hub.com', role: 'instructor', status: 'active' },
    { id: '7', name: 'Dr. Fatima Noor', email: 'fatima@hub.com', role: 'instructor', status: 'active' },
    { id: '8', name: 'Prof. Ahmad Basim', email: 'ahmad@hub.com', role: 'instructor', status: 'inactive' },
];

const Instructors = () => {
    const { user } = useAuth();
    const { cohorts } = useCohort();
    const [instructors] = useState(MOCK_INSTRUCTORS);
    const [search, setSearch] = useState('');

    const filtered = instructors.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.email.toLowerCase().includes(search.toLowerCase())
    );

    const getAssignedCohorts = (instructorId) =>
        cohorts.filter((c) => c.assignedInstructorIds.includes(instructorId));

    const statusDot = (status) => {
        if (status === 'active') return 'bg-green-500';
        return 'bg-gray-400';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Instructors</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    View all instructors and their cohort assignments
                </p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{instructors.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                    <p className="text-2xl font-bold text-green-600">{instructors.filter((i) => i.status === 'active').length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">With Cohorts</p>
                    <p className="text-2xl font-bold text-primary-600">{instructors.filter((i) => getAssignedCohorts(i.id).length > 0).length}</p>
                </div>
            </div>

            {/* Instructor cards */}
            {filtered.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <Shield size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">No Instructors Found</h2>
                    <p className="text-gray-500 dark:text-gray-400">Try adjusting your search criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map((instructor) => {
                        const assignedCohorts = getAssignedCohorts(instructor.id);
                        return (
                            <div
                                key={instructor.id}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 hover:shadow-soft-lg transition-shadow"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <Avatar name={instructor.name} size={48} role="instructor" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-800 dark:text-white truncate">{instructor.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                                            <Mail size={12} />{instructor.email}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${statusDot(instructor.status)}`} />
                                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{instructor.status}</span>
                                    </span>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Assigned Cohorts</p>
                                    {assignedCohorts.length === 0 ? (
                                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">No cohorts assigned</p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {assignedCohorts.map((c) => (
                                                <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                                    <GraduationCap size={14} className="text-primary-600 dark:text-primary-400" />
                                                    <span className="text-sm text-primary-700 dark:text-primary-300 font-medium">{c.name}</span>
                                                    <span className={`ml-auto px-1.5 py-0.5 rounded text-xs font-medium capitalize ${c.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                                        {c.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Instructors;
