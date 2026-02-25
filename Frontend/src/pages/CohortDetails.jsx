import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cohortAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Avatar from '../components/Avatar';
import {
    ArrowLeft, GraduationCap, Calendar, Users, Shield, User,
    BookOpen, Mail, AlertCircle
} from 'lucide-react';

/**
 * CohortDetails Page
 * Full-page detail view for a single cohort showing instructors, students, and courses.
 */
const CohortDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasRole } = useAuth();

    const [cohort, setCohort] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCohort = async () => {
            try {
                setLoading(true);
                setError('');
                const res = await cohortAPI.getById(id);
                setCohort(res?.data || null);
            } catch (err) {
                console.error('Error fetching cohort:', err);
                setError('Failed to load cohort details.');
            } finally {
                setLoading(false);
            }
        };
        fetchCohort();
    }, [id]);

    const formatDate = (d) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString(); } catch { return d; }
    };

    const statusBadge = (isActive) => {
        if (isActive) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (error || !cohort) {
        return (
            <div className="max-w-3xl mx-auto space-y-4">
                <button
                    onClick={() => navigate('/cohorts')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Cohorts</span>
                </button>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">Cohort Not Found</h2>
                    <p className="text-gray-500 dark:text-gray-400">{error || 'The cohort you are looking for does not exist.'}</p>
                </div>
            </div>
        );
    }

    const instructors = (cohort.members || []).filter(m => m.role === 'instructor');
    const students = (cohort.members || []).filter(m => m.role === 'student');
    const courses = cohort.courses || [];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Back button */}
            <button
                onClick={() => navigate('/cohorts')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
                <ArrowLeft size={20} />
                <span>Back to Cohorts</span>
            </button>

            {/* Header Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="h-28 bg-gradient-to-r from-primary-500 to-primary-700" />
                <div className="px-6 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                            <GraduationCap size={36} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1 pt-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{cohort.name}</h1>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(cohort.is_active)}`}>
                                    {cohort.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="flex items-center gap-5 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={14} />
                                    {formatDate(cohort.start_date)} — {formatDate(cohort.end_date)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Users size={14} />
                                    {students.length} student{students.length !== 1 ? 's' : ''}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <GraduationCap size={14} />
                                    {instructors.length} instructor{instructors.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Instructors */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Shield size={18} className="text-purple-500" />
                        Instructors
                        <span className="ml-auto text-xs font-normal text-gray-400">{instructors.length}</span>
                    </h2>
                    {instructors.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No instructors assigned</p>
                    ) : (
                        <div className="space-y-3">
                            {instructors.map(inst => (
                                <div key={inst.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <Avatar name={inst.full_name || 'Unknown'} size={36} role="instructor" imageUrl={inst.avatar_url} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{inst.full_name || 'Unknown'}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate flex items-center gap-1">
                                            <Mail size={10} />{inst.email}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Students */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <User size={18} className="text-green-500" />
                        Students
                        <span className="ml-auto text-xs font-normal text-gray-400">{students.length}</span>
                    </h2>
                    {students.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No students enrolled</p>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {students.map(stu => (
                                <div key={stu.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <Avatar name={stu.full_name || 'Unknown'} size={36} role="student" imageUrl={stu.avatar_url} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{stu.full_name || 'Unknown'}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate flex items-center gap-1">
                                            <Mail size={10} />{stu.email}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Courses */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <BookOpen size={18} className="text-primary-500" />
                        Courses
                        <span className="ml-auto text-xs font-normal text-gray-400">{courses.length}</span>
                    </h2>
                    {courses.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No courses in this cohort</p>
                    ) : (
                        <div className="space-y-3">
                            {courses.map(course => (
                                <div
                                    key={course.id}
                                    onClick={() => navigate(`/courses/${course.id}`)}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <BookOpen size={16} className="text-primary-500 flex-shrink-0" />
                                        <span className="text-sm font-medium text-gray-800 dark:text-white">{course.name}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                        course.status === 'active'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : course.status === 'completed'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                    }`}>
                                        {course.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CohortDetails;
