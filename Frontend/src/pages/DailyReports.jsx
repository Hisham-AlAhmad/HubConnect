import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { reportsAPI, checkInAPI, teamAPI } from '../services/api';
import { ROLES } from '../utils/constants';
import {
  Calendar,
  Clock,
  Users,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
  BarChart3,
  Filter
} from 'lucide-react';

export default function DailyReports() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user.role === ROLES.ADMIN || user.role === ROLES.INSTRUCTOR;

  const fetchReport = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      setError('');
      const [reportRes, teamsRes] = await Promise.all([
        reportsAPI.getDailyReport(selectedDate),
        teamAPI.getAll()
      ]);
      setReport(reportRes.data);
      setTeams(teamsRes.data);
    } catch (err) {
      setError('Failed to load daily report');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, isAdmin]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null;
    const diff = new Date(checkOut) - new Date(checkIn);
    return (diff / 3600000).toFixed(1);
  };

  const filteredRecords = report?.records?.filter(r => {
    if (selectedTeam === 'all') return true;
    return String(r.teamId) === selectedTeam;
  }) || [];

  const stats = {
    total: filteredRecords.length,
    checkedOut: filteredRecords.filter(r => r.checkOutTime).length,
    stillIn: filteredRecords.filter(r => !r.checkOutTime).length,
    avgHours: (() => {
      const completed = filteredRecords.filter(r => r.checkOutTime);
      if (completed.length === 0) return 0;
      const total = completed.reduce((sum, r) => {
        return sum + (parseFloat(calculateHours(r.checkInTime, r.checkOutTime)) || 0);
      }, 0);
      return (total / completed.length).toFixed(1);
    })()
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">You don&apos;t have permission to view reports.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Attendance Report</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View daily check-in and check-out records</p>
        </div>

        <button
          onClick={() => {
            const csv = [
              ['Name', 'Team', 'Check In', 'Check Out', 'Hours', 'Notes'].join(','),
              ...filteredRecords.map(r => [
                r.userName,
                r.teamName || '--',
                formatTime(r.checkInTime),
                r.checkOutTime ? formatTime(r.checkOutTime) : '--',
                calculateHours(r.checkInTime, r.checkOutTime) || '--',
                `"${(r.notes || '').replace(/"/g, '""')}"`
              ].join(','))
            ].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `daily-report-${selectedDate}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Date Selector & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
          <button onClick={() => changeDate(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-0 text-sm font-medium text-gray-900 dark:text-white focus:ring-0 p-0 dark:bg-gray-800"
            />
          </div>
          <button onClick={() => changeDate(1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium ml-2"
          >
            Today
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="border-0 text-sm font-medium text-gray-900 dark:text-white focus:ring-0 p-0 dark:bg-gray-800"
          >
            <option value="all">All Teams</option>
            {teams.map(team => (
              <option key={team.id} value={String(team.id)}>{team.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Check-ins</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.checkedOut}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Still Working</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.stillIn}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Timer className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Avg. Hours</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgHours}h</p>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Attendance Records</h2>
          <span className="text-sm text-gray-400 ml-2">({filteredRecords.length} records)</span>
        </div>
        <div className="overflow-x-auto">
          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No records for this date</p>
              <p className="text-sm mt-1">No one has checked in on {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Team</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check In</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check Out</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hours</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRecords.map((record) => {
                  const hours = calculateHours(record.checkInTime, record.checkOutTime);
                  return (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <span className="text-primary-700 font-medium text-sm">
                              {record.userName?.charAt(0) || '?'}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{record.userName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{record.teamName || '--'}</td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{formatTime(record.checkInTime)}</td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {record.checkOutTime ? formatTime(record.checkOutTime) : '--'}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {hours ? `${hours}h` : '--'}
                      </td>
                      <td className="px-5 py-4">
                        {record.checkOutTime ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                            <Clock className="w-3 h-3" />
                            Working
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {record.notes || '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
