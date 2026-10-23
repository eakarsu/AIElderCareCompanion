"use strict";
const FEATURES = [{"id": "care-summary", "title": "Care summary", "blurb": "Summarise open care tasks for the care circle, grouped by priority."}, {"id": "fall-risk-flags", "title": "Fall-risk flags", "blurb": "Flag care tasks mentioning fall, mobility, stairs, or night-time risk words for human review."}, {"id": "medication-adherence-overview", "title": "Medication adherence overview", "blurb": "Overview of medication-related tasks and their completion state; not medical advice."}];
const STATUSES=["todo","in_progress","done"]; const PRIORITIES=["low","medium","high"];
let seq=0;
function createStore(){ return { tasks: [] }; }
const defaultStore=createStore();
function hasProviderKey(env=process.env){ return Boolean(env.OPENROUTER_API_KEY||env.OPENAI_API_KEY); }
function validateTaskInput(b={},partial=false){
  if(!b||typeof b!=="object") throw Object.assign(new Error("task body required"),{status:400});
  const out={};
  if(!partial||b.title!==undefined){ const t=String(b.title||"").trim(); if(!t) throw Object.assign(new Error("title required"),{status:400}); out.title=t; }
  if(b.description!==undefined) out.description=String(b.description||"");
  if(b.status!==undefined){ if(!STATUSES.includes(b.status)) throw Object.assign(new Error("invalid status"),{status:400}); out.status=b.status; }
  if(b.priority!==undefined){ if(!PRIORITIES.includes(b.priority)) throw Object.assign(new Error("invalid priority"),{status:400}); out.priority=b.priority; }
  if(b.dueDate!==undefined) out.dueDate=b.dueDate?String(b.dueDate):null;
  return out;
}
function createTask(store,ownerId,input){ const v=validateTaskInput(input); const now=new Date().toISOString(); const task={id:++seq,title:v.title,description:v.description||"",status:v.status||"todo",priority:v.priority||"medium",dueDate:v.dueDate||null,ownerId:String(ownerId),createdAt:now,updatedAt:now}; store.tasks.push(task); return task; }
function listTasks(store,ownerId,q={}){ let rows=store.tasks.filter(t=>t.ownerId===String(ownerId)); const needle=String(q.q||q.search||"").trim().toLowerCase(); if(needle) rows=rows.filter(t=>(t.title+" "+t.description).toLowerCase().includes(needle)); if(q.status) rows=rows.filter(t=>t.status===q.status); if(q.priority) rows=rows.filter(t=>t.priority===q.priority); return rows.slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))); }
function updateTask(store,ownerId,id,input){ const t=store.tasks.find(x=>String(x.id)===String(id)&&x.ownerId===String(ownerId)); if(!t) return null; Object.assign(t,validateTaskInput(input,true),{updatedAt:new Date().toISOString()}); return t; }
function esc(v){ const s=v===null||v===undefined?"":String(v); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
function toCSV(tasks){ const cols=["id","title","description","status","priority","dueDate","ownerId","createdAt","updatedAt"]; return [cols.join(","),...tasks.map(t=>cols.map(c=>esc(t[c])).join(","))].join("\n"); }
function counts(tasks){ return { total:tasks.length, open:tasks.filter(t=>t.status!=="done").length, done:tasks.filter(t=>t.status==="done").length, highPriority:tasks.filter(t=>t.priority==="high"&&t.status!=="done").length, overdue:0, flagged:false }; }
function buildFallback(feature,tasks=[]){ const def=FEATURES.find(f=>f.id===feature)||FEATURES[0]; const c=counts(tasks); const top=tasks.filter(t=>t.status!=="done").slice(0,5);
  return { feature:def.id, title:def.title, aiGenerated:false, provider:null, model:null, fallback:true, label:"Deterministic fallback (no AI provider configured)", summary:def.blurb,
  sections:[ {heading:"Overview",content:def.blurb}, {heading:"Counts",content:`Total: ${c.total} \u00b7 Open: ${c.open} \u00b7 Done: ${c.done} \u00b7 High priority open: ${c.highPriority} \u00b7 Overdue: ${c.overdue} \u00b7 Flagged: ${c.flagged}`}, {heading:"Items",content: top.length? top.map(t=>`- [${t.priority}] ${t.title} (${t.status})`).join("\n") : "(no open items)"}, {heading:"Next steps",content:"Review the items above and update task status as work progresses."} ], counts:c, items:top }; }
async function runAi(feature,tasks,env=process.env){ if(!hasProviderKey(env)) return buildFallback(feature,tasks);
  try{ const key=env.OPENROUTER_API_KEY||env.OPENAI_API_KEY; const url=env.OPENROUTER_API_KEY?"https://openrouter.ai/api/v1/chat/completions":"https://api.openai.com/v1/chat/completions";
    const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`},body:JSON.stringify({model:env.OPENROUTER_MODEL||env.OPENAI_MODEL||"openai/gpt-4o-mini",messages:[{role:"user",content:`Feature ${feature}: summarise these tasks: ${JSON.stringify(tasks).slice(0,4000)}`}],max_tokens:600})});
    if(!r.ok) return buildFallback(feature,tasks); const j=await r.json(); const text=j.choices?.[0]?.message?.content; if(!text) return buildFallback(feature,tasks);
    const base=buildFallback(feature,tasks); return {...base,aiGenerated:true,provider:env.OPENROUTER_API_KEY?"openrouter":"openai",model:j.model||null,fallback:false,label:"AI-generated",sections:[{heading:"AI summary",content:text},...base.sections]}; }catch{ return buildFallback(feature,tasks); } }
module.exports={FEATURES,STATUSES,PRIORITIES,createStore,defaultStore,hasProviderKey,validateTaskInput,createTask,listTasks,updateTask,toCSV,counts,buildFallback,runAi};
