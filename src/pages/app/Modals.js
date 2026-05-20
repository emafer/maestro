import React, { useState } from 'react'
import { Modal, today } from './Components'

export function SchoolModal({onSave, onClose}) {
  const [f, setF] = useState({name:'', address:'', contact:''})
  return (
    <Modal title='Nuova Scuola' onClose={onClose} onSave={() => {if(f.name) {onSave(f); onClose()}}}>
      <label className="label">Nome *</label>
      <input className="input" value={f.name} onChange={e => setF({...f, name:e.target.value})} placeholder='Es: Scuola Musica Verdi'/>
      <label className="label">Indirizzo</label>
      <input className="input" value={f.address} onChange={e => setF({...f, address:e.target.value})} placeholder='Via Roma 1, Milano'/>
      <label className="label">Contatto</label>
      <input className="input" value={f.contact} onChange={e => setF({...f, contact:e.target.value})} placeholder='Mario Rossi · 333 000 0000'/>
    </Modal>
  )
}

export function StudentModal({schools, profile, initial, onSave, onClose}) {
  const [f, setF] = useState(initial || {first_name:'', last_name:'', instrument:profile?.default_instrument || '', duration:30, school_id:'', email:'', father_name:'', father_phone:'', mother_name:'', mother_phone:'', notes:''})
  return (
    <Modal title={initial ? 'Modifica Alunno' : 'Nuovo Alunno'} onClose={onClose} onSave={() => {if(f.first_name && f.last_name && f.instrument) {onSave(f); onClose()}}}>
      <div className="form-grid">
        <div>
          <label className="label">Nome *</label>
          <input className="input" value={f.first_name} onChange={e => setF({...f, first_name:e.target.value})} placeholder='Mario'/>
        </div>
        <div>
          <label className="label">Cognome *</label>
          <input className="input" value={f.last_name} onChange={e => setF({...f, last_name:e.target.value})} placeholder='Rossi'/>
        </div>
        <div>
          <label className="label">Strumento *</label>
          <input className="input" value={f.instrument} onChange={e => setF({...f, instrument:e.target.value})} placeholder='Pianoforte'/>
        </div>
        <div>
          <label className="label">Durata lezione (min)</label>
          <input className="input" type='number' value={f.duration} min={15} step={5} onChange={e => setF({...f, duration:+e.target.value})}/>
        </div>
        <div>
          <label className="label">Scuola</label>
          <select className="select" value={f.school_id || ''} onChange={e => setF({...f, school_id:e.target.value})}>
            <option value=''>– Nessuna –</option>
            {schools.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Email Alunno</label>
          <input className="input" value={f.email || ''} onChange={e => setF({...f, email:e.target.value})} placeholder='mario@email.it'/>
        </div>

        <div style={{gridColumn:'1/-1', marginTop:8, fontWeight:700, fontSize:14, color:'var(--text-main)', borderBottom:'1px solid var(--border)', paddingBottom:4}}>Contatti Genitori</div>
        
        <div>
          <label className="label">Nome Padre</label>
          <input className="input" value={f.father_name || ''} onChange={e => setF({...f, father_name:e.target.value})} placeholder='Papà di Mario'/>
        </div>
        <div>
          <label className="label">Cellulare Padre</label>
          <input className="input" value={f.father_phone || ''} onChange={e => setF({...f, father_phone:e.target.value})} placeholder='333 000 0000'/>
        </div>

        <div>
          <label className="label">Nome Madre</label>
          <input className="input" value={f.mother_name || ''} onChange={e => setF({...f, mother_name:e.target.value})} placeholder='Mamma di Mario'/>
        </div>
        <div>
          <label className="label">Cellulare Madre</label>
          <input className="input" value={f.mother_phone || ''} onChange={e => setF({...f, mother_phone:e.target.value})} placeholder='333 000 0000'/>
        </div>

        <div style={{gridColumn:'1/-1', marginTop:8}}>
          <label className="label">Note generali</label>
          <textarea className="input" style={{minHeight:70, resize:'vertical'}} value={f.notes || ''} onChange={e => setF({...f, notes:e.target.value})} placeholder="Note sull'alunno..."/>
        </div>
      </div>
    </Modal>
  )
}

export function LessonModal({students, initial, onSave, onClose}) {
  const [f, setF] = useState({student_id:'', datetime:today(), duration:'', topic:'', notes:'', next_to_bring:'', ...initial})
  const student = students.find(s => s.id === f.student_id)
  return (
    <Modal title='Lezione' onClose={onClose} onSave={() => {if(f.student_id && f.datetime) {onSave({...f, duration:f.duration || student?.duration || 30}); onClose()}}}>
      <label className="label">Alunno *</label>
      <select className="select" value={f.student_id} onChange={e => setF({...f, student_id:e.target.value})}>
        <option value=''>– Seleziona –</option>
        {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} · {s.instrument}</option>)}
      </select>
      <div className="form-grid" style={{marginTop:12}}>
        <div>
          <label className="label">Data e ora *</label>
          <input className="input" type='datetime-local' value={f.datetime?.slice(0,16) || ''} onChange={e => setF({...f, datetime:e.target.value})}/>
        </div>
        <div>
          <label className="label">Durata (min){student ? ` · default ${student.duration}` : ''}</label>
          <input className="input" type='number' value={f.duration} min={15} step={5} onChange={e => setF({...f, duration:+e.target.value})} placeholder={student?.duration || 30}/>
        </div>
      </div>
      <label className="label" style={{marginTop:12}}>Argomento</label>
      <input className="input" value={f.topic} onChange={e => setF({...f, topic:e.target.value})} placeholder='Scale maggiori, lettura...'/>
      <label className="label" style={{marginTop:12}}>Annotazioni</label>
      <textarea className="input" style={{minHeight:80, resize:'vertical'}} value={f.notes} onChange={e => setF({...f, notes:e.target.value})} placeholder='Note sulla lezione...'/>
      <label className="label" style={{marginTop:12}}>📦 Portare la prossima volta</label>
      <input className="input" value={f.next_to_bring} onChange={e => setF({...f, next_to_bring:e.target.value})} placeholder='Quaderno, metodo pagina 24...'/>
    </Modal>
  )
}
