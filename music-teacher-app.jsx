import { useState, useEffect, useCallback } from "react";

// ── Palette & helpers ───────────────────────────────────────────────
const SCHOOL_COLORS = [
  "#E8A838","#5B8DD9","#E85858","#52C07A",
  "#9B6DD9","#E8726E","#3BBFBF","#D97B3B",
];

const fmt = (d) => new Date(d).toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"});
const fmtTime = (d) => new Date(d).toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"});
const today = () => new Date().toISOString().slice(0,10);
const uid = () => Math.random().toString(36).slice(2,9);

function initData() {
  const stored = localStorage.getItem("musicteacher_v2");
  if (stored) return JSON.parse(stored);
  return { schools:[], students:[], lessons:[] };
}

// ── Google Calendar helpers ─────────────────────────────────────────
function gcalUrl(lesson, student, school) {
  const start = new Date(lesson.datetime);
  const end = new Date(start.getTime() + lesson.duration * 60000);
  const pad = (n) => String(n).padStart(2,"0");
  const fmt8601 = (d) =>
    `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const params = new URLSearchParams({
    action:"TEMPLATE",
    text:`Lezione ${student.instrument} – ${student.name}`,
    dates:`${fmt8601(start)}/${fmt8601(end)}`,
    details:`Scuola: ${school?.name||"–"}\nDurata: ${lesson.duration} min\n${lesson.notes||""}`,
    location: school?.name||"",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [data, setData] = useState(initData);
  const [view, setView] = useState("dashboard"); // dashboard|students|lessons|schools
  const [modal, setModal] = useState(null); // null | {type, payload}
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [toast, setToast] = useState(null);

  const save = useCallback((next) => {
    setData(next);
    localStorage.setItem("musicteacher_v2", JSON.stringify(next));
  }, []);

  const showToast = (msg, color="#52C07A") => {
    setToast({msg,color});
    setTimeout(()=>setToast(null),2500);
  };

  // ── CRUD ──────────────────────────────────────────────────────────
  const addSchool = (s) => { save({...data, schools:[...data.schools,{id:uid(),...s,color:SCHOOL_COLORS[data.schools.length%SCHOOL_COLORS.length]}]}); showToast("Scuola aggiunta ✓"); };
  const delSchool = (id) => { save({...data, schools:data.schools.filter(s=>s.id!==id), students:data.students.map(s=>s.schoolId===id?{...s,schoolId:null}:s)}); };

  const addStudent = (s) => { save({...data, students:[...data.students,{id:uid(),...s}]}); showToast("Alunno aggiunto ✓"); };
  const updateStudent = (id,patch) => { save({...data, students:data.students.map(s=>s.id===id?{...s,...patch}:s)}); };
  const delStudent = (id) => { save({...data, students:data.students.filter(s=>s.id!==id), lessons:data.lessons.filter(l=>l.studentId!==id)}); };

  const addLesson = (l) => { save({...data, lessons:[...data.lessons,{id:uid(),...l,createdAt:Date.now()}]}); showToast("Lezione salvata ✓"); };
  const updateLesson = (id,patch) => { save({...data, lessons:data.lessons.map(l=>l.id===id?{...l,...patch}:l)}); showToast("Aggiornato ✓"); };
  const delLesson = (id) => { save({...data, lessons:data.lessons.filter(l=>l.id!==id)}); };

  // ── computed ───────────────────────────────────────────────────────
  const now = Date.now();
  const upcoming = data.lessons
    .filter(l=>new Date(l.datetime).getTime()>now)
    .sort((a,b)=>new Date(a.datetime)-new Date(b.datetime))
    .slice(0,5);
  const past = data.lessons
    .filter(l=>new Date(l.datetime).getTime()<=now)
    .sort((a,b)=>new Date(b.datetime)-new Date(a.datetime));

  const studentById = (id) => data.students.find(s=>s.id===id);
  const schoolById = (id) => data.schools.find(s=>s.id===id);
  const lessonsOf = (sid) => data.lessons.filter(l=>l.studentId===sid).sort((a,b)=>new Date(b.datetime)-new Date(a.datetime));

  // ── render helpers ─────────────────────────────────────────────────
  const SchoolBadge = ({id, small}) => {
    const sc = schoolById(id);
    if (!sc) return null;
    return <span style={{background:sc.color+"22",color:sc.color,border:`1px solid ${sc.color}44`,borderRadius:20,padding:small?"2px 8px":"3px 10px",fontSize:small?11:12,fontWeight:600,whiteSpace:"nowrap"}}>{sc.name}</span>;
  };

  return (
    <div style={styles.root}>
      {/* BG texture */}
      <div style={styles.bgNoise}/>

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>♩</span>
          <div>
            <div style={styles.logoTitle}>Maestro</div>
            <div style={styles.logoSub}>Registro Musicale</div>
          </div>
        </div>
        <nav style={styles.nav}>
          {[
            {k:"dashboard", icon:"◈", label:"Dashboard"},
            {k:"students",  icon:"♟", label:"Alunni"},
            {k:"lessons",   icon:"♫", label:"Lezioni"},
            {k:"schools",   icon:"⌂", label:"Scuole"},
          ].map(({k,icon,label})=>(
            <button key={k} style={{...styles.navBtn, ...(view===k?styles.navBtnActive:{})}} onClick={()=>{setView(k);setSelectedStudent(null);}}>
              <span style={styles.navIcon}>{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div style={styles.sidebarStats}>
          <Stat label="Alunni" value={data.students.length}/>
          <Stat label="Lezioni tot." value={data.lessons.length}/>
          <Stat label="Scuole" value={data.schools.length}/>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerTitle}>
            {view==="dashboard" && "Dashboard"}
            {view==="students" && (selectedStudent ? (studentById(selectedStudent)?.name||"Alunno") : "Alunni")}
            {view==="lessons" && "Calendario Lezioni"}
            {view==="schools" && "Scuole / Associazioni"}
          </div>
          <div style={styles.headerActions}>
            {view==="schools"  && <PrimaryBtn onClick={()=>setModal({type:"addSchool"})}>+ Nuova Scuola</PrimaryBtn>}
            {view==="students" && !selectedStudent && <PrimaryBtn onClick={()=>setModal({type:"addStudent"})}>+ Nuovo Alunno</PrimaryBtn>}
            {view==="students" && selectedStudent && <>
              <SecBtn onClick={()=>setSelectedStudent(null)}>← Torna</SecBtn>
              <PrimaryBtn onClick={()=>setModal({type:"addLesson",payload:{studentId:selectedStudent}})}>+ Nuova Lezione</PrimaryBtn>
            </>}
            {view==="lessons"  && <PrimaryBtn onClick={()=>setModal({type:"addLesson",payload:{}})}>+ Nuova Lezione</PrimaryBtn>}
          </div>
        </header>

        {/* Views */}
        <div style={styles.content}>
          {view==="dashboard" && <Dashboard data={data} upcoming={upcoming} past={past} studentById={studentById} schoolById={schoolById} SchoolBadge={SchoolBadge} setView={setView} setSelectedStudent={setSelectedStudent} setModal={setModal}/>}
          {view==="students" && !selectedStudent && <Students data={data} setSelectedStudent={setSelectedStudent} schoolById={schoolById} lessonsOf={lessonsOf} SchoolBadge={SchoolBadge} setModal={setModal} delStudent={delStudent}/>}
          {view==="students" && selectedStudent && <StudentDetail studentId={selectedStudent} data={data} lessonsOf={lessonsOf} schoolById={schoolById} SchoolBadge={SchoolBadge} updateLesson={updateLesson} delLesson={delLesson} studentById={studentById} setModal={setModal} gcalUrl={gcalUrl}/>}
          {view==="lessons"  && <Lessons data={data} studentById={studentById} schoolById={schoolById} SchoolBadge={SchoolBadge} updateLesson={updateLesson} delLesson={delLesson} setModal={setModal} gcalUrl={gcalUrl} setSelectedStudent={setSelectedStudent} setView={setView}/>}
          {view==="schools"  && <Schools data={data} lessonsOf={lessonsOf} addSchool={addSchool} delSchool={delSchool} setModal={setModal}/>}
        </div>
      </main>

      {/* Modals */}
      {modal?.type==="addSchool"  && <SchoolModal  onSave={addSchool}  onClose={()=>setModal(null)}/>}
      {modal?.type==="addStudent" && <StudentModal data={data} onSave={addStudent} onClose={()=>setModal(null)}/>}
      {modal?.type==="editStudent"&& <StudentModal data={data} initial={modal.payload} onSave={(s)=>{updateStudent(modal.payload.id,s);showToast("Alunno aggiornato ✓");}} onClose={()=>setModal(null)}/>}
      {modal?.type==="addLesson"  && <LessonModal  data={data} initial={modal.payload} onSave={addLesson}  onClose={()=>setModal(null)}/>}
      {modal?.type==="editLesson" && <LessonModal  data={data} initial={modal.payload} onSave={(l)=>updateLesson(modal.payload.id,l)} onClose={()=>setModal(null)}/>}

      {/* Toast */}
      {toast && <div style={{...styles.toast,background:toast.color}}>{toast.msg}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
function Dashboard({data,upcoming,past,studentById,schoolById,SchoolBadge,setView,setSelectedStudent,setModal}) {
  const now = Date.now();
  const todayStr = today();
  const todayLessons = data.lessons.filter(l=>l.datetime.slice(0,10)===todayStr);

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
      {/* Today */}
      <Card title={`Oggi · ${new Date().toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})}`} accent="#E8A838" span={2}>
        {todayLessons.length===0
          ? <Empty>Nessuna lezione oggi</Empty>
          : todayLessons.sort((a,b)=>new Date(a.datetime)-new Date(b.datetime)).map(l=>{
              const st = studentById(l.studentId);
              const done = new Date(l.datetime).getTime()<now;
              return <LessonRow key={l.id} lesson={l} student={st} schoolById={schoolById} SchoolBadge={SchoolBadge} done={done}/>;
            })
        }
      </Card>

      {/* Prossime lezioni */}
      <Card title="Prossime lezioni" accent="#5B8DD9">
        {upcoming.length===0
          ? <Empty>Nessuna lezione programmata</Empty>
          : upcoming.map(l=>{
              const st = studentById(l.studentId);
              return <LessonRow key={l.id} lesson={l} student={st} schoolById={schoolById} SchoolBadge={SchoolBadge} onClick={()=>{setSelectedStudent(l.studentId);setView("students");}}/>;
            })
        }
        <div style={{marginTop:12}}>
          <button style={styles.linkBtn} onClick={()=>setView("lessons")}>Vedi tutte →</button>
        </div>
      </Card>

      {/* Ultime lezioni */}
      <Card title="Ultime lezioni svolte" accent="#52C07A">
        {past.slice(0,5).length===0
          ? <Empty>Nessuna lezione svolta</Empty>
          : past.slice(0,5).map(l=>{
              const st = studentById(l.studentId);
              return <LessonRow key={l.id} lesson={l} student={st} schoolById={schoolById} SchoolBadge={SchoolBadge} done onClick={()=>{setSelectedStudent(l.studentId);setView("students");}}/>;
            })
        }
      </Card>

      {/* Alunni per scuola */}
      <Card title="Alunni per scuola" accent="#9B6DD9" span={2}>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {data.schools.map(sc=>{
            const count = data.students.filter(s=>s.schoolId===sc.id).length;
            return (
              <div key={sc.id} style={{background:sc.color+"15",border:`1px solid ${sc.color}33`,borderRadius:12,padding:"12px 20px",minWidth:120}}>
                <div style={{color:sc.color,fontWeight:700,fontSize:18}}>{count}</div>
                <div style={{fontSize:13,color:"#aaa",marginTop:2}}>{sc.name}</div>
              </div>
            );
          })}
          {data.schools.length===0 && <Empty>Nessuna scuola aggiunta</Empty>}
        </div>
      </Card>
    </div>
  );
}

// STUDENTS LIST
function Students({data,setSelectedStudent,schoolById,lessonsOf,SchoolBadge,setModal,delStudent}) {
  const [search,setSearch]=useState("");
  const [filterSchool,setFilterSchool]=useState("");
  const filtered = data.students.filter(s=>{
    const q=search.toLowerCase();
    return (!q||(s.name+s.instrument).toLowerCase().includes(q)) && (!filterSchool||s.schoolId===filterSchool);
  });

  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <input style={styles.input} placeholder="🔍  Cerca alunno o strumento..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={styles.select} value={filterSchool} onChange={e=>setFilterSchool(e.target.value)}>
          <option value="">Tutte le scuole</option>
          {data.schools.map(sc=><option key={sc.id} value={sc.id}>{sc.name}</option>)}
        </select>
      </div>
      {filtered.length===0 && <Empty>Nessun alunno trovato</Empty>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
        {filtered.map(s=>{
          const lessons = lessonsOf(s.id);
          const next = lessons.filter(l=>new Date(l.datetime).getTime()>Date.now()).sort((a,b)=>new Date(a.datetime)-new Date(b.datetime))[0];
          const sc = schoolById(s.schoolId);
          return (
            <div key={s.id} style={styles.studentCard} onClick={()=>setSelectedStudent(s.id)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontWeight:700,fontSize:17,color:"#f0f0f0"}}>{s.name}</div>
                  <div style={{color:"#E8A838",fontSize:13,fontWeight:600,marginTop:2}}>♪ {s.instrument}</div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <IconBtn title="Modifica" onClick={e=>{e.stopPropagation();setModal({type:"editStudent",payload:s});}}>✎</IconBtn>
                  <IconBtn title="Elimina" danger onClick={e=>{e.stopPropagation();if(confirm(`Eliminare ${s.name}?`))delStudent(s.id);}}>✕</IconBtn>
                </div>
              </div>
              <div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                {sc && <SchoolBadge id={s.schoolId} small/>}
                <span style={styles.pill}>{s.duration} min</span>
                <span style={styles.pill}>{lessons.length} lezioni</span>
              </div>
              {next && <div style={{marginTop:10,fontSize:12,color:"#aaa"}}>Prossima: <span style={{color:"#5B8DD9"}}>{fmt(next.datetime)} {fmtTime(next.datetime)}</span></div>}
              {s.nextToBring && <div style={{marginTop:6,fontSize:12,color:"#E8A838",background:"#E8A83810",padding:"4px 8px",borderRadius:6}}>📦 {s.nextToBring}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// STUDENT DETAIL
function StudentDetail({studentId,data,lessonsOf,schoolById,SchoolBadge,updateLesson,delLesson,studentById,setModal,gcalUrl}) {
  const student = studentById(studentId);
  const lessons = lessonsOf(studentId);
  const school = schoolById(student?.schoolId);
  const [expandId,setExpandId]=useState(null);
  const [editNote,setEditNote]=useState({});
  const [editBring,setEditBring]=useState({});

  if (!student) return <Empty>Alunno non trovato</Empty>;

  const doneLessons = lessons.filter(l=>new Date(l.datetime).getTime()<=Date.now());
  const futureLessons = lessons.filter(l=>new Date(l.datetime).getTime()>Date.now());

  return (
    <div>
      {/* Student header */}
      <div style={styles.studentHeader}>
        <div style={{flex:1}}>
          <div style={{fontSize:26,fontWeight:800,color:"#f0f0f0"}}>{student.name}</div>
          <div style={{color:"#E8A838",fontWeight:600,marginTop:4}}>♪ {student.instrument} · {student.duration} min/lezione</div>
          <div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            {school && <SchoolBadge id={student.schoolId}/>}
            {student.email && <span style={styles.pill}>✉ {student.email}</span>}
            {student.phone && <span style={styles.pill}>📞 {student.phone}</span>}
          </div>
          {student.nextToBring && (
            <div style={{marginTop:12,background:"#E8A83815",border:"1px solid #E8A83844",borderRadius:8,padding:"8px 12px",fontSize:13}}>
              <span style={{color:"#E8A838",fontWeight:600}}>📦 Deve portare: </span>
              <span style={{color:"#ddd"}}>{student.nextToBring}</span>
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:8,flexDirection:"column"}}>
          <PrimaryBtn onClick={()=>setModal({type:"addLesson",payload:{studentId}})}>+ Lezione</PrimaryBtn>
          <SecBtn onClick={()=>setModal({type:"editStudent",payload:student})}>✎ Modifica</SecBtn>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
        <MiniStat label="Lezioni totali" value={lessons.length}/>
        <MiniStat label="Svolte" value={doneLessons.length}/>
        <MiniStat label="Programmate" value={futureLessons.length}/>
      </div>

      {/* Lessons */}
      {futureLessons.length>0 && (
        <div style={{marginBottom:24}}>
          <SectionTitle>Prossime lezioni</SectionTitle>
          {futureLessons.sort((a,b)=>new Date(a.datetime)-new Date(b.datetime)).map(l=>(
            <LessonCard key={l.id} lesson={l} student={student} school={school} expandId={expandId} setExpandId={setExpandId}
              editNote={editNote} setEditNote={setEditNote} editBring={editBring} setEditBring={setEditBring}
              updateLesson={updateLesson} delLesson={delLesson} setModal={setModal} gcalUrl={gcalUrl} future/>
          ))}
        </div>
      )}

      <SectionTitle>Storico lezioni</SectionTitle>
      {doneLessons.length===0 && <Empty>Nessuna lezione svolta</Empty>}
      {doneLessons.map(l=>(
        <LessonCard key={l.id} lesson={l} student={student} school={school} expandId={expandId} setExpandId={setExpandId}
          editNote={editNote} setEditNote={setEditNote} editBring={editBring} setEditBring={setEditBring}
          updateLesson={updateLesson} delLesson={delLesson} setModal={setModal} gcalUrl={gcalUrl}/>
      ))}
    </div>
  );
}

function LessonCard({lesson,student,school,expandId,setExpandId,editNote,setEditNote,editBring,setEditBring,updateLesson,delLesson,setModal,gcalUrl,future}) {
  const open = expandId===lesson.id;
  const isDone = new Date(lesson.datetime).getTime()<=Date.now();
  const accentColor = future ? "#5B8DD9" : "#52C07A";

  const saveNote = () => { updateLesson(lesson.id,{notes:editNote[lesson.id]??lesson.notes}); setEditNote(p=>({...p,[lesson.id]:undefined})); };
  const saveBring = () => { updateLesson(lesson.id,{nextToBring:editBring[lesson.id]??lesson.nextToBring}); setEditBring(p=>({...p,[lesson.id]:undefined})); };

  return (
    <div style={{...styles.lessonCard, borderLeft:`3px solid ${accentColor}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setExpandId(open?null:lesson.id)}>
        <div>
          <div style={{fontWeight:600,color:"#f0f0f0"}}>{fmt(lesson.datetime)} · <span style={{color:accentColor}}>{fmtTime(lesson.datetime)}</span></div>
          <div style={{fontSize:13,color:"#aaa",marginTop:2}}>{lesson.duration||student?.duration} min{lesson.topic?" · "+lesson.topic:""}</div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {lesson.notes && <span title="Ha annotazioni" style={{color:"#E8A838",fontSize:16}}>✍</span>}
          {lesson.nextToBring && <span title="Deve portare qualcosa" style={{color:"#9B6DD9",fontSize:16}}>📦</span>}
          <span style={{color:"#666",transition:"transform .2s",transform:open?"rotate(180deg)":"none"}}>▾</span>
        </div>
      </div>

      {open && (
        <div style={{marginTop:14,borderTop:"1px solid #333",paddingTop:14}}>
          {/* Argomento */}
          <div style={{marginBottom:12}}>
            <label style={styles.label}>Argomento lezione</label>
            <input style={styles.input} defaultValue={lesson.topic||""} onBlur={e=>updateLesson(lesson.id,{topic:e.target.value})} placeholder="Es: Scale, Solfeggio..."/>
          </div>

          {/* Note */}
          <div style={{marginBottom:12}}>
            <label style={styles.label}>Annotazioni</label>
            <textarea style={{...styles.input,minHeight:80,resize:"vertical"}}
              value={editNote[lesson.id]??lesson.notes??""}
              onChange={e=>setEditNote(p=>({...p,[lesson.id]:e.target.value}))}
              placeholder="Note sulla lezione..."
            />
            {editNote[lesson.id]!==undefined && <SecBtn onClick={saveNote}>Salva note</SecBtn>}
          </div>

          {/* Cosa portare */}
          <div style={{marginBottom:16}}>
            <label style={styles.label}>📦 Portare la prossima volta</label>
            <input style={styles.input}
              value={editBring[lesson.id]??lesson.nextToBring??""}
              onChange={e=>setEditBring(p=>({...p,[lesson.id]:e.target.value}))}
              placeholder="Es: Metodo Beyer, libro di teoria..."
            />
            {editBring[lesson.id]!==undefined && <SecBtn onClick={saveBring}>Salva</SecBtn>}
          </div>

          {/* Actions */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <a href={gcalUrl(lesson,student,school)} target="_blank" rel="noreferrer" style={styles.gcalBtn}>
              📅 Apri in Google Calendar
            </a>
            <IconBtn danger onClick={()=>{if(confirm("Eliminare questa lezione?"))delLesson(lesson.id);}}>🗑 Elimina</IconBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// LESSONS VIEW
function Lessons({data,studentById,schoolById,SchoolBadge,updateLesson,delLesson,setModal,gcalUrl,setSelectedStudent,setView}) {
  const [filterSt,setFilterSt]=useState("");
  const [filterSc,setFilterSc]=useState("");
  const [tab,setTab]=useState("upcoming"); // upcoming|past|all

  const now = Date.now();
  const filtered = data.lessons.filter(l=>{
    const st = studentById(l.studentId);
    return (!filterSt||l.studentId===filterSt) && (!filterSc||st?.schoolId===filterSc);
  });
  const shown = filtered.filter(l=>{
    const t = new Date(l.datetime).getTime();
    if(tab==="upcoming") return t>now;
    if(tab==="past") return t<=now;
    return true;
  }).sort((a,b)=>tab==="past"?new Date(b.datetime)-new Date(a.datetime):new Date(a.datetime)-new Date(b.datetime));

  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <select style={styles.select} value={filterSt} onChange={e=>setFilterSt(e.target.value)}>
          <option value="">Tutti gli alunni</option>
          {data.students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select style={styles.select} value={filterSc} onChange={e=>setFilterSc(e.target.value)}>
          <option value="">Tutte le scuole</option>
          {data.schools.map(sc=><option key={sc.id} value={sc.id}>{sc.name}</option>)}
        </select>
        <div style={styles.tabs}>
          {[["upcoming","Programmate"],["past","Svolte"],["all","Tutte"]].map(([k,l])=>(
            <button key={k} style={{...styles.tab,..( tab===k?styles.tabActive:{})}} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>
      </div>

      {shown.length===0 && <Empty>Nessuna lezione</Empty>}
      {shown.map(l=>{
        const st = studentById(l.studentId);
        const sc = schoolById(st?.schoolId);
        const future = new Date(l.datetime).getTime()>now;
        return (
          <div key={l.id} style={{...styles.lessonCard,borderLeft:`3px solid ${future?"#5B8DD9":"#52C07A"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,color:"#f0f0f0",cursor:"pointer"}} onClick={()=>{setSelectedStudent(l.studentId);setView("students");}}>
                    {st?.name||"?"}
                  </span>
                  <span style={{color:"#E8A838",fontSize:13}}>♪ {st?.instrument}</span>
                  {sc && <SchoolBadge id={st?.schoolId} small/>}
                </div>
                <div style={{fontSize:13,color:"#aaa",marginTop:4}}>{fmt(l.datetime)} · {fmtTime(l.datetime)} · {l.duration||st?.duration} min</div>
                {l.topic && <div style={{fontSize:13,color:"#bbb",marginTop:2}}>📚 {l.topic}</div>}
                {l.notes && <div style={{fontSize:12,color:"#999",marginTop:4,fontStyle:"italic"}}>✍ {l.notes.slice(0,80)}{l.notes.length>80?"...":""}</div>}
                {l.nextToBring && <div style={{fontSize:12,color:"#9B6DD9",marginTop:4}}>📦 {l.nextToBring}</div>}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                <a href={gcalUrl(l,st,sc)} target="_blank" rel="noreferrer" style={{...styles.gcalBtn,padding:"4px 10px",fontSize:12}}>📅 GCal</a>
                <IconBtn danger onClick={()=>{if(confirm("Eliminare?"))delLesson(l.id);}}>✕</IconBtn>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// SCHOOLS
function Schools({data,lessonsOf,addSchool,delSchool,setModal}) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:20}}>
      {data.schools.map(sc=>{
        const students = data.students.filter(s=>s.schoolId===sc.id);
        const totalLessons = students.reduce((acc,s)=>acc+lessonsOf(s.id).length,0);
        return (
          <div key={sc.id} style={{...styles.schoolCard,borderTop:`4px solid ${sc.color}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontWeight:700,fontSize:18,color:"#f0f0f0"}}>{sc.name}</div>
                {sc.address && <div style={{fontSize:13,color:"#aaa",marginTop:2}}>📍 {sc.address}</div>}
                {sc.contact && <div style={{fontSize:13,color:"#aaa"}}>📞 {sc.contact}</div>}
              </div>
              <IconBtn danger onClick={()=>{if(confirm(`Eliminare ${sc.name}?`))delSchool(sc.id);}}>✕</IconBtn>
            </div>
            <div style={{marginTop:14,display:"flex",gap:12}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:24,fontWeight:800,color:sc.color}}>{students.length}</div>
                <div style={{fontSize:11,color:"#777"}}>Alunni</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:24,fontWeight:800,color:sc.color}}>{totalLessons}</div>
                <div style={{fontSize:11,color:"#777"}}>Lezioni</div>
              </div>
            </div>
            {students.length>0 && (
              <div style={{marginTop:12,display:"flex",flexWrap:"wrap",gap:6}}>
                {students.map(s=><span key={s.id} style={{...styles.pill,fontSize:12}}>{s.name}</span>)}
              </div>
            )}
          </div>
        );
      })}
      {data.schools.length===0 && <div style={{gridColumn:"1/-1"}}><Empty>Nessuna scuola aggiunta</Empty></div>}
    </div>
  );
}

// ── Modals ──────────────────────────────────────────────────────────
function SchoolModal({onSave,onClose}) {
  const [f,setF]=useState({name:"",address:"",contact:""});
  return (
    <Modal title="Nuova Scuola / Associazione" onClose={onClose} onSave={()=>{if(f.name){onSave(f);onClose();}}} saveLabel="Aggiungi">
      <label style={styles.label}>Nome *</label>
      <input style={styles.input} value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Es: Scuola Musica Verdi"/>
      <label style={styles.label}>Indirizzo</label>
      <input style={styles.input} value={f.address} onChange={e=>setF({...f,address:e.target.value})} placeholder="Via Roma 1, Milano"/>
      <label style={styles.label}>Contatto / Referente</label>
      <input style={styles.input} value={f.contact} onChange={e=>setF({...f,contact:e.target.value})} placeholder="Mario Rossi · 333 000 0000"/>
    </Modal>
  );
}

function StudentModal({data,initial,onSave,onClose}) {
  const [f,setF]=useState(initial||{name:"",instrument:"",duration:30,schoolId:"",email:"",phone:"",notes:"",nextToBring:""});
  return (
    <Modal title={initial?"Modifica Alunno":"Nuovo Alunno"} onClose={onClose} onSave={()=>{if(f.name&&f.instrument){onSave(f);onClose();}}} saveLabel={initial?"Salva":"Aggiungi"}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{gridColumn:"1/-1"}}>
          <label style={styles.label}>Nome e cognome *</label>
          <input style={styles.input} value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Mario Rossi"/>
        </div>
        <div>
          <label style={styles.label}>Strumento *</label>
          <input style={styles.input} value={f.instrument} onChange={e=>setF({...f,instrument:e.target.value})} placeholder="Es: Pianoforte"/>
        </div>
        <div>
          <label style={styles.label}>Durata lezione (min)</label>
          <input style={styles.input} type="number" value={f.duration} min={15} step={5} onChange={e=>setF({...f,duration:+e.target.value})}/>
        </div>
        <div>
          <label style={styles.label}>Scuola</label>
          <select style={styles.select} value={f.schoolId||""} onChange={e=>setF({...f,schoolId:e.target.value})}>
            <option value="">– Nessuna –</option>
            {data.schools.map(sc=><option key={sc.id} value={sc.id}>{sc.name}</option>)}
          </select>
        </div>
        <div>
          <label style={styles.label}>Email</label>
          <input style={styles.input} value={f.email||""} onChange={e=>setF({...f,email:e.target.value})} placeholder="mario@email.it"/>
        </div>
        <div>
          <label style={styles.label}>Telefono</label>
          <input style={styles.input} value={f.phone||""} onChange={e=>setF({...f,phone:e.target.value})} placeholder="333 000 0000"/>
        </div>
        <div style={{gridColumn:"1/-1"}}>
          <label style={styles.label}>📦 Portare alla prossima lezione</label>
          <input style={styles.input} value={f.nextToBring||""} onChange={e=>setF({...f,nextToBring:e.target.value})} placeholder="Es: Metodo Beyer pagina 12..."/>
        </div>
        <div style={{gridColumn:"1/-1"}}>
          <label style={styles.label}>Note generali</label>
          <textarea style={{...styles.input,minHeight:70,resize:"vertical"}} value={f.notes||""} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Note sull'alunno..."/>
        </div>
      </div>
    </Modal>
  );
}

function LessonModal({data,initial,onSave,onClose}) {
  const defDate = initial?.datetime||`${today()}T09:00`;
  const [f,setF]=useState({
    studentId:initial?.studentId||"",
    datetime:initial?.datetime||defDate,
    duration:initial?.duration||"",
    topic:initial?.topic||"",
    notes:initial?.notes||"",
    nextToBring:initial?.nextToBring||"",
  });
  const student = data.students.find(s=>s.id===f.studentId);

  return (
    <Modal title="Lezione" onClose={onClose} onSave={()=>{if(f.studentId&&f.datetime){onSave({...f,duration:f.duration||student?.duration||30});onClose();}}} saveLabel="Salva">
      <label style={styles.label}>Alunno *</label>
      <select style={styles.select} value={f.studentId} onChange={e=>setF({...f,studentId:e.target.value})}>
        <option value="">– Seleziona –</option>
        {data.students.map(s=><option key={s.id} value={s.id}>{s.name} · {s.instrument}</option>)}
      </select>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
        <div>
          <label style={styles.label}>Data e ora *</label>
          <input style={styles.input} type="datetime-local" value={f.datetime} onChange={e=>setF({...f,datetime:e.target.value})}/>
        </div>
        <div>
          <label style={styles.label}>Durata (min){student?` · default ${student.duration}`:"" }</label>
          <input style={styles.input} type="number" value={f.duration} min={15} step={5} onChange={e=>setF({...f,duration:+e.target.value})} placeholder={student?.duration||30}/>
        </div>
      </div>
      <label style={styles.label}>Argomento</label>
      <input style={styles.input} value={f.topic} onChange={e=>setF({...f,topic:e.target.value})} placeholder="Es: Scale maggiori, lettura..."/>
      <label style={styles.label}>Annotazioni</label>
      <textarea style={{...styles.input,minHeight:80,resize:"vertical"}} value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Note sulla lezione..."/>
      <label style={styles.label}>📦 Portare la prossima volta</label>
      <input style={styles.input} value={f.nextToBring} onChange={e=>setF({...f,nextToBring:e.target.value})} placeholder="Es: Quaderno, metodo pagina 24..."/>
    </Modal>
  );
}

// ── Generic UI pieces ───────────────────────────────────────────────
function Modal({title,onClose,onSave,saveLabel="Salva",children}) {
  return (
    <div style={styles.overlay} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>{title}</div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={styles.modalBody}>{children}</div>
        <div style={styles.modalFooter}>
          <SecBtn onClick={onClose}>Annulla</SecBtn>
          <PrimaryBtn onClick={onSave}>{saveLabel}</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

function Card({title,accent="#E8A838",span,children}) {
  return (
    <div style={{...styles.card,...(span===2?{gridColumn:"1/-1"}:{})}}>
      <div style={{fontWeight:700,fontSize:14,color:accent,marginBottom:12,textTransform:"uppercase",letterSpacing:1}}>{title}</div>
      {children}
    </div>
  );
}

function LessonRow({lesson,student,schoolById,SchoolBadge,done,onClick}) {
  if(!student) return null;
  const sc = schoolById?.(student.schoolId);
  return (
    <div style={{...styles.lessonRow,...(onClick?{cursor:"pointer"}:{}),(done?{opacity:.8}:{})}} onClick={onClick}>
      <div>
        <span style={{fontWeight:600,color:"#f0f0f0"}}>{student.name}</span>
        <span style={{color:"#E8A838",fontSize:13,marginLeft:8}}>♪ {student.instrument}</span>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:13,color:"#aaa"}}>{fmtTime(lesson.datetime)}</span>
        {sc && <SchoolBadge id={student.schoolId} small/>}
      </div>
    </div>
  );
}

const Stat=({label,value})=><div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:"#E8A838"}}>{value}</div><div style={{fontSize:11,color:"#666",marginTop:2}}>{label}</div></div>;
const MiniStat=({label,value})=><div style={styles.miniStat}><div style={{fontSize:28,fontWeight:800,color:"#E8A838"}}>{value}</div><div style={{fontSize:12,color:"#777"}}>{label}</div></div>;
const SectionTitle=({children})=><div style={{fontWeight:700,fontSize:13,color:"#E8A838",textTransform:"uppercase",letterSpacing:1,marginBottom:10,marginTop:4}}>{children}</div>;
const Empty=({children})=><div style={{color:"#555",fontSize:14,padding:"16px 0",textAlign:"center"}}>{children}</div>;
const PrimaryBtn=({children,onClick})=><button style={styles.primaryBtn} onClick={onClick}>{children}</button>;
const SecBtn=({children,onClick})=><button style={styles.secBtn} onClick={onClick}>{children}</button>;
const IconBtn=({children,onClick,danger,title})=><button title={title} style={{...styles.iconBtn,...(danger?{color:"#E85858"}:{})}} onClick={onClick}>{children}</button>;

// ── Styles ──────────────────────────────────────────────────────────
const styles = {
  root:{display:"flex",minHeight:"100vh",background:"#0f0f13",color:"#d0d0d0",fontFamily:"'Crimson Pro', Georgia, serif",position:"relative",overflow:"hidden"},
  bgNoise:{position:"fixed",inset:0,backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E")`,pointerEvents:"none",zIndex:0},
  sidebar:{width:220,background:"#13131a",borderRight:"1px solid #222",display:"flex",flexDirection:"column",padding:"24px 0",position:"sticky",top:0,height:"100vh",zIndex:1},
  logo:{display:"flex",alignItems:"center",gap:12,padding:"0 20px 24px",borderBottom:"1px solid #222"},
  logoIcon:{fontSize:32,color:"#E8A838",lineHeight:1},
  logoTitle:{fontWeight:800,fontSize:18,color:"#f0f0f0",letterSpacing:.5},
  logoSub:{fontSize:11,color:"#555",letterSpacing:1,textTransform:"uppercase"},
  nav:{flex:1,padding:"16px 0"},
  navBtn:{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 20px",background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:15,fontFamily:"inherit",transition:"all .15s",textAlign:"left"},
  navBtnActive:{color:"#E8A838",background:"#E8A83810",borderRight:"2px solid #E8A838"},
  navIcon:{fontSize:18,width:22,textAlign:"center"},
  sidebarStats:{padding:"16px 20px",borderTop:"1px solid #222",display:"flex",flexDirection:"column",gap:12},
  main:{flex:1,display:"flex",flexDirection:"column",minWidth:0,zIndex:1},
  header:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 28px",borderBottom:"1px solid #1e1e28",background:"#0f0f1388",backdropFilter:"blur(8px)",position:"sticky",top:0,zIndex:10},
  headerTitle:{fontSize:22,fontWeight:800,color:"#f0f0f0"},
  headerActions:{display:"flex",gap:10},
  content:{padding:"24px 28px",flex:1},
  card:{background:"#16161f",border:"1px solid #222",borderRadius:14,padding:"18px 20px"},
  lessonCard:{background:"#16161f",border:"1px solid #252535",borderRadius:10,padding:"14px 16px",marginBottom:10,transition:"border-color .15s"},
  studentCard:{background:"#16161f",border:"1px solid #252535",borderRadius:14,padding:"18px",cursor:"pointer",transition:"border-color .15s, transform .15s"},
  schoolCard:{background:"#16161f",border:"1px solid #252535",borderRadius:14,padding:"20px"},
  lessonRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #1e1e28"},
  miniStat:{background:"#13131a",border:"1px solid #1e1e28",borderRadius:10,padding:"14px 16px"},
  studentHeader:{background:"#16161f",border:"1px solid #252535",borderRadius:14,padding:"20px 24px",marginBottom:20,display:"flex",gap:16,alignItems:"flex-start"},
  overlay:{position:"fixed",inset:0,background:"#000a",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,backdropFilter:"blur(4px)"},
  modal:{background:"#16161f",border:"1px solid #2a2a3a",borderRadius:16,width:"min(560px,95vw)",maxHeight:"90vh",overflow:"auto"},
  modalHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px",borderBottom:"1px solid #222"},
  modalTitle:{fontWeight:800,fontSize:18,color:"#f0f0f0"},
  modalBody:{padding:"20px 24px",display:"flex",flexDirection:"column",gap:10},
  modalFooter:{display:"flex",justifyContent:"flex-end",gap:10,padding:"16px 24px",borderTop:"1px solid #222"},
  closeBtn:{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:18,fontFamily:"inherit"},
  input:{width:"100%",background:"#0f0f13",border:"1px solid #2a2a3a",borderRadius:8,padding:"8px 12px",color:"#e0e0e0",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"},
  select:{background:"#0f0f13",border:"1px solid #2a2a3a",borderRadius:8,padding:"8px 12px",color:"#e0e0e0",fontSize:14,fontFamily:"inherit",outline:"none"},
  label:{fontSize:12,color:"#666",marginBottom:4,display:"block",letterSpacing:.5,textTransform:"uppercase"},
  primaryBtn:{background:"#E8A838",color:"#000",border:"none",borderRadius:8,padding:"8px 16px",fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit"},
  secBtn:{background:"#1e1e28",color:"#ccc",border:"1px solid #2a2a3a",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontFamily:"inherit"},
  iconBtn:{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:14,fontFamily:"inherit",padding:"4px 8px"},
  pill:{background:"#1e1e28",border:"1px solid #2a2a3a",borderRadius:20,padding:"2px 10px",fontSize:12,color:"#aaa"},
  linkBtn:{background:"none",border:"none",color:"#5B8DD9",cursor:"pointer",fontSize:13,fontFamily:"inherit",padding:0},
  gcalBtn:{display:"inline-flex",alignItems:"center",gap:6,background:"#1e3a6e",border:"1px solid #2a4d8f",color:"#6fa3ef",borderRadius:8,padding:"6px 14px",fontSize:13,textDecoration:"none"},
  tabs:{display:"flex",background:"#0f0f13",borderRadius:8,border:"1px solid #2a2a3a",overflow:"hidden"},
  tab:{background:"none",border:"none",padding:"7px 14px",color:"#666",cursor:"pointer",fontSize:13,fontFamily:"inherit"},
  tabActive:{background:"#E8A83822",color:"#E8A838"},
  toast:{position:"fixed",bottom:24,right:24,padding:"10px 20px",borderRadius:10,color:"#000",fontWeight:700,fontSize:14,zIndex:999,boxShadow:"0 4px 20px #0008"},
};
