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
  PLAN.rails.forEach(r=>rect(r.bounds,'#377d65',overlay));
  const fixtures=node('g',{fill:'none'},svg);
  for(const fixture of PLAN.fixtures){
    const group=node('g',{opacity:.65},fixtures);
    node('title',{},group).textContent=fixture.name;
    rect(fixture.bounds,'#94689b',group);
  }
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
