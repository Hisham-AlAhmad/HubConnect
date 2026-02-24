import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCohort } from '../context/CohortContext';
import { teamAPI } from '../services/api';
import Avatar from '../components/Avatar';
import {
    Users, Search, Mail, Shield, User, Crown, Filter,
    ChevronDown, GraduationCap
} from 'lucide-react';

/**
 * Students Page
 * Admin/Instructor can view all students, filter by cohort, and see details.
 */

/* ── Demo student data (mirrors AuthContext + extras) ─────── */
const MOCK_STUDENTS = [
    { id: '3', name: 'Student User', email: 'student@hub.com', role: 'student', teamId: 't1', cohortId: 'coh-1', status: 'active' },
    { id: '4', name: 'Team Leader User', email: 'leader@hub.com', role: 'team_leader', teamId: 't1', cohortId: 'coh-1', status: 'active' },
    { id: '5', name: 'Sarah Ahmed', email: 'sarah@hub.com', role: 'student', teamId: 't2', cohortId: 'coh-1', status: 'active' },
    { id: '6', name: 'Omar Hassan', email: 'omar@hub.com', role: 'student', teamId: 't2', cohortId: 'coh-1', status: 'active' },
    { id: '10', name: 'Layla Khalid', email: 'layla@hub.com', role: 'student', teamId: null, cohortId: 'coh-2', status: 'inactive' },
    { id: '11', name: 'Yousef Ali', email: 'yousef@hub.com', role: 'student', teamId: null, cohortId: 'coh-2', status: 'inactive' },
];

const Students = () => {
    const { user, hasRole } = useAuth();
    const { cohorts } = useCohort();
    const [students] = useState(MOCK_STUDENTS);
    const [search, setSearch] = useState('');
    const [cohortFilter, setCohortFilter] = useState('all');

    const filtered = students.filter((s) => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase());
        const matchesCohort = cohortFilter === 'all' || s.cohortId === cohortFilter;
        return matchesSearch && matchesCohort;
    });

    const getRoleBadge = (role) => {
        if (role === 'team_leader') return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Team Leader', icon: Crown };
        return { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Student', icon: User };
    };

    const statusDot = (status) => {
        if (status === 'active') return 'bg-green-500';
        return 'bg-gray-400';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Students</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    View and manage all enrolled students
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                </div>
                <div className="relative">
                    <select
                        value={cohortFilter}
                        onChange={(e) => setCohortFilter(e.target.value)}
                        className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm min-w-[180px]"
                    >
                        <option value="all">All Cohorts</option>
                        {cohorts.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{filtered.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                    <p className="text-2xl font-bold text-green-600">{filtered.filter((s) => s.status === 'active').length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Team Leaders</p>
                    <p className="text-2xl font-bold text-blue-600">{filtered.filter((s) => s.role === 'team_leader').length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Unassigned</p>
                    <p className="text-2xl font-bold text-orange-600">{filtered.filter((s) => !s.teamId).length}</p>
                </div>
            </div>

            {/* Students table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">No Students Found</h2>
                        <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cohort</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Team</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filtered.map((student) => {
                                    const badge = getRoleBadge(student.role);
                                    const BadgeIcon = badge.icon;
                                    const cohort = cohorts.find((c) => c.id === student.cohortId);
                                    return (
                                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={student.name} size={36} role={student.role} />
                                                    <div>
                                                        <p className="font-medium text-gray-800 dark:text-white text-sm">{student.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                                                    <BadgeIcon size={12} />{badge.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                {cohort?.name || '—'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                {student.teamId || 'Unassigned'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span className={`w-2 h-2 rounded-full ${statusDot(student.status)}`} />
                                                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{student.status}</span>
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Students;
