import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../context/WorkspaceContext';
import {
    Briefcase, Plus, Calendar, Users, CheckCircle, Clock,
    AlertCircle, X, ChevronRight
} from 'lucide-react';

/**
 * Workspaces Page
 * Lists all workspaces. Admins/Instructors can create new ones.
 */
const Workspaces = () => {
    const { user, hasRole } = useAuth();
    const { workspaces, createWorkspace } = useWorkspace();
    const navigate = useNavigate();

    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', endDate: '' });
    const [error, setError] = useState('');

    const canCreate = hasRole(['admin', 'instructor']);

    const handleCreate = () => {
        if (!form.name.trim()) { setError('Name is required'); return; }
        if (!form.endDate) { setError('End date is required'); return; }

        const result = createWorkspace({
            name: form.name.trim(),
            endDate: form.endDate,
        });

        if (result?.error) { setError(result.error); return; }

        setShowCreate(false);
        setForm({ name: '', endDate: '' });
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
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Workspaces</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {canCreate ? 'Create and manage training workspaces' : 'View your assigned workspaces'}
                    </p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => { setShowCreate(true); setError(''); }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        New Workspace
                    </button>
                )}
            </div>

            {/* Workspace list */}
            {workspaces.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <Briefcase size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">No Workspaces Yet</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {canCreate ? 'Create your first workspace to get started.' : 'No workspaces have been assigned.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {workspaces.map((ws) => (
                        <button
                            key={ws.id}
                            onClick={() => navigate(`/workspaces/${ws.id}`)}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 text-left hover:shadow-soft-lg transition-shadow group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                    <Briefcase size={24} className="text-primary-600 dark:text-primary-400" />
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(ws.status)}`}>
                                    {ws.status}
                                </span>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {ws.name}
                            </h3>

                            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>Created: {ws.createdDate}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} />
                                    <span>Ends: {ws.endDate}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={14} />
                                    <span>{ws.teams.length} team{ws.teams.length !== 1 ? 's' : ''}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-end mt-4 text-primary-600 dark:text-primary-400 text-sm font-medium">
                                <span>View details</span>
                                <ChevronRight size={16} />
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Workspace</h3>
                            <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Workspace Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Spring 2026 Training"
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">End Date</label>
                                <input
                                    type="date"
                                    value={form.endDate}
                                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowCreate(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Workspaces;
