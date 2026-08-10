/**
 * Mateo Aristizabal — portfolio ORIGIN server (dependency-free Node.js).
 *
 * This is a REAL origin you host yourself (VPS / Render / Fly / etc.) and put
 * behind Cloudflare (proxied). Because responses now come from an origin,
 * zone Cache Rules + Cache Analytics apply — that's what you tune for module C.
 *
 * Routes:
 *   /                     HTML portfolio          (origin sends no cache header
 *                                                  -> DYNAMIC until a Cache Rule
 *                                                  marks HTML eligible/edge-TTL)
 *   /about /projects      HTML pages
 *   /static/style.css     CSS   (default-cacheable extension; tune TTL via rule)
 *   /static/app.js        JS
 *   /static/logo.svg      image
 *   /api/time             dynamic JSON  -> Cache-Control: no-store (BYPASS)
 *   /login  GET+POST      form; POST sets a cookie -> BYPASS
 *   /resume.json          machine data
 *   /health               plain ok
 *
 * Run: node server.js   (listens on PORT, default 8080)
 */

const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 8080;

const RESUME = {
  name: "Mateo Aristizabal",
  role: "Software Engineer · Full-Stack Developer",
  location: "Gainesville, FL",
  phone: "954-647-2622",
  email: "maristizabal2003@gmail.com",
  linkedin: "https://linkedin.com/in/mateoaristizabal486",
  github: "https://github.com/Mateo486",
  summary:
    "Data Science student and full-stack engineer who ships production systems used by thousands — from crash-diagramming tools for FDOT to AI-driven backends on AWS and edge apps on Cloudflare.",
  education: {
    school: "University of Florida", location: "Gainesville, FL",
    degree: "B.S. in Data Science", gpa: "3.7 / 4.0", graduation: "Expected Spring 2026",
    coursework: ["Data Structures & Algorithms","Database Systems","R Programming","Discrete Structures","Regression","Probability","Statistics Theory","Linear Algebra","Deep Learning","GIS"],
  },
  skills: {
    Languages: ["Python","C++","TypeScript","Kotlin","JavaScript","C#","SQL","MATLAB"],
    "Frameworks / Tools": ["React.js","React Native","Node.js","Angular","ASP.NET","Swagger UI","Docker","Alembic","Pydantic"],
    "Cloud / Version Control": ["AWS (EC2, RDS, Fargate)","Git","GitHub"],
    "ML / Data": ["PyTorch","TensorFlow","SciKit-Learn","MongoDB","Pandas","NumPy","Matplotlib","ggplot2","Jupyter"],
  },
  experience: [
    { title:"Software Engineer", company:"Signal4 — UF GeoPlan Center", location:"Gainesville, FL", period:"Oct 2025 — Present",
      bullets:["Delivered full-stack features for an interactive crash diagramming tool using Paper.js and Mapbox, used by 6,000+ FDOT engineers and 1,200 law enforcement agencies.","Optimized backend logic with SQL and ASP.NET for efficient retrieval from an Oracle Database with 7+ million records.","Iterated on design through user feedback and mockups to align deliverables with project objectives."] },
    { title:"Full Stack Developer", company:"SBA Communications", location:"Boca Raton, FL", period:"Sep 2024 — Oct 2025",
      bullets:["Re-architected SBA's Kotlin mobile app into React Native, cutting time-to-production for new features by 30%.","Deployed backend to AWS Fargate, eliminating EC2 overhead and cutting $50,000 in costs via pay-per-use pricing and auto-scaling.","Migrated backend from Flask to FastAPI with route-level pagination, reducing endpoint response times by 80%.","Automated end-to-end lease termination with a supervisor agent network in Databricks, cutting processing from 10 min to 20 sec."] },
    { title:"Data Science Director", company:"Society of Hispanic Professional Engineers", location:"Gainesville, FL", period:"Jan 2024 — Aug 2024",
      bullets:["Ran AI application workshops with hands-on files guiding students through model development.","Trained and fine-tuned AI models using R to maximize accuracy and performance."] },
  ],
  projects: [
    { name:"Holler — Hurricane Relief Tool", tag:"IBM Hackathon", stack:["React.js","Node.js","MongoDB","Llama 3"], period:"Oct 2024",
      bullets:["Full-stack app for real-time hurricane impact reporting and visualization for citizens and agencies.","Deployed Llama 3 on GPU-accelerated Ubuntu EC2, persistent state, sub-2s inference at 99.5% uptime.","MongoDB for real-time synchronized community reports."] },
    { name:"Heart Disease Detection Model", tag:"ML Project", stack:["R","caret","rpart","ggplot2"], period:"Mar — May 2024",
      bullets:["Decision-tree classifier using entropy for optimal node splits.","86% accuracy; evaluated with confusion matrix, precision, recall, F1."] },
  ],
};

/* -------------------------------- CSS ---------------------------------- */
const CSS = `
:root{--bg:#0a0e14;--bg2:#0d1420;--panel:#0f1826;--line:#1c2b3a;--green:#00ff9c;--cyan:#22d3ee;--blue:#3b82f6;--dim:#5c7089;--fg:#c9d7e6;--amber:#ffb454;--glow:0 0 12px rgba(0,255,156,.35)}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--fg);font-family:'JetBrains Mono',ui-monospace,monospace;font-size:15px;line-height:1.6;overflow-x:hidden}
body::before{content:"";position:fixed;inset:0;z-index:-2;background:radial-gradient(circle at 20% 10%,rgba(34,211,238,.08),transparent 40%),radial-gradient(circle at 80% 90%,rgba(0,255,156,.07),transparent 40%),linear-gradient(var(--bg2),var(--bg))}
body::after{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background-image:linear-gradient(rgba(28,43,58,.35) 1px,transparent 1px),linear-gradient(90deg,rgba(28,43,58,.35) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(circle at 50% 40%,#000,transparent 80%)}
#matrix{position:fixed;inset:0;z-index:-3;opacity:.14}
#boot{position:fixed;inset:0;background:var(--bg);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;transition:opacity .5s}
#boot.done{opacity:0;pointer-events:none}
#boot pre{color:var(--green);font-size:13px;text-shadow:var(--glow);white-space:pre-wrap;max-width:720px;width:100%}
.cursor{display:inline-block;width:9px;height:16px;background:var(--green);animation:blink 1s steps(1) infinite;vertical-align:middle}
@keyframes blink{50%{opacity:0}}
.wrap{max-width:960px;margin:0 auto;padding:0 20px 80px}
header{position:sticky;top:0;z-index:20;background:rgba(10,14,20,.82);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.bar{max-width:960px;margin:0 auto;display:flex;align-items:center;gap:14px;padding:12px 20px}
.dots{display:flex;gap:7px}.dots i{width:12px;height:12px;border-radius:50%;display:block}
.dots i:nth-child(1){background:#ff5f57}.dots i:nth-child(2){background:#febc2e}.dots i:nth-child(3){background:#28c840}
.path{color:var(--dim);font-size:13px}.path b{color:var(--green)}
nav{margin-left:auto;display:flex;gap:4px;flex-wrap:wrap}
nav a{color:var(--dim);text-decoration:none;font-size:13px;padding:5px 10px;border-radius:6px;transition:.2s}
nav a:hover,nav a.active{color:var(--green);background:rgba(0,255,156,.08)}
.hero{padding:70px 0 40px;text-align:center}.hero .kw{color:var(--cyan)}
.name{font-family:'Orbitron',sans-serif;font-weight:900;font-size:clamp(34px,7vw,68px);letter-spacing:2px;background:linear-gradient(90deg,var(--green),var(--cyan),var(--blue));-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 0 40px rgba(34,211,238,.25);line-height:1.05;margin:6px 0}
.role{color:var(--amber);font-size:clamp(14px,2.5vw,18px);letter-spacing:1px;margin-bottom:18px}
.type{min-height:26px;font-size:14px}.type .t{color:var(--green)}
.links{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:24px}
.links a{color:var(--fg);text-decoration:none;border:1px solid var(--line);padding:9px 16px;border-radius:8px;font-size:13px;transition:.2s;background:var(--panel)}
.links a:hover{border-color:var(--green);color:var(--green);box-shadow:var(--glow);transform:translateY(-2px)}
section{margin-top:56px}
.h{display:flex;align-items:center;gap:12px;margin-bottom:22px}.h .n{color:var(--dim);font-size:13px}
.h h2{font-family:'Orbitron',sans-serif;font-size:20px;letter-spacing:1px}.h h2 .c{color:var(--green)}
.h .rule{flex:1;height:1px;background:linear-gradient(90deg,var(--line),transparent)}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px 22px;transition:.25s;position:relative;overflow:hidden}
.card:hover{border-color:rgba(0,255,156,.4);box-shadow:0 8px 30px rgba(0,0,0,.35)}
.card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(var(--green),var(--cyan));opacity:0;transition:.25s}
.card:hover::before{opacity:1}
.grid{display:grid;gap:16px}
.exp-top{display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px}.exp-top h3{font-size:16px}.exp-top .per{color:var(--amber);font-size:13px}
.co{color:var(--cyan);font-size:13px;margin-bottom:12px}
ul{list-style:none}li.b{position:relative;padding-left:22px;margin:8px 0;font-size:14px}li.b::before{content:"▹";position:absolute;left:0;color:var(--green)}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.tag{font-size:12px;color:var(--cyan);border:1px solid var(--line);background:var(--bg2);padding:4px 10px;border-radius:20px}
.skillgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}.skill h4{color:var(--green);font-size:13px;margin-bottom:12px}.skill h4::before{content:"$ ";color:var(--dim)}
.badge{display:inline-block;color:var(--green);font-size:12px;border:1px solid rgba(0,255,156,.3);padding:2px 8px;border-radius:6px}
label{display:block;margin:12px 0 6px;color:var(--dim);font-size:13px}
input{width:100%;padding:10px 12px;background:var(--bg2);border:1px solid var(--line);border-radius:8px;color:var(--fg);font-family:inherit}
button{margin-top:16px;padding:10px 18px;background:linear-gradient(90deg,var(--green),var(--cyan));border:0;border-radius:8px;color:#04121a;font-weight:700;font-family:inherit;cursor:pointer}
.meta{margin-top:26px;padding:14px 16px;background:var(--bg2);border:1px dashed var(--line);border-radius:8px;color:var(--dim);font-size:12px}.meta b{color:var(--amber)}
code{color:var(--green)}
footer{margin-top:70px;text-align:center;color:var(--dim);font-size:12px;border-top:1px solid var(--line);padding-top:24px}
`;

/* -------------------------------- JS ----------------------------------- */
const JS = `
const D = window.DATA;
// boot sequence
const bootLines=["> initializing portfolio.sys ...","> loading modules [skills, experience, projects] ... ok","> connecting origin -> cloudflare edge ... ok","> whoami","  "+D.name.toLowerCase().replace(' ','_'),"> launching UI \u258f"];
const bootEl=document.getElementById('boot-text');let bl=0,bc=0;
function boot(){if(bl>=bootLines.length){setTimeout(()=>document.getElementById('boot').classList.add('done'),350);return;}const line=bootLines[bl];bootEl.textContent+=line[bc]||'';bc++;if(bc>line.length){bootEl.textContent+="\\n";bl++;bc=0;setTimeout(boot,90);}else setTimeout(boot,8+Math.random()*22);}boot();
// typewriter
const phrases=["full-stack systems that scale","AI + data pipelines","edge-native apps on Cloudflare","turning coffee into commits \u2615"];
const typed=document.getElementById('typed');let pi=0,ci=0,del=false;
function type(){const p=phrases[pi];typed.textContent=p.slice(0,ci);if(!del){ci++;if(ci>p.length){del=true;setTimeout(type,1400);return;}}else{ci--;if(ci<0){del=false;pi=(pi+1)%phrases.length;}}setTimeout(type,del?35:65);}setTimeout(type,2600);
// render
document.getElementById('skills-grid').innerHTML=Object.entries(D.skills).map(([k,v])=>'<div class="card skill"><h4>'+k+'</h4><div class="tags">'+v.map(s=>'<span class="tag">'+s+'</span>').join('')+'</div></div>').join('');
document.getElementById('exp-grid').innerHTML=D.experience.map(e=>'<div class="card"><div class="exp-top"><h3>'+e.title+'</h3><span class="per">'+e.period+'</span></div><div class="co">'+e.company+' · '+e.location+'</div><ul>'+e.bullets.map(b=>'<li class="b">'+b+'</li>').join('')+'</ul></div>').join('');
document.getElementById('proj-grid').innerHTML=D.projects.map(p=>'<div class="card"><div class="exp-top"><h3>'+p.name+' <span class="badge">'+p.tag+'</span></h3><span class="per">'+p.period+'</span></div><ul>'+p.bullets.map(b=>'<li class="b">'+b+'</li>').join('')+'</ul><div class="tags">'+p.stack.map(s=>'<span class="tag">'+s+'</span>').join('')+'</div></div>').join('');
const ed=D.education;document.getElementById('edu-card').innerHTML='<div class="exp-top"><h3>'+ed.school+' <span class="badge">'+ed.gpa+' GPA</span></h3><span class="per">'+ed.graduation+'</span></div><div class="co">'+ed.degree+' · '+ed.location+'</div><div class="tags">'+ed.coursework.map(c=>'<span class="tag">'+c+'</span>').join('')+'</div>';
// reveal
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.style.opacity=1;}),{threshold:.12});
document.querySelectorAll('section').forEach(s=>{s.style.opacity=0;s.style.transition='.6s';io.observe(s);});
// matrix
const cv=document.getElementById('matrix'),cx=cv.getContext('2d');let cols,drops;const chars="01<>{}[]()=+*/;:$#@&|";
function sz(){cv.width=innerWidth;cv.height=innerHeight;cols=Math.floor(cv.width/16);drops=Array(cols).fill(1);}sz();addEventListener('resize',sz);
setInterval(()=>{cx.fillStyle="rgba(10,14,20,.08)";cx.fillRect(0,0,cv.width,cv.height);cx.fillStyle="#00ff9c";cx.font="14px monospace";for(let i=0;i<drops.length;i++){const ch=chars[Math.floor(Math.random()*chars.length)];cx.fillText(ch,i*16,drops[i]*16);if(drops[i]*16>cv.height&&Math.random()>.975)drops[i]=0;drops[i]++;}},60);
// live edge data (uncacheable)
fetch('/api/time',{cache:'no-store'}).then(r=>r.json()).then(d=>{const el=document.getElementById('edge-time');if(el)el.textContent=d.now;});
`;

/* ------------------------------ HTML page ------------------------------ */
function page() {
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${RESUME.name} // Portfolio</title>
<meta name="description" content="${RESUME.summary}"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Orbitron:wght@500;700;900&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="/static/style.css"/>
</head><body>
<canvas id="matrix"></canvas>
<div id="boot"><pre id="boot-text"></pre></div>
<header><div class="bar"><div class="dots"><i></i><i></i><i></i></div>
<span class="path">~/portfolio/<b>mateo</b> $</span>
<nav><a href="#about">about</a><a href="#skills">skills</a><a href="#experience">experience</a><a href="#projects">projects</a><a href="/login">login</a></nav>
</div></header>
<div class="wrap">
<div class="hero"><div class="kw">const engineer = {</div>
<h1 class="name">${RESUME.name}</h1><div class="role">${RESUME.role}</div>
<div class="type"><span class="t" id="typed"></span><span class="cursor"></span></div>
<div class="kw">}</div>
<div class="links"><a href="mailto:${RESUME.email}">✉ email</a><a href="${RESUME.github}" target="_blank" rel="noopener">⌨ github</a><a href="${RESUME.linkedin}" target="_blank" rel="noopener">⚡ linkedin</a><a href="/resume.json">{} resume.json</a></div>
</div>
<section id="about"><div class="h"><span class="n">01</span><h2><span class="c">#</span> about</h2><span class="rule"></span></div>
<div class="card"><p>${RESUME.summary}</p><div class="tags"><span class="tag">📍 ${RESUME.location}</span><span class="tag">served from a real origin behind Cloudflare</span></div>
<p style="margin-top:12px">edge time (uncacheable /api/time): <code id="edge-time">loading…</code></p></div></section>
<section id="skills"><div class="h"><span class="n">02</span><h2><span class="c">#</span> skills</h2><span class="rule"></span></div><div class="skillgrid" id="skills-grid"></div></section>
<section id="experience"><div class="h"><span class="n">03</span><h2><span class="c">#</span> experience</h2><span class="rule"></span></div><div class="grid" id="exp-grid"></div></section>
<section id="projects"><div class="h"><span class="n">04</span><h2><span class="c">#</span> projects</h2><span class="rule"></span></div><div class="grid" id="proj-grid"></div></section>
<section id="education"><div class="h"><span class="n">05</span><h2><span class="c">#</span> education</h2><span class="rule"></span></div><div class="card" id="edu-card"></div></section>
<footer>real origin ⚙ · fronted by Cloudflare ⚡ · tune caching with Cache Rules · &copy; ${new Date().getFullYear()} ${RESUME.name}</footer>
</div>
<script>window.DATA=${JSON.stringify(RESUME)};</script>
<script src="/static/app.js"></script>
</body></html>`;
}

function loginPage(msg) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>login // ${RESUME.name}</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Orbitron:wght@700;900&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="/static/style.css"/></head><body>
<header><div class="bar"><div class="dots"><i></i><i></i><i></i></div><span class="path">~/portfolio/<b>login</b> $</span>
<nav><a href="/">home</a></nav></div></header>
<div class="wrap"><section style="margin-top:40px"><div class="h"><span class="n">$</span><h2><span class="c">#</span> login</h2><span class="rule"></span></div>
<div class="card"><p>Dynamic / uncacheable path. Submitting sets a session cookie, forcing <code>CF-Cache-Status: BYPASS</code>.</p>
${msg ? `<p style="color:var(--green);margin-top:10px">${msg}</p>` : ""}
<form method="POST" action="/login"><label>username</label><input name="user" value="mateo"/><label>password</label><input name="pass" type="password" value="hunter2"/><button type="submit">authenticate</button></form></div>
<div class="meta"># cache intent: <b>dynamic · Set-Cookie => never cached</b></div></section></div></body></html>`;
}

/* -------------------------------- server -------------------------------- */
const send = (res, status, body, headers) =>
  res.writeHead(status, headers).end(body);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;

  // static assets: origin sends a modest TTL; tune the real TTL with Cache Rules
  if (p === "/static/style.css")
    return send(res, 200, CSS, { "Content-Type": "text/css; charset=utf-8", "Cache-Control": "public, max-age=300" });
  if (p === "/static/app.js")
    return send(res, 200, JS, { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=300" });
  if (p === "/static/logo.svg")
    return send(res, 200,
      `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="16" fill="#0f1826"/><text x="60" y="74" font-family="monospace" font-size="54" fill="#00ff9c" text-anchor="middle">MA</text></svg>`,
      { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=300" });

  // dynamic / uncacheable
  if (p === "/api/time")
    return send(res, 200, JSON.stringify({ now: new Date().toISOString(), rand: Math.random(), served_by: "origin" }, null, 2),
      { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  if (p === "/health")
    return send(res, 200, "ok", { "Content-Type": "text/plain", "Cache-Control": "no-store" });

  // cookie-setting form
  if (p === "/login") {
    if (req.method === "POST")
      return send(res, 200, loginPage("✓ authenticated — session cookie set (this response is BYPASS)."), {
        "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store",
        "Set-Cookie": `session=${crypto.randomUUID()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`,
      });
    return send(res, 200, loginPage(""), { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  }

  // machine data
  if (p === "/resume.json")
    return send(res, 200, JSON.stringify(RESUME, null, 2), { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=600" });

  // HTML: NO Cache-Control on purpose -> Cloudflare treats HTML as DYNAMIC
  // until YOUR Cache Rule marks it eligible + sets an Edge TTL. Great before/after demo.
  if (p === "/" || p === "/about" || p === "/projects" || p === "/education")
    return send(res, 200, page(), { "Content-Type": "text/html; charset=utf-8" });

  return send(res, 404, "<h1>404</h1><p>no route here — <a href=\"/\">home</a></p>", { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
});

server.listen(PORT, () => console.log(`portfolio origin listening on :${PORT}`));
