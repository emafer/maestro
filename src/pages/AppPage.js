import { useState, useCallback } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useSchools, useStudents, useLessons, useProfile } from '../lib/hooks'

// ── helpers ──────────────────────────────────────────────────────────
const fmt = d => new Date(d).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'})
const fmtTime = d => new Date(d).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})
const today = () => new Date().toISOString().slice(0,16)

function gcalUrl(lesson, student, school) {
  const start = new Date(lesson.datetime)
  const end = new Date(start.getTime() + (lesson.duration || student?.duration || 30) * 60000)
  const pad = n => String(n).padStart(2,'0')
  const f8 = d => `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
  const p = new URLSearchParams({
    action:'TEMPLATE',
    text:`Lezione ${student?.instrument} – ${student?.first_name} ${student?.last_name}`,
    dates:`${f8(start)}/${f8(end)}`,
    details:`Scuola: ${school?.name||'–'}\nDurata: ${lesson.duration||student?.duration} min\n${lesson.notes||''}`,
    location: school?.name||''
  })
  return `https://calendar.google.com/calendar/render?${p}`
}

function waUrl(phone, student, lesson, parentName, template) {
  if (!phone) return '#'
  const d = new Date(lesson.datetime)
  const dateStr = d.toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long' })
  const timeStr = d.toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' })
  
  const msg = (template || 'Ciao {{GENITORE}}, ti ricordo la prossima lezione di {{STRUMENTO}} per {{ALUNNO}} il giorno {{DATA}} alle ore {{ORA}}. A presto!')
    .replace('{{GENITORE}}', parentName || 'Buongiorno')
    .replace('{{ALUNNO}}', student.first_name)
    .replace('{{STRUMENTO}}', student.instrument)
    .replace('{{DATA}}', dateStr)
    .replace('{{ORA}}', timeStr)

  return `https://wa.me/${phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`
}

// ═════════════════════════════════════════════════════════════════════
export default function AppPage() {
  const { user, signOut } = useAuth()
  const { schools, add: addSchool, remove: removeSchool } = useSchools()
  const { students, add: addStudent, update: updateStudent, remove: removeStudent } = useStudents()
  const { lessons, add: addLesson, update: updateLesson, remove: removeLesson } = useLessons()
  const { profile, update: updateProfile } = useProfile()

  const [view, setView] = useState('dashboard')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, color='#52C07A') => {
    setToast({msg,color})
    setTimeout(() => setToast(null), 2500)
  }, [])

  const handleAddSchool = async (data) => { await addSchool(data); showToast('Scuola aggiunta ✓') }
  const handleAddStudent = async (data) => { await addStudent(data); showToast('Alunno aggiunto ✓') }
  const handleUpdateStudent = async (id, data) => { await updateStudent(id, data); showToast('Alunno aggiornato ✓') }
  const handleAddLesson = async (data) => { await addLesson(data); showToast('Lezione salvata ✓') }
  const handleUpdateLesson = async (id, data) => { await updateLesson(id, data); showToast('Aggiornato ✓') }

  const studentById = id => students.find(s => s.id === id)
  const schoolById  = id => schools.find(s => s.id === id)
  const lessonsOf   = sid => lessons.filter(l => l.student_id === sid).sort((a,b) => new Date(b.datetime)-new Date(a.datetime))

  const now = Date.now()
  const upcoming = lessons.filter(l => new Date(l.datetime).getTime() > now)
    .sort((a,b) => new Date(a.datetime)-new Date(b.datetime)).slice(0,6)
  const past = lessons.filter(l => new Date(l.datetime).getTime() <= now)
    .sort((a,b) => new Date(b.datetime)-new Date(a.datetime))

  const SchoolBadge = ({id, small}) => {
    const sc = schoolById(id)
    if (!sc) return null
    return <span style={{background:sc.color+'22',color:sc.color,border:`1px solid ${sc.color}44` }} className={small ? "pill small-badge" : "pill badge"}>{sc.name}</span>
  }

  return (
    <div className="app-root">
      <div className="bg-glow"/>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">♩</span>
          <div>
            <div className="logo-title">Maestro</div>
            <div className="logo-sub">Registro Musicale</div>
          </div>
        </div>

        <nav className="nav">
          {[
            {k:'dashboard',icon:'◈',label:'Dashboard'},
            {k:'students', icon:'♟',label:'Alunni'},
            {k:'lessons',  icon:'♫',label:'Lezioni'},
            {k:'schools',  icon:'⌂',label:'Scuole'},
            {k:'settings', icon:'⚙',label:'Impostazioni'},
          ].map(({k,icon,label}) => (
            <button key={k} className={`nav-btn ${view===k?'active':''}`}
              onClick={() => { setView(k); setSelectedStudent(null) }}>
              <span className="nav-icon">{icon}</span><span className="button_label">{label}</span>
            </button>
          ))}
        </nav>

        <div className="side-stats">
          {[['Alunni',students.length],['Lezioni',lessons.length],['Scuole',schools.length]].map(([l,v]) => (
            <div key={l} className="side-stat">
              <span className="side-stat-val">{v}</span>
              <span className="side-stat-label">{l}</span>
            </div>
          ))}
        </div>

        <button className="sign-out-btn" onClick={signOut}>
          ⎋ Esci
        </button>

        <div className="user-badge">
          <span style={{color:'var(--text-muted)',wordBreak:'break-all'}}>{user?.email}</span>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            {view==='dashboard' && 'Dashboard'}
            {view==='students' && (selectedStudent ? (studentById(selectedStudent)?.name||'Alunno') : 'Alunni')}
            {view==='lessons'  && 'Lezioni'}
            {view==='schools'  && 'Scuole / Associazioni'}
            {view==='settings' && 'Impostazioni'}
          </div>
          <div style={{display:'flex',gap:10}}>
            {view==='schools'  && <PrimaryBtn onClick={() => setModal({type:'addSchool'})}>+ Nuova Scuola</PrimaryBtn>}
            {view==='students' && !selectedStudent && <PrimaryBtn onClick={() => setModal({type:'addStudent'})}>+ Nuovo Alunno</PrimaryBtn>}
            {view==='students' && selectedStudent && <>
              <SecBtn onClick={() => setSelectedStudent(null)}>← Torna</SecBtn>
              <PrimaryBtn onClick={() => setModal({type:'addLesson',payload:{student_id:selectedStudent}})}>+ Lezione</PrimaryBtn>
            </>}
            {view==='lessons' && <PrimaryBtn onClick={() => setModal({type:'addLesson',payload:{}})}>+ Nuova Lezione</PrimaryBtn>}
          </div>
        </header>

        <div className="content-area">
          {view==='dashboard' && <Dashboard upcoming={upcoming} past={past} students={students} schools={schools} lessons={lessons} studentById={studentById} schoolById={schoolById} SchoolBadge={SchoolBadge} setView={setView} setSelectedStudent={setSelectedStudent}/>}
          {view==='students'  && !selectedStudent && <Students students={students} schools={schools} schoolById={schoolById} lessonsOf={lessonsOf} SchoolBadge={SchoolBadge} setSelectedStudent={setSelectedStudent} setModal={setModal} removeStudent={removeStudent} showToast={showToast}/>}
          {view==='students'  && selectedStudent && <StudentDetail studentId={selectedStudent} students={students} schools={schools} profile={profile} lessons={lessons} lessonsOf={lessonsOf} schoolById={schoolById} studentById={studentById} SchoolBadge={SchoolBadge} updateLesson={handleUpdateLesson} removeLesson={removeLesson} setModal={setModal} gcalUrl={gcalUrl} showToast={showToast}/>}
          {view==='lessons'   && <LessonsView lessons={lessons} students={students} schools={schools} profile={profile} studentById={studentById} schoolById={schoolById} SchoolBadge={SchoolBadge} updateLesson={handleUpdateLesson} removeLesson={removeLesson} setModal={setModal} gcalUrl={gcalUrl} setSelectedStudent={setSelectedStudent} setView={setView}/>}
          {view==='schools'   && <SchoolsView schools={schools} students={students} lessonsOf={lessonsOf} removeSchool={removeSchool} showToast={showToast}/>}
          {view==='settings'  && <SettingsView profile={profile} updateProfile={updateProfile} showToast={showToast}/>}
        </div>
      </main>

      {/* Modals */}
      {modal?.type==='addSchool'   && <SchoolModal onSave={handleAddSchool} onClose={() => setModal(null)}/>}
      {modal?.type==='addStudent'  && <StudentModal schools={schools} profile={profile} onSave={handleAddStudent} onClose={() => setModal(null)}/>}
      {modal?.type==='editStudent' && <StudentModal schools={schools} profile={profile} initial={modal.payload} onSave={d => handleUpdateStudent(modal.payload.id,d)} onClose={() => setModal(null)}/>}
      {modal?.type==='addLesson'   && <LessonModal students={students} initial={modal.payload} onSave={handleAddLesson} onClose={() => setModal(null)}/>}
      {modal?.type==='editLesson'  && <LessonModal students={students} initial={modal.payload} onSave={d => handleUpdateLesson(modal.payload.id,d)} onClose={() => setModal(null)}/>}

      {toast && <div className="toast" style={{background:toast.color}}>{toast.msg}</div>}
    </div>
  )
}

// ── DASHBOARD ─────────────────────────────────────────────────────────
function Dashboard({upcoming,past,students,schools,lessons,studentById,schoolById,SchoolBadge,setView,setSelectedStudent}) {
  const now = Date.now()
  const todayStr = new Date().toISOString().slice(0,10)
  const todayLessons = lessons.filter(l => l.datetime.slice(0,10) === todayStr)
    .sort((a,b) => new Date(a.datetime)-new Date(b.datetime))

  return (
    <div className="dashboard-grid">
      <Card title={`Oggi · ${new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'})}`} accent='#E8A838' span={2}>
        {todayLessons.length===0 ? <Empty>Nessuna lezione oggi</Empty>
          : todayLessons.map(l => <LessonRow key={l.id} lesson={l} student={studentById(l.student_id)} schoolById={schoolById} SchoolBadge={SchoolBadge} done={new Date(l.datetime).getTime()<now}/>)}
      </Card>

      <Card title='Prossime lezioni' accent='#5B8DD9'>
        {upcoming.length===0 ? <Empty>Nessuna lezione programmata</Empty>
          : upcoming.map(l => <LessonRow key={l.id} lesson={l} student={studentById(l.student_id)} schoolById={schoolById} SchoolBadge={SchoolBadge} onClick={() => {setSelectedStudent(l.student_id);setView('students')}}/>)}
        <button className="link-btn" onClick={() => setView('lessons')}>Vedi tutte →</button>
      </Card>

      <Card title='Ultime lezioni svolte' accent='#52C07A'>
        {past.slice(0,5).length===0 ? <Empty>Nessuna lezione svolta</Empty>
          : past.slice(0,5).map(l => <LessonRow key={l.id} lesson={l} student={studentById(l.student_id)} schoolById={schoolById} SchoolBadge={SchoolBadge} done onClick={() => {setSelectedStudent(l.student_id);setView('students')}}/>)}
      </Card>

      <Card title='Riepilogo per scuola' accent='#9B6DD9' span={2}>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          {schools.map(sc => {
            const count = students.filter(s => s.school_id === sc.id).length
            return (
              <div key={sc.id} style={{background:sc.color+'15',border:`1px solid ${sc.color}33`,borderRadius:12,padding:'12px 20px',minWidth:130}}>
                <div style={{color:sc.color,fontWeight:800,fontSize:26}}>{count}</div>
                <div style={{fontSize:15,color:'var(--text-muted)',marginTop:2}}>{sc.name}</div>
              </div>
            )
          })}
          {schools.length===0 && <Empty>Aggiungi scuole dalla sezione Scuole</Empty>}
        </div>
      </Card>
    </div>
  )
}

// ── STUDENTS LIST ────────────────────────────────────────────────────
function Students({students,schools,schoolById,lessonsOf,SchoolBadge,setSelectedStudent,setModal,removeStudent,showToast}) {
  const [search,setSearch]=useState('')
  const [filterSchool,setFilterSchool]=useState('')
  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    return (!q||(s.name+s.instrument).toLowerCase().includes(q)) && (!filterSchool||s.school_id===filterSchool)
  })
  return (
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <input className="input" placeholder='🔍  Cerca alunno o strumento...' value={search} onChange={e=>setSearch(e.target.value)}/>
        <select className="select" value={filterSchool} onChange={e=>setFilterSchool(e.target.value)}>
          <option value=''>Tutte le scuole</option>
          {schools.map(sc=><option key={sc.id} value={sc.id}>{sc.name}</option>)}
        </select>
      </div>
      {filtered.length===0 && <Empty>Nessun alunno trovato</Empty>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
        {filtered.map(s => {
          const ls = lessonsOf(s.id)
          const next = ls.filter(l=>new Date(l.datetime).getTime()>Date.now()).sort((a,b)=>new Date(a.datetime)-new Date(b.datetime))[0]
          return (
            <div key={s.id} className="student-card" onClick={()=>setSelectedStudent(s.id)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontWeight:700,fontSize:20,color:'var(--text-main)'}}>{s.first_name} {s.last_name}</div>
                  <div style={{color:'var(--primary)',fontSize:15,fontWeight:600,marginTop:2}}>♪ {s.instrument}</div>
                </div>
                <div style={{display:'flex',gap:6}} onClick={e=>e.stopPropagation()}>
                  <IBtn onClick={()=>setModal({type:'editStudent',payload:s})}>✎</IBtn>
                  <IBtn danger onClick={()=>{if(window.confirm(`Eliminare ${s.first_name} ${s.last_name}?`)){removeStudent(s.id);showToast('Alunno eliminato','#E85858')}}}>✕</IBtn>
                </div>
              </div>
              <div style={{marginTop:10,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                <SchoolBadge id={s.school_id} small/>
                <span className="pill">{s.duration} min</span>
                <span className="pill">{ls.length} lezioni</span>
              </div>
              {next && <div style={{marginTop:8,fontSize:14,color:'var(--text-muted)'}}>Prossima: <span style={{color:'#5B8DD9'}}>{fmt(next.datetime)} {fmtTime(next.datetime)}</span></div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── STUDENT DETAIL ───────────────────────────────────────────────────
function StudentDetail({studentId,students,schools,profile,lessonsOf,schoolById,studentById,SchoolBadge,updateLesson,removeLesson,setModal,gcalUrl,showToast}) {
  const student = studentById(studentId)
  const lessons = lessonsOf(studentId)
  const school = schoolById(student?.school_id)
  const [expandId,setExpandId]=useState(null)
  const now = Date.now()
  const future = lessons.filter(l=>new Date(l.datetime).getTime()>now).sort((a,b)=>new Date(a.datetime)-new Date(b.datetime))
  const done   = lessons.filter(l=>new Date(l.datetime).getTime()<=now)
  const nextLesson = future[0]

  if (!student) return <Empty>Alunno non trovato</Empty>
  return (
    <div>
      <div className="student-header">
        <div style={{flex:1}}>
          <div style={{fontSize:26,fontWeight:800,color:'var(--text-main)'}}>{student.first_name} {student.last_name}</div>
          <div style={{color:'var(--primary)',fontWeight:600,marginTop:4}}>♪ {student.instrument} · {student.duration} min/lezione</div>
          <div style={{marginTop:8,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
            <SchoolBadge id={student.school_id}/>
            {student.email && <span className="pill">✉ {student.email}</span>}
          </div>

          <div style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:12}}>
            {(student.father_name || student.father_phone) && (
              <div className="card" style={{padding:'12px 16px',background:'#f8fafc'}}>
                <div style={{fontSize:12,color:'var(--text-muted)',textTransform:'uppercase',fontWeight:600}}>Padre</div>
                <div style={{fontWeight:700,color:'var(--text-main)'}}>{student.father_name || '–'}</div>
                <div style={{fontSize:14,color:'var(--text-muted)'}}>{student.father_phone || '–'}</div>
                {student.father_phone && nextLesson && (
                  <a href={waUrl(student.father_phone, student, nextLesson, student.father_name, profile?.wa_template)} target="_blank" rel="noreferrer" className="link-btn" style={{marginTop:8,fontSize:12,padding:'4px 10px'}}>
                    📱 Promemoria WhatsApp
                  </a>
                )}
              </div>
            )}
            {(student.mother_name || student.mother_phone) && (
              <div className="card" style={{padding:'12px 16px',background:'#f8fafc'}}>
                <div style={{fontSize:12,color:'var(--text-muted)',textTransform:'uppercase',fontWeight:600}}>Madre</div>
                <div style={{fontWeight:700,color:'var(--text-main)'}}>{student.mother_name || '–'}</div>
                <div style={{fontSize:14,color:'var(--text-muted)'}}>{student.mother_phone || '–'}</div>
                {student.mother_phone && nextLesson && (
                  <a href={waUrl(student.mother_phone, student, nextLesson, student.mother_name, profile?.wa_template)} target="_blank" rel="noreferrer" className="link-btn" style={{marginTop:8,fontSize:12,padding:'4px 10px'}}>
                    📱 Promemoria WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexDirection:'column'}}>
          <PrimaryBtn onClick={()=>setModal({type:'addLesson',payload:{student_id:studentId}})}>+ Lezione</PrimaryBtn>
          <SecBtn onClick={()=>setModal({type:'editStudent',payload:student})}>✎ Modifica</SecBtn>
        </div>
      </div>

      <div className="stats-grid">
        {[['Totali',lessons.length],['Svolte',done.length],['Programmate',future.length]].map(([l,v])=>(
          <div key={l} className="stat-card">
            <div style={{fontSize:28,fontWeight:800,color:'var(--primary)'}}>{v}</div>
            <div style={{fontSize:12,color:'var(--text-muted)'}}>{l}</div>
          </div>
        ))}
      </div>

      {future.length>0 && <>
        <SectionTitle>Prossime lezioni</SectionTitle>
        {future.map(l=><LessonCard key={l.id} lesson={l} student={student} school={school} expandId={expandId} setExpandId={setExpandId} updateLesson={updateLesson} removeLesson={removeLesson} setModal={setModal} gcalUrl={gcalUrl} future/>)}
      </>}

      <SectionTitle>Storico lezioni</SectionTitle>
      {done.length===0 && <Empty>Nessuna lezione svolta</Empty>}
      {done.map(l=><LessonCard key={l.id} lesson={l} student={student} school={school} expandId={expandId} setExpandId={setExpandId} updateLesson={updateLesson} removeLesson={removeLesson} setModal={setModal} gcalUrl={gcalUrl}/>)}
    </div>
  )
}

function LessonCard({lesson,student,school,expandId,setExpandId,updateLesson,removeLesson,setModal,gcalUrl,future}) {
  const open = expandId===lesson.id
  const accent = future ? '#5B8DD9' : '#52C07A'
  const [notes,setNotes]=useState(lesson.notes||'')
  const [bring,setBring]=useState(lesson.next_to_bring||'')
  const [topic,setTopic]=useState(lesson.topic||'')
  const [dirty,setDirty]=useState({})

  const save = async () => {
    await updateLesson(lesson.id,{notes,next_to_bring:bring,topic})
    setDirty({})
  }

  return (
    <div className="lesson-card" style={{borderLeft:`3px solid ${accent}`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}} onClick={()=>setExpandId(open?null:lesson.id)}>
        <div>
          <div style={{fontWeight:600,color:'var(--text-main)'}}>{fmt(lesson.datetime)} · <span style={{color:accent}}>{fmtTime(lesson.datetime)}</span></div>
          <div style={{fontSize:13,color:'var(--text-muted)',marginTop:2}}>{lesson.duration||student?.duration} min{lesson.topic?` · ${lesson.topic}`:''}</div>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {lesson.notes && <span style={{color:'var(--primary)'}}>✍</span>}
          {lesson.next_to_bring && <span>📦</span>}
          <span style={{color:'var(--text-dim)',transition:'transform .2s',display:'inline-block',transform:open?'rotate(180deg)':'none'}}>▾</span>
        </div>
      </div>
      {open && (
        <div style={{marginTop:14,borderTop:'1px solid var(--border)',paddingTop:14,display:'flex',flexDirection:'column',gap:10}}>
          <div>
            <label className="label">Argomento</label>
            <input className="input" value={topic} onChange={e=>{setTopic(e.target.value);setDirty(d=>({...d,topic:1}))}} placeholder='Scale, solfeggio...'/>
          </div>
          <div>
            <label className="label">Annotazioni</label>
            <textarea className="input" style={{minHeight:80,resize:'vertical'}} value={notes} onChange={e=>{setNotes(e.target.value);setDirty(d=>({...d,notes:1}))}} placeholder='Note sulla lezione...'/>
          </div>
          <div>
            <label className="label">📦 Portare la prossima volta</label>
            <input className="input" value={bring} onChange={e=>{setBring(e.target.value);setDirty(d=>({...d,bring:1}))}} placeholder='Metodo Beyer, quaderno...'/>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
            {Object.keys(dirty).length>0 && <PrimaryBtn onClick={save}>💾 Salva</PrimaryBtn>}
            <a href={gcalUrl(lesson,student,school)} target='_blank' rel='noreferrer' className="gcal-btn">📅 Google Calendar</a>
            <IBtn danger onClick={()=>{if(window.confirm('Eliminare questa lezione?'))removeLesson(lesson.id)}}>🗑 Elimina</IBtn>
          </div>
        </div>
      )}
    </div>
  )
}

// ── LESSONS VIEW ──────────────────────────────────────────────────────
function LessonsView({lessons,students,schools,profile,studentById,schoolById,SchoolBadge,updateLesson,removeLesson,setModal,gcalUrl,setSelectedStudent,setView}) {
  const [filterSt,setFilterSt]=useState('')
  const [filterSc,setFilterSc]=useState('')
  const [tab,setTab]=useState('upcoming')
  const now = Date.now()

  // Trova l'ID della PRIMA lezione futura per ogni studente
  const nextLessonIds = students.map(s => {
    const sl = lessons.filter(l => l.student_id === s.id && new Date(l.datetime).getTime() > now)
      .sort((a,b) => new Date(a.datetime) - new Date(b.datetime))[0]
    return sl?.id
  }).filter(Boolean)

  const filtered = lessons.filter(l=>{
    const st = studentById(l.student_id)
    return (!filterSt||l.student_id===filterSt) && (!filterSc||st?.school_id===filterSc)
  }).filter(l=>{
    const t = new Date(l.datetime).getTime()
    if(tab==='upcoming') return t>now
    if(tab==='past') return t<=now
    return true
  }).sort((a,b)=>tab==='past'?new Date(b.datetime)-new Date(a.datetime):new Date(a.datetime)-new Date(b.datetime))

  return (
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <select className="select" value={filterSt} onChange={e=>setFilterSt(e.target.value)}>
          <option value=''>Tutti gli alunni</option>
          {students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="select" value={filterSc} onChange={e=>setFilterSc(e.target.value)}>
          <option value=''>Tutte le scuole</option>
          {schools.map(sc=><option key={sc.id} value={sc.id}>{sc.name}</option>)}
        </select>
        <div className="tabs">
          {[['upcoming','Programmate'],['past','Svolte'],['all','Tutte']].map(([k,l])=>(
            <button key={k} className={`tab ${tab===k?'active':''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      </div>
      {filtered.length===0 && <Empty>Nessuna lezione</Empty>}
      {filtered.map(l=>{
        const s = studentById(l.student_id)
        const sc = schoolById(s?.school_id)
        const isFuture = new Date(l.datetime).getTime()>now
        return (
          <div key={l.id} className="lesson-card" style={{borderLeft:`3px solid ${isFuture?'#5B8DD9':'#52C07A'}`}}>
            <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
              <div>
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                  <span style={{fontWeight:700,color:'var(--text-main)',cursor:'pointer',fontSize:17}} onClick={()=>{setSelectedStudent(l.student_id);setView('students')}}>{s ? `${s.first_name} ${s.last_name}` : '?'}</span>
                  <span style={{color:'var(--primary)',fontSize:15}}>♪ {s?.instrument}</span>
                  <SchoolBadge id={s?.school_id} small/>
                </div>
                <div style={{fontSize:15,color:'var(--text-muted)',marginTop:4}}>{fmt(l.datetime)} · {fmtTime(l.datetime)} · {l.duration||s?.duration} min</div>
                {l.topic && <div style={{fontSize:15,color:'var(--text)',marginTop:2}}>📚 {l.topic}</div>}
                {l.notes && <div style={{fontSize:14,color:'var(--text-muted)',marginTop:4,fontStyle:'italic'}}>✍ {l.notes.slice(0,100)}{l.notes.length>100?'...':''}</div>}
                {l.next_to_bring && <div style={{fontSize:14,color:'#9B6DD9',marginTop:4}}>📦 {l.next_to_bring}</div>}

                {isFuture && nextLessonIds.includes(l.id) && (
                  <div style={{marginTop:12,display:'flex',gap:8,flexWrap:'wrap'}}>
                    {s?.father_phone && (
                      <a href={waUrl(s.father_phone, s, l, s.father_name, profile?.wa_template)} target="_blank" rel="noreferrer" className="link-btn" style={{marginTop:0,fontSize:12,padding:'4px 10px',background:'#f0fdf4',borderColor:'#bbf7d0',color:'#166534'}}>
                        📱 Papà
                      </a>
                    )}
                    {s?.mother_phone && (
                      <a href={waUrl(s.mother_phone, s, l, s.mother_name, profile?.wa_template)} target="_blank" rel="noreferrer" className="link-btn" style={{marginTop:0,fontSize:12,padding:'4px 10px',background:'#f0fdf4',borderColor:'#bbf7d0',color:'#166534'}}>
                        📱 Mamma
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div style={{display:'flex',gap:6,alignItems:'flex-start'}}>
                <a href={gcalUrl(l,s,sc)} target='_blank' rel='noreferrer' className="gcal-btn" style={{padding:'4px 10px',fontSize:14}}>📅</a>
                <IBtn danger onClick={()=>{if(window.confirm('Eliminare?'))removeLesson(l.id)}}>✕</IBtn>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── SCHOOLS VIEW ─────────────────────────────────────────────────────
function SchoolsView({schools,students,lessonsOf,removeSchool,showToast}) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20}}>
      {schools.map(sc=>{
        const stds = students.filter(s=>s.school_id===sc.id)
        const tot = stds.reduce((a,s)=>a+lessonsOf(s.id).length,0)
        return (
          <div key={sc.id} className="card" style={{borderTop:`4px solid ${sc.color}`}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div>
                <div style={{fontWeight:700,fontSize:18,color:'var(--text-main)'}}>{sc.name}</div>
                {sc.address && <div style={{fontSize:13,color:'var(--text-muted)',marginTop:2}}>📍 {sc.address}</div>}
                {sc.contact && <div style={{fontSize:13,color:'var(--text-muted)'}}>📞 {sc.contact}</div>}
              </div>
              <IBtn danger onClick={()=>{if(window.confirm(`Eliminare ${sc.name}?`)){removeSchool(sc.id);showToast('Scuola eliminata','#E85858')}}}>✕</IBtn>
            </div>
            <div style={{display:'flex',gap:16,textAlign:'center'}}>
              <div><div style={{fontSize:24,fontWeight:800,color:sc.color}}>{stds.length}</div><div style={{fontSize:13,color:'var(--text-muted)'}}>Alunni</div></div>
              <div><div style={{fontSize:24,fontWeight:800,color:sc.color}}>{tot}</div><div style={{fontSize:13,color:'var(--text-muted)'}}>Lezioni</div></div>
            </div>
            {stds.length>0 && <div style={{marginTop:10,display:'flex',flexWrap:'wrap',gap:6}}>{stds.map(s=><span key={s.id} className="pill">{s.name}</span>)}</div>}
          </div>
        )
      })}
      {schools.length===0 && <div style={{gridColumn:'1/-1'}}><Empty>Nessuna scuola aggiunta</Empty></div>}
    </div>
  )
}

// ── SETTINGS VIEW ────────────────────────────────────────────────────
function SettingsView({profile,updateProfile,showToast}) {
  const [inst,setInst]=useState(profile?.default_instrument||'')
  const [temp,setTemp]=useState(profile?.wa_template||'Ciao {{GENITORE}}, ti ricordo la prossima lezione di {{STRUMENTO}} per {{ALUNNO}} il giorno {{DATA}} alle ore {{ORA}}. A presto!')
  const [saving,setSaving]=useState(false)

  const save = async () => {
    setSaving(true)
    await updateProfile({default_instrument:inst, wa_template:temp})
    setSaving(false)
    showToast('Impostazioni salvate ✓')
  }

  return (
    <div className="card" style={{maxWidth:600}}>
      <div style={{fontWeight:700,fontSize:18,color:'var(--text-main)',marginBottom:16}}>Profilo Maestro</div>
      
      <div style={{marginBottom:24}}>
        <label className="label">Il tuo strumento principale</label>
        <input className="input" value={inst} onChange={e=>setInst(e.target.value)} placeholder='Es: Pianoforte, Chitarra...'/>
        <p style={{fontSize:13,color:'var(--text-muted)',marginTop:8}}>
          Verrà suggerito automaticamente per ogni nuovo alunno.
        </p>
      </div>

      <div style={{marginBottom:24}}>
        <label className="label">Template Promemoria WhatsApp</label>
        <textarea className="input" style={{minHeight:120,resize:'vertical',lineHeight:1.5}} 
          value={temp} onChange={e=>setTemp(e.target.value)} 
          placeholder='Scrivi qui il tuo messaggio...'/>
        
        <div style={{marginTop:12,padding:12,background:'#f8fafc',borderRadius:8,border:'1px solid var(--border)'}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--text-muted)',marginBottom:8,textTransform:'uppercase'}}>Segnaposto disponibili:</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {['{{GENITORE}}','{{ALUNNO}}','{{STRUMENTO}}','{{DATA}}','{{ORA}}'].map(p => (
              <code key={p} style={{background:'#fff',padding:'2px 6px',borderRadius:4,border:'1px solid var(--border)',fontSize:12,color:'var(--primary)'}}>{p}</code>
            ))}
          </div>
        </div>
      </div>

      <div style={{marginTop:20}}>
        <PrimaryBtn onClick={save}>{saving?'Salvataggio...':'Salva Impostazioni'}</PrimaryBtn>
      </div>
    </div>
  )
}

// ── Modals ────────────────────────────────────────────────────────────
function SchoolModal({onSave,onClose}) {
  const [f,setF]=useState({name:'',address:'',contact:''})
  return (
    <Modal title='Nuova Scuola' onClose={onClose} onSave={()=>{if(f.name){onSave(f);onClose()}}}>
      <label className="label">Nome *</label>
      <input className="input" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder='Es: Scuola Musica Verdi'/>
      <label className="label">Indirizzo</label>
      <input className="input" value={f.address} onChange={e=>setF({...f,address:e.target.value})} placeholder='Via Roma 1, Milano'/>
      <label className="label">Contatto</label>
      <input className="input" value={f.contact} onChange={e=>setF({...f,contact:e.target.value})} placeholder='Mario Rossi · 333 000 0000'/>
    </Modal>
  )
}

function StudentModal({schools,profile,initial,onSave,onClose}) {
  const [f,setF]=useState(initial||{first_name:'',last_name:'',instrument:profile?.default_instrument||'',duration:30,school_id:'',email:'',father_name:'',father_phone:'',mother_name:'',mother_phone:'',notes:''})
  return (
    <Modal title={initial?'Modifica Alunno':'Nuovo Alunno'} onClose={onClose} onSave={()=>{if(f.first_name&&f.last_name&&f.instrument){onSave(f);onClose()}}}>
      <div className="form-grid">
        <div>
          <label className="label">Nome *</label>
          <input className="input" value={f.first_name} onChange={e=>setF({...f,first_name:e.target.value})} placeholder='Mario'/>
        </div>
        <div>
          <label className="label">Cognome *</label>
          <input className="input" value={f.last_name} onChange={e=>setF({...f,last_name:e.target.value})} placeholder='Rossi'/>
        </div>
        <div>
          <label className="label">Strumento *</label>
          <input className="input" value={f.instrument} onChange={e=>setF({...f,instrument:e.target.value})} placeholder='Pianoforte'/>
        </div>
        <div>
          <label className="label">Durata lezione (min)</label>
          <input className="input" type='number' value={f.duration} min={15} step={5} onChange={e=>setF({...f,duration:+e.target.value})}/>
        </div>
        <div>
          <label className="label">Scuola</label>
          <select className="select" value={f.school_id||''} onChange={e=>setF({...f,school_id:e.target.value})}>
            <option value=''>– Nessuna –</option>
            {schools.map(sc=><option key={sc.id} value={sc.id}>{sc.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Email Alunno</label>
          <input className="input" value={f.email||''} onChange={e=>setF({...f,email:e.target.value})} placeholder='mario@email.it'/>
        </div>

        <div style={{gridColumn:'1/-1',marginTop:8,fontWeight:700,fontSize:14,color:'var(--text-main)',borderBottom:'1px solid var(--border)',paddingBottom:4}}>Contatti Genitori</div>
        
        <div>
          <label className="label">Nome Padre</label>
          <input className="input" value={f.father_name||''} onChange={e=>setF({...f,father_name:e.target.value})} placeholder='Papà di Mario'/>
        </div>
        <div>
          <label className="label">Cellulare Padre</label>
          <input className="input" value={f.father_phone||''} onChange={e=>setF({...f,father_phone:e.target.value})} placeholder='333 000 0000'/>
        </div>

        <div>
          <label className="label">Nome Madre</label>
          <input className="input" value={f.mother_name||''} onChange={e=>setF({...f,mother_name:e.target.value})} placeholder='Mamma di Mario'/>
        </div>
        <div>
          <label className="label">Cellulare Madre</label>
          <input className="input" value={f.mother_phone||''} onChange={e=>setF({...f,mother_phone:e.target.value})} placeholder='333 000 0000'/>
        </div>

        <div style={{gridColumn:'1/-1',marginTop:8}}>
          <label className="label">Note generali</label>
          <textarea className="input" style={{minHeight:70,resize:'vertical'}} value={f.notes||''} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Note sull'alunno..."/>
        </div>
      </div>
    </Modal>
  )
}

function LessonModal({students,initial,onSave,onClose}) {
  const [f,setF]=useState({student_id:'',datetime:today(),duration:'',topic:'',notes:'',next_to_bring:'',...initial})
  const student = students.find(s=>s.id===f.student_id)
  return (
    <Modal title='Lezione' onClose={onClose} onSave={()=>{if(f.student_id&&f.datetime){onSave({...f,duration:f.duration||student?.duration||30});onClose()}}}>
      <label className="label">Alunno *</label>
      <select className="select" value={f.student_id} onChange={e=>setF({...f,student_id:e.target.value})}>
        <option value=''>– Seleziona –</option>
        {students.map(s=><option key={s.id} value={s.id}>{s.name} · {s.instrument}</option>)}
      </select>
      <div className="form-grid" style={{marginTop:12}}>
        <div>
          <label className="label">Data e ora *</label>
          <input className="input" type='datetime-local' value={f.datetime?.slice(0,16)||''} onChange={e=>setF({...f,datetime:e.target.value})}/>
        </div>
        <div>
          <label className="label">Durata (min){student?` · default ${student.duration}`:''}</label>
          <input className="input" type='number' value={f.duration} min={15} step={5} onChange={e=>setF({...f,duration:+e.target.value})} placeholder={student?.duration||30}/>
        </div>
      </div>
      <label className="label" style={{marginTop:12}}>Argomento</label>
      <input className="input" value={f.topic} onChange={e=>setF({...f,topic:e.target.value})} placeholder='Scale maggiori, lettura...'/>
      <label className="label" style={{marginTop:12}}>Annotazioni</label>
      <textarea className="input" style={{minHeight:80,resize:'vertical'}} value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder='Note sulla lezione...'/>
      <label className="label" style={{marginTop:12}}>📦 Portare la prossima volta</label>
      <input className="input" value={f.next_to_bring} onChange={e=>setF({...f,next_to_bring:e.target.value})} placeholder='Quaderno, metodo pagina 24...'/>
    </Modal>
  )
}

// ── Generic UI ────────────────────────────────────────────────────────
function Modal({title,onClose,onSave,children}) {
  return (
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <SecBtn onClick={onClose}>Annulla</SecBtn>
          <PrimaryBtn onClick={onSave}>Salva</PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

const Card=({title,accent='#E8A838',span,children})=><div className="card" style={span===2?{gridColumn:'1/-1'}:{}}><div style={{fontWeight:700,fontSize:15,color:accent,marginBottom:12,textTransform:'uppercase',letterSpacing:1}}>{title}</div>{children}</div>
const LessonRow=({lesson,student,schoolById,SchoolBadge,done,onClick})=>{if(!student)return null;const sc=schoolById?.(student.school_id);return(<div className="lesson-row" style={{...(onClick?{cursor:'pointer'}:{}),...(done?{opacity:.75}:{})}} onClick={onClick}><div><span style={{fontWeight:600,color:'var(--text-main)',fontSize:16}}>{student.first_name} {student.last_name}</span><span style={{color:'var(--primary)',fontSize:15,marginLeft:8}}>♪ {student.instrument}</span></div><div style={{display:'flex',gap:8,alignItems:'center'}}><span style={{fontSize:15,color:'var(--text-muted)'}}>{fmtTime(lesson.datetime)}</span>{sc&&<SchoolBadge id={student.school_id} small/>}</div></div>)}
const SectionTitle=({children})=><div style={{fontWeight:700,fontSize:15,color:'var(--primary)',textTransform:'uppercase',letterSpacing:1,marginBottom:10,marginTop:4}}>{children}</div>
const Empty=({children})=><div style={{color:'var(--text-dim)',fontSize:16,padding:'20px 0',textAlign:'center'}}>{children}</div>
const PrimaryBtn=({children,onClick})=><button className="primary-btn" onClick={onClick}>{children}</button>
const SecBtn=({children,onClick})=><button className="sec-btn" onClick={onClick}>{children}</button>
const IBtn=({children,onClick,danger})=><button className="icon-btn" style={danger?{color:'#E85858'}:{}} onClick={onClick}>{children}</button>
