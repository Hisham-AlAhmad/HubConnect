import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { taskAPI, submissionAPI } from '../services/api';
import SubmissionModal from '../components/SubmissionModal';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  User,
  Github,
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatDate, formatDateTime, getDaysRemaining, getStatusColor } from '../utils/helpers';

/**
 * TaskDetails Page
 * Displays detailed task information and submission interface
 */
const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [task, setTask] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);

      // Fetch task
      const taskResponse = await taskAPI.getTaskById(id);
      setTask(taskResponse.data);

      // Check for submission (if team leader or student)
      if (user.teamId) {
        try {
          const submissionResponse = await submissionAPI.checkSubmission(
            id,
            user.teamId
          );
          setSubmission(submissionResponse.data);
        } catch (error) {
          // No submission found
          setSubmission(null);
        }
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmitModal = () => {
    setShowSubmitModal(true);
  };

  const handleCloseSubmitModal = () => {
    setShowSubmitModal(false);
  };

  const handleSubmitSuccess = () => {
    fetchTaskDetails();
  };

  const handleBack = () => {
    navigate('/tasks');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Task not found</h2>
        <button
          onClick={handleBack}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Return to tasks
        </button>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(task.deadline);
  const isOverdue = daysRemaining < 0;
  const canSubmit = hasRole(['team_leader']) && !submission && task.assignedTo === 'team';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Tasks</span>
        </button>
      </div>

      {/* Main content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft border border-gray-100 dark:border-gray-700">
        {/* Header section */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex-1 pr-4">
              {task.title}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                task.status
              )}`}
            >
              {task.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Meta information */}
          <div className="flex flex-wrap gap-4 text-sm">
            {/* Deadline */}
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Due: {formatDate(task.deadline)}</span>
            </div>

            {/* Days remaining */}
            <div className="flex items-center space-x-2">
              <Clock size={16} className="text-gray-400" />
              <span className={isOverdue ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}>
                {isOverdue
                  ? `${Math.abs(daysRemaining)} days overdue`
                  : `${daysRemaining} days remaining`}
              </span>
            </div>

            {/* Assignment type */}
            <div className="flex items-center space-x-2">
              {task.assignedTo === 'team' ? (
                <>
                  <Users size={16} className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Team Task</span>
                </>
              ) : (
                <>
                  <User size={16} className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Individual Task</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Description</h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {task.description}
          </p>
        </div>

        {/* GitHub Repository */}
        {task.githubRepo && (
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              GitHub Repository
            </h2>
            <a
              href={task.githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              <Github size={20} />
              <span>{task.githubRepo}</span>
            </a>
          </div>
        )}

        {/* Submission section */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Submission</h2>

          {submission ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 dark:text-green-400 mb-2">
                    Task Submitted
                  </h3>
                  <div className="space-y-2 text-sm text-green-700 dark:text-green-400">
                    <p>
                      <span className="font-medium">Submitted at:</span>{' '}
                      {formatDateTime(submission.submittedAt)}
                    </p>
                    {submission.githubLink && (
                      <p>
                        <span className="font-medium">GitHub:</span>{' '}
                        <a
                          href={submission.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-green-900"
                        >
                          {submission.githubLink}
                        </a>
                      </p>
                    )}
                    {submission.comment && (
                      <p>
                        <span className="font-medium">Comment:</span>{' '}
                        {submission.comment}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      <span
                        className={`inline-block px-2 py-1 rounded ${submission.status === 'on_time'
                            ? 'bg-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                      >
                        {submission.status === 'on_time' ? 'On Time' : 'Late'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {canSubmit ? (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    This task has not been submitted yet. As a team leader, you can
                    submit this task on behalf of your team.
                  </p>
                  <button
                    onClick={handleOpenSubmitModal}
                    className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Upload size={20} />
                    <span>Submit Task</span>
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    {task.assignedTo === 'team'
                      ? 'Waiting for team leader to submit this task.'
                      : 'This task has not been submitted yet.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Submission Modal */}
      {showSubmitModal && (
        <SubmissionModal
          task={task}
          isOpen={showSubmitModal}
          onClose={handleCloseSubmitModal}
          onSuccess={handleSubmitSuccess}
        />
      )}
    </div>
  );
};

export default TaskDetails;
