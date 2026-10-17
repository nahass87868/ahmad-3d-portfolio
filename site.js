
(() => {
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const root=document.documentElement, body=document.body, rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
// Storage may be disabled in private browsing or strict privacy modes; animations must still work.
const storageGet=(key)=>{try{return sessionStorage.getItem(key)}catch(e){return null}};
const storageSet=(key,value)=>{try{sessionStorage.setItem(key,value)}catch(e){}};
const storageRemove=(key)=>{try{sessionStorage.removeItem(key)}catch(e){}};
const page=body.dataset.page;
const progress=$('.progress'), cover=$('.transition-cover'), coverWord=$('.transition-word'), cursor=$('.cursor');
const slugs=['realistic-ice','soap-animation','yerba-mate-animation','asus-product-animation','realistic-water-glass','smartwatch-animation','nike-shoe-modeling','interior-room-design','booth-design','2026-modes-looks','folder-inflation','vellum-simulation','date-cookies-animation','blue-mall-logo-animation','youth-affairs-logo-animation'];
const visuals=['visual-ice','visual-soap','visual-yerba','visual-asus','visual-glass','visual-watch','visual-shoe','visual-interior','visual-booth','visual-looks','visual-folder','visual-vellum','visual-cookies','visual-blue','visual-youth'];
const titleFromSlug=s=>({index:'Home',home:'Home',work:'Work',about:'About',services:'Services',contact:'Contact',privacy:'Privacy'})[s.replace(/\.html?$/i,'').replace(/^project-/,'')]||s.replace(/^project-/,'').replace(/\.html?$/i,'').split('-').map(w=>w==='3d'?'3D':w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const projects=window.PROJECTS||[];
const projectSlug=i=>`project-${slugs[i]||'realistic-ice'}.html`;
const titleNode=$('.reactive-title');
$$('.main-nav a').forEach(a=>{if(a.dataset.link===page)a.classList.add('active')});
const menu=$('.menu-toggle'), mobile=$('.mobile-nav');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));mobile.classList.toggle('open',open);menu.querySelector('span').textContent=open?'−':'+'});
$$('.mobile-nav a').forEach(a=>a.addEventListener('click',()=>{menu?.setAttribute('aria-expanded','false');mobile?.classList.remove('open');if(menu)menu.querySelector('span').textContent='+'}));

// Navigation transitions use one deterministic cover state and a per-navigation token.
const introKey='ahmad-intro-seen-v3';
let navigating=false;
const transitionTo=(url,title)=>{
  if(!cover||rm){location.href=url;return}
  if(navigating)return;
  navigating=true;
  storageSet('ahmad-transition-title',title);storageSet('ahmad-transition-from',location.pathname);
  cover.classList.remove('is-revealing','intro-cover','is-entering','is-leaving','is-booting');
  cover.style.pointerEvents='auto';
  coverWord.innerHTML=[...title].map((ch,i)=>`<span style="--i:${i}">${ch===' '?'&nbsp;':safe(ch)}</span>`).join('');
  const count=$('.transition-count');if(count)count.textContent='↗';
  void cover.offsetWidth;
  cover.classList.add('is-covered');
  // Fixed-duration handoff avoids transitionend races caused by nested animations.
  let moved=false;
  const go=()=>{if(moved)return;moved=true;location.assign(url)};
  setTimeout(go,720);
};

if(cover&&!rm){
  let incomingTitle=storageGet('ahmad-transition-title')||'';storageRemove('ahmad-transition-title');storageRemove('ahmad-transition-from');
  cover.classList.remove('is-revealing','is-covered','intro-cover','is-entering','is-leaving');
  cover.classList.add('is-booting','is-covered');
  cover.style.pointerEvents='none';
  if(incomingTitle)coverWord.innerHTML=[...incomingTitle].map((ch,i)=>`<span style="--i:${i}">${ch===' '?'&nbsp;':safe(ch)}</span>`).join('');
  void cover.offsetHeight;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const shouldIntro=page==='home'&&!storageGet(introKey)&&!incomingTitle;
    cover.classList.remove('is-booting');
    if(shouldIntro){
      cover.classList.add('intro-cover');cover.style.pointerEvents='auto';
      coverWord.innerHTML='<span style="--i:0">A</span><span style="--i:1">H</span><span style="--i:2">M</span><span style="--i:3">A</span><span style="--i:4">D</span>';
      const count=$('.transition-count');let n=0,done=false;
      const skip=document.createElement('button');skip.className='skip-intro';skip.textContent='SKIP INTRO ↗';skip.type='button';cover.append(skip);
      const finish=()=>{if(done)return;done=true;storageSet(introKey,'1');skip.remove();cover.style.pointerEvents='none';cover.classList.remove('is-covered','intro-cover');cover.classList.add('is-revealing');setTimeout(()=>cover.classList.remove('is-revealing'),850)};
      const timer=setInterval(()=>{n=Math.min(100,n+1);if(count)count.textContent=String(n).padStart(2,'0');if(n>=100){clearInterval(timer);setTimeout(finish,180)}},22);
      skip.addEventListener('click',()=>{clearInterval(timer);finish()});setTimeout(()=>{if(!done){clearInterval(timer);finish()}},2700);
    }else{
      requestAnimationFrame(()=>{cover.classList.remove('is-covered');cover.classList.add('is-revealing');setTimeout(()=>{cover.classList.remove('is-revealing');cover.style.pointerEvents='none'},850)});
    }
  }));
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');if(!a)return;
    const href=a.getAttribute('href');
    if(!href||href.startsWith('#')||href.startsWith('mailto:')||href.startsWith('tel:')||a.target==='_blank'||a.hasAttribute('download'))return;
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;
    const url=new URL(href,location.href);if(url.origin!==location.origin||url.pathname===location.pathname)return;
    e.preventDefault();
    const file=url.pathname.split('/').pop()||'index.html';
    const key=file.replace(/\.html?$/i,'');
    const title=titleFromSlug(key==='index'?'home':key);
    transitionTo(url.href,title);
  });
  window.addEventListener('pageshow',()=>{navigating=false});
}

// Dark-only theme: light mode and its toggle were intentionally removed.
root.dataset.theme='dark';
const themeMeta=$('meta[name="theme-color"]');if(themeMeta)themeMeta.content='#08090a';

// Cursor proximity across the whole site: each glyph transitions from bold to light near the pointer.
if(!rm&&matchMedia('(hover:hover) and (pointer:fine)').matches){
 const selectors='.reactive-title .variable-line,h1,h2,h3,.main-nav a,.mobile-nav a,.wordmark,.section-top>a,.rail-name,.work-card h2,.service-row h2,.service-teaser h3,.case-story h2,.case-next h2,.footer-links a,.contact-arrow,.email-link,.all-work-link,.round-link,.home-contact h2,.about-end h2';
 const targets=[...new Set($$(selectors).filter(el=>!el.closest('.transition-cover')&&!el.classList.contains('proximity-done')))];
 const splitNode=node=>{if(node.nodeType===Node.TEXT_NODE){const text=node.nodeValue;if(!text||!text.trim())return;const frag=document.createDocumentFragment();const tokens=text.match(/\s+|\S+/g)||[];tokens.forEach(token=>{if(/^\s+$/.test(token)){frag.append(document.createTextNode(token));return}const word=document.createElement('span');word.className='proximity-word';word.style.whiteSpace='nowrap';[...token].forEach(ch=>{const span=document.createElement('span');span.className='proximity-letter';span.setAttribute('aria-hidden','true');span.textContent=ch;word.append(span)});frag.append(word)});node.parentNode.replaceChild(frag,node)}else if(node.nodeType===Node.ELEMENT_NODE&&!['SCRIPT','STYLE','SVG','BUTTON'].includes(node.tagName)&&!node.classList.contains('proximity-letter')&&!node.classList.contains('proximity-word'))[...node.childNodes].forEach(splitNode)};
 targets.forEach(el=>{if(el.querySelector('.proximity-letter'))return;const original=el.getAttribute('aria-label');if(!original)el.setAttribute('aria-label',el.textContent.trim());[...el.childNodes].forEach(splitNode);el.classList.add('proximity-done')});
 const chars=$$('.proximity-letter');let raf=0,px=-2000,py=-2000;
 const update=()=>{raf=0;chars.forEach(el=>{const r=el.getBoundingClientRect();if(!r.width&&!r.height)return;const cx=r.left+r.width/2,cy=r.top+r.height/2,d=Math.hypot(px-cx,py-cy),t=Math.max(0,1-d/155);const influence=t*t*(3-2*t);const weight=780-influence*470,width=118-influence*34;el.style.fontVariationSettings=`"wdth" ${width}, "wght" ${weight}`})};
 addEventListener('pointermove',e=>{px=e.clientX;py=e.clientY;if(!raf)raf=requestAnimationFrame(update)},{passive:true});
 addEventListener('pointerleave',()=>{px=-2000;py=-2000;if(!raf)raf=requestAnimationFrame(update)});
}

// Custom cursor: disable the browser cursor at the document level and keep one smooth cursor.
if(cursor&&!rm&&matchMedia('(hover:hover) and (pointer:fine)').matches){
 body.classList.add('custom-cursor-active');
 let x=innerWidth/2,y=innerHeight/2,tx=x,ty=y,raf=0;
 const loop=()=>{x+=(tx-x)*.32;y+=(ty-y)*.32;cursor.style.left=`${x}px`;cursor.style.top=`${y}px`;if(Math.abs(tx-x)+Math.abs(ty-y)>.15)raf=requestAnimationFrame(loop);else raf=0};
 const move=e=>{tx=e.clientX;ty=e.clientY;cursor.classList.add('visible');if(!raf)raf=requestAnimationFrame(loop)};
 addEventListener('pointermove',move,{passive:true});
 addEventListener('pointerleave',()=>cursor.classList.remove('visible'));
 addEventListener('pointerdown',()=>cursor.classList.add('is-pressed'));
 addEventListener('pointerup',()=>cursor.classList.remove('is-pressed'));
 const bindCursor=()=>$$('a,button,[role="button"],.work-card,.rail-project,.service-row,.service-teaser,.case-next').forEach(el=>{
   if(el.dataset.cursorBound)return;el.dataset.cursorBound='1';
   el.addEventListener('pointerenter',()=>{cursor.classList.add('is-link');const label=el.dataset.cursorLabel||((el.matches('.work-card,.rail-project'))?'VIEW':(el.matches('.service-row,.service-teaser')?'EXPLORE':'OPEN'));const span=cursor.querySelector('span');if(span)span.textContent=label});
   el.addEventListener('pointerleave',()=>cursor.classList.remove('is-link'));
 });
 bindCursor();
 const mo=new MutationObserver(bindCursor);mo.observe(document.body,{childList:true,subtree:true});
}

// Magnetic links and restrained tilt make the interface feel responsive without shifting layout.
if(!rm&&matchMedia('(hover:hover) and (pointer:fine)').matches){
 $$('.round-link,.all-work-link,.case-next a,.home-contact a').forEach(el=>{
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/r.width,dy=(e.clientY-r.top-r.height/2)/r.height;el.style.setProperty('--mx',`${dx*8}px`);el.style.setProperty('--my',`${dy*8}px`);el.classList.add('is-magnetic')});
  el.addEventListener('pointerleave',()=>{el.style.setProperty('--mx','0px');el.style.setProperty('--my','0px');el.classList.remove('is-magnetic')});
 });
}

// Scroll progress and header tint.
let scrollRaf=0;const onScroll=()=>{if(scrollRaf)return;scrollRaf=requestAnimationFrame(()=>{scrollRaf=0;const h=document.documentElement.scrollHeight-innerHeight; if(progress)progress.style.transform=`scaleX(${h>0?scrollY/h:0})`})};
addEventListener('scroll',onScroll,{passive:true});onScroll();

// Scroll-led outline-to-fill statement: every word begins as stroked type and fills smoothly as it enters the reading zone.
const statement=$('[data-statement]');
if(statement){
 const text=statement.textContent.trim().replace(/\s+/g,' ');
 statement.setAttribute('aria-label',text);
 statement.innerHTML=text.split(' ').map((w,i)=>`<span class="statement-word" style="--word-index:${i}" aria-hidden="true">${safe(w)}</span>`).join(' ');
 const all=$$('.statement-word',statement);
 if(rm) all.forEach(w=>w.classList.add('lit'));
 else {let raf=0;const fill=()=>{raf=0;const rect=statement.getBoundingClientRect();const vh=innerHeight;const progress=Math.max(0,Math.min(1,(vh*.82-rect.top)/(rect.height+vh*.35)));const count=Math.ceil(progress*(all.length+1));all.forEach((w,i)=>{const amount=Math.max(0,Math.min(1,(progress*(all.length+1)-i)));w.style.setProperty('--fill',amount.toFixed(3));w.classList.toggle('lit',i<count-1||amount>.98)});};const queue=()=>{if(!raf)raf=requestAnimationFrame(fill)};addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);fill();}
}

// Project rail motion can be paused, and remembers choice in this tab.
const rail=$('#selected-rail'),motionToggle=$('#motion-toggle');
if(rail&&motionToggle){
 let paused=storageGet('ahmad-rail-paused')==='1';
 const apply=()=>{rail.classList.toggle('motion-paused',paused);motionToggle.setAttribute('aria-pressed',String(paused));motionToggle.innerHTML=paused?'Resume motion <b>▶</b>':'Pause motion <b>Ⅱ</b>';};
 apply();motionToggle.addEventListener('click',()=>{paused=!paused;storageSet('ahmad-rail-paused',paused?'1':'0');apply()});
}

// Work browser with real list/grid switching, filters, and pointer-following preview.
const grid=$('#work-grid'),filterBox=$('#filters'),layout=$('#work-layout'),preview=$('#hover-preview');
if(grid&&filterBox&&layout){
 const categories=['All',...new Set(projects.map(p=>p.category))];let active='All';
 filterBox.innerHTML=categories.map(c=>`<button type="button" class="filter-btn${c==='All'?' active':''}" data-filter="${safe(c)}" aria-pressed="${c==='All'}">${safe(c)}</button>`).join('');
 const art=(i)=>`<div class="card-art ${visuals[i%visuals.length]}"><span class="art-stamp">AN / ${String(i+1).padStart(2,'0')}</span><i class="art-form"></i><i class="art-form-secondary"></i><i class="art-orbit"></i></div>`;
 const render=()=>{
  const list=projects.map((p,i)=>({...p,i})).filter(p=>active==='All'||p.category===active);
  $('#project-count').textContent=String(list.length).padStart(2,'0')+' PROJECTS';
  grid.innerHTML=list.map(p=>`<a class="work-card" href="${projectSlug(p.i)}" data-index="${p.i}" aria-label="View ${safe(p.title)}"><span class="work-card-index">${String(p.i+1).padStart(2,'0')}</span><div class="work-card-media">${art(p.i)}</div><div class="work-card-meta"><span>${safe(p.category)}</span><span>${safe(p.year||'2026')}</span></div><h2><span>${safe(p.title)}</span><b>↗</b></h2></a>`).join('');
  if(preview){preview.classList.remove('is-visible')}
 };
 filterBox.addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;active=b.dataset.filter;$$('.filter-btn',filterBox).forEach(x=>{const yes=x===b;x.classList.toggle('active',yes);x.setAttribute('aria-pressed',String(yes))});render()});
 $$('.view-button').forEach(b=>b.addEventListener('click',()=>{$$('.view-button').forEach(x=>{const yes=x===b;x.classList.toggle('active',yes);x.setAttribute('aria-pressed',String(yes))});layout.classList.toggle('is-list',b.dataset.view==='list');if(preview)preview.classList.remove('is-visible')}));
 grid.addEventListener('pointerover',e=>{const card=e.target.closest('.work-card');if(!card||!preview||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;const i=+card.dataset.index;preview.querySelector('.preview-art').className='preview-art '+visuals[i%visuals.length];preview.querySelector('.preview-art>span').textContent=String(i+1).padStart(2,'0')+' / '+projects[i].title;preview.classList.add('is-visible')});
 grid.addEventListener('pointermove',e=>{if(!preview||!preview.classList.contains('is-visible'))return;const x=Math.min(innerWidth-240,e.clientX+24),y=Math.min(innerHeight-210,e.clientY+18);preview.style.transform=`translate3d(${x}px,${y}px,0) scale(1)`;preview.style.left='0';preview.style.top='0'});
 grid.addEventListener('pointerout',e=>{if(e.target.closest('.work-card')&&!e.relatedTarget?.closest('.work-card'))preview?.classList.remove('is-visible')});
 render();

}

// Enter content gently, but keep it visible for reduced-motion users.
if(!rm){const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');obs.unobserve(e.target)}}),{threshold:.08});$$('.service-teaser,.service-row,.about-feature-copy,.about-principles>div,.case-story,.case-gallery,.contact-main>div').forEach(el=>{el.classList.add('reveal-on-scroll');obs.observe(el)})}else{$$('.reveal-on-scroll').forEach(el=>el.classList.add('revealed'))}
})();
