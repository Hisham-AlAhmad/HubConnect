import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { taskAPI } from '../services/api';
import { ArrowLeft, Save } from 'lucide-react';

/**
 * CreateTask Page
 * Form to create new tasks (Instructor/Admin only)
 */
const CreateTask = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    assignedTo: 'team',
    teamId: 1,
    studentId: '',
    githubRepo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (!formData.deadline) {
      setError('Deadline is required');
      return;
    }

    // Check if deadline is in the future
    const deadlineDate = new Date(formData.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (deadlineDate < today) {
      setError('Deadline must be in the future');
      return;
    }

    try {
      setLoading(true);

      // Prepare task data
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        deadline: formData.deadline,
        createdBy: user.id,
        assignedTo: formData.assignedTo,
        githubRepo: formData.githubRepo.trim()
      };

      // Add assignment details
      if (formData.assignedTo === 'team') {
        taskData.teamId = parseInt(formData.teamId);
      } else {
        taskData.studentId = formData.studentId;
      }

      // Create task
      await taskAPI.createTask(taskData);

      // Success - redirect to tasks page
      navigate('/tasks');
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.message || 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/tasks');
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Tomorrow
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Tasks</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Create New Task</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Fill in the details below to create a new task
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft p-6 border border-gray-100 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Enter detailed task description"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              required
              disabled={loading}
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Deadline *
            </label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              min={getMinDate()}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          {/* Assignment type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assign To *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="assignedTo"
                  value="team"
                  checked={formData.assignedTo === 'team'}
                  onChange={handleChange}
                  className="mr-2"
                  disabled={loading}
                />
                <span className="text-gray-700 dark:text-gray-300">Team</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="assignedTo"
                  value="individual"
                  checked={formData.assignedTo === 'individual'}
                  onChange={handleChange}
                  className="mr-2"
                  disabled={loading}
                />
                <span className="text-gray-700 dark:text-gray-300">Individual Student</span>
              </label>
            </div>
          </div>

          {/* Team or Student selection */}
          {formData.assignedTo === 'team' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Team *
              </label>
              <select
                name="teamId"
                value={formData.teamId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                disabled={loading}
              >
                <option value={1}>Team Alpha</option>
                <option value={2}>Team Beta</option>
                <option value={3}>Team Gamma</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Student ID *
              </label>
              <input
                type="number"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="Enter student ID"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>
          )}

          {/* GitHub Repository */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              GitHub Repository (Optional)
            </label>
            <input
              type="url"
              name="githubRepo"
              value={formData.githubRepo}
              onChange={handleChange}
              placeholder="https://github.com/username/repository"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <Save size={20} />
              <span>{loading ? 'Creating...' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;
