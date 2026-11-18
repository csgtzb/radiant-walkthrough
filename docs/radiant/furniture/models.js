// Component positions are local to the drawing; all placements in plan.js are in metres.
const homeMaterials=(()=>{
  const T=THREE,finish=photoFinishes.material;
  return {
    maple:chairFinishes.oak,granodiorite:vanityFinishes.marble,
    oak:chairFinishes.oak,stone:vanityFinishes.marble,wool:roomFinishes.wool,
    plaid:chairFinishes.fabric,runner:roomFinishes.wool,waffle:roomFinishes.cotton,cloth:roomFinishes.cotton,
    gasket:finish('seal',{roughness:.82}),
    upper:finish('upper',{roughness:.58}),
    ceramic:finish('porcelain',{roughness:.19,clearcoat:.8,clearcoatRoughness:.10}),
    seat:finish('seat',{roughness:.29}),steel:finish('metal',{roughness:.27,metalness:.86}),
    chrome:finish('chrome',{roughness:.24,metalness:.85}),enamel:finish('appliance',{roughness:.34,metalness:.48}),
    sinkSteel:finish('sinksteel',{roughness:.26,metalness:.85}),plinth:finish('plinth',{roughness:.59}),
    ovenGlass:finish('oven',{roughness:.18}),black:finish('hob',{roughness:.19,metalness:.24}),
    glass:finish('glass',{transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false,roughness:.08}),
    ready:Promise.all([roomFinishes.ready,chairFinishes.ready,photoFinishes.ready()])
  };
})();

const homeTemplates=new Map();
function buildHomeFurniture(code){
  if(homeTemplates.has(code))return homeTemplates.get(code).clone();
  const T=THREE,design=HOME_DESIGNS[code],model=new T.Group();
  const kitchen=code==='K01'||code==='K02';
  const bed=code==='B01'||code==='B02';
  const finishes={...homeMaterials};
  if(bed){
    const fabric=(id)=>photoFinishes.material(id,{sheen:.30,sheenRoughness:.90,roughness:.94});
    finishes.waffle=fabric('ivoryPercale');finishes.cloth=fabric('linen');
    finishes.runner=fabric(code==='B01'?'stripedLinen':'wovenSlate');
    finishes.headboard=fabric('basketPillow');finishes.accent=fabric('wovenSlate');
    finishes.lumbar=fabric('stripedLinen');
  }
  if(code==='T01'){
    finishes.ceramic=photoFinishes.material('wcGlaze',{roughness:.23,clearcoat:.48,clearcoatRoughness:.16});
    finishes.seat=photoFinishes.material('wcCover',{roughness:.34});
  }
  if(kitchen)finishes.sinkSteel=photoFinishes.material('brushedSteel',{roughness:.32,metalness:.63});
  if(kitchen)finishes.stone=photoFinishes.material('honedTop',{roughness:.29,clearcoat:.16});
  model.name=code;model.scale.setScalar(.001);
  for(const [label,material,shape,x,z,w,d,low,high] of design.parts){
    const group=new T.Group(),h=high-low;
    group.position.set(x,low,z);group.name=label;model.add(group);
    function add(g,mat,X,Y,Z){
      if(mat==='black'&&shape==='oven')mat='ovenGlass';
      if(mat==='steel'&&shape==='sink')mat='sinkSteel';
      if(mat==='steel'&&['tap','shower'].includes(shape))mat='chrome';
      if(mat==='black'&&label==='踢脚')mat='plinth';

      const mesh=new T.Mesh(g,finishes[mat]);mesh.position.set(X,Y,Z);
      mesh.castShadow=!['glass','water'].includes(mat);mesh.receiveShadow=mesh.castShadow;
      group.add(mesh);return mesh;
    }
    function mapBox(g,mat,W,H,D){
      if(!finishes[mat].map)return;
      const dims={headboard:[115,125],oak:[420,411],stone:[240,137],wool:[270,276],
        cloth:[271,271],plaid:[323,400]}[mat];
      if(!dims)return;
      const {uv}=g.attributes;
      // RoundedBox retains its six BoxGeometry face groups and its rounded-edge UVs.
      for(let face=0;face<6;face++){
        const {start,count}=g.groups[face],side=face<2,top=face===2||face===3;
        const across=side?D:W,along=top?D:H;
        for(let i=start;i<start+count;i++){
          const u=uv.getX(i),v=uv.getY(i);
          if(mat==='oak'&&W>H&&!side)uv.setXY(i,.31+v*along/dims[0],.17+u*across/dims[1]);
          else uv.setXY(i,.11+(u*across+x*.28)/dims[0],.27+(v*along+z*.16)/dims[1]);
        }
      }
    }
    function box(W,H,D,X=0,Y=h/2,Z=0,mat=material,r=3){
      const g=new VanityRoundedBox(W,H,D,r>18?4:1,r);
      if(kitchen&&mat==='steel'&&W===w&&H===h&&/冰箱|冷藏|冷冻|洗碗机|抽油烟机/.test(label))mat='enamel';
      mapBox(g,mat,W,H,D);return add(g,mat,X,Y,Z);
    }
    function cylinder(rt,rb,H,X,Y,Z,mat,sides=36){
      return add(new T.CylinderGeometry(rt,rb,H,sides),mat,X,Y,Z);
    }
    function pipe(points,r,mat){
      const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');
      return add(new T.TubeGeometry(curve,32,r,9,false),mat,0,0,0);
    }
    // Each ring is [width, depth, elevation, centreZ]. Increasing and then decreasing
    // elevation forms one continuous, glazed surface around the lip and inside the bowl.
    function shell(rings,exponent,mat,visibility){
      const positions=[],tex=[],indices=[],colors=[],N=64;
      for(const [k,[W,D,Y,Z=0]] of rings.entries()){
        for(let i=0;i<=N;i++){
          const a=i/N*2*Math.PI,c=Math.cos(a),s=Math.sin(a);
          positions.push(W*.5*Math.sign(c)*Math.abs(c)**exponent,Y,Z+D*.5*Math.sign(s)*Math.abs(s)**exponent);
          tex.push(i/N,k/(rings.length-1));
          if(visibility){const a=visibility[k];colors.push(a,a,a);}
          if(k&&i<N){
            const j=(k-1)*(N+1)+i,next=j+N+1;
            indices.push(j,next,j+1,j+1,next,next+1);
          }
        }
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(tex,2));g.setIndex(indices);g.computeVertexNormals();
      const mesh=add(g,mat,0,0,0);
      if(visibility){
        g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
        mesh.material=mesh.material.clone();mesh.material.vertexColors=true;
      }
      return mesh;
    }
    function bedCover(){
      const runner=material==='runner';
      const duvet=design.parts.find(p=>p[2]==='quilt'&&p[1]==='waffle');
      const [, , , ,cz,W,D,,top]=duvet;
      // The runner samples the same support surface as the duvet so their layers stay in contact.
      function support(X,Z){
        const u=2*X/W,v=2*(Z-cz)/D,side=Math.min(1,Math.abs(u)),foot=Math.max(0,v);
        const hem=side**18,foldTop=-.80+.040*Math.sin(2.2*u)+.025*u;
        const fold=(line,spread,amount)=>amount*Math.exp(-((v-line)**2)/spread);
        const loft=12*(1-u*u)*(1-v*v);
        const wrinkles=fold(.01+.48*u+.09*u*u,.0030,21)*Math.exp(-((u+.49)**2)/.19)
          +fold(.22-.46*u,.006,-18)*Math.exp(-((u-.65)**2)/.18)
          +fold(-.32-.22*u+.10*u*u,.007,15)*Math.exp(-((u-.13)**2)/.32);
        // Stitched baffles pull the fill down into narrow channels. The turned cuff lies over these seams.
        const row=(v+1)*1.55+.045*Math.sin(3*u+4*v),col=(u+1)*1.33+.039*Math.sin(3*v-u);
        const channel=q=>Math.exp(-((q-Math.round(q))**2)/.003);
        const stitch=v>foldTop+.06?-5.5*Math.max(channel(row),channel(col)):0;
        const cuff=fold(foldTop,.0029,27)-fold(foldTop+.067,.0008,13);
        return top+loft+wrinkles+cuff+stitch-hem*(147+19*Math.sin(v*10+u))-86*foot**19+
          hem*7*Math.cos(v*32+u)+3*Math.sin(8*u+4*v);
      }
      const nx=76,nz=runner?22:84,vertices=[],uvs=[],indices=[],shades=[];
      function vertex(i,j){
        const u=i/nx*2-1,v=j/nz*2-1,edge=Math.abs(u)**12;
        const X=u*w/2,Z=z+v*d/2+(runner?19*u:11*Math.sin(u*2+v));
        const fold=runner?17+6*Math.cos(6*u+v)+4*edge*Math.sin(8*v+u):0;
        const pinch=Math.exp(-((u-.57*v-.29)**2)/.007)*Math.exp(-((v+.23)**2)/.21);
        const ripple=10*Math.sin(v*19+3*u)*edge+13*pinch;
        const y=support(X,Z)+fold+ripple;
        return [X,y-low,Z-z];
      }
      for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
        const position=vertex(i,j);vertices.push(...position);
        uvs.push(position[0]/(runner?340:270),(-position[2]+(1-i/nx)*4)/(runner?175:276));
        const u=i/nx*2-1,v=j/nz*2-1;
        const binding=runner?(Math.abs(v)>.88?.67:Math.abs(v)>.84?.93:Math.abs(v)>.79?.72:.90):1;
        const shade=binding*(1-.19*Math.abs(u)**14);shades.push(shade,shade,shade);
        if(i<nx&&j<nz){const a=j*(nx+1)+i,b=a+nx+1;indices.push(a,b,a+1,a+1,b,b+1);}
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setAttribute('color',new T.Float32BufferAttribute(shades,3));g.setIndex(indices);g.computeVertexNormals();
      const mesh=add(g,material,0,0,0);mesh.material=mesh.material.clone();mesh.material.vertexColors=true;mesh.material.side=T.DoubleSide;
      // Rolled hems at the four cut edges cast a contact line on the layer underneath.
      const hem=[];
      for(let i=0;i<=nx;i++)hem.push(vertex(i,0));
      for(let j=1;j<=nz;j++)hem.push(vertex(nx,j));
      for(let i=nx-1;i>=0;i--)hem.push(vertex(i,nz));
      for(let j=nz-1;j>0;j--)hem.push(vertex(0,j));
      // The comforter has a filled edge; close its gusset against the mattress at the foot and sides.
      if(!runner){
        const strip=[],coords=[],faces=[];
        for(let i=0;i<=hem.length;i++){
          const [a,b,c]=hem[i%hem.length],taper=1-.02*Math.abs(2*a/w);
          strip.push(a,b,c,a*taper,b-23,c*.995);coords.push(i/hem.length*12,0,i/hem.length*12,.085);
          if(i<hem.length){const j=i*2;faces.push(j,j+1,j+2,j+1,j+3,j+2);}
        }
        const edgeGeometry=new T.BufferGeometry();edgeGeometry.setAttribute('position',new T.Float32BufferAttribute(strip,3));
        edgeGeometry.setAttribute('uv',new T.Float32BufferAttribute(coords,2));edgeGeometry.setIndex(faces);edgeGeometry.computeVertexNormals();
        const edge=add(edgeGeometry,material,0,0,0);edge.material=edge.material.clone();edge.material.side=T.DoubleSide;
      }
      const curve=new T.CatmullRomCurve3(hem.map(([a,b,c])=>new T.Vector3(a,b-2,c)),true);
      add(new T.TubeGeometry(curve,hem.length,runner?3:5,6,true),material,0,0,0);
    }
    function cushion(){
      // A superellipsoid gives the textile a continuous crown across its broad panels.
      const pillow=shape==='pillow',back=shape==='back';
      const sofaSeat=shape==='pad'&&material==='wool',hand=x<0?-1:1;
      const power=pillow?3.5:back?4.8:sofaSeat?3.9:5.0,depth=back?d*.73:d;
      const geometry=new T.BoxGeometry(2,2,2,40,24,34),{position,normal,uv}=geometry.attributes;
      const map=material==='wool'?[270,276]:material==='plaid'?[323,400]:[271,271];
      function surface(a,b,c){
        const norm=(Math.abs(a)**power+Math.abs(b)**power+Math.abs(c)**power)**(1/power);
        const X=a/norm,Z=c/norm,Y=b/norm;
        let offset=0;
        let push=0;
        if(pillow){
          const pinch=Math.abs(X)**3+Math.abs(Z)**4;
          offset=pinch*(8*Math.sin(12*X+7*Z)+5*Math.cos(9*Z-5*X))*(.5+.5*Y);
          offset-=13*Math.max(Y,0)*Math.exp(-((X+.22)**2+(Z-.15)**2)/.18);
        }else if(back){
          const height=1-Y*Y,edge=Math.abs(X)**4,front=Math.max(Z,0);
          push=front*(19*height*(1-X*X)-9*edge*Math.cos(11*Y+X)-14*Math.exp(-((X+.4*Y)**2)/.042)*(1-Y)*.35);
          offset=4*Math.sin(4*X+Z)*(1-X*X);
        }else if(sofaSeat){
          // A shallow sitting hollow rolls up into a fuller front bolster.
          const hollow=Math.exp(-((X-.20*hand)**2/.37+(Z+.28)**2/.34));
          const bolster=Math.exp(-((Z-.60)**2)/.12)*(1-.7*X*X);
          const front=Math.max(Z,0)**3;
          const tuck=(center,slope)=>Math.exp(-((X-center-slope*Y)**2)/.009);
          const gathers=tuck(.53*hand,.17)+.72*tuck(-.74*hand,-.11);
          offset=Math.max(Y,0)*(-29*hollow+13*bolster-8*front*gathers);
          push=front*(7*Math.sin(3*X+hand)-10*gathers)*(1-Y*Y);
        }
        return new T.Vector3(X*w/2,Y*h/2+offset,Z*depth/2+push);
      }
      for(let i=0;i<position.count;i++){
        const v=surface(position.getX(i),position.getY(i),position.getZ(i));
        const side=Math.abs(normal.getX(i))>.5,top=Math.abs(normal.getY(i))>.5;
        uv.setXY(i,((side?v.z:v.x)+x*.19)/map[0],(top?-v.z:v.y)/map[1]);
        position.setXYZ(i,v.x,v.y,v.z);
      }
      geometry.computeVertexNormals();
      const mesh=add(geometry,material,0,h/2,0);
      if(back){mesh.rotation.x=x<0?-.15:-.20;mesh.rotation.z=x<0?-.018:.022;}
      if(pillow){mesh.rotation.x=x>0?.21:.16;mesh.position.y+=13;mesh.rotation.y=x>0?.06:-.055;}
      const line=[],N=160,level=.32;
      for(let i=0;i<N;i++){
        const angle=i*2*Math.PI/N,a=Math.cos(angle),c=Math.sin(angle);
        const edge=(Math.abs(a)**power+Math.abs(c)**power)**(1/power);
        const v=back?surface(a/edge,c/edge,.60):surface(a/edge,level,c/edge);
        v.x*=1.002;v.y*=1.002;v.z*=1.002;line.push(v);
      }
      const path=new T.CatmullRomCurve3(line,true);
      const seam=new T.TubeGeometry(path,N,2.0,6,true);
      for(let i=0;i<seam.attributes.uv.count;i++)seam.attributes.uv.setXY(i,seam.attributes.uv.getX(i)*path.getLength()/map[0],seam.attributes.uv.getY(i)*.05);
      const piping=add(seam,material,0,h/2,0);piping.rotation.copy(mesh.rotation);piping.position.y=mesh.position.y;
    }
    function pull(width,y,front){
      const a=Math.min(width*.54,242);
      for(const X of [-a/2+5,a/2-5])box(10,10,19,X,y,front+7,'steel',2);
      box(a,10,10,0,y,front+16,'steel',3);
    }
    switch(shape){
      case 'foot': cylinder(w*.48,w*.36,h,0,h/2,0,material,16);break;
      case 'pad':case 'pillow':case 'back':cushion();break;
      case 'quilt':bedCover();break;
      case 'soft':
        if(bed && label==='包布床头'){
          box(w,h,d,0,h/2,0,'headboard',42);
          for(const side of [-1,1]){
            const pad=tailoredPillow(w*.498,h*.91,47,finishes.headboard,side,[9,6]);
            pad.position.set(side*w*.248,h*.51,d*.36);group.add(pad);
          }
        }else if(code==='T01'){
          const cap=label==='箱盖';
          shell(cap?[[w*.95,d*.94,0],[w,d,6],[w,d,h-10],[w*.98,d*.98,h-2],[w*.91,d*.9,h],[1,1,h]]:
            [[w*.82,d*.80,0],[w*.88,d*.86,12],[w*.97,d*.97,h*.65],[w,d,h-17],[w*.98,d*.98,h],[1,1,h]],.31,material);
        }else box(w,h,d,0,h/2,0,material,Math.min(h*.4,d*.28,w*.22,48));
        break;
      case 'lid':{
        // Seat and cover rest on the bowl with a visible joint and two rear hinge barrels.
        group.position.set(0,423,62);
        shell([[338,487,2,7],[349,501,4,7],[354,510,8,7],[351,507,15,7],
          [338,490,20,7],[297,439,23,7],[195,308,25,7],[1,1,26,7]],.86,'seat');
        for(const X of [-88,88]){
          cylinder(15,17,11,X,0,-205,'chrome');
          const hinge=cylinder(9,9,40,X,11,-202,'chrome');hinge.rotation.z=Math.PI/2;
        }
        break;
      }
      case 'wc':
        const valve=pipe([[w*.41,23,-241],[w*.41,98,-241],[w*.42,129,-229],[w*.37,230,-226],[w*.32,301,-239]],4.2,'chrome');
        valve.name='进水软管';
        cylinder(10,12,8,w*.41,8,-241,'chrome');
        box(22,6,13,w*.41,99,-236,'steel',3);
        // The pedestal flares into a rear ledge that supports the close-coupled cistern.
        shell([[w*.50,200,0,-162],[w*.53,205,14,-162],[w*.47,185,152,-158],
          [w*.55,215,264,-164],[w*.69,240,308,-174],[w*.68,235,325,-174],[1,1,325,-174]],.54,material);
        for(const side of [-1,1]){
          const cap=add(new T.SphereGeometry(10,18,10),material,side*w*.31,36,-52);
          cap.scale.set(.6,1,1.15);
        }
        shell([[w*.61,d*.66,0,-51],[w*.66,d*.69,12,-48],[w*.65,d*.67,115,-48],[w*.69,d*.72,176,-36],
          [w*.80,d*.85,222,-15],[w*.95,d*.96,304],[w,d,365],[w*.98,d*.99,h],[w*.78,d*.76,h-3,19],
          [w*.69,d*.67,327,24],[w*.56,d*.52,243,16],[w*.3,d*.26,182,-20],[8,10,178,-23]],.93,material,[.57,.68,.84,.89,.96,1,.99,.88,.78,.70,.61,.47,.37]);
        break;
      case 'ring':
        shell([[w*.96,d*.96,0],[w,d,h*.42],[w*.97,d*.98,h-2],[w*.9,d*.91,h],[w*.75,d*.73,h-1,15],
          [w*.70,d*.69,h*.6,15],[w*.72,d*.71,0,15],[w*.96,d*.96,0]],.90,material);break;
      case 'tub':case 'tray':{
        const tray=shape==='tray',rim=tray?38:93;
        shell([[w-8,d-8,0],[w,d,14],[w,d,h-12],[w-8,d-8,h],[w-rim*2,d-rim*2,h],
          [w-rim*2-16,d-rim*2-22,h-14],[w-rim*2-60,d-rim*2-(tray?84:230),tray?20:123],
          [w*.42,d*.4,tray?16:109],[2,2,tray?16:108]],tray?.16:.23,material,[.64,.78,.98,1,1,.95,.86,.80,.78]);
        cylinder(28,28,3,0,tray?23:128,-d*.20,'steel');break;
      }
      case 'button':{
        const base=cylinder(w*.52,w*.52,2,0,1,0,'chrome');base.scale.z=d/w;
        for(const side of [-1,1]){
          const pad=box(w*(side<0?.55:.32),3.8,d*.82,side*(side<0?w*.16:w*.31),3,0,'steel',3);
          pad.rotation.z=side*.024;
        }
        break;
      }
      case 'stoolseat':case 'roundtop':case 'pedestal':{
        const top=w/2,bottom=shape==='pedestal'?w*.40:top;
        const g=new T.LatheGeometry([[.001,0],[bottom-3,0],[bottom,3],[top,h-4],[top-3,h],[.001,h]].map(([a,b])=>new T.Vector2(a,b)),64);
        const {uv,position,normal}=g.attributes;
        for(let i=0;i<uv.count;i++){
          const X=position.getX(i),Y=position.getY(i),Z=position.getZ(i);
          if(Math.abs(normal.getY(i))>.65)uv.setXY(i,.18+X/(material==='stone'?240:1000),.3+Z/(material==='stone'?137:1000));
          else uv.setXY(i,(uv.getX(i)*w*Math.PI)/1400,Y/1400);
        }
        const m=add(g,material,0,0,0);m.scale.z=d/w;break;
      }
      case 'drawer':case 'door':case 'appliance':case 'oven':case 'upper':{
        if(kitchen && ['drawer','door','upper'].includes(shape)){
          // The cabinet carcass stops behind the door, leaving a recessed shadow joint.
          const overhead=shape==='upper',panel=overhead?'upper':material, front=d/2;
          box(w-2,h-2,d-18,0,h/2,-9,material,2);
          box(w-3,h-3,3,0,h/2,front-18,'gasket',1);
          box(w-6,h-6,16,0,h/2,front-7,panel,2);
          const handleY=overhead?13:h-17,grip=Math.min(110,w*.34);
          box(grip,4,16,0,handleY,front+7,'steel',1.8);
          box(grip,10,4,0,handleY+(overhead?-3:3),front+14,'steel',1.8);
          break;
        }
        box(w,h,d,0,h/2,0,material,shape==='appliance'?8:3);
        if(shape==='upper'){
          box(w-5,h-8,16,0,h/2,d/2-3,'upper');
        }else if(shape==='oven'){
          box(w*.87,h*.58,5,0,h*.43,d/2+2,'black',9);
          for(const X of [-w*.34,w*.34]){
            const dial=cylinder(19,19,13,X,h*.91,d/2+8,'steel');dial.rotation.x=Math.PI/2;
          }
          box(w*.93,42,6,0,h*.89,d/2+2,'ovenGlass',3);
          box(w*.27,23,4,0,h*.89,d/2+7,'black',2);
          for(let row=0;row<3;row++) box(w*.68,2.2,3,0,h*(.28+.11*row),d/2+5,'ovenGlass',1);
          pull(w,h*.77,d/2);
        }else if(kitchen && label==='冷藏室'){
          const inset=-w*.39,handleY=h*.33,span=278;
          for(const yy of [handleY-span/2,handleY+span/2])box(12,12,24,inset,yy,d/2+9,'steel',4);
          box(16,span+15,14,inset,handleY,d/2+22,'steel',6);
        }else pull(w,shape==='door'?h*.61:h-42,d/2);
        break;
      }
      case 'box':
        if(kitchen && material==='stone'){
          box(w,h-5,d,0,(h+5)/2,0,'stone',5);
          box(w-5,5,d-5,0,2.5,0,'stone',2);
        }else box(w,h,d);
        break;
      case 'sink':{
        const rim=h-31,innerW=w*.75,innerD=d*.59,side=(w-innerW)/2,edge=(d-innerD)/2;
        for(const X of [-w/2+side/2,w/2-side/2])box(side,31,d,X,h-15.5,0,'stone');
        for(const Z of [-d/2+edge/2,d/2-edge/2])box(innerW,31,edge,0,h-15.5,Z,'stone');
        shell([[innerW+3,innerD+4,rim+29],[innerW-10,innerD-10,rim+23],[innerW-23,innerD-20,27],[innerW-60,innerD-62,11],[2,2,8]],.19,'steel');
        cylinder(31,30,3,0,14,0,'steel');
        cylinder(20,20,3,0,16,0,'gasket');
        for(let i=0;i<8;i++){
          const a=i*Math.PI/4;
          const strut=box(2.5,2,13,Math.sin(a)*11,18,Math.cos(a)*11,'steel',1);
          strut.rotation.y=a;
        }
        break;
      }
      case 'hob':
        for(let i=0;i<4;i++){
          const X=w*.42,Z=(i-1.5)*d*.18;
          cylinder(12,15,9,X,h+5,Z,'steel',32);
          box(2,1.5,7,X,h+10,Z+3,'gasket',.6);
        }
        box(w,h,d,0,h/2,0,material,7);
        for(const [X,Z,R] of [[-.24,-.25,.17],[.24,-.24,.13],[-.25,.23,.13],[.22,.18,.21]]){
          const g=new T.TorusGeometry(w*R,1.5,6,52);const m=add(g,'steel',X*w,h+1,Z*d);m.rotation.x=Math.PI/2;
        }break;
      case 'tap':{
        const r=Math.min(w*.17,13);
        pipe([[0,0,-d*.38],[0,h*.70,-d*.38],[0,h-r,-d*.19],[0,h-r,d*.20],[0,h*.72,d*.36]],r,material);
        cylinder(w*.31,w*.39,10,0,5,-d*.38,material);
        box(w*.56,9,13,w*.22,h*.32,-d*.38,material);break;
      }
      case 'shower':
        pipe([[0,0,d*.42],[0,h*.86,d*.42],[0,h-15,d*.37],[0,h-15,-d*.23],[0,h-38,-d*.23]],9,material);
        box(w,13,d*.75,0,h-51,-d*.12,material,5);
        box(180,40,51,0,75,d*.34,material,12);break;
      case 'hood':
        box(w,h,d,0,h/2,0,material,8);box(w*.72,4,d*.64,0,1,5,'black');break;
      default:box(w,h,d);
    }
  }
  if(code==='K01'){
    const boardMaterial=photoFinishes.material('boardWood',{roughness:.68});
    for(const [x,wide,tall,tilt] of [[509,215,327,.044],[414,159,242,-.053]]){
      const board=new T.Mesh(new VanityRoundedBox(wide,tall,17,4,8),boardMaterial);
      board.name='备餐砧板';board.position.set(x,909+tall*.5,-252+(tall<300?30:0));
      board.rotation.set(-.12,tilt*.5,tilt);board.castShadow=board.receiveShadow=true;
      model.add(board);
    }
    // A staggered glazed backsplash sits between the counter and the upper cabinets.
    const backing=photoFinishes.material('trim',{roughness:.86});
    const tile=photoFinishes.material('splash',{roughness:.29,clearcoat:.32});
    const width=2364,height=552,left=-1558,bottom=909,back=-302;
    const grout=new T.Mesh(new T.BoxGeometry(width,height,7),backing);
    grout.position.set(left+width/2,bottom+height/2,back);grout.receiveShadow=true;model.add(grout);
    const positions=[],normals=[],uv=[],faces=[];
    for(let row=0;row<6;row++){
      for(let cell=-(row%2)*115;cell<width;cell+=230){
        const a=Math.max(0,cell)+1.2,b=Math.min(width,cell+230)-1.2;
        const y=bottom+row*92+1.1,yt=y+89.8,idx=positions.length/3;
        for(const [inset,z] of [[0,back+3.6],[1.7,back+5.4]]){
          for(const [x,v,nx,ny] of [[a+inset,y+inset,-1,-1],[b-inset,y+inset,1,-1],[b-inset,yt-inset,1,1],[a+inset,yt-inset,-1,1]]){
            positions.push(left+x,v,z);uv.push(x/520,v/520);
            const normal=new T.Vector3(nx*.025,ny*.025,inset?1:.26).normalize();normals.push(...normal.toArray());
          }
        }
        faces.push(idx+4,idx+5,idx+6,idx+4,idx+6,idx+7);
        for(let j=0;j<4;j++){
          const k=(j+1)%4;faces.push(idx+j,idx+k,idx+k+4,idx+j,idx+k+4,idx+j+4);
        }
      }
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setIndex(faces);
    const face=new T.Mesh(g,tile);face.name='釉面砖防溅墙';face.receiveShadow=true;model.add(face);
  }
  if(bed){
    const [width,length]=design.size;
    for(const side of [-1,1]){
      const cushion=tailoredPillow(width*.29,320,119,finishes.accent,side,[2.2,2.1]);
      cushion.name='织纹靠枕';cushion.position.set(side*width*.166,650,-length*.34+side*12);
      cushion.rotation.set(-.25,side*.07,side*.045);model.add(cushion);
    }
    const lumbar=tailoredPillow(width*.34,175,110,finishes.lumbar,.6,[1.6,1.2]);
    lumbar.name='条纹腰枕';lumbar.position.set(width*.015,564,-length*.27);
    lumbar.rotation.set(-.17,-.06,-.028);model.add(lumbar);
  }
  homeTemplates.set(code,model);
  return model.clone();
}
