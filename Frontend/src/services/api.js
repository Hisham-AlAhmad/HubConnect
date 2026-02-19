/* ============================================================
   HubConnect  API layer (stubbed  no backend)
   ============================================================ */

//  AUTH API 

export const authAPI = {
  login: async () => ({ data: null }),
  logout: async () => ({ data: null }),
  updateProfile: async () => ({ data: null }),
  changePassword: async () => ({ data: null }),
  forgotPassword: async () => ({ data: null }),
  verifyResetCode: async () => ({ data: null }),
  resetPassword: async () => ({ data: null }),
};

//  TASK API 

export const taskAPI = {
  getAllTasks: async () => ({ data: [] }),
  getTaskById: async () => ({ data: null }),
  getMyTasks: async () => ({ data: [] }),
  createTask: async () => ({ data: null }),
  updateTask: async () => ({ data: null }),
  deleteTask: async () => ({ data: null }),
};

//  SUBMISSION API 

export const submissionAPI = {
  getAllSubmissions: async () => ({ data: [] }),
  getSubmissionsByTask: async () => ({ data: [] }),
  submitTask: async () => ({ data: null }),
  checkSubmission: async () => ({ data: null }),
};

//  TEAM API 

export const teamAPI = {
  getAllTeams: async () => ({ data: [] }),
  getAll: async () => ({ data: [] }),
  getTeamById: async () => ({ data: null }),
  getTeamMembers: async () => ({ data: [] }),
  createTeam: async () => ({ data: null }),
  updateTeam: async () => ({ data: null }),
  deleteTeam: async () => ({ data: null }),
  addMember: async () => ({ data: null }),
  removeMember: async () => ({ data: null }),
  getAllStudents: async () => ({ data: [] }),
};

//  CHECK-IN API 

export const checkInAPI = {
  checkIn: async () => ({ data: null }),
  checkOut: async () => ({ data: null }),
  getTodayStatus: async () => ({ data: null }),
  getByDate: async () => ({ data: [] }),
  getUserHistory: async () => ({ data: [] }),
  getAll: async () => ({ data: [] }),
};

//  REPORTS API 

export const reportsAPI = {
  getDailyReport: async () => ({ data: { date: '', records: [] } }),
  getDateRangeReport: async () => ({ data: { startDate: '', endDate: '', records: [] } }),
  getStudentReport: async () => ({ data: null }),
  getAllStudentsSummary: async () => ({ data: [] }),
};

//  ANALYTICS API 

export const analyticsAPI = {
  getSubmissionStats: async () => ({
    data: { totalTasks: 0, submittedTasks: 0, pendingTasks: 0, submissionRate: 0 },
  }),
  getSubmissionTimeline: async () => ({ data: [] }),
  getTeamRankings: async () => ({ data: [] }),
  getOnTimeLateStats: async () => ({
    data: [
      { name: 'On Time', value: 0, percentage: 0 },
      { name: 'Late', value: 0, percentage: 0 },
    ],
  }),
};

//  WORKSPACE API 

export const workspaceAPI = {
  getAll: async () => ({ data: [] }),
  getById: async () => ({ data: null }),
  create: async () => ({ data: null }),
  update: async () => ({ data: null }),
  finish: async () => ({ data: null }),
  addTeam: async () => ({ data: null }),
  removeTeam: async () => ({ data: null }),
  assignLeader: async () => ({ data: null }),
  addMember: async () => ({ data: null }),
  removeMember: async () => ({ data: null }),
  getTasks: async () => ({ data: [] }),
  createTask: async () => ({ data: null }),
  updateTask: async () => ({ data: null }),
};

//  NOTIFICATION API 

export const notificationAPI = {
  getNotifications: async () => ({ data: [] }),
  markAsRead: async () => ({ data: null }),
  markAllAsRead: async () => ({ data: null }),
};

// Default export for backward compatibility
const api = {
  authAPI,
  taskAPI,
  submissionAPI,
  teamAPI,
  checkInAPI,
  reportsAPI,
  analyticsAPI,
  notificationAPI,
  workspaceAPI,
};
export default api;
