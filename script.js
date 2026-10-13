const PROJECTS=[
{title:"Realistic Ice Render",category:"Product Visualization",year:"2026",images:["images/realistic-ice-image-1.jpg","images/realistic-ice-image-2.jpg"],description:"A realistic ice-focused 3D study built around materials, lighting, transparency, and detailed surface realism.",details:"A material and lighting study focused on believable ice, refraction, highlights, and controlled studio presentation.",tools:["Blender","Cycles","Materials","Lighting"]},
{title:"Soap Animation",category:"Product Visualization",year:"2026",images:["images/soap-image-1.jpg","images/soap-image-2.jpg","images/soap-image-3.jpg","images/soap-image-4.jpg"],video:"videos/soap-animation.mp4",description:"Glossy surfaces and rich material realism.",details:"A product animation focused on aloe vera soap, material response, lighting, camera movement, and compositing.",tools:["Blender","Cycles","Compositing"]},
{title:"Yerba Mate Animation",category:"Product Visualization",year:"2026",images:["images/yerba-mate-image-1.jpg","images/yerba-mate-image-2.jpg"],video:"videos/yerba-mate-animation.mp4",description:"Refreshing beverage hero shot with condensation and motion.",details:"Product-focused beverage visualization with emphasis on materials, condensation, lighting, and motion.",tools:["Blender","Cycles","Product Visualization"]},
{title:"Asus Product Animation",category:"Product Visualization",year:"2026",images:["images/asus-image.jpg"],video:"videos/asus-animation.mp4",description:"A clean product-focused 3D presentation.",details:"Product modeling, materials, lighting, camera work, and animation.",tools:["Blender","Product Visualization","Motion"]},
{title:"Realistic Water Glass Render",category:"Product Visualization",year:"2026",images:["images/real-water-glass-image-1.jpg","images/real-water-glass-image-2.jpg"],description:"A realistic study of transparent glass and water.",details:"Focused on believable transparency, refraction, liquid shading, lighting, and studio composition.",tools:["Blender","Cycles","Materials","Lighting"]},
{title:"Smartwatch Animation",category:"Product Visualization",year:"2026",images:["images/smart-watch-image.jpg"],video:"videos/watch-animation.mp4",description:"Macro product showcase with crisp studio lighting.",details:"A close-up product animation emphasizing clean forms, controlled lighting, materials, and camera movement.",tools:["Blender","Product Visualization","Motion"]},
{title:"Nike Shoe Modeling",category:"3D Modeling",year:"2026",images:["images/nike-shoe-image-1.jpg","images/nike-shoe-image-2.jpg","images/nike-shoe-image-3.jpg","images/nike-shoe-image-4.jpg","images/nike-shoe-image-5.jpg","images/nike-shoe-image-6.jpg"],description:"Detailed footwear modeling and presentation.",details:"A modeling study focused on shape, construction, materials, and product presentation.",tools:["Blender","Hard Surface","Product Modeling"]},
{title:"Interior Room Design",category:"Interior design & architecture",year:"2026",images:["images/interior-image-1.jpg","images/interior-image-2.jpg"],description:"Concrete & Comfort — an interior scene focused on atmosphere and composition.",details:"Interior environment work with attention to materials, lighting, composition, and realistic scene presentation.",tools:["Blender","Cycles","Environment Design","Lighting"]},
{title:"Booth Design",category:"Interior design & architecture",year:"2026",images:["images/booth-01-image-01.jpg","images/booth-01-image-02.jpg","images/booth-01-image-03.jpg","images/booth-01-image-04.jpg","images/booth-01-image-05.jpg","images/booth-01-image-06.jpg","images/booth-01-image-07.jpg","images/booth-01-image-08.jpg","images/booth-01-image-09.jpg"],description:"A modern exhibition booth design with a warm wooden touch and a luxury feel.",details:"A booth design modeled and rendered in Blender using Cycles, focused on modern architectural form, warm wood materials, lighting, and premium presentation.",tools:["Blender","Cycles","Interior Design","Lighting"]},
{title:"2026 Modes & Looks",category:"3D Art",year:"2026",images:["images/2026-looks.jpg","images/2026-look-1.jpg","images/2026-look-2.jpg","images/2026-look-3.jpg","images/2026-look-4.jpg","images/2026-look-5.jpg","images/2026-look-6.jpg"],description:"A visual exploration of different 3D moods, forms, and looks.",details:"An experimental collection exploring visual direction, lighting, materials, composition, and style.",tools:["Blender","Lighting","Materials","Look Development"]},
{title:"Folder Inflation",category:"Simulation",year:"2026",images:["images/folder-image-1.jpg","images/folder-image-2.jpg"],video:"videos/folder-animation-1.mp4",description:"A Windows folder icon transformed through soft-body and smoke effects.",details:"A procedural-style experiment combining soft body deformation, procedural shading, and volumetric smoke.",tools:["Blender","Soft Body","Smoke","Procedural Shading"]},
{title:"Vellum Simulation",category:"Simulation",year:"2026",images:["images/vellum-image.jpg"],video:"videos/vellum-animation-1.mp4",description:"A procedural growth-style simulation study.",details:"A Houdini-inspired simulation experiment recreated with Blender techniques and procedural control.",tools:["Blender","Geometry Nodes","Simulation","Procedural"]},
{title:"Date Cookies Animation",category:"Product Visualization",year:"2026",images:["images/dates-cookie-image.jpg"],video:"videos/dates-cookie-animation-1.mp4",description:"Food-focused product animation with controlled lighting and presentation.",details:"A product visualization study focused on food form, materials, lighting, and camera movement.",tools:["Blender","Cycles","Product Animation"]},
{title:"Blue Mall Logo Animation",category:"Motion Design",year:"2026",images:["images/blue-mall-image.jpg"],video:"videos/blue-mall-animation.mp4",description:"A premium 3D logo animation built around glass, light, and motion.",details:"Exploration of glass shaders, material alpha animation, camera movement, keyframes, and textured lighting.",tools:["Blender","Logo Animation","Glass Shaders","Lighting"]},
{title:"Youth Affairs Logo Animation",category:"Motion Design",year:"2026",images:["images/youth-affairs-image-1.jpg","images/youth-affairs-image-2.jpg","images/youth-affairs-image-3.jpg"],video:"videos/youth-affairs-animation.mp4",description:"3D logo animation with final renders and making-of material.",details:"A logo motion project developed through modeling, materials, lighting, animation, and final rendering.",tools:["Blender","Logo Animation","Motion Design"]}
];

const CATS=[...new Set(PROJECTS.map(p=>p.category))];
const $=s=>document.querySelector(s),root=document.documentElement;
const grid=$("#project-grid"),filters=$("#filters"),dialog=$("#project-dialog"),dc=$("#dialog-content"),themeBtn=$("#theme-toggle"),bar=$("#scroll-progress"),header=$(".site-header"),menuBtn=$("#menu-btn"),nav=$("#primary-nav"),hx=$("#hx"),hy=$("#hy"),hz=$("#hz");
const rm=matchMedia("(prefers-reduced-motion: reduce)").matches;
const n2=n=>String(n+1).padStart(2,"0"),n4=n=>String(Math.round(n)).padStart(4,"0");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("is-visible");io.unobserve(e.target)}}),{threshold:.12,rootMargin:"0px 0px -40px 0px"});
const reveal=l=>l.forEach(el=>rm?el.classList.add("is-visible"):io.observe(el));
reveal(document.querySelectorAll(".section-heading,.about-grid>*,.skills-list>div,.contact-section>*"));
document.querySelectorAll(".section-heading,.about-grid>*,.skills-list>div,.contact-section>*").forEach(el=>el.classList.add("reveal"));

function renderFilters(){
  filters.setAttribute("role","group");filters.setAttribute("aria-label","Filter projects");
  filters.innerHTML=["All",...CATS].map((c,i)=>{const n=i?PROJECTS.filter(p=>p.category===c).length:PROJECTS.length;return `<button class="filter-btn${i?"":" active"}" aria-pressed="${!i}" data-filter="${esc(c)}">${esc(c)} <sup>${n}</sup></button>`}).join("");
  filters.onclick=e=>{const b=e.target.closest("button");if(!b)return;filters.querySelectorAll("button").forEach(x=>{const on=x===b;x.classList.toggle("active",on);x.setAttribute("aria-pressed",on)});renderProjects(b.dataset.filter)};
}
function buildGrid(f){
  const list=f==="All"?PROJECTS:PROJECTS.filter(p=>p.category===f);
  grid.classList.toggle("is-bento",f==="All");
  grid.innerHTML=list.map((p,i)=>{const k=PROJECTS.indexOf(p);return `<article class="project-card reveal" style="transition-delay:${rm?0:(i%3)*70}ms" data-project="${k}" tabindex="0" role="button" aria-label="${esc(p.title)}, ${esc(p.category)}"><div class="project-media"><img src="${p.images[0]}" alt="" width="800" height="600" decoding="async" loading="${i<3?"eager":"lazy"}">${p.video?'<span class="project-video-mark">Video</span>':""}</div><div class="project-info"><div><span class="project-tag">${n2(k)} / ${esc(p.category)}</span><h3>${esc(p.title)}</h3></div><span class="project-year">${p.year}</span></div></article>`}).join("");
  reveal(grid.querySelectorAll(".project-card"));
}
function renderProjects(f){
  if(rm){buildGrid(f);return}
  grid.classList.add("is-switching");
  setTimeout(()=>{buildGrid(f);grid.classList.remove("is-switching")},170);
}
grid.onclick=e=>{const c=e.target.closest(".project-card");if(c)openProject(+c.dataset.project)};
grid.onkeydown=e=>{const c=e.target.closest(".project-card");if(c&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openProject(+c.dataset.project)}};

function openProject(i){
  const p=PROJECTS[i];if(!p)return;
  const video=p.video?`<video class="dialog-video" controls playsinline preload="none" poster="${p.images[0]}"><source src="${p.video}" type="video/mp4"></video>`:"";
  const gallery=p.images.map((x,n)=>`<img src="${x}" alt="${esc(p.title)}, image ${n+1} of ${p.images.length}" width="1200" height="900" loading="lazy" decoding="async">`).join("");
  dc.innerHTML=`<div class="dialog-inner"><div class="dialog-kicker">${n2(i)} / ${esc(p.category)} / ${p.year}</div><h2 class="dialog-title">${esc(p.title)}</h2><p class="dialog-description">${esc(p.description)}</p>${video}<div class="dialog-gallery">${gallery}</div><div class="dialog-details"><div><div class="dialog-kicker">About the project</div><p class="dialog-description">${esc(p.details)}</p></div><div><div class="dialog-kicker">Tools / focus</div><div class="dialog-tools">${p.tools.map(esc).join("<br>")}</div></div></div></div>`;
  dialog.setAttribute("aria-label",p.title);dialog.showModal();
}
$("#dialog-close").onclick=()=>dialog.close();
dialog.onclick=e=>{if(e.target===dialog)dialog.close()};
dialog.addEventListener("close",()=>{dc.innerHTML=""});

let tk=0;
function tick(){tk=0;const y=scrollY,h=root.scrollHeight-innerHeight;bar.style.transform=`scaleX(${h>0?y/h:0})`;header.classList.toggle("is-scrolled",y>40);hz.textContent=n4(y)}
addEventListener("scroll",()=>{if(!tk)tk=requestAnimationFrame(tick)},{passive:true});
let hq=0,px=0,py=0;
if(matchMedia("(hover:hover)").matches)addEventListener("pointermove",e=>{px=e.clientX;py=e.clientY;if(!hq)hq=requestAnimationFrame(()=>{hq=0;hx.textContent=n4(px);hy.textContent=n4(py)})},{passive:true});

const setMenu=o=>{nav.classList.toggle("open",o);menuBtn.setAttribute("aria-expanded",o);menuBtn.textContent=o?"Close":"Menu"};
menuBtn.onclick=()=>setMenu(!nav.classList.contains("open"));
nav.onclick=e=>{if(e.target.closest("a"))setMenu(false)};
addEventListener("keydown",e=>{if(e.key==="Escape")setMenu(false)});
matchMedia("(min-width:901px)").addEventListener("change",e=>{if(e.matches)setMenu(false)});

function applyTheme(t){
  root.dataset.theme=t;const l=t==="light";
  themeBtn.querySelector(".theme-label").textContent=l?"Dark":"Light";
  themeBtn.setAttribute("aria-label",l?"Switch to dark mode":"Switch to light mode");
  try{localStorage.setItem("ahmad-theme",t)}catch(e){}
  $('meta[name="theme-color"]').content=l?"#f3f2ee":"#08090a";
}
let st=null;try{st=localStorage.getItem("ahmad-theme")}catch(e){}
applyTheme(st==="light"?"light":"dark");
themeBtn.onclick=()=>applyTheme(root.dataset.theme==="dark"?"light":"dark");

const edge=$("#edge-cta");let pastHero=false,atContact=false;
const edgeUpdate=()=>edge.classList.toggle("is-on",pastHero&&!atContact);
new IntersectionObserver(([e])=>{pastHero=!e.isIntersecting;edgeUpdate()}).observe($(".hero"));
new IntersectionObserver(([e])=>{atContact=e.isIntersecting;edgeUpdate()},{rootMargin:"0px 0px -30% 0px"}).observe($("#contact"));

renderFilters();buildGrid("All");tick();
requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.add("is-in")));
