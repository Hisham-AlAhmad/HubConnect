import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, CheckCircle, Clock, Users, Download } from 'lucide-react';

/**
 * Analytics Page
 * Performance analytics and statistics (Instructor/Admin only)
 */
const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [onTimeLate, setOnTimeLate] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch all analytics data in parallel
      const [statsRes, timelineRes, rankingsRes, onTimeLateRes] = await Promise.all([
        analyticsAPI.getSubmissionStats(),
        analyticsAPI.getSubmissionTimeline(),
        analyticsAPI.getTeamRankings(),
        analyticsAPI.getOnTimeLateStats()
      ]);

      setStats(statsRes.data);
      setTimeline(timelineRes.data);
      setRankings(rankingsRes.data);
      setOnTimeLate(onTimeLateRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Performance insights and submission statistics
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Download size={20} />
          <span>Export Report</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <TrendingUp size={24} className="text-blue-600" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.totalTasks}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Tasks</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-50">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Completed</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.submittedTasks}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Submitted Tasks</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-50">
              <Clock size={24} className="text-orange-600" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Pending</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.pendingTasks}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pending Tasks</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-50">
              <Users size={24} className="text-purple-600" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Rate</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.submissionRate}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Submission Rate</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Submission Timeline
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="onTime" name="On Time" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="late" name="Late" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* On-Time vs Late */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            On-Time vs Late Submissions
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={onTimeLate}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {onTimeLate.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Team Rankings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Team Performance Rankings
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rankings} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="teamName" type="category" stroke="#6b7280" width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="score" name="Score" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Rankings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Detailed Team Rankings
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Team Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Submissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {rankings.map((team, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index === 0 ? (
                        <span className="text-2xl">🥇</span>
                      ) : index === 1 ? (
                        <span className="text-2xl">🥈</span>
                      ) : index === 2 ? (
                        <span className="text-2xl">🥉</span>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400 font-medium">#{index + 1}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      >
                        {team.teamName.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-white">{team.teamName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-3" style={{ width: '100px' }}>
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${team.score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{team.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {team.submissions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${team.score >= 90
                          ? 'bg-green-100 text-green-800'
                          : team.score >= 70
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {team.score >= 90 ? 'Excellent' : team.score >= 70 ? 'Good' : 'Needs Improvement'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
