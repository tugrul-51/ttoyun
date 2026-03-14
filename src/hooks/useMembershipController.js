import { useCallback, useState } from 'react';
import { pullCloudSnapshot, pushCloudSnapshot } from '../utils/cloudSync';
import { createSyncPackage, makeClassCode, normalizeMembershipState, safeEmail, uid } from '../utils/membership';

export function useMembershipController({
  initialMembership,
  initialUserRole = 'teacher',
  notify,
  setScreen,
  setTopic,
  onSettingsUserRoleChange,
  onSettingsMerge,
  onCompetitionMerge,
  onStartAssignmentTopic,
}) {
  const [membership, setMembership] = useState(normalizeMembershipState(initialMembership));
  const setUserRole = useCallback((role) => {
    onSettingsUserRoleChange?.(role);
  }, [onSettingsUserRoleChange]);

  const registerTeacher = useCallback(({ name, email, password }) => {
    const cleanEmail = safeEmail(email);
    if (!name?.trim() || !cleanEmail || !password?.trim()) { notify('Öğretmen kaydı için ad, e-posta ve şifre gerekli.'); return; }
    setMembership((prev) => {
      if ((prev.teachers || []).some((teacher) => safeEmail(teacher.email) === cleanEmail)) { notify('Bu e-posta ile kayıtlı öğretmen zaten var.'); return prev; }
      const teacher = { id: uid('teacher'), role: 'teacher', name: name.trim(), email: cleanEmail, password, avatar: '🧑‍🏫', createdAt: new Date().toISOString() };
      return { ...prev, teachers: [...(prev.teachers || []), teacher], currentUser: teacher };
    });
    setUserRole('teacher');
    setScreen?.('membership');
  }, [notify, setScreen, setUserRole]);

  const loginTeacher = useCallback(({ email, password }) => {
    const cleanEmail = safeEmail(email);
    const teacher = (membership.teachers || []).find((item) => safeEmail(item.email) === cleanEmail && item.password === password);
    if (!teacher) { notify('Öğretmen girişi başarısız. Bilgileri kontrol et.'); return; }
    setMembership((prev) => ({ ...prev, currentUser: teacher }));
    setUserRole('teacher');
    setScreen?.('membership');
  }, [membership.teachers, notify, setScreen, setUserRole]);

  const createClass = useCallback(({ name, level, subject }) => {
    setMembership((prev) => {
      if (!prev.currentUser || prev.currentUser.role !== 'teacher') { notify('Önce öğretmen girişi yapmalısın.'); return prev; }
      if (!name?.trim()) { notify('Sınıf adı gerekli.'); return prev; }
      const cls = { id: uid('class'), teacherId: prev.currentUser.id, name: name.trim(), level: level?.trim() || '', subject: subject?.trim() || '', code: makeClassCode(), studentIds: [], createdAt: new Date().toISOString() };
      return { ...prev, classes: [...(prev.classes || []), cls] };
    });
  }, [notify]);

  const addStudent = useCallback(({ classId, name, username, password, avatar }) => {
    if (!classId || !name?.trim()) { notify('Öğrenci eklemek için sınıf ve öğrenci adı gerekli.'); return; }
    const student = { id: uid('student'), role: 'student', name: name.trim(), username: username?.trim() || '', password: password?.trim() || '', avatar: avatar || '🧒', createdAt: new Date().toISOString() };
    setMembership((prev) => ({
      ...prev,
      students: [...(prev.students || []), student],
      classes: (prev.classes || []).map((cls) => cls.id === classId ? { ...cls, studentIds: [...new Set([...(cls.studentIds || []), student.id])] } : cls),
    }));
  }, [notify]);

  const createAssignment = useCallback(({ classId, title, topic, liveMode, dueDate }) => {
    if (!classId || !title?.trim() || !topic?.trim()) { notify('Görev için sınıf, başlık ve konu gerekli.'); return; }
    const assignment = { id: uid('assignment'), teacherId: membership.currentUser?.id || '', classId, title: title.trim(), topic: topic.trim(), liveMode: !!liveMode, dueDate: dueDate || '', createdAt: new Date().toISOString() };
    setMembership((prev) => ({ ...prev, assignments: [...(prev.assignments || []), assignment] }));
  }, [membership.currentUser?.id, notify]);

  const joinStudentByCode = useCallback(({ classCode, name, avatar }) => {
    const code = String(classCode || '').trim().toUpperCase();
    const cls = (membership.classes || []).find((item) => item.code === code);
    if (!cls || !name?.trim()) { notify('Geçerli sınıf kodu ve öğrenci adı gerekli.'); return; }
    const student = { id: uid('student'), role: 'student', name: name.trim(), username: '', password: '', avatar: avatar || '🧒', createdAt: new Date().toISOString(), joinedByCode: true };
    setMembership((prev) => ({
      ...prev,
      currentUser: student,
      students: [...(prev.students || []), student],
      classes: (prev.classes || []).map((item) => item.id === cls.id ? { ...item, studentIds: [...new Set([...(item.studentIds || []), student.id])] } : item),
    }));
    setUserRole('student');
  }, [membership.classes, notify, setUserRole]);

  const loginStudentAccount = useCallback(({ username, password }) => {
    const student = (membership.students || []).find((item) => item.username === username && item.password === password);
    if (!student) { notify('Öğrenci hesabı bulunamadı.'); return; }
    setMembership((prev) => ({ ...prev, currentUser: student }));
    setUserRole('student');
  }, [membership.students, notify, setUserRole]);

  const logoutMembership = useCallback(() => {
    setMembership((prev) => ({ ...prev, currentUser: null }));
    setUserRole(initialUserRole);
    setScreen?.('home');
  }, [initialUserRole, setScreen, setUserRole]);

  const createSyncBackup = useCallback(({ settings, competition, topic }) => {
    const pack = createSyncPackage({ membership, settings, competition, topic });
    setMembership((prev) => ({ ...prev, syncPackages: [...(prev.syncPackages || []), { id: pack.id, createdAt: pack.createdAt }] }));
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${pack.id}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }, [membership]);

  const importSyncBackup = useCallback(async (file) => {
    if (!file) return;
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      if (!parsed?.payload) { notify('Geçersiz senkron paketi.'); return; }
      if (parsed.payload.membership) setMembership(normalizeMembershipState(parsed.payload.membership));
      if (parsed.payload.settings) onSettingsMerge?.(parsed.payload.settings);
      if (parsed.payload.competition) onCompetitionMerge?.(parsed.payload.competition);
      if (parsed.payload.topic) setTopic?.(parsed.payload.topic);
      notify('Senkron paketi içe aktarıldı.');
    } catch {
      notify('Senkron paketi okunamadı. Dosya bozuk olabilir.');
    }
  }, [notify, onCompetitionMerge, onSettingsMerge, setTopic]);

  const pushMembershipToCloud = useCallback(async ({ settings, competition, topic }) => {
    try {
      setMembership((prev) => ({ ...prev, cloud: { ...(prev.cloud || {}), status: 'syncing', message: 'Buluta gönderiliyor...' } }));
      const result = await pushCloudSnapshot({ user: membership.currentUser, source: 'manual-push', payload: { membership, settings, competition, topic } });
      setMembership((prev) => ({ ...prev, cloud: { ...(prev.cloud || {}), enabled: true, mode: result.mode, status: 'synced', lastSyncAt: new Date().toISOString(), message: `Bulut senkron tamamlandı (${result.mode}).` } }));
      notify('Bulut senkron tamamlandı.');
    } catch (error) {
      setMembership((prev) => ({ ...prev, cloud: { ...(prev.cloud || {}), status: 'error', message: error?.message || 'Bulut senkron hatası.' } }));
      notify(error?.message || 'Bulut senkron hatası.');
    }
  }, [membership, notify]);

  const pullMembershipFromCloud = useCallback(async () => {
    try {
      setMembership((prev) => ({ ...prev, cloud: { ...(prev.cloud || {}), status: 'pulling', message: 'Buluttan veriler alınıyor...' } }));
      const result = await pullCloudSnapshot({ user: membership.currentUser });
      if (!result?.snapshot?.payload) throw new Error('Bulutta alınacak kayıt bulunamadı.');
      const payload = result.snapshot.payload;
      if (payload.membership) setMembership(normalizeMembershipState({ ...payload.membership, cloud: { ...(payload.membership.cloud || {}), enabled: true, mode: result.mode, status: 'synced', lastPullAt: new Date().toISOString(), message: `Buluttan veri alındı (${result.mode}).` } }));
      if (payload.settings) onSettingsMerge?.(payload.settings);
      if (payload.competition) onCompetitionMerge?.(payload.competition);
      if (payload.topic) setTopic?.(payload.topic);
      notify('Bulut verisi içe aktarıldı.');
    } catch (error) {
      setMembership((prev) => ({ ...prev, cloud: { ...(prev.cloud || {}), status: 'error', message: error?.message || 'Buluttan veri alınamadı.' } }));
      notify(error?.message || 'Buluttan veri alınamadı.');
    }
  }, [membership.currentUser, notify, onCompetitionMerge, onSettingsMerge, setTopic]);

  const startAssignmentFlow = useCallback(async (assignment) => {
    if (!assignment?.topic) return;
    if (membership.currentUser?.role === 'student') {
      setMembership((prev) => {
        const existing = (prev.assignmentProgress || []).find((item) => item.assignmentId === assignment.id && item.studentId === prev.currentUser?.id);
        const nextRow = existing ? { ...existing, status: existing.status === 'completed' ? 'completed' : 'started', startedAt: existing.startedAt || new Date().toISOString(), updatedAt: new Date().toISOString() } : { id: uid('assignmentprogress'), assignmentId: assignment.id, studentId: prev.currentUser?.id, classId: assignment.classId, status: 'started', startedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        return { ...prev, assignmentProgress: existing ? prev.assignmentProgress.map((item) => item.id === existing.id ? nextRow : item) : [...(prev.assignmentProgress || []), nextRow] };
      });
    }
    setTopic?.(assignment.topic);
    setScreen?.('home');
    await Promise.resolve();
    onStartAssignmentTopic?.(assignment);
  }, [membership.currentUser?.role, onStartAssignmentTopic, setScreen, setTopic]);

  return {
    membership,
    setMembership,
    registerTeacher,
    loginTeacher,
    createClass,
    addStudent,
    createAssignment,
    joinStudentByCode,
    loginStudentAccount,
    logoutMembership,
    createSyncBackup,
    importSyncBackup,
    pushMembershipToCloud,
    pullMembershipFromCloud,
    startAssignmentFlow,
  };
}
