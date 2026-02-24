import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCohort } from '../context/CohortContext';
import {
    GraduationCap, Plus, Calendar, Users, Clock, X, AlertCircle,
    ChevronRight, Trash2, Pencil, CheckCircle
} from 'lucide-react';

/**
 * Cohorts Page
 * Admin can view, create, edit, and delete cohorts.
 * Instructors see only their assigned cohorts.
 */
const Cohorts = () => {
    const { user, hasRole } = useAuth();
    const { cohorts, createCohort, updateCohort, deleteCohort } = useCohort();
    const navigate = useNavigate();

    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(null);
    const [showDelete, setShowDelete] = useState(null);
    const [form, setForm] = useState({ name: '', startDate: '', endDate: '' });
    const [error, setError] = useState('');

    const isAdmin = hasRole('admin');

    // Instructors see only their assigned cohorts
    const visibleCohorts = isAdmin
        ? cohorts
        : cohorts.filter((c) => c.assignedInstructorIds.includes(user.id));

    const handleCreate = () => {
        if (!form.name.trim()) { setError('Name is required'); return; }
        if (!form.startDate) { setError('Start date is required'); return; }
        if (!form.endDate) { setError('End date is required'); return; }

        const result = createCohort({
            name: form.name.trim(),
            startDate: form.startDate,
            endDate: form.endDate,
        });

        if (result?.error) { setError(result.error); return; }
        setShowCreate(false);
        setForm({ name: '', startDate: '', endDate: '' });
        setError('');
    };

    const handleEdit = () => {
        if (!form.name.trim()) { setError('Name is required'); return; }
        updateCohort(showEdit, {
            name: form.name.trim(),
            startDate: form.startDate,
            endDate: form.endDate,
        });
        setShowEdit(null);
        setForm({ name: '', startDate: '', endDate: '' });
        setError('');
    };

    const handleDelete = () => {
        deleteCohort(showDelete);
        setShowDelete(null);
    };

    const openEdit = (cohort) => {
        setForm({ name: cohort.name, startDate: cohort.startDate, endDate: cohort.endDate });
        setShowEdit(cohort.id);
        setError('');
    };

    const statusBadge = (status) => {
        if (status === 'active') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Cohorts</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {isAdmin ? 'Create and manage cohorts' : 'View your assigned cohorts'}
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => { setShowCreate(true); setForm({ name: '', startDate: '', endDate: '' }); setError(''); }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        New Cohort
                    </button>
                )}
            </div>

            {/* Cohort list */}
            {visibleCohorts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <GraduationCap size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">No Cohorts Yet</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isAdmin ? 'Create your first cohort to get started.' : 'No cohorts have been assigned to you.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {visibleCohorts.map((cohort) => (
                        <div
                            key={cohort.id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 hover:shadow-soft-lg transition-shadow group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                    <GraduationCap size={24} className="text-primary-600 dark:text-primary-400" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(cohort.status)}`}>
                                        {cohort.status}
                                    </span>
                                    {isAdmin && (
                                        <div className="flex gap-1">
                                            <button onClick={() => openEdit(cohort)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Edit">
                                                <Pencil size={14} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                            </button>
                                            <button onClick={() => setShowDelete(cohort.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Delete">
                                                <Trash2 size={14} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {cohort.name}
                            </h3>

                            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>{cohort.startDate} — {cohort.endDate}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={14} />
                                    <span>{cohort.enrolledStudentIds.length} student{cohort.enrolledStudentIds.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <GraduationCap size={14} />
                                    <span>{cohort.assignedInstructorIds.length} instructor{cohort.assignedInstructorIds.length !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Cohort</h3>
                            <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cohort Name</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Spring 2026 Cohort"
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Start Date</label>
                                    <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">End Date</label>
                                    <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">Cancel</button>
                                <button onClick={handleCreate} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">Create</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEdit && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Cohort</h3>
                            <button onClick={() => setShowEdit(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cohort Name</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Start Date</label>
                                    <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">End Date</label>
                                    <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={() => setShowEdit(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">Cancel</button>
                                <button onClick={handleEdit} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {showDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm">
                        <div className="p-6 text-center">
                            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                                <Trash2 size={24} className="text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Cohort?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This action cannot be undone. All associated data will be removed.</p>
                            <div className="flex justify-center gap-3">
                                <button onClick={() => setShowDelete(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">Cancel</button>
                                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cohorts;
