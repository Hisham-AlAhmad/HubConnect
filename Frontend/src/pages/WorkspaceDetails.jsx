import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../context/WorkspaceContext';
import Avatar from '../components/Avatar';
import {
    ArrowLeft, Briefcase, Users, Calendar, Clock, Plus, Crown, UserPlus,
    UserMinus, X, AlertCircle, CheckCircle, ChevronDown, ChevronUp,
    ListTodo, PlusCircle
} from 'lucide-react';

/**
 * WorkspaceDetails Page
 * Shows teams in a workspace, submission metadata, team leader assignment.
 */
const WorkspaceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, hasRole } = useAuth();
    const {
        workspaces, addTeamToWorkspace, assignTeamLeader,
        addMemberToTeam, removeMemberFromTeam, finishWorkspace,
        isTeamLeaderInWorkspace, getLeadingTeam,
        addTaskToWorkspace, updateTaskInWorkspace,
    } = useWorkspace();

    const ws = workspaces.find((w) => w.id === id);

    const [showAddTeam, setShowAddTeam] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [expandedTeam, setExpandedTeam] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Task creation state
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium' });

    const canManage = hasRole(['admin', 'instructor']);
    const isLeader = ws ? isTeamLeaderInWorkspace(ws.id) : false;
    const leadingTeam = ws ? getLeadingTeam(ws.id) : null;

    if (!ws) {
        return (
            <div className="text-center py-12">
                <Briefcase size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Workspace not found</h2>
                <button onClick={() => navigate('/workspaces')} className="mt-4 text-primary-600 hover:underline text-sm">
                    Back to Workspaces
                </button>
            </div>
        );
    }

    const handleAddTeam = () => {
        if (!teamName.trim()) return;
        addTeamToWorkspace(ws.id, { name: teamName.trim() });
        setTeamName('');
        setShowAddTeam(false);
        setSuccess('Team added!');
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleAssignLeader = (teamId, studentId) => {
        assignTeamLeader(ws.id, teamId, studentId);
        setSuccess('Team leader assigned!');
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleAddMember = (teamId, studentId) => {
        // Check student is not already in another team in this workspace
        const alreadyIn = ws.teams.some((t) => t.members.includes(studentId));
        if (alreadyIn) {
            setError('This student is already in a team in this workspace.');
            setTimeout(() => setError(''), 4000);
            return;
        }
        addMemberToTeam(ws.id, teamId, studentId);
    };

    const handleCreateTask = () => {
        if (!taskForm.title.trim()) { setError('Task title is required'); return; }
        addTaskToWorkspace(ws.id, {
            title: taskForm.title.trim(),
            description: taskForm.description.trim(),
            priority: taskForm.priority,
            status: 'todo',
            createdBy: user.id,
            assignedTeamId: leadingTeam?.id,
        });
        setTaskForm({ title: '', description: '', priority: 'medium' });
        setShowTaskForm(false);
        setSuccess('Task created!');
        setTimeout(() => setSuccess(''), 3000);
    };

    const statusBadge = (status) => {
        if (status === 'active') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    };

    const priorityBadge = (p) => {
        const map = {
            high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        };
        return map[p] || map.medium;
    };

    const taskStatusBadge = (s) => {
        const map = {
            todo: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
            in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        };
        return map[s] || map.todo;
    };

    // Filter tasks for this workspace (team-leader sees only their team)
    const visibleTasks = isLeader && leadingTeam
        ? ws.tasks.filter((t) => t.assignedTeamId === leadingTeam.id)
        : ws.tasks;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <button onClick={() => navigate('/workspaces')} className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4 text-sm">
                    <ArrowLeft size={16} /> Back to Workspaces
                </button>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                            <Briefcase size={28} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{ws.name}</h1>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(ws.status)}`}>{ws.status}</span>
                                <span className="flex items-center gap-1"><Calendar size={14} /> Created: {ws.createdDate}</span>
                                <span className="flex items-center gap-1"><Clock size={14} /> Ends: {ws.endDate}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {canManage && ws.status === 'active' && (
                            <>
                                <button
                                    onClick={() => setShowAddTeam(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                                >
                                    <Plus size={16} /> Add Team
                                </button>
                                <button
                                    onClick={() => finishWorkspace(ws.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                                >
                                    <CheckCircle size={16} /> Mark Finished
                                </button>
                            </>
                        )}
                        {isLeader && ws.status === 'active' && (
                            <button
                                onClick={() => setShowTaskForm(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                            >
                                <PlusCircle size={16} /> Create Task
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />{success}
                </div>
            )}

            {/* Teams */}
            <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Users size={20} /> Teams ({ws.teams.length})
                </h2>
                {ws.teams.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                        <Users size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No teams yet. {canManage ? 'Add a team to get started.' : ''}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {ws.teams.map((team) => (
                            <div key={team.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <button
                                    onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                                    className="w-full p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                            <Users size={20} className="text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-semibold text-gray-800 dark:text-white">{team.name}</h3>
                                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                <span>{team.members.length} members</span>
                                                {team.leaderId && (
                                                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                                        <Crown size={12} /> Leader assigned
                                                    </span>
                                                )}
                                                {team.firstSubmissionDate && <span>First sub: {team.firstSubmissionDate}</span>}
                                                {team.lastSubmissionDate && <span>Last sub: {team.lastSubmissionDate}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {expandedTeam === team.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </button>

                                {/* Expanded - members */}
                                {expandedTeam === team.id && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 p-5 space-y-3">
                                        {team.members.length === 0 ? (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">No members yet.</p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {team.members.map((memberId) => (
                                                    <li key={memberId} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar name={`User ${memberId}`} size={32} />
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">User {memberId}</span>
                                                                {team.leaderId === memberId && (
                                                                    <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                                        <Crown size={10} /> Leader
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {canManage && team.leaderId !== memberId && (
                                                                <button
                                                                    onClick={() => handleAssignLeader(team.id, memberId)}
                                                                    className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                                                    title="Assign as team leader"
                                                                >
                                                                    <Crown size={14} />
                                                                </button>
                                                            )}
                                                            {canManage && (
                                                                <button
                                                                    onClick={() => removeMemberFromTeam(ws.id, team.id, memberId)}
                                                                    className="text-xs px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                                                                    title="Remove member"
                                                                >
                                                                    <UserMinus size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {canManage && (
                                            <button
                                                onClick={() => {
                                                    // For demo, add a mock student
                                                    const newId = String(Math.floor(Math.random() * 900 + 100));
                                                    handleAddMember(team.id, newId);
                                                }}
                                                className="inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline mt-2"
                                            >
                                                <UserPlus size={14} /> Add Member
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Workspace Tasks (team-leader created) */}
            {(visibleTasks.length > 0 || isLeader) && (
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <ListTodo size={20} /> Team Tasks ({visibleTasks.length})
                    </h2>
                    {visibleTasks.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                            <ListTodo size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                            <p className="text-gray-500 dark:text-gray-400 text-sm">No team tasks yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {visibleTasks.map((task) => (
                                <div key={task.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-medium text-gray-800 dark:text-white text-sm">{task.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                    {task.description && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{task.description}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${taskStatusBadge(task.status)}`}>
                                            {task.status.replace('_', ' ')}
                                        </span>
                                        {(isLeader || canManage) && (
                                            <select
                                                value={task.status}
                                                onChange={(e) => updateTaskInWorkspace(ws.id, task.id, { status: e.target.value })}
                                                className="text-xs border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="done">Done</option>
                                            </select>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add Team Modal */}
            {showAddTeam && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm">
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Add Team</h3>
                            <button onClick={() => setShowAddTeam(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <input
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="Team name"
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowAddTeam(false)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                                <button onClick={handleAddTeam} className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">Add</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Create Modal (Team Leader) */}
            {showTaskForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Create Team Task</h3>
                            <button onClick={() => setShowTaskForm(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                                <input
                                    type="text"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    placeholder="Task title"
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    placeholder="What needs to be done?"
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                <select
                                    value={taskForm.priority}
                                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setShowTaskForm(false)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                                <button onClick={handleCreateTask} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Create Task</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkspaceDetails;
