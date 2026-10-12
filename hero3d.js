(()=>{
const host=document.querySelector(".hero-art"),hero=document.querySelector(".hero");
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const saveData=navigator.connection&&navigator.connection.saveData;
function hasWebGL(){try{const c=document.createElement("canvas");return !!(c.getContext("webgl2")||c.getContext("webgl"))}catch(e){return false}}
if(host&&hero&&!saveData&&hasWebGL())init().catch(()=>{});

async function init(){
  const [THREE,{RoomEnvironment}]=await Promise.all([import("three"),import("three/addons/environments/RoomEnvironment.js")]);
  const root=document.documentElement,dialog=document.getElementById("project-dialog");
  const accent=()=>getComputedStyle(root).getPropertyValue("--accent").trim();

  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0x000000,0);
  renderer.domElement.setAttribute("aria-hidden","true");
  host.appendChild(renderer.domElement);
  host.classList.add("has-3d");
  renderer.domElement.addEventListener("webglcontextlost",e=>{e.preventDefault();host.classList.remove("has-3d")});
  renderer.domElement.addEventListener("webglcontextrestored",()=>{host.classList.add("has-3d");draw()});

  const scene=new THREE.Scene();
  scene.environment=new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),0.04).texture;
  const camera=new THREE.PerspectiveCamera(35,1,.1,50);

  const shapes=[
    new THREE.TorusKnotGeometry(1,.34,220,32,2,3),
    new THREE.IcosahedronGeometry(1.35,1),
    new THREE.TorusGeometry(1.1,.45,48,96),
    new THREE.SphereGeometry(1.3,64,64)
  ];
  const mat=new THREE.MeshPhysicalMaterial({metalness:.3,roughness:.16,clearcoat:1,clearcoatRoughness:.08,flatShading:false});
  const mesh=new THREE.Mesh(shapes[0],mat),group=new THREE.Group();
  group.add(mesh);scene.add(group);

  const N=220,pos=new Float32Array(N*3);
  for(let i=0;i<N;i++){const r=2.4+Math.random()*1.8,a=Math.random()*Math.PI*2;pos.set([Math.cos(a)*r,(Math.random()-.5)*3.2,Math.sin(a)*r],i*3)}
  const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute("position",new THREE.BufferAttribute(pos,3));
  const dustMat=new THREE.PointsMaterial({size:.035,transparent:true,opacity:.7,depthWrite:false});
  const dust=new THREE.Points(dustGeo,dustMat);scene.add(dust);

  const light=new THREE.PointLight(0xffffff,25,14);light.position.set(2,2,4);scene.add(light);

  function theme(){
    const c=new THREE.Color(accent());
    mat.color.copy(c);dustMat.color.copy(c);light.color.copy(c);
    mat.envMapIntensity=root.dataset.theme==="light"?.9:1.15;
    if(!raf)draw();
  }
  new MutationObserver(theme).observe(root,{attributes:true,attributeFilter:["data-theme"]});

  let mx=0,my=0,cx=0,cy=0,pulse=0,shape=0,vis=true,raf=0;
  function draw(){renderer.render(scene,camera)}
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.set(0,0,w/h<.9?8.5:7);camera.updateProjectionMatrix();
    if(!raf)draw();
  }
  new ResizeObserver(resize).observe(host);

  function frame(now){
    raf=0;
    if(!vis||document.hidden||(dialog&&dialog.open))return;
    const t=now/1000,p=Math.min(scrollY/innerHeight,1);
    cx+=(mx-cx)*.06;cy+=(my-cy)*.06;pulse*=.92;
    mesh.rotation.set(t*.15+cy*.6,t*.22+cx*.9,0);
    group.position.y=p*1.1;group.rotation.z=p*.5;
    group.scale.setScalar((1-p*.25)*(1+pulse*.25));
    dust.rotation.y=t*.05+cx*.3;
    light.position.set(cx*4,-cy*3+1,4);
    draw();
    raf=requestAnimationFrame(frame);
  }
  const start=()=>{if(!raf&&!reduce)raf=requestAnimationFrame(frame)};

  host.addEventListener("click",()=>{
    shape=(shape+1)%shapes.length;mesh.geometry=shapes[shape];pulse=1;
    if(reduce)draw();
  });

  theme();resize();
  if(reduce){mesh.rotation.set(.4,.6,0);draw();return}

  hero.addEventListener("pointermove",e=>{
    const r=host.getBoundingClientRect();
    mx=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/r.width*2));
    my=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/r.height*2));
  },{passive:true});
  hero.addEventListener("pointerleave",()=>{mx=my=0});
  new IntersectionObserver(([e])=>{vis=e.isIntersecting;if(vis)start()}).observe(host);
  document.addEventListener("visibilitychange",start);
  if(dialog)dialog.addEventListener("close",start);
  start();
}
})();
