import React, { useState } from 'react'
import { Empty, IBtn, SectionTitle, PrimaryBtn, SecBtn, gcalUrl, waUrl, fmt, fmtTime } from './Components'

// ── STUDENTS LIST ────────────────────────────────────────────────────
export function Students({students, schools, schoolById, lessonsOf, SchoolBadge, setSelectedStudent, setModal, removeStudent, showToast}) {
  const [search, setSearch] = useState('')
  const [filterSchool, setFilterSchool] = useState('')

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    const nameStr = `${s.first_name} ${s.last_name} ${s.instrument}`.toLowerCase()
    return (!q || nameStr.includes(q)) && (!filterSchool || s.school_id === filterSchool)
  })

  return (
    <div>
      <div style={{display:'flex', gap:12, marginBottom:20, flexWrap:'wrap'}}>
        <input className="input" placeholder='🔍  Cerca alunno o strumento...' value={search} onChange={e => setSearch(e.target.value)}/>
        <select className="select" value={filterSchool} onChange={e => setFilterSchool(e.target.value)}>
          <option value=''>Tutte le scuole</option>
          {schools.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
        </select>
      </div>
      {filtered.length === 0 && <Empty>Nessun alunno trovato</Empty>}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16}}>
        {filtered.map(s => {
          const ls = lessonsOf(s.id)
          const next = ls.filter(l => new Date(l.datetime).getTime() > Date.now()).sort((a,b) => new Date(a.datetime) - new Date(b.datetime))[0]
          return (
            <div key={s.id} className="student-card" onClick={() => setSelectedStudent(s.id)}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div>
                  <div style={{fontWeight:700, fontSize:20, color:'var(--text-main)'}}>{s.first_name} {s.last_name}</div>
                  <div style={{color:'var(--primary)', fontSize:15, fontWeight:600, marginTop:2}}>♪ {s.instrument}</div>
                </div>
                <div style={{display:'flex', gap:6}} onClick={e => e.stopPropagation()}>
                  <IBtn onClick={() => setModal({type:'editStudent', payload:s})}>✎</IBtn>
                  <IBtn danger onClick={() => {if(window.confirm(`Eliminare ${s.first_name} ${s.last_name}?`)) {removeStudent(s.id); showToast('Alunno eliminato', '#E85858')}}}>✕</IBtn>
                </div>
              </div>
              <div style={{marginTop:10, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
                <SchoolBadge id={s.school_id} small/>
                <span className="pill">{s.duration} min</span>
                <span className="pill">{ls.length} lezioni</span>
              </div>
              {next && <div style={{marginTop:8, fontSize:14, color:'var(--text-muted)'}}>Prossima: <span style={{color:'#5B8DD9'}}>{fmt(next.datetime)} {fmtTime(next.datetime)}</span></div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── STUDENT DETAIL ───────────────────────────────────────────────────
export function StudentDetail({studentId, students, schools, profile, lessonsOf, schoolById, studentById, SchoolBadge, updateLesson, removeLesson, setModal, showToast}) {
  const student = studentById(studentId)
  const lessons = lessonsOf(studentId)
  const school = schoolById(student?.school_id)
  const [expandId, setExpandId] = useState(null)
  const now = Date.now()
  const future = lessons.filter(l => new Date(l.datetime).getTime() > now).sort((a,b) => new Date(a.datetime) - new Date(b.datetime))
  const done = lessons.filter(l => new Date(l.datetime).getTime() <= now)
  const nextLesson = future[0]

  if (!student) return <Empty>Alunno non trovato</Empty>
  return (
    <div>
      <div className="student-header">
        <div style={{flex:1}}>
          <div style={{fontSize:26, fontWeight:800, color:'var(--text-main)'}}>{student.first_name} {student.last_name}</div>
          <div style={{color:'var(--primary)', fontWeight:600, marginTop:4}}>♪ {student.instrument} · {student.duration} min/lezione</div>
          <div style={{marginTop:8, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
            <SchoolBadge id={student.school_id}/>
            {student.email && <span className="pill">✉ {student.email}</span>}
          </div>

          <div style={{marginTop:16, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12}}>
            {(student.father_name || student.father_phone) && (
              <div className="card" style={{padding:'12px 16px', background:'#f8fafc'}}>
                <div style={{fontSize:12, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600}}>Padre</div>
                <div style={{fontWeight:700, color:'var(--text-main)'}}>{student.father_name || '–'}</div>
                <div style={{fontSize:14, color:'var(--text-muted)'}}>{student.father_phone || '–'}</div>
                {student.father_phone && nextLesson && (
                  <a href={waUrl(student.father_phone, student, nextLesson, student.father_name, profile?.wa_template)} target="_blank" rel="noreferrer" className="link-btn" style={{marginTop:8, fontSize:12, padding:'4px 10px'}}>
                    📱 Promemoria WhatsApp
                  </a>
                )}
              </div>
            )}
            {(student.mother_name || student.mother_phone) && (
              <div className="card" style={{padding:'12px 16px', background:'#f8fafc'}}>
                <div style={{fontSize:12, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600}}>Madre</div>
                <div style={{fontWeight:700, color:'var(--text-main)'}}>{student.mother_name || '–'}</div>
                <div style={{fontSize:14, color:'var(--text-muted)'}}>{student.mother_phone || '–'}</div>
                {student.mother_phone && nextLesson && (
                  <a href={waUrl(student.mother_phone, student, nextLesson, student.mother_name, profile?.wa_template)} target="_blank" rel="noreferrer" className="link-btn" style={{marginTop:8, fontSize:12, padding:'4px 10px'}}>
                    📱 Promemoria WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        <div style={{display:'flex', gap:8, flexDirection:'column'}}>
          <PrimaryBtn onClick={() => setModal({type:'addLesson', payload:{student_id:studentId}})}>+ Lezione</PrimaryBtn>
          <SecBtn onClick={() => setModal({type:'editStudent', payload:student})}>✎ Modifica</SecBtn>
        </div>
      </div>

      <div className="stats-grid">
        {[['Totali',lessons.length], ['Svolte',done.length], ['Programmate',future.length]].map(([l,v]) => (
          <div key={l} className="stat-card">
            <div style={{fontSize:28, fontWeight:800, color:'var(--primary)'}}>{v}</div>
            <div style={{fontSize:12, color:'var(--text-muted)'}}>{l}</div>
          </div>
        ))}
      </div>

      {future.length > 0 && <>
        <SectionTitle>Prossime lezioni</SectionTitle>
        {future.map(l => <LessonCard key={l.id} lesson={l} student={student} school={school} expandId={expandId} setExpandId={setExpandId} updateLesson={updateLesson} removeLesson={removeLesson} setModal={setModal} future/>)}
      </>}

      <SectionTitle>Storico lezioni</SectionTitle>
      {done.length === 0 && <Empty>Nessuna lezione svolta</Empty>}
      {done.map(l => <LessonCard key={l.id} lesson={l} student={student} school={school} expandId={expandId} setExpandId={setExpandId} updateLesson={updateLesson} removeLesson={removeLesson} setModal={setModal}/>)}
    </div>
  )
}

function LessonCard({lesson, student, school, expandId, setExpandId, updateLesson, removeLesson, future}) {
  const open = expandId === lesson.id
  const accent = future ? '#5B8DD9' : '#52C07A'
  const [notes, setNotes] = useState(lesson.notes || '')
  const [bring, setBring] = useState(lesson.next_to_bring || '')
  const [topic, setTopic] = useState(lesson.topic || '')
  const [dirty, setDirty] = useState({})

  const save = async () => {
    await updateLesson(lesson.id, {notes, next_to_bring:bring, topic})
    setDirty({})
  }

  return (
    <div className="lesson-card" style={{borderLeft:`3px solid ${accent}`}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer'}} onClick={() => setExpandId(open?null:lesson.id)}>
        <div>
          <div style={{fontWeight:600, color:'var(--text-main)'}}>{fmt(lesson.datetime)} · <span style={{color:accent}}>{fmtTime(lesson.datetime)}</span></div>
          <div style={{fontSize:13, color:'var(--text-muted)', marginTop:2}}>{lesson.duration || student?.duration} min{lesson.topic ? ` · ${lesson.topic}` : ''}</div>
        </div>
        <div style={{display:'flex', gap:6, alignItems:'center'}}>
          {lesson.notes && <span style={{color:'var(--primary)'}}>✍</span>}
          {lesson.next_to_bring && <span>📦</span>}
          <span style={{color:'var(--text-dim)', transition:'transform .2s', display:'inline-block', transform:open?'rotate(180deg)':'none'}}>▾</span>
        </div>
      </div>
      {open && (
        <div style={{marginTop:14, borderTop:'1px solid var(--border)', paddingTop:14, display:'flex', flexDirection:'column', gap:10}}>
          <div>
            <label className="label">Argomento</label>
            <input className="input" value={topic} onChange={e => {setTopic(e.target.value); setDirty(d => ({...d, topic:1}))}} placeholder='Scale, solfeggio...'/>
          </div>
          <div>
            <label className="label">Annotazioni</label>
            <textarea className="input" style={{minHeight:80, resize:'vertical'}} value={notes} onChange={e => {setNotes(e.target.value); setDirty(d => ({...d, notes:1}))}} placeholder='Note sulla lezione...'/>
          </div>
          <div>
            <label className="label">📦 Portare la prossima volta</label>
            <input className="input" value={bring} onChange={e => {setBring(e.target.value); setDirty(d => ({...d, bring:1}))}} placeholder='Metodo Beyer, quaderno...'/>
          </div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
            {Object.keys(dirty).length > 0 && <PrimaryBtn onClick={save}>💾 Salva</PrimaryBtn>}
            <a href={gcalUrl(lesson, student, school)} target='_blank' rel='noreferrer' className="gcal-btn">📅 Google Calendar</a>
            <IBtn danger onClick={() => {if(window.confirm('Eliminare questa lezione?')) removeLesson(lesson.id)}}>🗑 Elimina</IBtn>
          </div>
        </div>
      )}
    </div>
  )
}
