(function(){
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>Array.from(c.querySelectorAll(s));
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
const small=innerWidth<820;

/* ===== static content (works without animation) ===== */
const HOURS={0:[9,14],1:[6,23],2:[6,23],3:[6,23],4:[6,23],5:[6,23],6:[8,20]};
const now=new Date(),d=now.getDay(),h=now.getHours()+now.getMinutes()/60,pad=n=>String(n).padStart(2,'0');
const [oH,cH]=HOURS[d],open=h>=oH&&h<cH;
$('#heroToday').textContent=pad(oH)+':00 — '+pad(cH)+':00';
$$('.orari tr').forEach(tr=>{if(tr.dataset.days.split(',').includes(String(d)))tr.classList.add('today');});
const flapText=open?'APERTO ORA':'CHIUSO', flapTarget=flapText.padEnd(12,' ').split(''), flapEl=$('#flap');
flapTarget.forEach(ch=>{const b=document.createElement('b');b.textContent=ch;flapEl.appendChild(b);});
flapEl.setAttribute('aria-label',flapText);
$('#flapNote').textContent=open?'Chiude alle '+pad(cH)+':00 di oggi.':(h<oH?'Apre oggi alle '+pad(oH)+':00.':'Riapre domani alle '+pad(HOURS[(d+1)%7][0])+':00.');

const DISC=[
 {n:'Sala pesi',w:'Accesso libero',t:'Forza e ipertrofia con schede scritte dal tuo coach.',img:'assets/img/d-pesi.jpg'},
 {n:'Functional',w:'45 min',t:'Circuiti con kettlebell, slitte e corde. Sempre in gruppo.',img:'assets/img/d-functional.jpg'},
 {n:'Boxe',w:'60 min',t:'Tecnica, sacco e sparring leggero su richiesta. Dai 16 anni.',img:'assets/img/d-boxe.jpg'},
 {n:'Pilates',w:'50 min',t:'Controllo, postura e core in gruppi da massimo dieci persone.',img:'assets/img/d-pilates.jpg'},
 {n:'Mobility',w:'60 min',t:'Yoga e mobilità articolare, ideale dopo i pesi.',img:'assets/img/d-mobility.jpg'},
 {n:'Personal',w:'Su appuntamento',t:'Sedute uno a uno, anche in coppia. Pacchetti da 5 o 10.',img:'assets/img/d-personal.jpg'}
];
const mq=$('#marquee');
for(let r=0;r<4;r++)DISC.forEach((x,i)=>{const s=document.createElement('span');s.textContent=x.n;if(i%2)s.className='o';mq.appendChild(s);const t=document.createElement('span');t.className='dot';t.textContent='●';mq.appendChild(t);});

const setPeriod=y=>{$('#btnMese').setAttribute('aria-pressed',String(!y));$('#btnAnno').setAttribute('aria-pressed',String(y));
  $$('.tier .price strong').forEach(el=>{const to=+(y?el.dataset.y:el.dataset.m);
    if(window.gsap&&!reduce){const o={v:+el.textContent};gsap.to(o,{v:to,duration:.6,ease:'power3.out',onUpdate:()=>el.textContent=Math.round(o.v)});}else el.textContent=to;});};
$('#btnMese').addEventListener('click',()=>setPeriod(false));
$('#btnAnno').addEventListener('click',()=>setPeriod(true));

const loader=$('.loader');
if(!window.gsap||!window.ScrollTrigger||reduce){loader&&loader.remove();$('#gl').remove();return;}
gsap.registerPlugin(ScrollTrigger);

/* ===== smooth scroll, nav, cursor ===== */
let lenis=null;
if(window.Lenis){lenis=new Lenis({lerp:.08,smoothWheel:true});lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);}
$$('[data-scroll]').forEach(a=>a.addEventListener('click',e=>{const el=$(a.getAttribute('href'));if(!el)return;e.preventDefault();lenis?lenis.scrollTo(el,{duration:2}):el.scrollIntoView({behavior:'smooth'});}));
let lastY=0;const nav=$('#nav');
ScrollTrigger.create({start:0,end:'max',onUpdate:s=>{const y=s.scroll();nav.classList.toggle('hide',y>lastY&&y>200);lastY=y;}});
const cur=$('.cursor'),mouse={x:0,y:0};
addEventListener('mousemove',e=>{mouse.x=e.clientX/innerWidth*2-1;mouse.y=e.clientY/innerHeight*2-1;});
if(fine){const xT=gsap.quickTo(cur,'x',{duration:.25,ease:'power3'}),yT=gsap.quickTo(cur,'y',{duration:.25,ease:'power3'});
  addEventListener('mousemove',e=>{xT(e.clientX);yT(e.clientY);});
  $$('a,button,.tier,.coach-card').forEach(el=>{el.addEventListener('mouseenter',()=>cur.classList.add('big'));el.addEventListener('mouseleave',()=>cur.classList.remove('big'));});}

/* ===== heartbeat ===== */
const curve=[[0,62],[.1,80],[.3,118],[.45,168],[.52,176],[.65,128],[.78,82],[.92,68],[1,64]];
const bpmAt=p=>{for(let i=1;i<curve.length;i++){const[p1,b1]=curve[i],[p0,b0]=curve[i-1];if(p<=p1)return b0+(b1-b0)*((p-p0)/(p1-p0));}return 64;};
const phaseAt=p=>p<.16?'Riscaldamento':p<.4?'In carico':p<.58?'Picco':p<.8?'Recupero':'Defaticamento';
let BPM=62;
ScrollTrigger.create({start:0,end:'max',onUpdate:s=>{const p=s.progress;BPM=bpmAt(p);$('#bpm').textContent=Math.round(BPM);$('#phase').textContent=phaseAt(p);$('#progress').style.transform='scaleX('+p+')';$('.hud-ecg svg').style.animationDuration=(96/BPM).toFixed(2)+'s';}});

/* ===== 3D GYM: barbell + bumper plates, kettlebell, hex dumbbells, chalk / steam, photo ring ===== */
const W={camZ:7,camY:0,
  barS:0,barX:0,barY:-1.2,barRX:.12,barRY:0,barRZ:0,load:0,lift:0,
  kbS:0,kbX:0,kbY:0,kbSwing:0,
  dbS:0,dbSpin:0,
  ring:0,ringRot:0,
  dust:.35,burst:0,steam:0,ice:0};
let world=null;
if(window.THREE){try{world=initWorld();}catch(e){world=null;console.warn(e);}}
if(!world)$('#gl').remove();

function initWorld(){
  const canvas=$('#gl');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,small?1.5:2));
  renderer.setSize(innerWidth,innerHeight,false);
  renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.05,100);
  camera.position.set(0,0,7);

  /* procedural matcaps (studio-lit materials without an environment map) */
  function matcap(base,mid,hi,rim,rimA){
    const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
    const g=x.createRadialGradient(96,84,4,128,128,128);
    g.addColorStop(0,hi);g.addColorStop(.18,mid);g.addColorStop(.62,base);g.addColorStop(1,'#000');
    x.fillStyle=g;x.fillRect(0,0,256,256);
    const r=x.createRadialGradient(210,220,10,210,220,150);r.addColorStop(0,rim);r.addColorStop(1,'rgba(0,0,0,0)');
    x.globalAlpha=rimA;x.globalCompositeOperation='lighter';x.fillStyle=r;x.fillRect(0,0,256,256);
    const t=new THREE.CanvasTexture(c);return {tex:t,canvas:c,ctx:x};
  }
  const chromeM=matcap('#3d3a36','#cfcac2','#ffffff','#ff7a3d',.85);
  const rubberM=matcap('#141312','#3a3835','#8a8780','#ff7a3d',.35);
  const ironM=matcap('#1b1a19','#4a4743','#a8a49c','#ff7a3d',.5);
  const orangeM=matcap('#a8320c','#ff6a2a','#ffd2b0','#ffb347',.6);
  const chrome=new THREE.MeshMatcapMaterial({matcap:chromeM.tex});
  const rubber=new THREE.MeshMatcapMaterial({matcap:rubberM.tex});
  const iron=new THREE.MeshMatcapMaterial({matcap:ironM.tex});
  const orange=new THREE.MeshMatcapMaterial({matcap:orangeM.tex});
  let lastIce=0;
  function tintRims(ice){ // recovery: rim light turns from warm to ice-blue
    [chromeM,rubberM,ironM].forEach((m,i)=>{
      const base=i===0?['#3d3a36','#cfcac2','#ffffff']:i===1?['#141312','#3a3835','#8a8780']:['#1b1a19','#4a4743','#a8a49c'];
      const x=m.ctx;x.globalAlpha=1;x.globalCompositeOperation='source-over';
      const g=x.createRadialGradient(96,84,4,128,128,128);g.addColorStop(0,base[2]);g.addColorStop(.18,base[1]);g.addColorStop(.62,base[0]);g.addColorStop(1,'#000');
      x.fillStyle=g;x.fillRect(0,0,256,256);
      const rr=Math.round(255*(1-ice)+156*ice),gg=Math.round(122*(1-ice)+201*ice),bb=Math.round(61*(1-ice)+227*ice);
      const r=x.createRadialGradient(210,220,10,210,220,150);r.addColorStop(0,`rgb(${rr},${gg},${bb})`);r.addColorStop(1,'rgba(0,0,0,0)');
      x.globalAlpha=i===0?.85:i===1?.35:.5;x.globalCompositeOperation='lighter';x.fillStyle=r;x.fillRect(0,0,256,256);m.tex.needsUpdate=true;});
  }

  /* --- olympic barbell with bumper plates --- */
  const bar=new THREE.Group(), barInner=new THREE.Group(); bar.add(barInner);
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,2.6,24),chrome);shaft.rotation.z=Math.PI/2;barInner.add(shaft);
  // knurling bands
  [-.55,.55].forEach(x=>{const k=new THREE.Mesh(new THREE.CylinderGeometry(.048,.048,.5,24),iron);k.rotation.z=Math.PI/2;k.position.x=x;barInner.add(k);});
  [-1,1].forEach(s=>{
    const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,1.05,32),chrome);sleeve.rotation.z=Math.PI/2;sleeve.position.x=s*1.85;barInner.add(sleeve);
    const collar=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.06,32),chrome);collar.rotation.z=Math.PI/2;collar.position.x=s*1.31;barInner.add(collar);
  });
  // bumper plate: lathe profile (hole, steel hub, rubber body, flat face)
  function plateGeo(R,T){
    const pts=[[.08,-T*.5],[.2,-T*.5],[.2,-T*.42],[R*.88,-T*.5],[R,-T*.5],[R,T*.5],[R*.88,T*.5],[.2,T*.42],[.2,T*.5],[.08,T*.5],[.08,-T*.5]]
      .map(p=>new THREE.Vector2(p[0],p[1]));
    return new THREE.LatheGeometry(pts,64);
  }
  const plates=[];
  const PL=[[1.48,.82,.2],[1.69,.82,.2],[1.88,.62,.16],[2.03,.45,.12]]; // x, radius, thickness (25kg,25kg,15kg,10kg)
  PL.forEach(([x,R,T],k)=>[-1,1].forEach(s=>{
    const g=new THREE.Group();
    const body=new THREE.Mesh(plateGeo(R,T),rubber);body.rotation.z=Math.PI/2;g.add(body);
    const hub=new THREE.Mesh(new THREE.TorusGeometry(.2,.018,10,48),k<2?orange:chrome);hub.rotation.y=Math.PI/2;
    const hub2=hub.clone();hub.position.x=T*.44;hub2.position.x=-T*.44;g.add(hub,hub2);
    g.userData={x:x*s,s,k,rx:Math.random()*2-1,ry:Math.random()*2-1,rz:Math.random()*2-1};
    plates.push(g);barInner.add(g);
  }));
  scene.add(bar);

  /* --- kettlebell (cast iron) --- */
  const kb=new THREE.Group();
  const bell=new THREE.Mesh(new THREE.SphereGeometry(.62,48,36),iron);bell.scale.set(1,.92,1);kb.add(bell);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.06,40),iron);base.position.y=-.56;kb.add(base);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.36,.075,18,48,Math.PI),iron);handle.position.y=.62;kb.add(handle);
  [-1,1].forEach(s=>{const horn=new THREE.Mesh(new THREE.CylinderGeometry(.075,.09,.32,18),iron);horn.position.set(s*.36,.5,0);kb.add(horn);});
  const kbBand=new THREE.Mesh(new THREE.TorusGeometry(.6,.012,8,64),orange);kbBand.rotation.x=Math.PI/2;kbBand.position.y=.05;kb.add(kbBand);
  const kbPivot=new THREE.Group();kb.position.y=-.9;kbPivot.add(kb);scene.add(kbPivot);

  /* --- pair of hex dumbbells --- */
  function hexDB(){
    const g=new THREE.Group();
    const handle=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.62,20),chrome);handle.rotation.z=Math.PI/2;g.add(handle);
    [-1,1].forEach(s=>{const head=new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,.3,6),rubber);head.rotation.z=Math.PI/2;head.position.x=s*.46;g.add(head);
      const cap=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.31,24),orange);cap.rotation.z=Math.PI/2;cap.position.x=s*.46;g.add(cap);});
    return g;
  }
  const db1=hexDB(),db2=hexDB();const dbs=new THREE.Group();dbs.add(db1,db2);scene.add(dbs);

  /* --- ring of real photos (discipline cards) --- */
  const ring=new THREE.Group(),R=small?2.4:3.4,cardMats=[];
  const cardGeo=new THREE.PlaneGeometry(1.8,2.4);
  DISC.forEach((dd,i)=>{
    const c=document.createElement('canvas');c.width=600;c.height=800;
    const tex=new THREE.CanvasTexture(c);tex.anisotropy=4;
    const m=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:0,side:THREE.DoubleSide});cardMats.push(m);
    const draw=img=>{const x=c.getContext('2d');
      x.fillStyle='#191714';x.fillRect(0,0,600,800);
      if(img){const s=Math.max(600/img.width,800/img.height),w=img.width*s,hh=img.height*s;x.drawImage(img,(600-w)/2,(800-hh)/2,w,hh);}
      const g=x.createLinearGradient(0,380,0,800);g.addColorStop(0,'rgba(14,13,12,0)');g.addColorStop(1,'rgba(14,13,12,.92)');x.fillStyle=g;x.fillRect(0,0,600,800);
      x.fillStyle='#ff5b1f';x.font='600 24px "JetBrains Mono", monospace';x.fillText(String(i+1).padStart(2,'0')+' / 06',36,60);
      x.fillStyle='#efe9df';x.font='900 104px "Big Shoulders Display", Impact, sans-serif';x.fillText(dd.n.toUpperCase(),32,720);
      x.font='400 22px "JetBrains Mono", monospace';x.fillStyle='rgba(239,233,223,.8)';x.fillText(dd.w.toUpperCase(),36,764);
      tex.needsUpdate=true;};
    draw(null);
    const img=new Image();img.onload=()=>{(document.fonts?document.fonts.ready:Promise.resolve()).then(()=>draw(img));};img.src=dd.img;
    const mesh=new THREE.Mesh(cardGeo,m);const a=i/DISC.length*Math.PI*2;
    mesh.position.set(Math.sin(a)*R,0,Math.cos(a)*R);mesh.rotation.y=a;ring.add(mesh);
  });
  ring.position.z=-R+1.4;ring.visible=false;scene.add(ring);

  /* --- chalk dust / sauna steam --- */
  const N=small?600:1400,P=new Float32Array(N*3),base0=new Float32Array(N*3),dir=new Float32Array(N*3),spd=new Float32Array(N);
  for(let i=0;i<N;i++){base0[i*3]=(Math.random()-.5)*12;base0[i*3+1]=(Math.random()-.5)*8;base0[i*3+2]=(Math.random()-.5)*5;
    const th=Math.random()*Math.PI*2,ph=Math.acos(Math.random()*2-1);dir[i*3]=Math.sin(ph)*Math.cos(th);dir[i*3+1]=Math.sin(ph)*Math.sin(th)*.7+.3;dir[i*3+2]=Math.cos(ph);spd[i]=.4+Math.random();}
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(P,3));
  const sc=document.createElement('canvas');sc.width=sc.height=64;const sx=sc.getContext('2d');const sg=sx.createRadialGradient(32,32,0,32,32,32);sg.addColorStop(0,'rgba(255,255,255,1)');sg.addColorStop(.35,'rgba(255,255,255,.45)');sg.addColorStop(1,'rgba(255,255,255,0)');sx.fillStyle=sg;sx.fillRect(0,0,64,64);
  const pm=new THREE.PointsMaterial({size:.06,map:new THREE.CanvasTexture(sc),transparent:true,depthWrite:false,color:0xf2efe9,opacity:.4});
  const dust=new THREE.Points(pg,pm);scene.add(dust);

  const S=Object.assign({},W),clock=new THREE.Clock();let pulse=0,beat=0;
  function frame(){
    const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
    for(const k in W)S[k]+=(W[k]-S[k])*Math.min(1,dt*6);
    beat+=dt*BPM/60;if(beat>=1){beat-=1;pulse=1;}pulse*=Math.pow(.03,dt);
    // barbell
    bar.visible=S.barS>.01;bar.scale.setScalar(Math.max(S.barS,1e-4));
    bar.position.set(S.barX,S.barY+S.lift+Math.sin(t*1.2)*.03,0);
    bar.rotation.set(S.barRX,S.barRY+Math.sin(t*.4)*.05,S.barRZ+Math.sin(t*.7)*.02);
    barInner.position.y=-pulse*.012;
    plates.forEach(p=>{const u=p.userData,L=Math.min(1,Math.max(0,S.load*PL.length-u.k)); // plates slide on one by one
      const off=(1-L)*2.6*u.s, b=S.burst;
      p.position.set(u.x+off+u.s*b*(1.2+u.k*.5),u.ry*b*1.6,u.rz*b*1.4);
      p.rotation.set(u.rx*b*2.5,u.ry*b*2,u.rz*b*2);
      p.visible=L>.001||b>0;p.scale.setScalar(.6+.4*Math.max(L,b>0?1:0));});
    // kettlebell swing
    kbPivot.visible=S.kbS>.01;kbPivot.scale.setScalar(Math.max(S.kbS,1e-4));kbPivot.position.set(S.kbX,S.kbY+.9*S.kbS,0);
    kbPivot.rotation.z=Math.sin(t*1.6)*.18*S.kbSwing+S.kbSwing*.0;kbPivot.rotation.y=t*.25;kbPivot.rotation.x=.15;
    // dumbbells orbit
    dbs.visible=S.dbS>.01;dbs.scale.setScalar(Math.max(S.dbS,1e-4));
    const ox=small?1.4:3.3,oy=small?2.6:1.6;
    db1.position.set(-ox,oy+Math.sin(t*.9)*.12,0);db1.rotation.set(t*.3+S.dbSpin,t*.2,.4);
    db2.position.set(ox,-oy+Math.cos(t*.8)*.12,-.5);db2.rotation.set(-t*.25-S.dbSpin,t*.15,-.3);
    // ring
    ring.visible=S.ring>.01;ring.rotation.y=S.ringRot;cardMats.forEach(m=>m.opacity=S.ring);
    ring.children.forEach((m,i)=>m.position.y=Math.sin(t*.8+i)*.05);
    // chalk dust, burst and steam
    for(let i=0;i<N;i++){const j=i*3;
      const rise=((t*spd[i]*.25*S.steam+i*.137)%1)*9*S.steam;
      P[j]=base0[j]+dir[j]*S.burst*3*spd[i]+Math.sin(t*.3+i)*.08;
      P[j+1]=base0[j+1]+dir[j+1]*S.burst*3*spd[i]+Math.sin(t*.2+i*.7)*.1+(S.steam>.01?((base0[j+1]+4+rise)%8)-4-base0[j+1]:0);
      P[j+2]=base0[j+2]+dir[j+2]*S.burst*2*spd[i];}
    pg.attributes.position.needsUpdate=true;
    pm.opacity=Math.min(.9,S.dust*(.6+S.burst*.6));pm.size=(small?.05:.06)*(1+S.steam*2.2+S.burst*.6);
    pm.color.setRGB(.95-S.ice*.25,.94-S.ice*.08,.92+S.ice*.06);
    if(Math.abs(S.ice-lastIce)>.04){tintRims(Math.min(1,Math.max(0,S.ice)));lastIce=S.ice;}
    camera.position.x+=((mouse.x*.3)-camera.position.x)*.05;
    camera.position.y+=((S.camY-mouse.y*.2)-camera.position.y)*.05;
    camera.position.z=S.camZ;camera.lookAt(0,S.camY*.5,0);
    renderer.render(scene,camera);
  }
  gsap.ticker.add(frame);
  addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
  return true;
}

/* ===== SCROLL CHOREOGRAPHY ===== */
const KF={
  hero:Object.assign({},W),
  manifesto:{camZ:7,camY:0,barS:0,load:0,kbS:small?.55:.85,kbX:small?1.3:-.6,kbY:small?-2.4:-.4,kbSwing:1,dust:.3},
  spazio:{kbS:0,kbSwing:0,dust:.5},
  disc:{ring:1,ringRot:0,dust:.25,camZ:6.4},
  picco:{ring:0,ringRot:-Math.PI*2*5/6,barS:small?.7:1,barX:0,barY:-1.9,barRX:.18,barRY:0,barRZ:0,load:1,lift:0,burst:0,dust:.4,camZ:7},
  coach:{barS:0,burst:0,lift:0,dbS:small?.6:.85,dust:.3},
  prezzi:{dbSpin:Math.PI},
  recovery:{dbS:0,dbSpin:Math.PI,steam:1,ice:1,dust:.55},
  dove:{steam:0,dust:.15,ice:.6},
  cta:{ice:0,barS:small?.6:.85,barX:0,barY:small?-2.6:-2.2,barRX:.25,barRY:-.3,load:1,lift:0,dust:.35}
};
let prevKF=Object.assign({},KF.hero);
const approach=(sel,key,start='top bottom',end='top top')=>{
  const from=Object.assign({},prevKF),to=Object.assign({},prevKF,KF[key]);
  gsap.fromTo(W,from,Object.assign({},to,{ease:'none',immediateRender:false,scrollTrigger:{trigger:sel,start,end,scrub:true}}));
  prevKF=to;
};
const commit=o=>{prevKF=Object.assign({},prevKF,o);};

/* 0 preloader → plates load onto the bar */
const lp=$('#loaderPath'),len=lp.getTotalLength();gsap.set(lp,{strokeDasharray:len,strokeDashoffset:len});
const cnt={v:0},letters=$$('#heroWord span');
gsap.timeline()
  .to(lp,{strokeDashoffset:0,duration:1.3,ease:'power2.inOut'},0)
  .to(cnt,{v:62,duration:1.3,ease:'power2.out',onUpdate:()=>$('#loaderNum').textContent=Math.round(cnt.v)},0)
  .to(loader,{yPercent:-100,duration:.9,ease:'power4.inOut'},1.5)
  .fromTo('#heroImg',{scale:1.35,filter:'brightness(.2)'},{scale:1.08,filter:'brightness(1)',duration:2.4,ease:'expo.out'},1.6)
  .from(letters,{yPercent:120,rotationX:-80,opacity:0,duration:1.2,stagger:.06,ease:'expo.out'},1.9)
  .to(W,{barS:small?.7:1,duration:1,ease:'expo.out'},2.0)
  .to(W,{load:1,duration:1.6,ease:'power2.inOut'},2.3)
  .from('.hero-bottom > *',{y:30,opacity:0,duration:.8,stagger:.1,ease:'power3.out'},2.5)
  .add(()=>loader.remove());
KF.hero.barS=small?.7:1;KF.hero.load=1;prevKF=Object.assign({},KF.hero);

/* 1 hero: barbell turns end-on and the camera dives into the plate */
gsap.timeline({scrollTrigger:{trigger:'#hero',start:'top top',end:'+=220%',scrub:1,pin:true,anticipatePin:1}})
  .to('.hero-bottom,.scroll-hint',{opacity:0,y:-60,duration:.12},0)
  .to(letters,{z:(i)=>500+i*90,x:(i)=>(i-2)*innerWidth*.3,y:(i)=>(i%2?-1:1)*innerHeight*.2,rotationY:(i)=>(i-2)*-30,opacity:0,ease:'power2.in',duration:.45,stagger:.02},0)
  .to('#heroImg',{scale:1.5,filter:'brightness(.35) blur(4px)',ease:'power1.in',duration:.9},0)
  .to(W,{barY:0,barRX:0,barRY:-Math.PI/2*.92,lift:0,ease:'power2.inOut',duration:.5},0)
  .to(W,{camZ:small?3.3:3.05,dust:.8,ease:'power3.in',duration:.42},.48)
  .to('#blackout',{opacity:1,duration:.08,ease:'none'},.86)
  .set(W,{barS:0,barRY:0,barY:-1.2,camZ:7,dust:.3},.95)
  .to('#blackout',{opacity:0,duration:.05},.95);
commit({barS:0,barRY:0,barY:-1.2,camZ:7,dust:.3,load:1});

/* 2 manifesto: words flip in, photos reveal, kettlebell swings */
approach('#manifesto','manifesto','top 60%','top top');
const mt=$('.manifesto-text');
Array.from(mt.childNodes).forEach(n=>{
  if(n.nodeType===3){const f=document.createDocumentFragment();n.textContent.split(/(\s+)/).forEach(tk=>{if(!tk.trim())return;const s=document.createElement('span');s.className='w';s.textContent=tk;f.appendChild(s);});n.replaceWith(f);}
  else if(n.nodeType===1)n.classList.add('w');});
gsap.timeline({scrollTrigger:{trigger:'#manifesto',start:'top top',end:'+=170%',scrub:1,pin:true,anticipatePin:1}})
  .fromTo('.man-photo.a',{clipPath:'inset(100% 0% 0% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:.4,ease:'power2.out'},0)
  .fromTo('.man-photo.a img',{yPercent:-10,scale:1.3},{yPercent:-2,scale:1,duration:1,ease:'none'},0)
  .fromTo('.man-photo.b',{clipPath:'inset(0% 0% 100% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:.4,ease:'power2.out'},.2)
  .fromTo($$('.w',mt),{rotationX:-95,z:-260,y:40,opacity:0},{rotationX:0,z:0,y:0,opacity:1,stagger:.06,ease:'power3.out',duration:.5},0)
  .fromTo('.manifesto-sub',{y:60,opacity:0},{y:0,opacity:1,duration:.3},'-=.2')
  .to(W,{kbY:KF.manifesto.kbY+.5,duration:1,ease:'none'},0)
  .to('.man-text',{z:0,opacity:0,y:-80,duration:.25,ease:'power2.in'},'+=.25')
  .to('.man-photo',{opacity:0,scale:.9,duration:.25},'<');
commit({kbY:KF.manifesto.kbY+.5});

/* 3 the rooms: fly-through tunnel of real photos */
approach('#spazio','spazio');
const frames=$$('.frame'),GAP=1700,tun={p:0};
const layoutTunnel=()=>{const z=tun.p*((frames.length-1)*GAP+150);
  frames.forEach((f,i)=>{const fz=-i*GAP+z;const o=fz>320?Math.max(0,1-(fz-320)/280):Math.max(0,Math.min(1,1+fz/(GAP*1.6)));
    const side=(i%2?1:-1)*Math.min(200,innerWidth*.12)*Math.max(0,-fz/GAP);
    f.style.transform=`translate3d(${side}px,0,${fz}px) rotateY(${(i%2?-1:1)*Math.max(0,-fz/GAP)*12}deg)`;
    f.style.opacity=o.toFixed(3);f.style.visibility=o<.01?'hidden':'visible';
    const im=f.querySelector('img');im.style.transform=`scale(${1.15-Math.min(.15,Math.max(0,(fz+GAP)/GAP)*.15)})`;});
  $('#tunN').textContent=Math.min(frames.length,1+Math.floor(z/GAP+.4));};
layoutTunnel();
gsap.timeline({scrollTrigger:{trigger:'#spazio',start:'top top',end:'+=360%',scrub:1,pin:true,anticipatePin:1}})
  .to(tun,{p:1,ease:'none',duration:1,onUpdate:layoutTunnel},0);

/* 4 disciplines: rotate the 3D ring of photos */
approach('#discipline','disc');
let curDisc=0;
const showDisc=i=>{if(i===curDisc)return;curDisc=i;const x=DISC[i];
  gsap.timeline().to('#discName',{yPercent:-110,duration:.18,ease:'power2.in'})
   .add(()=>{$('#discName').textContent=x.n;$('#discWhen').textContent=x.w;$('#discDesc').textContent=x.t;$('#discN').textContent=String(i+1).padStart(2,'0');})
   .fromTo('#discName',{yPercent:110},{yPercent:0,duration:.35,ease:'power3.out'})
   .fromTo('#discDesc,#discWhen',{opacity:0,y:12},{opacity:1,y:0,duration:.3},'<');};
gsap.timeline({scrollTrigger:{trigger:'#discipline',start:'top top',end:'+=420%',scrub:1,pin:true,anticipatePin:1,onUpdate:s=>showDisc(Math.min(5,Math.round(s.progress*5)))}})
  .to(W,{ringRot:-Math.PI*2*5/6,ease:'none',duration:1},0);
commit({ringRot:-Math.PI*2*5/6});

let mqX=0,boost=0,dirM=-1;const mqW=()=>mq.scrollWidth/4;
ScrollTrigger.create({start:0,end:'max',onUpdate:s=>{boost=Math.min(18,Math.abs(s.getVelocity())/150);dirM=s.direction>0?-1:1;}});
gsap.ticker.add(()=>{mqX+=dirM*(1.2+boost);boost*=.93;const w=mqW();if(-mqX>w)mqX+=w;if(mqX>0)mqX-=w;mq.style.transform='translateX('+mqX+'px) skewX('+(-dirM*boost*.8)+'deg)';});

/* 5 peak: the bar is lifted, counters climb, chalk explodes */
approach('#picco','picco');
const counters=$$('[data-count]');
gsap.timeline({scrollTrigger:{trigger:'#picco',start:'top top',end:'+=200%',scrub:1,pin:true,anticipatePin:1,
    onUpdate:s=>{const p=Math.min(1,s.progress*1.6);counters.forEach(el=>el.textContent=Math.round(+el.dataset.count*p).toLocaleString('it-IT'));if(s.progress>.62)runFlap();}}})
  .fromTo('#piccoImg',{scale:1.25},{scale:1,ease:'none',duration:1},0)
  .fromTo('.stat',{rotationX:-80,y:80,opacity:0,transformPerspective:800},{rotationX:0,y:0,opacity:1,stagger:.06,duration:.3,ease:'power3.out'},0)
  .to(W,{lift:small?3.4:2.6,barRZ:.04,ease:'power3.inOut',duration:.45},.05)
  .to(W,{burst:1,dust:1,ease:'power2.out',duration:.35},.5)
  .to(W,{camZ:5.8,ease:'none',duration:1},0);
commit({lift:small?3.4:2.6,barRZ:.04,burst:1,dust:1,camZ:5.8});
const CH='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';let flapped=false;
function runFlap(){if(flapped)return;flapped=true;
  $$('b',flapEl).forEach((b,i)=>{let n=0;const stop=8+i*3;const iv=setInterval(()=>{n++;if(n>=stop){b.textContent=flapTarget[i];clearInterval(iv);gsap.fromTo(b,{rotationX:-90},{rotationX:0,duration:.25});}else b.textContent=CH[Math.floor(Math.random()*CH.length)];},45);});}

/* 6 coach: photo cards fan open in 3D, dumbbells float in */
approach('#coach','coach');
const cards=$$('.coach-card'),spreadX=small?[-90,-30,30,90]:[-390,-130,130,390];
gsap.set(cards,{rotationZ:(i)=>(i-1.5)*1.5,y:(i)=>i*-3});
gsap.timeline({scrollTrigger:{trigger:'#coach',start:'top top',end:'+=170%',scrub:1,pin:true,anticipatePin:1}})
  .fromTo(cards,{rotationX:70,y:320,opacity:0},{rotationX:0,y:(i)=>i*-3,opacity:1,stagger:.06,duration:.35,ease:'power3.out'},0)
  .to(cards,{x:(i)=>spreadX[i],rotationZ:(i)=>(i-1.5)*(small?6:9),rotationY:(i)=>(i-1.5)*-14,y:(i)=>Math.abs(i-1.5)*40,stagger:.03,duration:.5,ease:'power2.inOut'},.35);

/* 7 pricing */
approach('#abbonamenti','prezzi','top bottom','top 20%');
gsap.fromTo('.tier',{rotationX:55,z:-400,y:160,opacity:0},{rotationX:0,z:0,y:0,opacity:1,stagger:.12,ease:'power3.out',scrollTrigger:{trigger:'.tiers',start:'top 95%',end:'top 35%',scrub:1}});
if(fine)$$('.tier').forEach(t=>{const rx=gsap.quickTo(t,'rotationX',{duration:.5,ease:'power3'}),ry=gsap.quickTo(t,'rotationY',{duration:.5,ease:'power3'});
  t.addEventListener('mousemove',e=>{const r=t.getBoundingClientRect();ry(((e.clientX-r.left)/r.width-.5)*14);rx(-((e.clientY-r.top)/r.height-.5)*14);});
  t.addEventListener('mouseleave',()=>{rx(0);ry(0);});});

/* 8 recovery: steam rises, everything cools */
approach('#recovery','recovery','top bottom','top 25%');
const root=document.documentElement;
ScrollTrigger.create({trigger:'#recovery',start:'top 60%',end:'bottom 40%',onToggle:s=>root.style.setProperty('--accent',s.isActive?'#9cc9e3':'#ff5b1f')});
gsap.fromTo('#recImg',{scale:1.3,yPercent:-8},{scale:1,yPercent:8,ease:'none',scrollTrigger:{trigger:'#recovery',start:'top bottom',end:'bottom top',scrub:true}});
gsap.fromTo('#rec-t',{letterSpacing:'.3em',opacity:0,filter:'blur(14px)'},{letterSpacing:'-.01em',opacity:1,filter:'blur(0px)',ease:'none',scrollTrigger:{trigger:'#rec-t',start:'top 95%',end:'top 45%',scrub:1}});
gsap.fromTo('.rec',{y:90,opacity:0},{y:0,opacity:1,stagger:.2,ease:'none',scrollTrigger:{trigger:'.rec-list',start:'top 100%',end:'top 55%',scrub:1}});
gsap.fromTo('.rec-photo',{clipPath:'inset(100% 0 0 0)',y:120},{clipPath:'inset(0% 0 0 0)',y:-40,ease:'none',scrollTrigger:{trigger:'#recovery',start:'top 70%',end:'bottom 40%',scrub:1}});

/* 9 map */
approach('#dove','dove','top bottom','top 25%');
const route=$('#route'),rl=route.getTotalLength();gsap.set(route,{strokeDasharray:rl,strokeDashoffset:rl});
gsap.timeline({scrollTrigger:{trigger:'.map',start:'top 95%',end:'center 45%',scrub:1}})
  .fromTo('#mapSvg',{rotationX:62,scale:.8},{rotationX:0,scale:1,ease:'power2.out',duration:.5},0)
  .to(route,{strokeDashoffset:0,ease:'none',duration:.5},.35)
  .from('#pin',{scale:0,transformOrigin:'486px 140px',ease:'back.out(3)',duration:.15},'>-.05');
gsap.fromTo('.info > *',{x:60,opacity:0},{x:0,opacity:1,stagger:.1,ease:'none',scrollTrigger:{trigger:'.info',start:'top 95%',end:'top 50%',scrub:1}});

/* 10 CTA: the loaded bar returns, resting */
approach('#prova','cta','top bottom','top 10%');
gsap.fromTo('#ctaImg',{scale:1.3},{scale:1,ease:'none',scrollTrigger:{trigger:'#prova',start:'top bottom',end:'bottom bottom',scrub:true}});
gsap.fromTo('#mag',{scale:0,rotation:-60},{scale:1,rotation:0,ease:'none',scrollTrigger:{trigger:'#mag',start:'top 100%',end:'top 60%',scrub:1}});
gsap.fromTo('#wordmark',{yPercent:70,scaleY:.3,opacity:0},{yPercent:0,scaleY:1,opacity:1,ease:'none',scrollTrigger:{trigger:'footer',start:'top bottom',end:'bottom bottom',scrub:1}});
const mag=$('#mag'),magIn=mag.querySelector('span');
if(fine){mag.addEventListener('mousemove',e=>{const r=mag.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;gsap.to(mag,{x:x*.35,y:y*.35,duration:.4});gsap.to(magIn,{x:x*.15,y:y*.15,duration:.4});});
  mag.addEventListener('mouseleave',()=>gsap.to([mag,magIn],{x:0,y:0,duration:1,ease:'elastic.out(1,.35)'}));}

/* headings rise in 3D */
$$('.coach-head h2,.prezzi-head h2,.dove h2,.cta h2,.picco h2,.disc-top h2').forEach(hh=>{
  gsap.fromTo(hh,{rotationX:-70,y:80,opacity:0,transformPerspective:900,transformOrigin:'50% 100%'},{rotationX:0,y:0,opacity:1,ease:'power2.out',scrollTrigger:{trigger:hh,start:'top 100%',end:'top 60%',scrub:1}});});

/* velocity skew */
const skewSet=$$('.recovery-lead,.prezzi-head,.dove-grid,.rec-list').map(el=>gsap.quickTo(el,'skewY',{duration:.5,ease:'power3'}));
ScrollTrigger.create({start:0,end:'max',onUpdate:s=>{const v=gsap.utils.clamp(-4,4,s.getVelocity()/-400);skewSet.forEach(f=>f(v));}});

addEventListener('load',()=>ScrollTrigger.refresh());
})();
