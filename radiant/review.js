(() => {
  const ns='http://www.w3.org/2000/svg', scale=PLAN.source.metersPerPixel;
  const $=id=>document.getElementById(id);
  function node(tag,attrs,parent){
    const el=document.createElementNS(ns,tag);
    Object.entries(attrs).forEach(([name,value])=>el.setAttribute(name,value));
    parent.append(el);return el;
  }
  const [width,height]=PLAN.source.imageSize;
  const svg=node('svg',{viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'原始平面图与墙体、开口和尺寸测量端点叠图'},$('sheet'));
  const image=node('image',{href:PLAN.source.planImage,width,height,opacity:.65},svg);
  const overlay=node('g',{opacity:.78},svg), measures=node('g',{display:'none'},svg);
  function rect(bounds,fill,group){
    const [x,z,X,Z]=bounds.map(v=>v/scale);
    node('rect',{x,y:z,width:X-x,height:Z-z,fill},group);
  }
  for(const s of wallSpans){
    const fill=!s.opening?'#377d65':blocksMovement(s)?'#558ba9':'#db9058';
    rect(s.bounds,fill,overlay);
  }
  openLeaves.forEach(bounds=>rect(bounds,'#9b7951',overlay));
  PLAN.rails.forEach(r=>rect(r.bounds,'#377d65',overlay));
  const fixtures=node('g',{fill:'none'},svg);
  const marks=new Map(),defaults=new Map(),storageKey='radiant/2c/furniture-layout/v1';
  const select=$('item-select'),hint=$('edit-hint');
  let selected,drag;
  const overlapping=(a,b)=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1];
  function fits(f,x,z,front){
    const b=placementBounds(f,x,z,front),[a,c,A,C]=b;
    const {x:sx,z:sz}=PLAN.spawn,r=PLAN.parameters.bodyRadius;
    if(overlapping(b,[sx-r,sz-r,sx+r,sz+r]))return false;
    return [[a,c],[a,C],[A,c],[A,C]].every(([X,Z])=>insidePolygon(X,Z,PLAN.floors[0].polygon))
      && !openLeaves.some(bounds=>overlapping(b,bounds))
      && !PLAN.walls.some(w=>overlapping(b,w.bounds))
      && !PLAN.fixtures.some(other=>other!==f&&overlapping(b,other.bounds));
  }
  function transform(f,x=f.center[0],z=f.center[1],front=f.front){
    marks.get(f.id).setAttribute('transform',`translate(${x/scale} ${z/scale}) rotate(${-headingAngle[front]*180/Math.PI})`);
  }
  for(const f of PLAN.fixtures){
    defaults.set(f.id,[...f.center,f.front]);
    const opt=new Option(f.name+' · '+f.id.split('-')[0].replace('living','客厅').replace('ensuite','套卫').replace('bath','公卫').replace('main','主卧').replace('second','次卧').replace('kitchen','厨房').replace('island','餐区').replace('laundry','洗衣区'),f.id);
    select.add(opt);
    const g=node('g',{class:'furniture-mark','data-item':f.id},fixtures);
    marks.set(f.id,g);node('title',{},g).textContent=opt.text;
    const W=f.size[0]/scale,D=f.size[1]/scale;
    node('rect',{class:'footprint',x:-W/2,y:-D/2,width:W,height:D,rx:2,fill:'#c5b49b','fill-opacity':.88,stroke:'#746957'},g);
    const k=1000*scale,colors={wool:'#9a958c',waffle:'#e1d3b8',runner:'#748373',oak:'#c0936c',cloth:'#e4d8c4',linen:'#889eaf',stone:'#e7dfcd',ceramic:'#f8f5ec',steel:'#b7c1c0',plaid:'#b39c82',black:'#566160'};
    for(const [,mat,shape,X,Z,w,d] of HOME_DESIGNS[f.design]?.parts||[]){
      const attrs={fill:colors[mat]||'#d4d9ce',stroke:'#756e5d','stroke-width':.48,'pointer-events':'none'};
      if(['wc','ring','pedestal','roundtop','stoolseat'].includes(shape))node('ellipse',{cx:X/k,cy:Z/k,rx:w/2/k,ry:d/2/k,...attrs},g);
      else node('rect',{x:(X-w/2)/k,y:(Z-d/2)/k,width:w/k,height:d/k,rx:1.5,...attrs},g);
    }
    transform(f);
  }
  function choose(f){
    selected=f;select.value=f.id;
    marks.forEach((mark,id)=>mark.classList.toggle('active',id===f.id));
    const link=$('item-drawing'),design=HOME_DESIGNS[f.design];
    link.hidden=!f.design;
    if(f.design)link.href=design?'furniture/'+f.design+'.svg':'samples/'+(f.design==='V01'?'vanity':'chair')+'/drawing.svg';
  }
  function cancelDrag(){
    if(!drag)return;
    transform(drag.f);marks.get(drag.f.id).classList.remove('invalid');drag=null;
  }
  function commit(f,x,z,front){
    if(!fits(f,x,z,front)){
      hint.textContent='此处需给墙、门洞、玄关起点或其他家具留出空间。';transform(f);return;
    }
    placeFurniture(f,x,z,front);transform(f);
    document.dispatchEvent(new CustomEvent('furniture-moved',{detail:f}));
    const saved={};
    for(const item of PLAN.fixtures)saved[item.id]=[...item.center,item.front];
    try{localStorage.setItem(storageKey,JSON.stringify(saved));hint.textContent='摆位已保存。切回三维模型可查看。';}
    catch{hint.textContent='本次摆位已更新。此浏览器无法保存到下次打开。';}
  }
  // Restore as a single layout, so two objects can legitimately have exchanged places.
  try{
    const data=JSON.parse(localStorage.getItem(storageKey)||'null');
    if(data&&typeof data==='object'){
      for(const f of PLAN.fixtures){
        const p=data[f.id];
        if(Array.isArray(p)&&p.length===3&&p.slice(0,2).every(Number.isFinite)&&Object.hasOwn(headingAngle,p[2]))placeFurniture(f,...p);
      }
      const restored=new Set();
      for(;;){
        const blocked=PLAN.fixtures.filter(f=>!restored.has(f.id)&&!fits(f,...f.center,f.front));
        if(!blocked.length)break;
        for(const f of blocked){placeFurniture(f,...defaults.get(f.id));restored.add(f.id);}
      }
      if(restored.size)hint.textContent='与当前门扇或家具冲突的摆位已复位。';
      for(const f of PLAN.fixtures)transform(f);
    }
  }catch{/* The sample layout is already available when storage is disabled. */}
  choose(PLAN.fixtures.find(f=>f.design==='S02'));
  select.onchange=()=>{cancelDrag();choose(PLAN.fixtures.find(f=>f.id===select.value));};
  $('turn-item').onclick=()=>{
    const cycle=['south','west','north','east'];
    commit(selected,...selected.center,cycle[(cycle.indexOf(selected.front)+1)%4]);
  };
  $('restore-item').onclick=()=>commit(selected,...defaults.get(selected.id));
  function point(e){const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());return [p.x*scale,p.y*scale];}
  svg.onpointerdown=e=>{
    const mark=e.target.closest('[data-item]');
    if(!mark||e.button!==0)return;
    choose(PLAN.fixtures.find(f=>f.id===mark.dataset.item));const [x,z]=point(e);
    drag={f:selected,dx:selected.center[0]-x,dz:selected.center[1]-z,origin:[x,z],moved:false};
    svg.setPointerCapture(e.pointerId);e.preventDefault();
  };
  svg.onpointermove=e=>{
    if(!drag)return;
    const [x,z]=point(e);
    if(Math.hypot(x-drag.origin[0],z-drag.origin[1])<.025&&!drag.moved)return;
    drag.moved=true;drag.x=Math.round((x+drag.dx)*100)/100;drag.z=Math.round((z+drag.dz)*100)/100;
    transform(drag.f,drag.x,drag.z);
    marks.get(drag.f.id).classList.toggle('invalid',!fits(drag.f,drag.x,drag.z,drag.f.front));
  };
  svg.onpointerup=()=>{if(!drag)return;const d=drag;cancelDrag();if(d.moved)commit(d.f,d.x,d.z,d.f.front);};
  svg.onlostpointercapture=svg.onpointercancel=cancelDrag;
  $('fixture-layer').onchange=e=>fixtures.style.display=e.target.checked?'':'none';
  for(const c of PLAN.source.calibration){
    const [[x0,y0],[x1,y1]]=c.pixels;
    node('rect',{x:x0,y:y0,width:x1-x0,height:y1-y0,fill:'none',stroke:'#a94b24','stroke-width':2.5,'stroke-dasharray':'8 6'},measures);
    for(const [cx,cy] of c.pixels) node('circle',{cx,cy,r:4,fill:'#a94b24'},measures);
    const measured=[(x1-x0)*scale,(y1-y0)*scale],reference=c.referenceInches.map(v=>v*.0254);
    const fmt=a=>a.map(x=>x.toFixed(2)).join(' × ');
    const diff=measured.map((v,i)=>Math.round((v-reference[i])*100)).join(' / ');
    const row=document.createElement('div');row.className='measure';
    row.innerHTML='<strong>'+c.room+'</strong><span>图示 '+fmt(reference)+' m</span><span>模型 '+fmt(measured)+' m</span><span>宽 / 深差值 '+diff+' cm</span>';row.title=c.note;
    $('calibrations').append(row);
  }
  $('overlay').onchange=e=>overlay.style.display=e.target.checked?'':'none';
  $('measures').onchange=e=>measures.setAttribute('display',e.target.checked?'inline':'none');
  $('opacity').oninput=e=>image.setAttribute('opacity',Number(e.target.value)/100);
})();
