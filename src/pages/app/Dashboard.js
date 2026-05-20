import React from 'react'
import { Card, LessonRow, Empty } from './Components'

export default function Dashboard({upcoming, past, students, schools, lessons, studentById, schoolById, SchoolBadge, setView, setSelectedStudent}) {
  const now = Date.now()
  const todayStr = new Date().toISOString().slice(0,10)
  const todayLessons = lessons.filter(l => l.datetime.slice(0,10) === todayStr)
    .sort((a,b) => new Date(a.datetime)-new Date(b.datetime))

  return (
    <div className="dashboard-grid">
      <Card title={`Oggi · ${new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'})}`} accent='#E8A838' span={2}>
        {todayLessons.length===0 ? <Empty>Nessuna lezione oggi</Empty>
          : todayLessons.map(l => (
            <LessonRow key={l.id} lesson={l} student={studentById(l.student_id)} schoolById={schoolById} SchoolBadge={SchoolBadge} done={new Date(l.datetime).getTime()<now}/>
          ))}
      </Card>

      <Card title='Prossime lezioni' accent='#5B8DD9'>
        {upcoming.length===0 ? <Empty>Nessuna lezione programmata</Empty>
          : upcoming.map(l => (
            <LessonRow key={l.id} lesson={l} student={studentById(l.student_id)} schoolById={schoolById} SchoolBadge={SchoolBadge} showDate onClick={() => {setSelectedStudent(l.student_id); setView('students')}}/>
          ))}
        <button className="link-btn" onClick={() => setView('lessons')}>Vedi tutte →</button>
      </Card>

      <Card title='Ultime lezioni svolte' accent='#52C07A'>
        {past.slice(0,5).length===0 ? <Empty>Nessuna lezione svolta</Empty>
          : past.slice(0,5).map(l => (
            <LessonRow key={l.id} lesson={l} student={studentById(l.student_id)} schoolById={schoolById} SchoolBadge={SchoolBadge} done onClick={() => {setSelectedStudent(l.student_id); setView('students')}}/>
          ))}
      </Card>

      <Card title='Riepilogo per scuola' accent='#9B6DD9' span={2}>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          {schools.map(sc => {
            const count = students.filter(s => s.school_id === sc.id).length
            return (
              <div key={sc.id} style={{background:sc.color+'15', border:`1px solid ${sc.color}33`, borderRadius:12, padding:'12px 20px', minWidth:130}}>
                <div style={{color:sc.color, fontWeight:800, fontSize:26}}>{count}</div>
                <div style={{fontSize:15, color:'var(--text-muted)', marginTop:2}}>{sc.name}</div>
              </div>
            )
          })}
          {schools.length===0 && <Empty>Aggiungi scuole dalla sezione Scuole</Empty>}
        </div>
      </Card>
    </div>
  )
}
