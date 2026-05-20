import React from 'react'
import { IBtn, Empty } from './Components'

export function SchoolsView({schools, students, lessonsOf, removeSchool, showToast}) {
  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:20}}>
      {schools.map(sc => {
        const stds = students.filter(s => s.school_id === sc.id)
        const tot = stds.reduce((a,s) => a + lessonsOf(s.id).length, 0)
        return (
          <div key={sc.id} className="card" style={{borderTop:`4px solid ${sc.color}`}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <div>
                <div style={{fontWeight:700, fontSize:18, color:'var(--text-main)'}}>{sc.name}</div>
                {sc.address && <div style={{fontSize:13, color:'var(--text-muted)', marginTop:2}}>📍 {sc.address}</div>}
                {sc.contact && <div style={{fontSize:13, color:'var(--text-muted)'}}>📞 {sc.contact}</div>}
              </div>
              <IBtn danger onClick={() => {if(window.confirm(`Eliminare ${sc.name}?`)) {removeSchool(sc.id); showToast('Scuola eliminata', '#E85858')}}}>✕</IBtn>
            </div>
            <div style={{display:'flex', gap:16, textAlign:'center'}}>
              <div><div style={{fontSize:24, fontWeight:800, color:sc.color}}>{stds.length}</div><div style={{fontSize:13, color:'var(--text-muted)'}}>Alunni</div></div>
              <div><div style={{fontSize:24, fontWeight:800, color:sc.color}}>{tot}</div><div style={{fontSize:13, color:'var(--text-muted)'}}>Lezioni</div></div>
            </div>
            {stds.length > 0 && <div style={{marginTop:10, display:'flex', flexWrap:'wrap', gap:6}}>{stds.map(s => <span key={s.id} className="pill">{s.first_name} {s.last_name}</span>)}</div>}
          </div>
        )
      })}
      {schools.length === 0 && <div style={{gridColumn:'1/-1'}}><Empty>Nessuna scuola aggiunta</Empty></div>}
    </div>
  )
}
