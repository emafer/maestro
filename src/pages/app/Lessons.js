import React, { useState } from 'react'
import { Empty, IBtn, gcalUrl, waUrl, fmt, fmtTime } from './Components'

export function LessonsView({lessons, students, schools, profile, studentById, schoolById, SchoolBadge, updateLesson, removeLesson, setModal, setSelectedStudent, setView}) {
  const [filterSt, setFilterSt] = useState('')
  const [filterSc, setFilterSc] = useState('')
  const [tab, setTab] = useState('upcoming')
  const now = Date.now()

  // Trova l'ID della PRIMA lezione futura per ogni studente
  const nextLessonIds = students.map(s => {
    const sl = lessons.filter(l => l.student_id === s.id && new Date(l.datetime).getTime() > now)
      .sort((a,b) => new Date(a.datetime) - new Date(b.datetime))[0]
    return sl?.id
  }).filter(Boolean)

  const filtered = lessons.filter(l => {
    const st = studentById(l.student_id)
    return (!filterSt || l.student_id === filterSt) && (!filterSc || st?.school_id === filterSc)
  }).filter(l => {
    const t = new Date(l.datetime).getTime()
    if(tab==='upcoming') return t > now
    if(tab==='past') return t <= now
    return true
  }).sort((a,b) => tab==='past' ? new Date(b.datetime) - new Date(a.datetime) : new Date(a.datetime) - new Date(b.datetime))

  return (
    <div>
      <div style={{display:'flex', gap:12, marginBottom:16, flexWrap:'wrap', alignItems:'center'}}>
        <select className="select" value={filterSt} onChange={e => setFilterSt(e.target.value)}>
          <option value=''>Tutti gli alunni</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
        </select>
        <select className="select" value={filterSc} onChange={e => setFilterSc(e.target.value)}>
          <option value=''>Tutte le scuole</option>
          {schools.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
        </select>
        <div className="tabs">
          {[['upcoming','Programmate'], ['past','Svolte'], ['all','Tutte']].map(([k,l]) => (
            <button key={k} className={`tab ${tab===k?'active':''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      </div>
      {filtered.length === 0 && <Empty>Nessuna lezione</Empty>}
      {filtered.map(l => {
        const s = studentById(l.student_id)
        const sc = schoolById(s?.school_id)
        const isFuture = new Date(l.datetime).getTime() > now
        return (
          <div key={l.id} className="lesson-card" style={{borderLeft:`3px solid ${isFuture ? '#5B8DD9' : '#52C07A'}`}}>
            <div style={{display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8}}>
              <div>
                <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                  <span style={{fontWeight:700, color:'var(--text-main)', cursor:'pointer', fontSize:17}} onClick={() => {setSelectedStudent(l.student_id); setView('students')}}>{s ? `${s.first_name} ${s.last_name}` : '?'}</span>
                  <span style={{color:'var(--primary)', fontSize:15}}>♪ {s?.instrument}</span>
                  <SchoolBadge id={s?.school_id} small/>
                </div>
                <div style={{fontSize:15, color:'var(--text-muted)', marginTop:4}}>{fmt(l.datetime)} · {fmtTime(l.datetime)} · {l.duration||s?.duration} min</div>
                {l.topic && <div style={{fontSize:15, color:'var(--text)', marginTop:2}}>📚 {l.topic}</div>}
                {l.notes && <div style={{fontSize:14, color:'var(--text-muted)', marginTop:4, fontStyle:'italic'}}>✍ {l.notes.slice(0,100)}{l.notes.length>100 ? '...' : ''}</div>}
                {l.next_to_bring && <div style={{fontSize:14, color:'#9B6DD9', marginTop:4}}>📦 {l.next_to_bring}</div>}

                {isFuture && nextLessonIds.includes(l.id) && (
                  <div style={{marginTop:12, display:'flex', gap:8, flexWrap:'wrap'}}>
                    {s?.father_phone && (
                      <a href={waUrl(s.father_phone, s, l, s.father_name, profile?.wa_template)} target="_blank" rel="noreferrer" className="link-btn" style={{marginTop:0, fontSize:12, padding:'4px 10px', background:'#f0fdf4', borderColor:'#bbf7d0', color:'#166534'}}>
                        📱 Papà
                      </a>
                    )}
                    {s?.mother_phone && (
                      <a href={waUrl(s.mother_phone, s, l, s.mother_name, profile?.wa_template)} target="_blank" rel="noreferrer" className="link-btn" style={{marginTop:0, fontSize:12, padding:'4px 10px', background:'#f0fdf4', borderColor:'#bbf7d0', color:'#166534'}}>
                        📱 Mamma
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div style={{display:'flex', gap:6, alignItems:'flex-start'}}>
                <a href={gcalUrl(l,s,sc)} target='_blank' rel='noreferrer' className="gcal-btn" style={{padding:'4px 10px', fontSize:14}}>📅</a>
                <IBtn danger onClick={() => {if(window.confirm('Eliminare?')) removeLesson(l.id)}}>✕</IBtn>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
