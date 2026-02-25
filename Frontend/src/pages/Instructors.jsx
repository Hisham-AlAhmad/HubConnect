import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { profileAPI, authAPI } from '../services/api';
import Avatar from '../components/Avatar';
import {
    Users, Search, Shield, ChevronDown, GraduationCap, BookOpen, Mail, Plus, X
} from 'lucide-react';

/**
 * Instructors Page
 * Admin can view all instructors.
 */

const DEFAULT_PASSWORD = '123456789';

const Instructors = () => {
    const { user } = useAuth();
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Create modal state
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', email: '', password: DEFAULT_PASSWORD });
    const [createLoading, setCreateLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchInstructors = async () => {
        try {
            setLoading(true);
            const res = await profileAPI.getInstructors();
            setInstructors(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching instructors:', err);
            setInstructors([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInstructors(); }, []);

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!createForm.name.trim() || !createForm.email.trim()) {
            setError('Name and email are required');
            return;
        }
        try {
            setCreateLoading(true);
            await authAPI.register({
                name: createForm.name.trim(),
                email: createForm.email.trim() + '@hub.com',
                password: createForm.password || DEFAULT_PASSWORD,
                role: 'instructor',
            });
            setShowCreate(false);
            setCreateForm({ name: '', email: '', password: DEFAULT_PASSWORD });
            await fetchInstructors();
        } catch (err) {
            setError(err?.response?.data?.error || err.message || 'Failed to create instructor');
        } finally {
            setCreateLoading(false);
        }
    };

    const filtered = instructors.filter((i) => {
        const name = (i.full_name || '').toLowerCase();
        const email = (i.email || '').toLowerCase();
        const q = search.toLowerCase();
        return name.includes(q) || email.includes(q);
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Instructors</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    View all instructors
                </p>
            </div>

            <button
                    onClick={() => { setShowCreate(true); setError(''); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                <Plus className="w-4 h-4" />
                New Instructor
            </button>

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
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Instructors</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{instructors.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Search Results</p>
                    <p className="text-2xl font-bold text-primary-600">{filtered.length}</p>
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
                    {filtered.map((instructor) => (
                        <div
                            key={instructor.id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 hover:shadow-soft-lg transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                <Avatar name={instructor.full_name || 'Unknown'} size={48} role="instructor" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-800 dark:text-white truncate">{instructor.full_name || 'Unknown'}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                                        <Mail size={12} />{instructor.email}
                                    </p>
                                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                        <Shield size={12} />Instructor
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Instructor Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">New Instructor</h2>
                            <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">{error}</div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                                <input type="text" value={createForm.name} onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))} required placeholder="Enter full name"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                                <div className="flex">
                                    <input type="text" value={createForm.email} onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value.replace(/[@.]/g, '') }))} required placeholder="username"
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm" />
                                    <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-sm">@hub.com</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                <input type="text" value={createForm.password} onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm" />
                                <p className="text-xs text-gray-400 mt-1">Default: {DEFAULT_PASSWORD}</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm" disabled={createLoading}>Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium" disabled={createLoading}>
                                    {createLoading ? 'Creating...' : 'Create Instructor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Instructors;
