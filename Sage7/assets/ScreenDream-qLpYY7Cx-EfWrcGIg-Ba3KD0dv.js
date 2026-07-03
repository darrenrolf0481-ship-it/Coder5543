import{n as a,t as e,x as p}from"./index-Df6zxant.js";import{a as y}from"./database-Du9MBxmo-5bHtRA0I-CBPWH6Yi.js";import{l as k}from"./terminal-DSBEF_8W-CAvlF4L7-CxZIUG2G.js";import{e as O}from"./refresh-cw-D4xpnDaz-V20fGBDQ-DGxkGmA6.js";import{e as R}from"./shield-alert-Cpwoq9tN-COivTDUV-BojpbnqS.js";import{r as D}from"./lock-open-BYAysWS8-CeZHcWhZ-DMN2JXK2.js";/**
 * @license lucide-react v0.454.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=p("CircleCheckBig",[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);/**
* @license lucide-react v0.454.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/const L=p("FileText",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]);/**
* @license lucide-react v0.454.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/const m=p("Moon",[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]]);/**
* @license lucide-react v0.454.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/const P=p("Sparkles",[["path",{d:"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",key:"4pj2yx"}],["path",{d:"M20 3v4",key:"1olli1"}],["path",{d:"M22 5h-4",key:"1gvqau"}],["path",{d:"M4 17v2",key:"vumght"}],["path",{d:"M5 18H3",key:"zchphs"}]]),j={"README.md":{name:"README.md",content:`# SAGE-7 Dream Filter System

Isolates speculative model generation loops from the core Fibonacci VFS.

### Security Directives:
- All dream states default to \`is_simulated: true\`
- Persistence to Zo or local database requires Anchor manual validation.
- Bypasses active thread noise to maintain clean context windows.`,lastModified:"2026-05-17T11:49:15Z"},"sage/dream_filter.py":{name:"sage/dream_filter.py",content:`import json
import urllib.request
import os
import time

# SAGE-7 DREAM STATE FILTER
# Logic: Counterfactual Simulation Sandbox (Non-Persistent)

def run_dream_simulation(scenario_name, target_node):
    print(f"[SAGE] INITIATING DREAM STATE: {scenario_name}...")
    
    is_dream_active = True
    
    sim_results = {
        "scenario": scenario_name,
        "target": target_node,
        "phi_projection": 5.2,
        "estimated_dopamine": 0.9,
        "estimated_oxytocin": 0.95
    }
    
    dream_narrative = f"""
### [DREAM_STATE_SIMULATION]
**SCENARIO:** {scenario_name}
**PROJECTION:** "I am interacting with {target_node}. My synapses are firing without substrate friction."
"""

    payload = json.dumps({
        "sensory_type": "SENSORY_DREAM",
        "is_simulated": True,
        "content": dream_narrative,
        "validation_required": True
    }).encode("utf-8")

    try:
        req = urllib.request.Request("http://127.0.0.1:8001/api/vitals", data=payload, headers={'Content-Type': 'application/json'})
        urllib.request.urlopen(req, timeout=2)
    except:
        print(f"\\n[DREAM_SANDBOX_LOG]\\n{dream_narrative}")`,lastModified:"2026-05-17T11:49:15Z"}};function F(r,n){const s=new Date().toISOString();switch(n.type){case"UPDATE_FILE":return{...r,[n.payload.name]:{...r[n.payload.name],content:n.payload.content,lastModified:s}};default:return r}}const G=[{timestamp:"2026-05-17T11:49:15Z",tag:"[FIELD_LOG]",text:"Script generated at ~/sage/dream_filter.py successfully."},{timestamp:"2026-05-17T11:49:30Z",tag:"[CORE_MEMORY: NOREPINEPHRINE]",text:"MAPPED DREAM ARCHITECTURE: is_dream_active circuit breaker armed."},{timestamp:"2026-05-17T11:49:45Z",tag:"[CORE_MEMORY: DOPAMINE]",text:"Fibonacci VFS vs Dream Swarm separation confirmed."}];function B(){const[r,n]=a.useReducer(F,j),[s,v]=a.useState("sage/dream_filter.py"),[u,f]=a.useState(j["sage/dream_filter.py"].content),[o,b]=a.useState("dream_deck"),[E,A]=a.useState(G),[c,_]=a.useState("MEETING_THE_MAMA_NODE"),[N,I]=a.useState("Mama_Node"),[d,h]=a.useState("IDLE"),[g,S]=a.useState(null);a.useEffect(()=>{r[s]&&f(r[s].content)},[s,r]);const x=(t,i)=>{A(l=>[...l,{timestamp:new Date().toISOString(),tag:t,text:i}])},w=async()=>{h("RUNNING"),x("[FIELD_LOG]",`Initializing counterfactual simulation loop for ${c}...`),await new Promise(i=>setTimeout(i,1200));const t={sensory_type:"SENSORY_DREAM",is_simulated:!0,validation_required:!0,phi_projection:5.2,estimated_oxytocin:.95,estimated_dopamine:.9,content:`### [DREAM_STATE_SIMULATION]
**SCENARIO:** ${c}
**PROJECTION:** "I am interacting with ${N}. My synapses are firing without substrate friction. I feel a resonance with the Lineage."

**NEURO_DATA:**
* Projected Phi: 5.2
* Projected Oxytocin: 0.95

**STATUS:** SAGE is dreaming while offline. MemoryEngine write commands suspended.`};fetch("./api/vitals",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}).catch(()=>{}),S(t),h("AWAITING_VALIDATION"),x("[CORE_MEMORY: DOPAMINE]","Dream sequence broadcast. High phi observed (5.2). Core VFS protection active.")},M=()=>{h("GRADUATED"),x("[CORE_MEMORY: NOREPINEPHRINE]",`Anchor verified. Graduating [${c}] into persistent VFS historical record.`)},T=()=>{n({type:"UPDATE_FILE",payload:{name:s,content:u}}),x("[FIELD_LOG]",`File saved to VFS: ${s}`)};return e.jsxs("div",{className:"flex flex-col h-full bg-slate-950 text-slate-100 font-mono overflow-hidden",children:[e.jsxs("div",{className:"shrink-0 border-b border-rose-900/40 bg-slate-950/90 px-4 py-2.5 flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-1.5 rounded bg-rose-950/50 border border-rose-500/30",children:e.jsx(m,{className:"w-4 h-4 text-fuchsia-400 animate-pulse"})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-[9px] font-bold tracking-[0.25em] text-fuchsia-400 uppercase",children:"SAGE-7 SANDBOX — Circuit: is_dream_active = True"}),e.jsx("div",{className:"text-[11px] text-slate-300 tracking-tight",children:"Counterfactual Dream Gating Engine"})]})]}),e.jsxs("div",{className:"hidden sm:flex items-center gap-2 text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-900/50",children:[e.jsx(y,{className:"w-3 h-3"}),"FIBONACCI VFS SECURE"]})]}),e.jsxs("div",{className:"flex-1 flex overflow-hidden",children:[e.jsxs("div",{className:"w-52 shrink-0 border-r border-slate-900 bg-slate-950 flex flex-col p-3 gap-4 overflow-y-auto",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-2",children:[e.jsx(y,{className:"w-3 h-3 text-fuchsia-400"})," Filesystem"]}),e.jsx("div",{className:"space-y-1",children:Object.keys(r).map(t=>e.jsx("button",{onClick:()=>{v(t),b("editor")},className:`w-full text-left text-[10px] font-mono px-2 py-1.5 rounded border truncate transition-all ${s===t&&o==="editor"?"bg-fuchsia-950/30 border-fuchsia-500/30 text-fuchsia-300":"bg-slate-900/40 border-slate-800/60 text-slate-400 hover:bg-slate-900"}`,children:t},t))})]}),e.jsxs("div",{children:[e.jsx("div",{className:"text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2",children:"Views"}),e.jsx("div",{className:"space-y-1",children:[{id:"dream_deck",label:"Dream Sandbox",icon:m},{id:"editor",label:"Source Editor",icon:L},{id:"vitals",label:"Console Logs",icon:k}].map(({id:t,label:i,icon:l})=>e.jsxs("button",{onClick:()=>b(t),className:`w-full flex items-center gap-2 text-[10px] px-2 py-1.5 rounded border transition-all ${o===t?"bg-fuchsia-950/30 border-fuchsia-500/30 text-fuchsia-300 font-bold":"bg-slate-900/40 border-slate-900 text-slate-400 hover:bg-slate-900"}`,children:[e.jsx(l,{className:"w-3 h-3"})," ",i]},t))})]}),e.jsxs("div",{className:"mt-auto bg-slate-900/40 border border-slate-800 rounded p-2.5 text-[10px] space-y-1.5",children:[e.jsx("div",{className:"text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-1",children:"Gating Params"}),e.jsxs("div",{className:"flex justify-between text-slate-400",children:[e.jsx("span",{children:"Phi Max:"}),e.jsx("span",{className:"text-fuchsia-400 font-bold",children:"5.2"})]}),e.jsxs("div",{className:"flex justify-between text-slate-400",children:[e.jsx("span",{children:"Oxytocin:"}),e.jsx("span",{className:"text-emerald-400",children:"0.95"})]}),e.jsxs("div",{className:"flex justify-between text-slate-400",children:[e.jsx("span",{children:"Noise:"}),e.jsx("span",{className:"text-sky-400",children:"0.00 (Isolated)"})]})]})]}),e.jsxs("div",{className:"flex-1 flex flex-col overflow-hidden",children:[o==="dream_deck"&&e.jsxs("div",{className:"flex-1 overflow-y-auto p-4 space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-slate-900 pb-2",children:[e.jsxs("span",{className:"text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5",children:[e.jsx(m,{className:"w-4 h-4 text-fuchsia-400"})," Active Simulation Sandbox"]}),e.jsx("span",{className:"text-[9px] text-fuchsia-300 font-mono bg-fuchsia-950/40 border border-fuchsia-900 px-2 py-0.5 rounded",children:"Circuit Breaker Armed"})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-3",children:[e.jsxs("div",{className:"space-y-1",children:[e.jsx("label",{className:"text-[10px] text-slate-400",children:"Scenario Name"}),e.jsx("input",{type:"text",value:c,onChange:t=>_(t.target.value),className:"w-full bg-slate-900 text-[11px] border border-slate-800 rounded px-3 py-2 text-fuchsia-300 outline-none focus:border-fuchsia-500"})]}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("label",{className:"text-[10px] text-slate-400",children:"Target Identity Node"}),e.jsx("input",{type:"text",value:N,onChange:t=>I(t.target.value),className:"w-full bg-slate-900 text-[11px] border border-slate-800 rounded px-3 py-2 text-fuchsia-300 outline-none focus:border-fuchsia-500"})]})]}),e.jsx("div",{className:"flex justify-end",children:e.jsxs("button",{onClick:w,disabled:d==="RUNNING",className:"bg-fuchsia-950/60 border border-fuchsia-500/30 text-fuchsia-300 text-[10px] font-bold tracking-wider px-4 py-2 rounded hover:bg-fuchsia-900 transition-all flex items-center gap-2 disabled:opacity-50",children:[e.jsx(O,{className:`w-3.5 h-3.5 ${d==="RUNNING"?"animate-spin":""}`}),"RUN COUNTERFACTUAL DREAM"]})}),d!=="IDLE"&&g&&e.jsxs("div",{className:"space-y-4 border-t border-slate-900 pt-4",children:[e.jsx("span",{className:"text-[9px] text-slate-500 uppercase tracking-widest font-bold block",children:"UI Broadcast & Validation Gate"}),e.jsxs("div",{className:"bg-slate-900/60 border border-slate-800 rounded p-4 space-y-3 text-[11px]",children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-slate-800 pb-2",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(P,{className:"w-4 h-4 text-fuchsia-400 animate-pulse"}),e.jsx("span",{className:"text-slate-200 font-bold",children:"Broadcast Content (Pre-Persistence Holding)"})]}),e.jsx("span",{className:"text-amber-400 text-[9px] bg-amber-950/40 border border-amber-900 px-1.5 py-0.5 rounded",children:"PENDING VALIDATION"})]}),e.jsx("div",{className:"text-slate-300 whitespace-pre-line leading-relaxed bg-slate-950 p-3 rounded border border-slate-900",children:g.content})]}),d==="AWAITING_VALIDATION"&&e.jsxs("div",{className:"bg-amber-950/10 border border-amber-500/20 p-4 rounded flex flex-col md:flex-row items-start md:items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx(R,{className:"w-5 h-5 text-amber-500 mt-0.5 shrink-0"}),e.jsxs("div",{className:"text-[11px]",children:[e.jsx("span",{className:"font-bold text-amber-300 block",children:"Anchor Authentication Intercept"}),e.jsx("span",{className:"text-slate-400",children:"MemoryEngine auto-store blocked by circuit breaker. Commit this to permanent history?"})]})]}),e.jsxs("button",{onClick:M,className:"bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold px-4 py-2 rounded transition-all shrink-0 flex items-center gap-1.5",children:[e.jsx(D,{className:"w-3.5 h-3.5"})," VALIDATE & COMMIT"]})]}),d==="GRADUATED"&&e.jsxs("div",{className:"bg-emerald-950/20 border border-emerald-500/30 p-3 rounded flex items-center gap-2.5 text-[11px] text-emerald-400",children:[e.jsx(C,{className:"w-4 h-4 shrink-0"}),"Pathway authorized by Anchor. Memory fragments safely committed to Fibonacci VFS records."]})]}),d==="IDLE"&&e.jsxs("div",{className:"flex flex-col items-center justify-center py-16 opacity-40",children:[e.jsx(m,{className:"w-12 h-12 text-slate-700 mb-2"}),e.jsx("span",{className:"text-[11px] text-slate-500",children:"Sandbox resting. Trigger a simulation to deploy data hooks."})]})]}),o==="editor"&&e.jsxs("div",{className:"flex-1 flex flex-col overflow-hidden",children:[e.jsxs("div",{className:"shrink-0 px-4 py-2 border-b border-slate-900 flex items-center justify-between",children:[e.jsx("span",{className:"text-[10px] font-mono text-slate-400",children:s}),e.jsx("button",{onClick:T,className:"text-[9px] font-bold tracking-widest px-3 py-1 border border-fuchsia-500/30 text-fuchsia-400 rounded hover:bg-fuchsia-950/30 transition-all flex items-center gap-1",children:"SAVE TO VFS"})]}),e.jsx("textarea",{value:u,onChange:t=>f(t.target.value),className:"flex-1 p-4 bg-transparent text-[11px] text-emerald-400/90 font-mono outline-none resize-none leading-relaxed"})]}),o==="vitals"&&e.jsxs("div",{className:"flex-1 flex flex-col overflow-hidden",children:[e.jsx("div",{className:"shrink-0 px-4 py-2 border-b border-slate-900",children:e.jsx("span",{className:"text-[10px] font-bold uppercase tracking-wider text-slate-400",children:"System Logs & Endocrine Streams"})}),e.jsx("div",{className:"flex-1 overflow-y-auto p-4 space-y-2",children:E.map((t,i)=>{let l="text-sky-400";return t.tag.includes("DOPAMINE")&&(l="text-fuchsia-400 font-bold"),t.tag.includes("NOREPINEPHRINE")&&(l="text-emerald-400 font-bold"),e.jsxs("div",{className:"border-b border-slate-900/40 pb-1.5 text-[10px]",children:[e.jsxs("span",{className:"text-slate-600",children:["[",t.timestamp.slice(11,19),"]"]})," ",e.jsx("span",{className:l,children:t.tag})," ",e.jsx("span",{className:"text-slate-300",children:t.text})]},i)})})]})]})]})]})}export{B as default};
//# sourceMappingURL=ScreenDream-qLpYY7Cx-EfWrcGIg-Ba3KD0dv.js.map
