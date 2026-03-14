export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-5)}`;
}

export function makeClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export const AVATARS = ['🦊','🐼','🦁','🐸','🐯','🐳','🦄','🐙','🐧','🦖','🐨','🐻'];

export function defaultMembershipState() {
  return {
    currentUser: null,
    teachers: [],
    students: [],
    classes: [],
    assignments: [],
    reports: [],
    assignmentProgress: [],
    syncPackages: [],
    cloud: { enabled: false, lastSyncAt: '', lastPullAt: '', status: 'idle', mode: 'disabled', message: '' },
  };
}

export function normalizeMembershipState(raw) {
  const base = defaultMembershipState();
  return {
    ...base,
    ...(raw || {}),
    teachers: Array.isArray(raw?.teachers) ? raw.teachers : [],
    students: Array.isArray(raw?.students) ? raw.students : [],
    classes: Array.isArray(raw?.classes) ? raw.classes : [],
    assignments: Array.isArray(raw?.assignments) ? raw.assignments : [],
    reports: Array.isArray(raw?.reports) ? raw.reports : [],
    assignmentProgress: Array.isArray(raw?.assignmentProgress) ? raw.assignmentProgress : [],
    syncPackages: Array.isArray(raw?.syncPackages) ? raw.syncPackages : [],
    cloud: { ...base.cloud, ...(raw?.cloud || {}) },
  };
}

export function safeEmail(v = '') {
  return String(v || '').trim().toLowerCase();
}

export function summarizeStudentProgress(reports = [], studentId) {
  const mine = reports.filter((report) => report.studentId === studentId);
  const totalGames = mine.length;
  const totalScore = mine.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
  const totalCorrect = mine.reduce((sum, item) => sum + (Number(item.correct) || 0), 0);
  const totalWrong = mine.reduce((sum, item) => sum + (Number(item.wrong) || 0), 0);
  const badges = [...new Set(mine.map((item) => item.badge).filter(Boolean))];
  return { totalGames, totalScore, totalCorrect, totalWrong, badges, recent: mine.slice(-8).reverse() };
}

export function classStudentRows(cls, students = [], reports = []) {
  const members = (cls?.studentIds || []).map((id) => students.find((student) => student.id === id)).filter(Boolean);
  return members.map((student) => {
    const summary = summarizeStudentProgress(reports, student.id);
    return { ...student, ...summary };
  }).sort((a, b) => b.totalScore - a.totalScore);
}

export function classAssignments(cls, assignments = []) {
  return assignments.filter((assignment) => assignment.classId === cls?.id).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export function studentAssignments(student, classes = [], assignments = []) {
  if (!student) return [];
  const classIds = classes.filter((cls) => (cls.studentIds || []).includes(student.id)).map((cls) => cls.id);
  return assignments.filter((assignment) => classIds.includes(assignment.classId)).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export function createSyncPackage(state) {
  return {
    id: uid('sync'),
    createdAt: new Date().toISOString(),
    payload: state,
  };
}


export function summarizeAssignmentProgress(assignmentId, assignmentProgress = [], cls = null) {
  const rows = assignmentProgress.filter((item) => item.assignmentId === assignmentId);
  const total = cls?.studentIds?.length || rows.length;
  const completed = rows.filter((item) => item.status === 'completed').length;
  const started = rows.filter((item) => item.status === 'started').length;
  return { total, completed, started, pending: Math.max(0, total - completed), completionRate: total ? Math.round((completed / total) * 100) : 0 };
}

export function buildTeacherCharts(classes = [], assignments = [], reports = [], students = [], assignmentProgress = []) {
  const activeStudents = new Set(classes.flatMap((cls) => cls.studentIds || []));
  const reportTotals = classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
    reports: reports.filter((report) => (cls.studentIds || []).includes(report.studentId)).length,
    totalScore: reports.filter((report) => (cls.studentIds || []).includes(report.studentId)).reduce((sum, item) => sum + (Number(item.score) || 0), 0),
  }));
  const topStudents = students.filter((student) => activeStudents.has(student.id)).map((student) => ({
    id: student.id,
    name: student.name,
    avatar: student.avatar || '🧒',
    score: reports.filter((report) => report.studentId === student.id).reduce((sum, item) => sum + (Number(item.score) || 0), 0),
  })).sort((a, b) => b.score - a.score).slice(0, 5);

  const assignmentRows = assignments.map((assignment) => {
    const cls = classes.find((item) => item.id === assignment.classId);
    return { id: assignment.id, title: assignment.title, className: cls?.name || 'Sınıf', ...(summarizeAssignmentProgress(assignment.id, assignmentProgress, cls)) };
  }).sort((a, b) => b.completionRate - a.completionRate);

  return {
    classPerformance: reportTotals,
    topStudents,
    assignmentRows,
  };
}
