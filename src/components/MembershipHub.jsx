import { useMemo, useRef, useState } from 'react';
import BrandMark from './common/BrandMark';
import { AVATARS, buildTeacherCharts, classAssignments, classStudentRows, studentAssignments, summarizeAssignmentProgress, summarizeStudentProgress } from '../utils/membership';
import { getCloudConfig } from '../utils/cloudSync';
import { MODES } from '../constants/gameRegistry';

const panel = { background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))', borderRadius: 24, border: '1px solid rgba(255,255,255,.08)', padding: 18, boxShadow: '0 18px 40px rgba(0,0,0,.16)' };
const input = { width: '100%', padding: '12px 14px', borderRadius: 14, background: 'rgba(0,0,0,.24)', color: '#fff', border: '1px solid rgba(255,255,255,.1)', fontSize: 15, fontFamily: 'inherit' };
const smallBtn = { padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, cursor: 'pointer' };
const primaryBtn = { padding: '13px 16px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6C5CE7,#4ECDC4)', color: '#fff', fontWeight: 900, cursor: 'pointer' };
const ghostBtn = { ...smallBtn, background: 'rgba(108,92,231,.16)' };

function SectionTitle({ eyebrow, title, text }) {
  return <div><div style={{ fontSize: 12, color: '#9FB3CD', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }}>{eyebrow}</div><div style={{ fontSize: 26, color: '#fff', fontWeight: 900, marginTop: 4 }}>{title}</div>{text ? <div style={{ color: '#BFCDE3', lineHeight: 1.55, marginTop: 8 }}>{text}</div> : null}</div>;
}
function MiniStat({ label, value, tone = '#fff' }) { return <div style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}><div style={{ color: '#9FB3CD', fontSize: 12 }}>{label}</div><div style={{ color: tone, fontWeight: 900, fontSize: 24, marginTop: 4 }}>{value}</div></div>; }
function TabButton({ active, children, onClick }) { return <button onClick={onClick} style={{ ...smallBtn, background: active ? 'linear-gradient(135deg,#6C5CE7,#4ECDC4)' : 'rgba(255,255,255,.05)', border: active ? 'none' : smallBtn.border }}>{children}</button>; }

function Card({ children, style }) { return <div style={{ ...panel, ...style }}>{children}</div>; }

export default function MembershipHub({ membership, onClose, onTeacherRegister, onTeacherLogin, onClassCreate, onStudentAdd, onAssignmentCreate, onStudentJoin, onStudentAccountLogin, onStartAssignment, onLogout, onImportSync, onCreateSyncPackage, onCloudPush, onCloudPull }) {
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', password: '' });
  const [teacherLogin, setTeacherLogin] = useState({ email: '', password: '' });
  const [classForm, setClassForm] = useState({ name: '', level: '', subject: '' });
  const [studentForm, setStudentForm] = useState({ classId: '', name: '', username: '', password: '', avatar: AVATARS[0] });
  const [assignmentForm, setAssignmentForm] = useState({ classId: '', title: '', topic: '', liveMode: true, dueDate: '' });
  const [joinForm, setJoinForm] = useState({ classCode: '', name: '', avatar: AVATARS[1] });
  const [studentLogin, setStudentLogin] = useState({ username: '', password: '' });
  const [teacherTab, setTeacherTab] = useState('classes');
  const [focusedClassId, setFocusedClassId] = useState('');
  const fileRef = useRef(null);

  const current = membership.currentUser;
  const cloudConfig = getCloudConfig();
  const teacherClasses = useMemo(() => current?.role === 'teacher' ? membership.classes.filter((cls) => cls.teacherId === current.id) : [], [membership.classes, current]);
  const studentSummary = useMemo(() => current?.role === 'student' ? summarizeStudentProgress(membership.reports, current.id) : null, [membership.reports, current]);
  const studentTasks = useMemo(() => current?.role === 'student' ? studentAssignments(current, membership.classes, membership.assignments) : [], [current, membership.classes, membership.assignments]);
  const charts = useMemo(() => current?.role === 'teacher' ? buildTeacherCharts(teacherClasses, membership.assignments, membership.reports, membership.students, membership.assignmentProgress) : null, [current, teacherClasses, membership.assignments, membership.reports, membership.students, membership.assignmentProgress]);
  const selectedClass = teacherClasses.find((cls) => cls.id === focusedClassId || cls.id === studentForm.classId || cls.id === assignmentForm.classId) || teacherClasses[0] || null;

  const teacherOverview = (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card>
        <SectionTitle eyebrow='Hızlı özet' title='Sadece önemli olanları göster' text='Öğretmen ekranı dört basit işe indirildi: sınıflar, öğrenciler, görevler ve raporlar.' />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginTop: 14 }}>
          <MiniStat label='Sınıf' value={teacherClasses.length} />
          <MiniStat label='Öğrenci' value={teacherClasses.reduce((sum, cls) => sum + (cls.studentIds?.length || 0), 0)} />
          <MiniStat label='Görev' value={charts?.assignmentRows?.length || 0} />
          <MiniStat label='Rapor' value={charts?.classPerformance?.reduce((sum, row) => sum + row.reports, 0) || 0} tone='#4ECDC4' />
        </div>
      </Card>
      <Card>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <TabButton active={teacherTab === 'classes'} onClick={() => setTeacherTab('classes')}>Sınıflar</TabButton>
          <TabButton active={teacherTab === 'students'} onClick={() => setTeacherTab('students')}>Öğrenciler</TabButton>
          <TabButton active={teacherTab === 'assignments'} onClick={() => setTeacherTab('assignments')}>Görevler</TabButton>
          <TabButton active={teacherTab === 'reports'} onClick={() => setTeacherTab('reports')}>Raporlar</TabButton>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: teacherClasses.length ? 'minmax(0,1.2fr) minmax(240px,.8fr)' : '1fr', gap: 10, marginBottom: 14 }}>
          <div style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#BFCDE3' }}>İlk bakışta sadece dört işi gösteriyoruz. Derin ayarlar sağ panelde kalır.</div>
          {teacherClasses.length ? <select style={input} value={focusedClassId} onChange={(e) => setFocusedClassId(e.target.value)}><option value=''>Odak sınıf: tümü</option>{teacherClasses.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}</select> : null}
        </div>

        {teacherTab === 'classes' ? (
          <div style={{ display: 'grid', gap: 14 }}>
            <SectionTitle eyebrow='Sınıf oluştur' title='İlk iş sınıfı kur' text='Öğretmenin her zaman bu ekrandan başlayabilmesi için sınıf kurulumu tek karta indirildi.' />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
              <input style={input} placeholder='Sınıf adı' value={classForm.name} onChange={(e) => setClassForm((p) => ({ ...p, name: e.target.value }))} />
              <input style={input} placeholder='Seviye' value={classForm.level} onChange={(e) => setClassForm((p) => ({ ...p, level: e.target.value }))} />
              <input style={input} placeholder='Ders / konu' value={classForm.subject} onChange={(e) => setClassForm((p) => ({ ...p, subject: e.target.value }))} />
              <button onClick={() => onClassCreate(classForm)} style={primaryBtn}>Sınıf Oluştur</button>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {teacherClasses.length ? teacherClasses.map((cls) => {
                const rows = classStudentRows(cls, membership.students, membership.reports);
                return <div key={cls.id} style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', display: 'grid', gridTemplateColumns: 'minmax(180px,1.2fr) repeat(auto-fit,minmax(110px,1fr))', gap: 10, alignItems: 'center' }}><div><div style={{ color: '#fff', fontWeight: 900 }}>{cls.name}</div><div style={{ color: '#9FB3CD', fontSize: 12 }}>{cls.level || 'Seviye yok'} • Kod: {cls.code}</div></div><MiniStat label='Öğrenci' value={cls.studentIds?.length || 0} /><MiniStat label='Görev' value={classAssignments(cls, membership.assignments).length} /><MiniStat label='Puan' value={rows.reduce((sum, item) => sum + item.totalScore, 0)} /><MiniStat label='Canlı başlat' value={<button style={ghostBtn} onClick={() => onStartAssignment(classAssignments(cls, membership.assignments)[0])}>İlk görevi aç</button>} /></div>;
              }) : <div style={{ color: '#9FB3CD' }}>Henüz sınıf yok. Önce yukarıdan bir sınıf oluştur.</div>}
            </div>
          </div>
        ) : null}

        {teacherTab === 'students' ? (
          <div style={{ display: 'grid', gap: 14 }}>
            <SectionTitle eyebrow='Öğrenci ekle' title='Sınıfa öğrenciyi hızlıca bağla' text='Kod, kullanıcı adı ve avatar tek kartta. Küçük yaşta e-posta zorunlu değil.' />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
              <select style={input} value={studentForm.classId} onChange={(e) => setStudentForm((p) => ({ ...p, classId: e.target.value }))}><option value=''>Sınıf seç</option>{teacherClasses.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}</select>
              <input style={input} placeholder='Ad soyad' value={studentForm.name} onChange={(e) => setStudentForm((p) => ({ ...p, name: e.target.value }))} />
              <input style={input} placeholder='Kullanıcı adı' value={studentForm.username} onChange={(e) => setStudentForm((p) => ({ ...p, username: e.target.value }))} />
              <input style={input} type='password' placeholder='Şifre' value={studentForm.password} onChange={(e) => setStudentForm((p) => ({ ...p, password: e.target.value }))} />
              <select style={input} value={studentForm.avatar} onChange={(e) => setStudentForm((p) => ({ ...p, avatar: e.target.value }))}>{AVATARS.map((avatar) => <option key={avatar} value={avatar}>{avatar}</option>)}</select>
              <button onClick={() => onStudentAdd(studentForm)} style={primaryBtn}>Öğrenci Ekle</button>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {(selectedClass ? classStudentRows(selectedClass, membership.students, membership.reports) : []).map((student) => (
                <div key={student.id} style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', display: 'grid', gridTemplateColumns: 'minmax(180px,1.2fr) repeat(auto-fit,minmax(110px,1fr))', gap: 10, alignItems: 'center' }}>
                  <div><div style={{ color: '#fff', fontWeight: 900 }}>{student.avatar || '🧒'} {student.name}</div><div style={{ color: '#9FB3CD', fontSize: 12 }}>Kullanıcı adı: {student.username}</div></div>
                  <MiniStat label='Oyun' value={student.totalGames} />
                  <MiniStat label='Puan' value={student.totalScore} />
                  <MiniStat label='Doğru' value={student.totalCorrect} />
                  <MiniStat label='Rozet' value={student.badges?.length || 0} tone='#FFD166' />
                </div>
              ))}
              {!selectedClass ? <div style={{ color: '#9FB3CD' }}>Önce bir sınıf seçerek öğrenci listesini görüntüle.</div> : null}
            </div>
          </div>
        ) : null}

        {teacherTab === 'assignments' ? (
          <div style={{ display: 'grid', gap: 14 }}>
            <SectionTitle eyebrow='Görev ver' title='Canlı ders veya ödev oluştur' text='Öğretmen önce başlığı ve konuyu girer, sonra görev sınıfa bağlanır.' />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: 10 }}>
              <select style={input} value={assignmentForm.classId} onChange={(e) => setAssignmentForm((p) => ({ ...p, classId: e.target.value }))}><option value=''>Sınıf seç</option>{teacherClasses.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}</select>
              <input style={input} placeholder='Görev başlığı' value={assignmentForm.title} onChange={(e) => setAssignmentForm((p) => ({ ...p, title: e.target.value }))} />
              <input style={input} placeholder='Konu' value={assignmentForm.topic} onChange={(e) => setAssignmentForm((p) => ({ ...p, topic: e.target.value }))} />
              <input style={input} type='date' value={assignmentForm.dueDate} onChange={(e) => setAssignmentForm((p) => ({ ...p, dueDate: e.target.value }))} />
              <button onClick={() => onAssignmentCreate(assignmentForm)} style={primaryBtn}>Görev Oluştur</button>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {charts?.assignmentRows?.length ? charts.assignmentRows.map((row) => (
                <div key={row.id} style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', display: 'grid', gridTemplateColumns: '1.2fr repeat(4,minmax(0,1fr)) auto', gap: 10, alignItems: 'center' }}>
                  <div><div style={{ color: '#fff', fontWeight: 900 }}>{row.title}</div><div style={{ color: '#9FB3CD', fontSize: 12 }}>{row.className}</div></div>
                  <MiniStat label='Toplam' value={row.total} />
                  <MiniStat label='Başladı' value={row.started} />
                  <MiniStat label='Tamamladı' value={row.completed} tone='#4ECDC4' />
                  <MiniStat label='Oran' value={`%${row.completionRate}`} tone='#FFD166' />
                  <button style={ghostBtn} onClick={() => onStartAssignment(membership.assignments.find((item) => item.id === row.id))}>Canlı Aç</button>
                </div>
              )) : <div style={{ color: '#9FB3CD' }}>Henüz görev yok. Bir görev oluştur ve sınıfa dağıt.</div>}
            </div>
          </div>
        ) : null}

        {teacherTab === 'reports' ? (
          <div style={{ display: 'grid', gap: 14 }}>
            <SectionTitle eyebrow='Raporlar' title='Önce özeti gör, sonra derine in' text='İlk ekranda sadece en gerekli raporlar: sınıf performansı, en iyi öğrenciler ve görev tamamlama.' />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              <Card style={{ padding: 14 }}>
                <div style={{ color: '#fff', fontWeight: 900, marginBottom: 10 }}>Sınıf performansı</div>
                <div style={{ display: 'grid', gap: 10 }}>{charts?.classPerformance?.length ? charts.classPerformance.map((row) => <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,.04)' }}><div style={{ color: '#fff', fontWeight: 800 }}>{row.name}</div><div style={{ color: '#AFC2DF' }}>{row.reports} rapor</div><div style={{ color: '#4ECDC4', fontWeight: 900 }}>{row.totalScore} puan</div></div>) : <div style={{ color: '#9FB3CD' }}>Rapor oluşmadı.</div>}</div>
              </Card>
              <Card style={{ padding: 14 }}>
                <div style={{ color: '#fff', fontWeight: 900, marginBottom: 10 }}>En iyi öğrenciler</div>
                <div style={{ display: 'grid', gap: 10 }}>{charts?.topStudents?.length ? charts.topStudents.map((student, index) => <div key={student.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,.04)' }}><div style={{ fontSize: 24 }}>{student.avatar}</div><div style={{ color: '#fff', fontWeight: 800 }}>{index + 1}. {student.name}</div><div style={{ color: '#FFD166', fontWeight: 900 }}>{student.score}</div></div>) : <div style={{ color: '#9FB3CD' }}>Öğrenci puanı oluşmadı.</div>}</div>
              </Card>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );

  return (
    <div style={{ height: '100%', width: '100%', maxWidth: 1420, margin: '0 auto', display: 'grid', gridTemplateRows: 'auto 1fr', gap: 16, padding: '8px 0 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <BrandMark size={70} />
          <SectionTitle eyebrow='Sınıf ve üyelik merkezi' title='Basit giriş, güçlü içerik' text='İlk ekranda sadece üç yol var: üyeliksiz devam et, öğretmen gir veya öğrenci katıl.' />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {current ? <div style={{ ...panel, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 22 }}>{current.avatar || (current.role === 'teacher' ? '🧑‍🏫' : '🧒')}</span><div><div style={{ color: '#fff', fontWeight: 900 }}>{current.name}</div><div style={{ color: '#9FB3CD', fontSize: 12 }}>{current.role === 'teacher' ? 'Öğretmen' : 'Öğrenci'}</div></div></div> : null}
          {current ? <button onClick={onLogout} style={smallBtn}>Çıkış Yap</button> : null}
          <button onClick={onClose} style={smallBtn}>Hızlı Kullanıma Dön</button>
        </div>
      </div>

      {!current ? (
        <div style={{ minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <Card style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
            <SectionTitle eyebrow='1. Hızlı kullanım' title='Hesapsız devam et' text='Derse hemen başlamak isteyen öğretmen için en hızlı akış burada.' />
            <MiniStat label='Akış' value='Konu → Oyun → Başla' tone='#4ECDC4' />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(78,205,196,.12)', color: '#C9FFF8', fontSize: 12, fontWeight: 800 }}>{MODES.length} oyun</span><span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,.05)', color: '#DCE8F7', fontSize: 12, fontWeight: 800 }}>Kaydırmasız</span></div>
            <div style={{ color: '#BFCDE3', lineHeight: 1.65 }}>Hesap açmadan {MODES.length} oyuna, SCORM dışa aktarmaya ve akıllı tahta düzenine erişim sürer.</div>
            <button onClick={onClose} style={primaryBtn}>Üyeliksiz Devam Et</button>
          </Card>

          <Card style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
            <SectionTitle eyebrow='2. Öğretmen' title='Kayıt ol veya giriş yap' text='Sınıf kur, öğrenci ekle, görev ver ve sonuçları izle.' />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(108,92,231,.16)', color: '#DDD3FF', fontSize: 12, fontWeight: 800 }}>Sınıflar</span><span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(108,92,231,.16)', color: '#DDD3FF', fontSize: 12, fontWeight: 800 }}>Görevler</span><span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(108,92,231,.16)', color: '#DDD3FF', fontSize: 12, fontWeight: 800 }}>Raporlar</span></div>
            <input style={input} placeholder='Ad soyad' value={teacherForm.name} onChange={(e) => setTeacherForm((p) => ({ ...p, name: e.target.value }))} />
            <input style={input} placeholder='E-posta' value={teacherForm.email} onChange={(e) => setTeacherForm((p) => ({ ...p, email: e.target.value }))} />
            <input style={input} type='password' placeholder='Şifre' value={teacherForm.password} onChange={(e) => setTeacherForm((p) => ({ ...p, password: e.target.value }))} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => onTeacherRegister(teacherForm)} style={primaryBtn}>Kayıt Ol</button>
            </div>
            <input style={input} placeholder='E-posta' value={teacherLogin.email} onChange={(e) => setTeacherLogin((p) => ({ ...p, email: e.target.value }))} />
            <input style={input} type='password' placeholder='Şifre' value={teacherLogin.password} onChange={(e) => setTeacherLogin((p) => ({ ...p, password: e.target.value }))} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => onTeacherLogin(teacherLogin)} style={smallBtn}>Giriş Yap</button>
            </div>
          </Card>

          <Card style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
            <SectionTitle eyebrow='3. Öğrenci' title='Kodla katıl veya hesapla gir' text='Küçük yaş için en pratik yöntem: sınıf kodu, ad ve avatar.' />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(255,209,102,.14)', color: '#FFE7A8', fontSize: 12, fontWeight: 800 }}>Kodla katılım</span><span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(255,209,102,.14)', color: '#FFE7A8', fontSize: 12, fontWeight: 800 }}>Avatar seçimi</span></div>
            <input style={input} placeholder='Sınıf kodu' value={joinForm.classCode} onChange={(e) => setJoinForm((p) => ({ ...p, classCode: e.target.value }))} />
            <input style={input} placeholder='Ad soyad' value={joinForm.name} onChange={(e) => setJoinForm((p) => ({ ...p, name: e.target.value }))} />
            <select style={input} value={joinForm.avatar} onChange={(e) => setJoinForm((p) => ({ ...p, avatar: e.target.value }))}>{AVATARS.map((avatar) => <option key={avatar} value={avatar}>{avatar}</option>)}</select>
            <button onClick={() => onStudentJoin(joinForm)} style={primaryBtn}>Kodla Katıl</button>
            <input style={input} placeholder='Kullanıcı adı' value={studentLogin.username} onChange={(e) => setStudentLogin((p) => ({ ...p, username: e.target.value }))} />
            <input style={input} type='password' placeholder='Şifre' value={studentLogin.password} onChange={(e) => setStudentLogin((p) => ({ ...p, password: e.target.value }))} />
            <button onClick={() => onStudentAccountLogin(studentLogin)} style={smallBtn}>Öğrenci Girişi</button>
          </Card>
        </div>
      ) : null}

      {current?.role === 'teacher' ? (
        <div style={{ minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(300px,.9fr)', gap: 16 }}>
          {teacherOverview}
          <div style={{ minHeight: 0, display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: 16, alignContent: 'start' }}>
            <Card>
              <SectionTitle eyebrow='Canlı kontrol' title='Kısa yollar' text='Öğretmen paneli ağırlaşmasın diye ileri seviye işler ayrı tutuldu.' />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                <button onClick={onCreateSyncPackage} style={smallBtn}>Senkron paketi indir</button>
                <button onClick={() => fileRef.current?.click()} style={smallBtn}>Senkron paketi içe aktar</button>
                <button onClick={onCloudPush} style={smallBtn} disabled={!cloudConfig.endpoint}>Buluta gönder</button>
                <button onClick={onCloudPull} style={smallBtn} disabled={!cloudConfig.endpoint}>Buluttan çek</button>
              </div>
              <input ref={fileRef} type='file' hidden accept='application/json' onChange={(event) => { const file = event.target.files?.[0]; if (file) onImportSync(file); event.target.value = ''; }} />
              <div style={{ marginTop: 12, color: '#9FB3CD', fontSize: 12 }}>Bulut modu: {membership.cloud?.status || 'idle'} • {cloudConfig.endpoint ? 'endpoint hazır' : 'yalnız yerel mod'}</div>
            </Card>
            <Card>
              <SectionTitle eyebrow='Sınıf kodu ile katılım' title='Öğrenci girişi sade kaldı' text='Öğrenciler e-posta olmadan sınıf kodu, ad ve avatar ile girebilir.' />
              <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>{teacherClasses.map((cls) => <div key={cls.id} style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}><div><div style={{ color: '#fff', fontWeight: 900 }}>{cls.name}</div><div style={{ color: '#9FB3CD', fontSize: 12 }}>{cls.subject || 'Ders alanı belirtilmedi'}</div></div><div style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(108,92,231,.18)', color: '#fff', fontWeight: 900 }}>{cls.code}</div></div>)}</div>
            </Card>
          </div>
        </div>
      ) : null}

      {current?.role === 'student' ? (
        <div style={{ minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <Card>
            <SectionTitle eyebrow='Görevlerim' title='Sade öğrenci ekranı' text='Öğrenci sadece görevlerini, ilerlemesini ve rozetlerini görür.' />
            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>{studentTasks.length ? studentTasks.map((assignment) => {
              const cls = membership.classes.find((item) => item.id === assignment.classId);
              const progress = summarizeAssignmentProgress(assignment.id, membership.assignmentProgress.filter((item) => item.studentId === current.id), cls);
              return <div key={assignment.id} style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center' }}><div><div style={{ color: '#fff', fontWeight: 900 }}>{assignment.title}</div><div style={{ color: '#9FB3CD', fontSize: 12 }}>{assignment.topic || 'Konu yok'} • {cls?.name || 'Sınıf'}</div></div><div style={{ color: '#FFD166', fontWeight: 900 }}>{progress.completed ? 'Tamamlandı' : progress.started ? 'Başladı' : 'Bekliyor'}</div><button style={primaryBtn} onClick={() => onStartAssignment(assignment)}>Aç</button></div>;
            }) : <div style={{ color: '#9FB3CD' }}>Henüz atanmış görev yok.</div>}</div>
          </Card>
          <div style={{ display: 'grid', gap: 16 }}>
            <Card>
              <SectionTitle eyebrow='İlerlemem' title='Bugüne kadar ne yaptım?' />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12, marginTop: 12 }}>
                <MiniStat label='Toplam oyun' value={studentSummary?.totalGames || 0} />
                <MiniStat label='Toplam puan' value={studentSummary?.totalScore || 0} tone='#4ECDC4' />
                <MiniStat label='Doğru' value={studentSummary?.totalCorrect || 0} />
                <MiniStat label='Yanlış' value={studentSummary?.totalWrong || 0} />
              </div>
            </Card>
            <Card>
              <SectionTitle eyebrow='Rozetlerim' title='Biriktirdiklerin' />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>{studentSummary?.badges?.length ? studentSummary.badges.map((badge) => <div key={badge} style={{ padding: '10px 12px', borderRadius: 999, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: '#fff', fontWeight: 800 }}>{badge}</div>) : <div style={{ color: '#9FB3CD' }}>İlk rozetin ilk tamamlanan görevle gelecek.</div>}</div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
