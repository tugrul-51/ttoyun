import { useCallback, useState } from 'react';
import { pullCloudSnapshot, pushCloudSnapshot } from '../utils/cloudSync';
import { createSyncPackage, makeClassCode, normalizeMembershipState, safeEmail, uid } from '../utils/membership';

function sanitizeQuestionSetImport(parsed) {
  if (!parsed) return null;
  const data = parsed.payload || parsed;
  if (!Array.isArray(data.questions) || !data.questions.length) return null;
  return {
    name: String(data.name || data.title || 'İçe aktarılan set').trim(),
    topic: String(data.topic || '').trim(),
    questions: data.questions,
    selectedIndexes: Array.isArray(data.selectedIndexes) ? data.selectedIndexes : data.questions.map((_, index) => index),
    folder: String(data.folder || '').trim(),
    tags: Array.isArray(data.tags) ? data.tags.filter(Boolean) : [],
    settingsSnapshot: data.settingsSnapshot || data.settings || null,
    publishMode: data.publishMode === 'published' ? 'published' : 'edit',
    notes: String(data.notes || '').trim(),
  };
}

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

  const saveQuestionSet = useCallback(({ id, name, topic, questions, selectedIndexes, settingsSnapshot, folder, tags, publishMode, notes }) => {
    const currentUser = membership.currentUser;
    if (!currentUser) {
      notify('Soruları kaydetmek için önce giriş yapmalısın.');
      return null;
    }
    const trimmedName = String(name || '').trim();
    if (!trimmedName) {
      notify('Kaydetmek için bir isim yazmalısın.');
      return null;
    }
    const normalizedQuestions = Array.isArray(questions) ? questions : [];
    if (!normalizedQuestions.length) {
      notify('Kaydedilecek soru bulunamadı.');
      return null;
    }
    const normalizedTags = Array.isArray(tags)
      ? Array.from(new Set(tags.map((tag) => String(tag || '').trim()).filter(Boolean)))
      : String(tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
    const safeSelectedIndexes = Array.isArray(selectedIndexes)
      ? Array.from(new Set(selectedIndexes.filter((value) => Number.isInteger(value) && value >= 0)))
      : normalizedQuestions.map((_, index) => index);
    const now = new Date().toISOString();
    const questionSetId = id || uid('questionpack');
    setMembership((prev) => {
      const existing = (prev.savedQuestionSets || []).find((item) => item.id === questionSetId);
      const nextItem = {
        id: questionSetId,
        ownerId: currentUser.id,
        ownerRole: currentUser.role,
        ownerName: currentUser.name,
        name: trimmedName,
        topic: String(topic || '').trim(),
        questions: normalizedQuestions,
        selectedIndexes: safeSelectedIndexes,
        questionCount: normalizedQuestions.length,
        folder: String(folder || '').trim(),
        tags: normalizedTags,
        settingsSnapshot: settingsSnapshot || existing?.settingsSnapshot || null,
        publishMode: publishMode === 'published' ? 'published' : 'edit',
        notes: String(notes || '').trim(),
        updatedAt: now,
        createdAt: existing?.createdAt || now,
      };
      return {
        ...prev,
        savedQuestionSets: existing
          ? (prev.savedQuestionSets || []).map((item) => item.id === questionSetId ? nextItem : item)
          : [nextItem, ...(prev.savedQuestionSets || [])],
      };
    });
    notify(id ? 'Soru seti güncellendi.' : 'Soru seti kaydedildi.');
    return { id: questionSetId, name: trimmedName };
  }, [membership.currentUser, notify]);

  const duplicateQuestionSet = useCallback((questionSetId) => {
    const currentUser = membership.currentUser;
    if (!currentUser) { notify('Kopyalamak için önce giriş yapmalısın.'); return null; }
    const source = (membership.savedQuestionSets || []).find((item) => item.id === questionSetId);
    if (!source) return null;
    const now = new Date().toISOString();
    const copy = {
      ...source,
      id: uid('questionpack'),
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      name: `${source.name} (Kopya)`,
      createdAt: now,
      updatedAt: now,
    };
    setMembership((prev) => ({ ...prev, savedQuestionSets: [copy, ...(prev.savedQuestionSets || [])] }));
    notify('Soru seti kopyalandı.');
    return copy;
  }, [membership.currentUser, membership.savedQuestionSets, notify]);

  const deleteQuestionSet = useCallback((questionSetId) => {
    if (!questionSetId) return;
    setMembership((prev) => ({
      ...prev,
      savedQuestionSets: (prev.savedQuestionSets || []).filter((item) => item.id !== questionSetId),
      questionDrafts: (prev.questionDrafts || []).filter((item) => item.questionSetId !== questionSetId),
    }));
    notify('Kayıtlı soru seti silindi.');
  }, [notify]);

  const saveQuestionDraft = useCallback(({ draftId, questionSetId, topic, questions, selectedIndexes, settingsSnapshot, ownerId, sourceName }) => {
    const currentUser = membership.currentUser;
    const scopedOwnerId = ownerId || currentUser?.id || 'guest';
    const safeQuestions = Array.isArray(questions) ? questions : [];
    if (!safeQuestions.length) return null;
    const id = draftId || uid('draft');
    const row = {
      id,
      questionSetId: questionSetId || '',
      ownerId: scopedOwnerId,
      ownerName: currentUser?.name || 'Misafir',
      sourceName: sourceName || topic || 'Adsız taslak',
      topic: String(topic || '').trim(),
      questions: safeQuestions,
      selectedIndexes: Array.isArray(selectedIndexes) ? selectedIndexes : safeQuestions.map((_, index) => index),
      settingsSnapshot: settingsSnapshot || null,
      updatedAt: new Date().toISOString(),
    };
    setMembership((prev) => ({
      ...prev,
      questionDrafts: [(row), ...(prev.questionDrafts || []).filter((item) => item.id !== id)].slice(0, 15),
    }));
    return row;
  }, [membership.currentUser]);

  const dismissQuestionDraft = useCallback((draftId) => {
    if (!draftId) return;
    setMembership((prev) => ({ ...prev, questionDrafts: (prev.questionDrafts || []).filter((item) => item.id !== draftId) }));
  }, []);

  const exportQuestionSet = useCallback((questionSet, format = 'json') => {
    if (!questionSet) return;
    const safeBase = String(questionSet.name || 'soru-seti').replace(/[^a-z0-9-_çğıöşü]/gi, '_');
    if (format === 'csv') {
      const rows = [['Soru', 'A', 'B', 'C', 'D', 'Doğru', 'İpucu', 'Açıklama', 'Konu Etiketi']]
        .concat((questionSet.questions || []).map((question) => [
          question.q || '',
          question.o?.[0] || '',
          question.o?.[1] || '',
          question.o?.[2] || '',
          question.o?.[3] || '',
          Number.isInteger(question.a) ? question.a : 0,
          question.hint || '',
          question.explanation || '',
          question.topicTag || '',
        ]));
      const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${safeBase}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      notify('CSV dışa aktarıldı.');
      return;
    }
    const payload = { ...questionSet, exportedAt: new Date().toISOString(), app: 'T-T Eğitsel Oyunlar' };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${safeBase}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    notify('JSON dışa aktarıldı.');
  }, [notify]);

  const importQuestionSetFile = useCallback(async (file) => {
    if (!file) return null;
    try {
      const raw = await file.text();
      const imported = sanitizeQuestionSetImport(JSON.parse(raw));
      if (!imported) throw new Error('Geçerli soru seti bulunamadı.');
      const currentUser = membership.currentUser;
      if (!currentUser) throw new Error('İçe aktarmak için önce giriş yapmalısın.');
      const now = new Date().toISOString();
      const row = {
        id: uid('questionpack'),
        ownerId: currentUser.id,
        ownerRole: currentUser.role,
        ownerName: currentUser.name,
        ...imported,
        questionCount: imported.questions.length,
        updatedAt: now,
        createdAt: now,
      };
      setMembership((prev) => ({ ...prev, savedQuestionSets: [row, ...(prev.savedQuestionSets || [])] }));
      notify('Soru seti içe aktarıldı.');
      return row;
    } catch (error) {
      notify(error?.message || 'Soru seti içe aktarılamadı.');
      return null;
    }
  }, [membership.currentUser, notify]);

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
    saveQuestionSet,
    duplicateQuestionSet,
    deleteQuestionSet,
    saveQuestionDraft,
    dismissQuestionDraft,
    exportQuestionSet,
    importQuestionSetFile,
    createSyncBackup,
    importSyncBackup,
    pushMembershipToCloud,
    pullMembershipFromCloud,
    startAssignmentFlow,
  };
}
