import { useState, useCallback } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useSchools, useStudents, useLessons, useProfile } from '../lib/hooks'

import { PrimaryBtn, SecBtn, gcalUrl } from './app/Components'
import Dashboard from './app/Dashboard'
import { Students, StudentDetail } from './app/Students'
import { LessonsView } from './app/Lessons'
import { SchoolsView } from './app/Schools'
import { SettingsView } from './app/Settings'
import { SchoolModal, StudentModal, LessonModal } from './app/Modals'

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

      <main className="main-content">
        <header className="header">
          <div className="header-title">
            {view==='dashboard' && 'Dashboard'}
            {view==='students' && (selectedStudent ? (studentById(selectedStudent)?.first_name||'Alunno') : 'Alunni')}
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

      {modal?.type==='addSchool'   && <SchoolModal onSave={handleAddSchool} onClose={() => setModal(null)}/>}
      {modal?.type==='addStudent'  && <StudentModal schools={schools} profile={profile} onSave={handleAddStudent} onClose={() => setModal(null)}/>}
      {modal?.type==='editStudent' && <StudentModal schools={schools} profile={profile} initial={modal.payload} onSave={d => handleUpdateStudent(modal.payload.id,d)} onClose={() => setModal(null)}/>}
      {modal?.type==='addLesson'   && <LessonModal students={students} initial={modal.payload} onSave={handleAddLesson} onClose={() => setModal(null)}/>}
      {modal?.type==='editLesson'  && <LessonModal students={students} initial={modal.payload} onSave={d => handleUpdateLesson(modal.payload.id,d)} onClose={() => setModal(null)}/>}

      {toast && <div className="toast" style={{background:toast.color}}>{toast.msg}</div>}
    </div>
  )
}
