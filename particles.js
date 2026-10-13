(()=>{
const cv=document.getElementById("space");if(!cv)return;
const ctx=cv.getContext("2d"),root=document.documentElement,rm=matchMedia("(prefers-reduced-motion: reduce)").matches;
let W=0,H=0,dpr=1,P=[],mx=0,my=0,cx=0,cy=0,px=-999,py=-999,raf=0,fg="#fff",ac="#b9ff39",rt=0;
const css=n=>getComputedStyle(root).getPropertyValue(n).trim();
function colors(){fg=css("--fg");ac=css("--acc");if(rm)draw()}
function size(){
  const w=innerWidth,h=innerHeight,rebuild=w!==W||!P.length;
  W=w;H=h;dpr=Math.min(devicePixelRatio||1,w<700?1.5:2);
  cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  if(rebuild){
    const n=Math.max(70,Math.min(190,Math.round(W*H/8000)));
    P=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,z:.15+Math.random()*.85,vx:(Math.random()-.5)*.14,vy:(Math.random()-.5)*.14,k:Math.random()<.12}));
  }
  draw();
}
function draw(){
  ctx.clearRect(0,0,W,H);
  cx+=(mx-cx)*.07;cy+=(my-cy)*.07;
  const s=scrollY;
  for(const p of P){
    if(!rm){p.x+=p.vx*p.z*2;p.y+=p.vy*p.z*2}
    if(p.x<-10)p.x=W+10;else if(p.x>W+10)p.x=-10;
    if(p.y<-10)p.y=H+10;else if(p.y>H+10)p.y=-10;
    let x=p.x+cx*p.z*60,y=p.y+cy*p.z*60-s*p.z*.25;
    y=((y%H)+H)%H;
    const dx=x-px,dy=y-py,d=dx*dx+dy*dy;
    if(d<16900){const m=Math.sqrt(d)||1,f=(1-m/130)*34*p.z;x+=dx/m*f;y+=dy/m*f}
    ctx.globalAlpha=.25+p.z*.6;ctx.fillStyle=p.k?ac:fg;
    if(p.k){ctx.fillRect(x-3,y-.5,6,1);ctx.fillRect(x-.5,y-3,1,6)}
    else{ctx.beginPath();ctx.arc(x,y,.6+p.z*1.4,0,6.2832);ctx.fill()}
  }
  ctx.globalAlpha=1;
}
function loop(){raf=0;if(document.hidden)return;draw();raf=requestAnimationFrame(loop)}
const start=()=>{if(!raf&&!rm)raf=requestAnimationFrame(loop)};
new MutationObserver(colors).observe(root,{attributes:true,attributeFilter:["data-theme"]});
addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(size,150)});
colors();size();
if(!rm){
  addEventListener("pointermove",e=>{px=e.clientX;py=e.clientY;mx=px/W-.5;my=py/H-.5},{passive:true});
  document.addEventListener("pointerleave",()=>{px=py=-999;mx=my=0});
  addEventListener("pointerup",e=>{if(e.pointerType!=="mouse"){px=py=-999;mx=my=0}});
  document.addEventListener("visibilitychange",start);
  start();
}
})();
