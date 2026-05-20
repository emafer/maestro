import React, { useState } from 'react'
import { PrimaryBtn } from './Components'

export function SettingsView({profile, updateProfile, showToast}) {
  const [inst, setInst] = useState(profile?.default_instrument || '')
  const [temp, setTemp] = useState(profile?.wa_template || 'Ciao {{GENITORE}}, ti ricordo la prossima lezione di {{STRUMENTO}} per {{ALUNNO}} il giorno {{DATA}} alle ore {{ORA}}. A presto!')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await updateProfile({default_instrument:inst, wa_template:temp})
    setSaving(false)
    showToast('Impostazioni salvate ✓')
  }

  return (
    <div className="card" style={{maxWidth:600}}>
      <div style={{fontWeight:700, fontSize:18, color:'var(--text-main)', marginBottom:16}}>Profilo Maestro</div>
      
      <div style={{marginBottom:24}}>
        <label className="label">Il tuo strumento principale</label>
        <input className="input" value={inst} onChange={e => setInst(e.target.value)} placeholder='Es: Pianoforte, Chitarra...'/>
        <p style={{fontSize:13, color:'var(--text-muted)', marginTop:8}}>
          Verrà suggerito automaticamente per ogni nuovo alunno.
        </p>
      </div>

      <div style={{marginBottom:24}}>
        <label className="label">Template Promemoria WhatsApp</label>
        <textarea className="input" style={{minHeight:120, resize:'vertical', lineHeight:1.5}} 
          value={temp} onChange={e => setTemp(e.target.value)} 
          placeholder='Scrivi qui il tuo messaggio...'/>
        
        <div style={{marginTop:12, padding:12, background:'#f8fafc', borderRadius:8, border:'1px solid var(--border)'}}>
          <div style={{fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase'}}>Segnaposto disponibili:</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
            {['{{GENITORE}}', '{{ALUNNO}}', '{{STRUMENTO}}', '{{DATA}}', '{{ORA}}'].map(p => (
              <code key={p} style={{background:'#fff', padding:'2px 6px', borderRadius:4, border:'1px solid var(--border)', fontSize:12, color:'var(--primary)'}}>{p}</code>
            ))}
          </div>
        </div>
      </div>

      <div style={{marginTop:20}}>
        <PrimaryBtn onClick={save}>{saving ? 'Salvataggio...' : 'Salva Impostazioni'}</PrimaryBtn>
      </div>
    </div>
  )
}
