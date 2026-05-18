import { useState, useCallback } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useSchools, useStudents, useLessons } from '../lib/hooks'

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
    text:`Lezione ${student?.instrument} – ${student?.name}`,
    dates:`${f8(start)}/${f8(end)}`,
    details:`Scuola: ${school?.name||'–'}\nDurata: ${lesson.duration||student?.duration} min\n${lesson.notes||''}`,
    location: school?.name||''
  })
  return `https://calendar.google.com/calendar/render?${p}`
}

// ═════════════════════════════════════════════════════════════════════
export default function AppPage() {
  const { user, signOut } = useAuth()
  const { schools, add: addSchool, remove: removeSchool } = useSchools()
  const { students, add: addStudent, update: updateStudent, remove: removeStudent } = useStudents()
  const { lessons, add: addLesson, update: updateLesson, remove: removeLesson } = useLessons()

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
    return <span style={{background:sc.color+'22',color:sc.color,border:`1px solid ${sc.color}44`,borderRadius:20,padding:small?'2px 8px':'3px 10px',fontSize:small?11:12,fontWeight:600,whiteSpace:'nowrap'}}>{sc.name}</span>
  }

  return (
    <div style={st.root}>
      <div style={st.bgGlow}/>

      {/* Sidebar */}
      <aside style={st.sidebar}>
        <div style={st.logo}>
          <span style={st.logoIcon}>♩</span>
          <div>
            <div style={st.logoTitle}>Maestro</div>
            <div style={st.logoSub}>Registro Musicale</div>
          </div>
        </div>

        <nav style={st.nav}>
          {[
            {k:'dashboard',icon:'◈',label:'Dashboard'},
            {k:'students', icon:'♟',label:'Alunni'},
            {k:'lessons',  icon:'♫',label:'Lezioni'},
            {k:'schools',  icon:'⌂',label:'Scuole'},
          ].map(({k,icon,label}) => (
            <button key={k} style={{...st.navBtn,...(view===k?st.navActive:{})}}
              onClick={() => { setView(k); setSelectedStudent(null) }}>
              <span style={st.navIcon}>{icon}</span>{label}
            </button>
          ))}
        </nav>

        <div style={st.sideStats}>
          {[['Alunni',students.length],['Lezioni',lessons.length],['Scuole',schools.length]].map(([l,v]) => (
            <div key={l} style={st.sideStat}>
              <span style={st.sideStatVal}>{v}</span>
              <span style={st.sideStatLabel}>{l}</span>
            </div>
          ))}
        </div>

        <button style={st.signOutBtn} onClick={signOut}>
          ⎋ Esci
        </button>

        <div style={st.userBadge}>
          <span style={{fontSize:11,color:'#444',wordBreak:'break-all'}}>{user?.email}</span>
        </div>
      </aside>

      {/* Main */}
      <main style={st.main}>
        <header style={st.header}>
          <div style={st.headerTitle}>
            {view==='dashboard' && 'Dashboard'}
            {view==='students' && (selectedStudent ? (studentById(selectedStudent)?.name||'Alunno') : 'Alunni')}
            {view==='lessons'  && 'Lezioni'}
            {view==='schools'  && 'Scuole / Associazioni'}
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

        <div style={st.content}>
          {view==='dashboard' && <Dashboard upcoming={upcoming} past={past} students={students} schools={schools} lessons={lessons} studentById={studentById} schoolById={schoolById} SchoolBadge={SchoolBadge} setView={setView} setSelectedStudent={setSelectedStudent}/>}
          {view==='students'  && !selectedStudent && <Students students={students} schools={schools} schoolById={schoolById} lessonsOf={lessonsOf} SchoolBadge={SchoolBadge} setSelectedStudent={setSelectedStudent} setModal={setModal} removeStudent={removeStudent} showToast={showToast}/>}
          {view==='students'  && selectedStudent && <StudentDetail studentId={selectedStudent} students={students} schools={schools} lessons={lessons} lessonsOf={lessonsOf} schoolById={schoolById} studentById={studentById} SchoolBadge={SchoolBadge} updateLesson={handleUpdateLesson} removeLesson={removeLesson} setModal={setModal} gcalUrl={gcalUrl} showToast={showToast}/>}
          {view==='lessons'   && <LessonsView lessons={lessons} students={students} schools={schools} studentById={studentById} schoolById={schoolById} SchoolBadge={SchoolBadge} updateLesson={handleUpdateLesson} removeLesson={removeLesson} setModal={setModal} gcalUrl={gcalUrl} setSelectedStudent={setSelectedStudent} setView={setView}/>}
          {view==='schools'   && <SchoolsView schools={schools} students={students} lessonsOf={lessonsOf} removeSchool={removeSchool} showToast={showToast}/>}
        </div>
      </main>

      {/* Modals */}
      {modal?.type==='addSchool'   && <SchoolModal onSave={handleAddSchool} onClose={() => setModal(null)}/>}
      {modal?.type==='addStudent'  && <StudentModal schools={schools} onSave={handleAddStudent} onClose={() => setModal(null)}/>}
      {modal?.type==='editStudent' && <StudentModal schools={schools} initial={modal.payload} onSave={d => handleUpdateStudent(modal.payload.id,d)} onClose={() => setModal(null)}/>}
      {modal?.type==='addLesson'   && <LessonModal students={students} initial={modal.payload} onSave={handleAddLesson} onClose={() => setModal(null)}/>}
      {modal?.type==='editLesson'  && <LessonModal students={students} initial={modal.payload} onSave={d => handleUpdateLesson(modal.payload.id,d)} onClose={() => setModal(null)}/>}

      {toast && <div style={{...st.toast,background:toast.color}}>{toast.msg}</div>}
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
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <Card title={`Oggi · ${new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'})}`} accent='#E8A838' span={2}>
        {todayLessons.length===0 ? <Empty>Nessuna lezione oggi</Empty>
          : todayLessons.map(l => <LessonRow key={l.id} lesson={l} student={studentById(l.student_id)} schoolById={schoolById} SchoolBadge={SchoolBadge} done={new Date(l.datetime).getTime()<now}/>)}
      </Card>

      <Card title='Prossime lezioni' accent='#5B8DD9'>
        {upcoming.length===0 ? <Empty>Nessuna lezione programmata</Empty>
          : upcoming.map(l => <LessonRow key={l.id} lesson={l} student={studentById(l.student_id)} schoolById={schoolById} SchoolBadge={SchoolBadge} onClick={() => {setSelectedStudent(l.student_id);setView('students')}}/>)}
        <button style={st.linkBtn} onClick={() => setView('lessons')}>Vedi tutte →</button>
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
                <div style={{color:sc.color,fontWeight:800,fontSize:22}}>{count}</div>
                <div style={{fontSize:13,color:'#aaa',marginTop:2}}>{sc.name}</div>
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
        <input style={st.input} placeholder='🔍  Cerca alunno o strumento...' value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={st.select} value={filterSchool} onChange={e=>setFilterSchool(e.target.value)}>
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
            <div key={s.id} style={st.studentCard} onClick={()=>setSelectedStudent(s.id)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontWeight:700,fontSize:17,color:'#f0f0f0'}}>{s.name}</div>
                  <div style={{color:'#E8A838',fontSize:13,fontWeight:600,marginTop:2}}>♪ {s.instrument}</div>
                </div>
                <div style={{display:'flex',gap:6}} onClick={e=>e.stopPropagation()}>
                  <IBtn onClick={()=>setModal({type:'editStudent',payload:s})}>✎</IBtn>
                  <IBtn danger onClick={()=>{if(window.confirm(`Eliminare ${s.name}?`)){removeStudent(s.id);showToast('Alunno eliminato','#E85858')}}}>✕</IBtn>
                </div>
              </div>
              <div style={{marginTop:10,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                <SchoolBadge id={s.school_id} small/>
                <span style={st.pill}>{s.duration} min</span>
                <span style={st.pill}>{ls.length} lezioni</span>
              </div>
              {next && <div style={{marginTop:8,fontSize:12,color:'#aaa'}}>Prossima: <span style={{color:'#5B8DD9'}}>{fmt(next.datetime)} {fmtTime(next.datetime)}</span></div>}
              {s.next_to_bring && <div style={{marginTop:6,fontSize:12,color:'#E8A838',background:'#E8A83810',padding:'4px 8px',borderRadius:6}}>📦 {s.next_to_bring}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── STUDENT DETAIL ───────────────────────────────────────────────────
function StudentDetail({studentId,students,schools,lessonsOf,schoolById,studentById,SchoolBadge,updateLesson,removeLesson,setModal,gcalUrl,showToast}) {
  const student = studentById(studentId)
  const lessons = lessonsOf(studentId)
  const school = schoolById(student?.school_id)
  const [expandId,setExpandId]=useState(null)
  const now = Date.now()
  const future = lessons.filter(l=>new Date(l.datetime).getTime()>now).sort((a,b)=>new Date(a.datetime)-new Date(b.datetime))
  const done   = lessons.filter(l=>new Date(l.datetime).getTime()<=now)

  if (!student) return <Empty>Alunno non trovato</Empty>
  return (
    <div>
      <div style={st.studentHeader}>
        <div style={{flex:1}}>
          <div style={{fontSize:26,fontWeight:800,color:'#f0f0f0'}}>{student.name}</div>
          <div style={{color:'#E8A838',fontWeight:600,marginTop:4}}>♪ {student.instrument} · {student.duration} min/lezione</div>
          <div style={{marginTop:8,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
            <SchoolBadge id={student.school_id}/>
            {student.email && <span style={st.pill}>✉ {student.email}</span>}
            {student.phone && <span style={st.pill}>📞 {student.phone}</span>}
          </div>
          {student.next_to_bring && (
            <div style={{marginTop:12,background:'#E8A83815',border:'1px solid #E8A83844',borderRadius:8,padding:'8px 12px',fontSize:13}}>
              <span style={{color:'#E8A838',fontWeight:600}}>📦 Deve portare: </span>
              <span style={{color:'#ddd'}}>{student.next_to_bring}</span>
            </div>
          )}
        </div>
        <div style={{display:'flex',gap:8,flexDirection:'column'}}>
          <PrimaryBtn onClick={()=>setModal({type:'addLesson',payload:{student_id:studentId}})}>+ Lezione</PrimaryBtn>
          <SecBtn onClick={()=>setModal({type:'editStudent',payload:student})}>✎ Modifica</SecBtn>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:24}}>
        {[['Totali',lessons.length],['Svolte',done.length],['Programmate',future.length]].map(([l,v])=>(
          <div key={l} style={{background:'#13131a',border:'1px solid #1e1e28',borderRadius:10,padding:'14px 16px'}}>
            <div style={{fontSize:28,fontWeight:800,color:'#E8A838'}}>{v}</div>
            <div style={{fontSize:12,color:'#777'}}>{l}</div>
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
    <div style={{...st.lessonCard,borderLeft:`3px solid ${accent}`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}} onClick={()=>setExpandId(open?null:lesson.id)}>
        <div>
          <div style={{fontWeight:600,color:'#f0f0f0'}}>{fmt(lesson.datetime)} · <span style={{color:accent}}>{fmtTime(lesson.datetime)}</span></div>
          <div style={{fontSize:13,color:'#aaa',marginTop:2}}>{lesson.duration||student?.duration} min{lesson.topic?` · ${lesson.topic}`:''}</div>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {lesson.notes && <span style={{color:'#E8A838'}}>✍</span>}
          {lesson.next_to_bring && <span>📦</span>}
          <span style={{color:'#666',transition:'transform .2s',display:'inline-block',transform:open?'rotate(180deg)':'none'}}>▾</span>
        </div>
      </div>
      {open && (
        <div style={{marginTop:14,borderTop:'1px solid #333',paddingTop:14,display:'flex',flexDirection:'column',gap:10}}>
          <div>
            <label style={st.label}>Argomento</label>
            <input style={st.input} value={topic} onChange={e=>{setTopic(e.target.value);setDirty(d=>({...d,topic:1}))}} placeholder='Scale, solfeggio...'/>
          </div>
          <div>
            <label style={st.label}>Annotazioni</label>
            <textarea style={{...st.input,minHeight:80,resize:'vertical'}} value={notes} onChange={e=>{setNotes(e.target.value);setDirty(d=>({...d,notes:1}))}} placeholder='Note sulla lezione...'/>
          </div>
          <div>
            <label style={st.label}>📦 Portare la prossima volta</label>
            <input style={st.input} value={bring} onChange={e=>{setBring(e.target.value);setDirty(d=>({...d,bring:1}))}} placeholder='Metodo Beyer, quaderno...'/>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
            {Object.keys(dirty).length>0 && <PrimaryBtn onClick={save}>💾 Salva</PrimaryBtn>}
            <a href={gcalUrl(lesson,student,school)} target='_blank' rel='noreferrer' style={st.gcalBtn}>📅 Google Calendar</a>
            <IBtn danger onClick={()=>{if(window.confirm('Eliminare questa lezione?'))removeLesson(lesson.id)}}>🗑 Elimina</IBtn>
          </div>
        </div>
      )}
    </div>
  )
}

// ── LESSONS VIEW ──────────────────────────────────────────────────────
function LessonsView({lessons,students,schools,studentById,schoolById,SchoolBadge,updateLesson,removeLesson,setModal,gcalUrl,setSelectedStudent,setView}) {
  const [filterSt,setFilterSt]=useState('')
  const [filterSc,setFilterSc]=useState('')
  const [tab,setTab]=useState('upcoming')
  const now = Date.now()

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
        <select style={st.select} value={filterSt} onChange={e=>setFilterSt(e.target.value)}>
          <option value=''>Tutti gli alunni</option>
          {students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select style={st.select} value={filterSc} onChange={e=>setFilterSc(e.target.value)}>
          <option value=''>Tutte le scuole</option>
          {schools.map(sc=><option key={sc.id} value={sc.id}>{sc.name}</option>)}
        </select>
        <div style={st.tabs}>
          {[['upcoming','Programmate'],['past','Svolte'],['all','Tutte']].map(([k,l])=>(
            <button key={k} style={{...st.tab,...(tab===k?st.tabActive:{})}} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>
      </div>
      {filtered.length===0 && <Empty>Nessuna lezione</Empty>}
      {filtered.map(l=>{
        const s = studentById(l.student_id)
        const sc = schoolById(s?.school_id)
        const isFuture = new Date(l.datetime).getTime()>now
        return (
          <div key={l.id} style={{...st.lessonCard,borderLeft:`3px solid ${isFuture?'#5B8DD9':'#52C07A'}`}}>
            <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
              <div>
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                  <span style={{fontWeight:700,color:'#f0f0f0',cursor:'pointer'}} onClick={()=>{setSelectedStudent(l.student_id);setView('students')}}>{s?.name||'?'}</span>
                  <span style={{color:'#E8A838',fontSize:13}}>♪ {s?.instrument}</span>
                  <SchoolBadge id={s?.school_id} small/>
                </div>
                <div style={{fontSize:13,color:'#aaa',marginTop:4}}>{fmt(l.datetime)} · {fmtTime(l.datetime)} · {l.duration||s?.duration} min</div>
                {l.topic && <div style={{fontSize:13,color:'#bbb',marginTop:2}}>📚 {l.topic}</div>}
                {l.notes && <div style={{fontSize:12,color:'#999',marginTop:4,fontStyle:'italic'}}>✍ {l.notes.slice(0,100)}{l.notes.length>100?'...':''}</div>}
                {l.next_to_bring && <div style={{fontSize:12,color:'#9B6DD9',marginTop:4}}>📦 {l.next_to_bring}</div>}
              </div>
              <div style={{display:'flex',gap:6,alignItems:'flex-start'}}>
                <a href={gcalUrl(l,s,sc)} target='_blank' rel='noreferrer' style={{...st.gcalBtn,padding:'4px 10px',fontSize:12}}>📅</a>
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
          <div key={sc.id} style={{...st.card,borderTop:`4px solid ${sc.color}`}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div>
                <div style={{fontWeight:700,fontSize:18,color:'#f0f0f0'}}>{sc.name}</div>
                {sc.address && <div style={{fontSize:13,color:'#aaa',marginTop:2}}>📍 {sc.address}</div>}
                {sc.contact && <div style={{fontSize:13,color:'#aaa'}}>📞 {sc.contact}</div>}
              </div>
              <IBtn danger onClick={()=>{if(window.confirm(`Eliminare ${sc.name}?`)){removeSchool(sc.id);showToast('Scuola eliminata','#E85858')}}}>✕</IBtn>
            </div>
            <div style={{marginTop:14,display:'flex',gap:16}}>
              <div><div style={{fontSize:24,fontWeight:800,color:sc.color}}>{stds.length}</div><div style={{fontSize:11,color:'#777'}}>Alunni</div></div>
              <div><div style={{fontSize:24,fontWeight:800,color:sc.color}}>{tot}</div><div style={{fontSize:11,color:'#777'}}>Lezioni</div></div>
            </div>
            {stds.length>0 && <div style={{marginTop:10,display:'flex',flexWrap:'wrap',gap:6}}>{stds.map(s=><span key={s.id} style={st.pill}>{s.name}</span>)}</div>}
          </div>
        )
      })}
      {schools.length===0 && <div style={{gridColumn:'1/-1'}}><Empty>Nessuna scuola aggiunta</Empty></div>}
    </div>
  )
}

// ── Modals ────────────────────────────────────────────────────────────
function SchoolModal({onSave,onClose}) {
  const [f,setF]=useState({name:'',address:'',contact:''})
  return (
    <Modal title='Nuova Scuola' onClose={onClose} onSave={()=>{if(f.name){onSave(f);onClose()}}}>
      <label style={st.label}>Nome *</label>
      <input style={st.input} value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder='Es: Scuola Musica Verdi'/>
      <label style={st.label}>Indirizzo</label>
      <input style={st.input} value={f.address} onChange={e=>setF({...f,address:e.target.value})} placeholder='Via Roma 1, Milano'/>
      <label style={st.label}>Contatto</label>
      <input style={st.input} value={f.contact} onChange={e=>setF({...f,contact:e.target.value})} placeholder='Mario Rossi · 333 000 0000'/>
    </Modal>
  )
}

function StudentModal({schools,initial,onSave,onClose}) {
  const [f,setF]=useState(initial||{name:'',instrument:'',duration:30,school_id:'',email:'',phone:'',notes:'',next_to_bring:''})
  return (
    <Modal title={initial?'Modifica Alunno':'Nuovo Alunno'} onClose={onClose} onSave={()=>{if(f.name&&f.instrument){onSave(f);onClose()}}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div style={{gridColumn:'1/-1'}}>
          <label style={st.label}>Nome e cognome *</label>
          <input style={st.input} value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder='Mario Rossi'/>
        </div>
        <div>
          <label style={st.label}>Strumento *</label>
          <input style={st.input} value={f.instrument} onChange={e=>setF({...f,instrument:e.target.value})} placeholder='Pianoforte'/>
        </div>
        <div>
          <label style={st.label}>Durata lezione (min)</label>
          <input style={st.input} type='number' value={f.duration} min={15} step={5} onChange={e=>setF({...f,duration:+e.target.value})}/>
        </div>
        <div>
          <label style={st.label}>Scuola</label>
          <select style={st.select} value={f.school_id||''} onChange={e=>setF({...f,school_id:e.target.value})}>
            <option value=''>– Nessuna –</option>
            {schools.map(sc=><option key={sc.id} value={sc.id}>{sc.name}</option>)}
          </select>
        </div>
        <div>
          <label style={st.label}>Email</label>
          <input style={st.input} value={f.email||''} onChange={e=>setF({...f,email:e.target.value})} placeholder='mario@email.it'/>
        </div>
        <div>
          <label style={st.label}>Telefono</label>
          <input style={st.input} value={f.phone||''} onChange={e=>setF({...f,phone:e.target.value})} placeholder='333 000 0000'/>
        </div>
        <div style={{gridColumn:'1/-1'}}>
          <label style={st.label}>📦 Portare alla prossima lezione</label>
          <input style={st.input} value={f.next_to_bring||''} onChange={e=>setF({...f,next_to_bring:e.target.value})} placeholder='Metodo Beyer pagina 12...'/>
        </div>
        <div style={{gridColumn:'1/-1'}}>
          <label style={st.label}>Note generali</label>
          <textarea style={{...st.input,minHeight:70,resize:'vertical'}} value={f.notes||''} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Note sull'alunno..."/>
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
      <label style={st.label}>Alunno *</label>
      <select style={st.select} value={f.student_id} onChange={e=>setF({...f,student_id:e.target.value})}>
        <option value=''>– Seleziona –</option>
        {students.map(s=><option key={s.id} value={s.id}>{s.name} · {s.instrument}</option>)}
      </select>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:12}}>
        <div>
          <label style={st.label}>Data e ora *</label>
          <input style={st.input} type='datetime-local' value={f.datetime?.slice(0,16)||''} onChange={e=>setF({...f,datetime:e.target.value})}/>
        </div>
        <div>
          <label style={st.label}>Durata (min){student?` · default ${student.duration}`:''}</label>
          <input style={st.input} type='number' value={f.duration} min={15} step={5} onChange={e=>setF({...f,duration:+e.target.value})} placeholder={student?.duration||30}/>
        </div>
      </div>
      <label style={st.label}>Argomento</label>
      <input style={st.input} value={f.topic} onChange={e=>setF({...f,topic:e.target.value})} placeholder='Scale maggiori, lettura...'/>
      <label style={st.label}>Annotazioni</label>
      <textarea style={{...st.input,minHeight:80,resize:'vertical'}} value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder='Note sulla lezione...'/>
      <label style={st.label}>📦 Portare la prossima volta</label>
      <input style={st.input} value={f.next_to_bring} onChange={e=>setF({...f,next_to_bring:e.target.value})} placeholder='Quaderno, metodo pagina 24...'/>
    </Modal>
  )
}

// ── Generic UI ────────────────────────────────────────────────────────
function Modal({title,onClose,onSave,children}) {
  return (
    <div style={st.overlay} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={st.modal}>
        <div style={st.modalHeader}>
          <div style={st.modalTitle}>{title}</div>
          <button style={st.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={st.modalBody}>{children}</div>
        <div style={st.modalFooter}>
          <SecBtn onClick={onClose}>Annulla</SecBtn>
          <PrimaryBtn onClick={onSave}>Salva</PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

const Card=({title,accent='#E8A838',span,children})=><div style={{...st.card,...(span===2?{gridColumn:'1/-1'}:{})}}><div style={{fontWeight:700,fontSize:13,color:accent,marginBottom:12,textTransform:'uppercase',letterSpacing:1}}>{title}</div>{children}</div>
const LessonRow=({lesson,student,schoolById,SchoolBadge,done,onClick})=>{if(!student)return null;const sc=schoolById?.(student.school_id);return(<div style={{...st.lessonRow,...(onClick?{cursor:'pointer'}:{}),...(done?{opacity:.75}:{})}} onClick={onClick}><div><span style={{fontWeight:600,color:'#f0f0f0'}}>{student.name}</span><span style={{color:'#E8A838',fontSize:13,marginLeft:8}}>♪ {student.instrument}</span></div><div style={{display:'flex',gap:8,alignItems:'center'}}><span style={{fontSize:13,color:'#aaa'}}>{fmtTime(lesson.datetime)}</span>{sc&&<SchoolBadge id={student.school_id} small/>}</div></div>)}
const SectionTitle=({children})=><div style={{fontWeight:700,fontSize:13,color:'#E8A838',textTransform:'uppercase',letterSpacing:1,marginBottom:10,marginTop:4}}>{children}</div>
const Empty=({children})=><div style={{color:'#555',fontSize:14,padding:'20px 0',textAlign:'center'}}>{children}</div>
const PrimaryBtn=({children,onClick})=><button style={st.primaryBtn} onClick={onClick}>{children}</button>
const SecBtn=({children,onClick})=><button style={st.secBtn} onClick={onClick}>{children}</button>
const IBtn=({children,onClick,danger})=><button style={{...st.iconBtn,...(danger?{color:'#E85858'}:{})}} onClick={onClick}>{children}</button>

const st = {
  root:{display:'flex',minHeight:'100vh',background:'#0f0f13',color:'#d0d0d0',fontFamily:"'Crimson Pro',Georgia,serif",position:'relative'},
  bgGlow:{position:'fixed',inset:0,backgroundImage:'radial-gradient(ellipse 60% 40% at 20% 0%, #E8A83808 0%, transparent 60%)',pointerEvents:'none'},
  sidebar:{width:220,background:'#13131a',borderRight:'1px solid #1e1e28',display:'flex',flexDirection:'column',padding:'24px 0',position:'sticky',top:0,height:'100vh'},
  logo:{display:'flex',alignItems:'center',gap:12,padding:'0 20px 24px',borderBottom:'1px solid #1e1e28'},
  logoIcon:{fontSize:36,color:'#E8A838',lineHeight:1},
  logoTitle:{fontWeight:800,fontSize:18,color:'#f0f0f0'},
  logoSub:{fontSize:10,color:'#555',letterSpacing:2,textTransform:'uppercase'},
  nav:{flex:1,padding:'16px 0'},
  navBtn:{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 20px',background:'none',border:'none',color:'#666',cursor:'pointer',fontSize:15,fontFamily:'inherit',textAlign:'left'},
  navActive:{color:'#E8A838',background:'#E8A83810',borderRight:'2px solid #E8A838'},
  navIcon:{fontSize:18,width:22,textAlign:'center'},
  sideStats:{padding:'12px 20px',borderTop:'1px solid #1e1e28',display:'flex',gap:12},
  sideStat:{display:'flex',flexDirection:'column',alignItems:'center'},
  sideStatVal:{fontSize:18,fontWeight:800,color:'#E8A838'},
  sideStatLabel:{fontSize:10,color:'#555',textTransform:'uppercase'},
  signOutBtn:{margin:'8px 16px 0',background:'none',border:'1px solid #1e1e28',borderRadius:8,padding:'7px',color:'#555',cursor:'pointer',fontSize:13,fontFamily:'inherit'},
  userBadge:{padding:'8px 16px 0',fontSize:11,color:'#333',wordBreak:'break-all'},
  main:{flex:1,display:'flex',flexDirection:'column',minWidth:0},
  header:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 28px',borderBottom:'1px solid #1e1e28',background:'#0f0f1388',backdropFilter:'blur(8px)',position:'sticky',top:0,zIndex:10},
  headerTitle:{fontSize:22,fontWeight:800,color:'#f0f0f0'},
  content:{padding:'24px 28px',flex:1},
  card:{background:'#16161f',border:'1px solid #222',borderRadius:14,padding:'18px 20px'},
  lessonCard:{background:'#16161f',border:'1px solid #252535',borderRadius:10,padding:'14px 16px',marginBottom:10},
  studentCard:{background:'#16161f',border:'1px solid #252535',borderRadius:14,padding:'18px',cursor:'pointer'},
  lessonRow:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #1e1e28'},
  studentHeader:{background:'#16161f',border:'1px solid #252535',borderRadius:14,padding:'20px 24px',marginBottom:20,display:'flex',gap:16,alignItems:'flex-start'},
  overlay:{position:'fixed',inset:0,background:'#000b',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,backdropFilter:'blur(4px)'},
  modal:{background:'#16161f',border:'1px solid #2a2a3a',borderRadius:16,width:'min(560px,95vw)',maxHeight:'90vh',overflow:'auto'},
  modalHeader:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 24px',borderBottom:'1px solid #222'},
  modalTitle:{fontWeight:800,fontSize:18,color:'#f0f0f0'},
  modalBody:{padding:'20px 24px',display:'flex',flexDirection:'column',gap:10},
  modalFooter:{display:'flex',justifyContent:'flex-end',gap:10,padding:'16px 24px',borderTop:'1px solid #222'},
  closeBtn:{background:'none',border:'none',color:'#666',cursor:'pointer',fontSize:18,fontFamily:'inherit'},
  input:{width:'100%',background:'#0f0f13',border:'1px solid #2a2a3a',borderRadius:8,padding:'8px 12px',color:'#e0e0e0',fontSize:14,fontFamily:'inherit',outline:'none',boxSizing:'border-box'},
  select:{background:'#0f0f13',border:'1px solid #2a2a3a',borderRadius:8,padding:'8px 12px',color:'#e0e0e0',fontSize:14,fontFamily:'inherit',outline:'none'},
  label:{fontSize:11,color:'#666',marginBottom:4,display:'block',letterSpacing:.5,textTransform:'uppercase'},
  primaryBtn:{background:'#E8A838',color:'#000',border:'none',borderRadius:8,padding:'8px 16px',fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit'},
  secBtn:{background:'#1e1e28',color:'#ccc',border:'1px solid #2a2a3a',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:13,fontFamily:'inherit'},
  iconBtn:{background:'none',border:'none',color:'#666',cursor:'pointer',fontSize:13,fontFamily:'inherit',padding:'4px 8px'},
  pill:{background:'#1e1e28',border:'1px solid #2a2a3a',borderRadius:20,padding:'2px 10px',fontSize:12,color:'#aaa'},
  linkBtn:{background:'none',border:'none',color:'#5B8DD9',cursor:'pointer',fontSize:13,fontFamily:'inherit',padding:'8px 0 0',display:'block'},
  gcalBtn:{display:'inline-flex',alignItems:'center',gap:6,background:'#1e3a6e',border:'1px solid #2a4d8f',color:'#6fa3ef',borderRadius:8,padding:'6px 14px',fontSize:13,textDecoration:'none'},
  tabs:{display:'flex',background:'#0f0f13',borderRadius:8,border:'1px solid #2a2a3a',overflow:'hidden'},
  tab:{background:'none',border:'none',padding:'7px 14px',color:'#666',cursor:'pointer',fontSize:13,fontFamily:'inherit'},
  tabActive:{background:'#E8A83818',color:'#E8A838'},
  toast:{position:'fixed',bottom:24,right:24,padding:'10px 20px',borderRadius:10,color:'#000',fontWeight:700,fontSize:14,zIndex:999},
}
