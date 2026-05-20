import React from 'react'

// ── helpers ──────────────────────────────────────────────────────────
export const fmt = d => new Date(d).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'})
export const fmtTime = d => new Date(d).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})
export const today = () => new Date().toISOString().slice(0,16)

export function gcalUrl(lesson, student, school) {
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

export function waUrl(phone, student, lesson, parentName, template) {
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

// ── Shared UI ────────────────────────────────────────────────────────
export const Card = ({title, accent='#E8A838', span, children}) => (
  <div className="card" style={span===2?{gridColumn:'1/-1'}:{}}>
    <div style={{fontWeight:700,fontSize:15,color:accent,marginBottom:12,textTransform:'uppercase',letterSpacing:1}}>{title}</div>
    {children}
  </div>
)

export const LessonRow = ({lesson, student, schoolById, SchoolBadge, done, onClick, showDate}) => {
  if(!student) return null
  const sc = schoolById?.(student.school_id)
  return (
    <div className="lesson-row" style={{...(onClick?{cursor:'pointer'}:{}), ...(done?{opacity:.75}:{})}} onClick={onClick}>
      <div>
        <span style={{fontWeight:600,color:'var(--text-main)',fontSize:16}}>{student.first_name} {student.last_name}</span>
        <span style={{color:'var(--primary)',fontSize:15,marginLeft:8}}>♪ {student.instrument}</span>
      </div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <span style={{fontSize:14,color:'var(--text-muted)'}}>
          {showDate && <span style={{marginRight:6}}>{fmt(lesson.datetime)}</span>}
          {fmtTime(lesson.datetime)}
        </span>
        {sc && <SchoolBadge id={student.school_id} small/>}
      </div>
    </div>
  )
}

export const SectionTitle = ({children}) => (
  <div style={{fontWeight:700,fontSize:15,color:'var(--primary)',textTransform:'uppercase',letterSpacing:1,marginBottom:10,marginTop:4}}>{children}</div>
)

export const Empty = ({children}) => (
  <div style={{color:'var(--text-dim)',fontSize:16,padding:'20px 0',textAlign:'center'}}>{children}</div>
)

export const PrimaryBtn = ({children, onClick}) => (
  <button className="primary-btn" onClick={onClick}>{children}</button>
)

export const SecBtn = ({children, onClick}) => (
  <button className="sec-btn" onClick={onClick}>{children}</button>
)

export const IBtn = ({children, onClick, danger}) => (
  <button className="icon-btn" style={danger?{color:'#E85858'}:{}} onClick={onClick}>{children}</button>
)

export function Modal({title, onClose, onSave, children}) {
  return (
    <div className="overlay" onClick={e => {if(e.target===e.currentTarget) onClose()}}>
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
