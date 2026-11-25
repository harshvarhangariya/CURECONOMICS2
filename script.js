const $=id=>document.getElementById(id),RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
/* menu */
$('burger').onclick=()=>{const o=$('nav').classList.toggle('open');$('burger').setAttribute('aria-expanded',o)};
$('nav').onclick=e=>{if(e.target.tagName==='A'){$('nav').classList.remove('open');$('burger').setAttribute('aria-expanded',false)}};
/* card tilt */
if(!RM)document.querySelectorAll('.tilt').forEach(c=>{
  c.addEventListener('mousemove',e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform=`perspective(800px) rotateY(${x*12}deg) rotateX(${-y*12}deg) translateZ(8px)`});
  c.addEventListener('mouseleave',()=>c.style.transform='')});
/* 3D hero */
(function(){
  if(!window.THREE)return;
  const cv=$('stage'),hero=cv.parentElement,R=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true});
  const S=new THREE.Scene(),C=new THREE.PerspectiveCamera(50,1,.1,100);C.position.set(0,.3,10);
  const G=new THREE.Group();S.add(G);
  const N=90,curves=[],dots=[];
  for(let i=0;i<10;i++){
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3),3));
    const col=i%2?0x22d3ee:0x8b7cff,l=new THREE.Line(g,new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.85}));
    G.add(l);curves.push({g,i});
    const d=new THREE.Mesh(new THREE.SphereGeometry(.085,12,12),new THREE.MeshBasicMaterial({color:0xffffff}));G.add(d);dots.push({d,i,o:Math.random()});
  }
  const grid=new THREE.GridHelper(20,28,0x1f2c55,0x121a36);grid.position.y=-2.1;G.add(grid);
  const P=new Float32Array(500*3);for(let i=0;i<P.length;i++)P[i]=(Math.random()-.5)*(i%3==1?8:20);
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(P,3));
  const pts=new THREE.Points(pg,new THREE.PointsMaterial({color:0x9fb4ff,size:.045,transparent:true,opacity:.7}));S.add(pts);
  const y=(i,t,tm)=>{const x=t+Math.sin(tm*.8+i)*.15;return(i%2?3.2*Math.exp(-2*Math.exp(-1.1*(x+.3))):3.2/(1+Math.exp(-1.3*x)))-1.7+Math.sin(t*1.6+tm*1.2+i*.6)*.12};
  const mx={x:0,y:0},cur={x:0,y:0};
  hero.addEventListener('mousemove',e=>{const r=hero.getBoundingClientRect();mx.x=(e.clientX-r.left)/r.width-.5;mx.y=(e.clientY-r.top)/r.height-.5});
  function size(){const w=hero.clientWidth,h=hero.clientHeight;R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(w,h,false);C.aspect=w/h;C.updateProjectionMatrix();G.position.x=w>900?2.6:0;G.scale.setScalar(w>900?1:.7)}
  addEventListener('resize',size);size();
  let vis=true;new IntersectionObserver(e=>vis=e[0].isIntersecting).observe(hero);
  function frame(ms){
    requestAnimationFrame(frame);if(!vis||document.hidden)return;
    const tm=RM?0:ms/1000;
    curves.forEach(({g,i})=>{const a=g.attributes.position;for(let k=0;k<N;k++){const t=-4+8*k/(N-1);a.setXYZ(k,t*1.5,y(i,t,tm),(i-4.5)*.75)}a.needsUpdate=true});
    dots.forEach(({d,i,o})=>{const t=-4+8*((tm*.07+o)%1);d.position.set(t*1.5,y(i,t,tm),(i-4.5)*.75)});
    cur.x+=(mx.x-cur.x)*.05;cur.y+=(mx.y-cur.y)*.05;
    G.rotation.y=-.5+cur.x*.7+Math.sin(tm*.25)*.12;G.rotation.x=.18+cur.y*.35;pts.rotation.y=tm*.02;
    R.render(S,C)}
  requestAnimationFrame(frame);
})();
/* analyzer */
const L=(t,K,r,A)=>K/(1+A*Math.exp(-r*t)),Gp=(t,K,r,A)=>K*Math.exp(-A*Math.exp(-r*t));
function fit(m,T,V){
  const mx=Math.max(...V),mn=Math.min(...V),sp=Math.max(...T)-Math.min(...T);
  let p=[mx*1.2,4/Math.max(sp,1),Math.max(mx/Math.max(mn,.001)-1,.1)];
  const f=q=>q[0]<=mx||q[1]<=0||q[2]<=0?Infinity:T.reduce((s,t,i)=>s+(V[i]-m(t,...q))**2,0);
  let b=f(p),st=[Math.max(mx*.25,1),.5,Math.max(p[2]*.5,.1)];
  for(let n=0;n<300;n++){let ok=false;
    for(let j=0;j<3;j++)for(const d of[-1,1]){const c=[...p];c[j]+=d*st[j];c[0]=Math.max(c[0],mx+1e-4);c[1]=Math.max(c[1],1e-5);c[2]=Math.max(c[2],1e-5);const s=f(c);if(s<b){p=c;b=s;ok=true}}
    if(!ok)st=st.map(x=>x*.65);if(Math.max(...st)<1e-6)break}
  const e=T.map((t,i)=>V[i]-m(t,...p)),mean=V.reduce((a,c)=>a+c,0)/V.length,tot=V.reduce((s,v)=>s+(v-mean)**2,0);
  return{p,m,rmse:Math.sqrt(b/V.length),mae:e.reduce((s,x)=>s+Math.abs(x),0)/e.length,r2:tot?1-b/tot:NaN};
}
const list=s=>s.split(',').map(x=>Number(x.trim()));
function draw(T,V,a,b,ft){
  const c=$('chart'),dpr=devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;c.width=w*dpr;c.height=h*dpr;
  const x=c.getContext('2d');x.scale(dpr,dpr);
  const dt=(T[T.length-1]-T[0])/(T.length-1),tEnd=T[T.length-1]+ft*dt,top=Math.max(...V,a.p[0],b.p[0])*1.05,pad=34;
  const X=t=>pad+(t-T[0])/(tEnd-T[0])*(w-pad-12),Y=v=>h-pad-v/top*(h-pad-14);
  x.strokeStyle='#1c2540';x.fillStyle='#8e9ab8';x.font='10px JetBrains Mono';
  for(let i=0;i<=4;i++){const v=top*i/4;x.beginPath();x.moveTo(pad,Y(v));x.lineTo(w-12,Y(v));x.stroke();x.fillText(v.toFixed(0),4,Y(v)+3)}
  x.fillStyle='rgba(139,124,255,.08)';x.fillRect(X(T[T.length-1]),14,w-12-X(T[T.length-1]),h-pad-14);
  [[a,'#8b7cff'],[b,'#22d3ee']].forEach(([f,col])=>{x.strokeStyle=col;x.lineWidth=2.5;x.beginPath();
    for(let k=0;k<=120;k++){const t=T[0]+(tEnd-T[0])*k/120;k?x.lineTo(X(t),Y(f.m(t,...f.p))):x.moveTo(X(t),Y(f.m(t,...f.p)))}x.stroke()});
  x.fillStyle='#fff';T.forEach((t,i)=>{x.beginPath();x.arc(X(t),Y(V[i]),4,0,7);x.fill()});
}
function run(){
  const e=$('err');e.hidden=true;
  try{
    const T=list($('times').value),V=list($('vals').value),ft=+$('steps').value;
    if(T.length!==V.length||T.length<4||[...T,...V].some(n=>!isFinite(n)))throw'Enter at least four matching numbers in both fields.';
    if(T.some((t,i)=>i&&t<=T[i-1]))throw'Time values must be unique and increasing.';
    if(Math.min(...V)<=0)throw'Measured values must be greater than zero.';
    const a=fit(L,T,V),b=fit(Gp,T,V),best=a.rmse<=b.rmse?a:b,dt=(T[T.length-1]-T[0])/(T.length-1);
    $('m1').textContent=a.rmse.toFixed(3);$('m2').textContent=b.rmse.toFixed(3);$('m3').textContent=best.mae.toFixed(3);$('m4').textContent=isNaN(best.r2)?'—':best.r2.toFixed(4);
    $('fc').innerHTML=Array.from({length:ft},(_,k)=>{const t=T[T.length-1]+(k+1)*dt;return`<span>t=${+t.toFixed(2)}: ${best.m(t,...best.p).toFixed(1)}</span>`}).join('');
    draw(T,V,a,b,ft);
  }catch(x){e.textContent=typeof x==='string'?x:'Could not fit this data. Check the values.';e.hidden=false}
}
$('go').onclick=run;$('steps').oninput=()=>{$('sv').textContent=$('steps').value+' steps'};
addEventListener('resize',run);run();
