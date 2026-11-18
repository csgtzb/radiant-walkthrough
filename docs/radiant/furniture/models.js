// Component positions are local to the drawing; all placements in plan.js are in metres.
const homeMaterials=(()=>{
  const T=THREE,finish=photoFinishes.material;
  return {
    maple:chairFinishes.oak,granodiorite:vanityFinishes.marble,
    oak:chairFinishes.oak,stone:vanityFinishes.marble,wool:roomFinishes.wool,
    plaid:chairFinishes.fabric,runner:roomFinishes.wool,waffle:roomFinishes.cotton,cloth:roomFinishes.cotton,
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
  const finishes=homeMaterials;
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
      const dims={oak:[420,411],stone:[240,137],wool:[270,276],
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
        const row=(v+1)*2.4+.035*Math.sin(3*u+4*v),col=(u+1)*1.8+.031*Math.sin(3*v-u);
        const channel=q=>Math.exp(-((q-Math.round(q))**2)/.003);
        const stitch=v>foldTop+.06?-10*Math.max(channel(row),channel(col)):0;
        const cuff=fold(foldTop,.0029,27)-fold(foldTop+.067,.0008,13);
        return top+loft+wrinkles+cuff+stitch-hem*(147+19*Math.sin(v*10+u))-86*foot**19+
          hem*7*Math.cos(v*32+u)+3*Math.sin(8*u+4*v);
      }
      const nx=76,nz=runner?22:84,vertices=[],uvs=[],indices=[],shades=[];
      function vertex(i,j){
        const u=i/nx*2-1,v=j/nz*2-1,edge=Math.abs(u)**12;
        const X=u*w/2,Z=z+v*d/2+(runner?19*u:11*Math.sin(u*2+v));
        const fold=runner?17+6*Math.cos(6*u+v)+4*edge*Math.sin(8*v+u):0;
        const y=support(X,Z)+fold;
        return [X,y-low,Z-z];
      }
      for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
        const position=vertex(i,j);vertices.push(...position);
        uvs.push(position[0]/270,(-position[2]+(1-i/nx)*4)/276);
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
      case 'soft':box(w,h,d,0,h/2,0,material,Math.min(h*.4,d*.28,w*.22,48));break;
      case 'lid':{
        const lid=new T.LatheGeometry([[.01,-.46],[.87,-.46],[.98,-.3],[1,0],[.98,.3],[.86,.46],[.01,.46]].map(([a,b])=>new T.Vector2(a,b)),64);
        const m=add(lid,material,0,h/2,0);m.rotation.x=Math.PI/2;m.scale.set(w/2,d,h/2);
        for(const X of [-w*.29,w*.29])box(25,14,35,X,5,d*.50,'steel',5);
        break;
      }
      case 'wc':
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
      case 'button':case 'stoolseat':case 'roundtop':case 'pedestal':{
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
        box(w,h,d,0,h/2,0,material,shape==='appliance'?8:3);
        if(shape==='upper'){
          box(w-5,h-8,16,0,h/2,d/2-3,'upper');
        }else if(shape==='oven'){
          box(w*.87,h*.58,5,0,h*.43,d/2+2,'black',9);
          for(const X of [-w*.34,w*.34]){
            const dial=cylinder(19,19,13,X,h*.91,d/2+8,'steel');dial.rotation.x=Math.PI/2;
          }
          pull(w,h*.77,d/2);
        }else pull(w,shape==='door'?h*.61:h-42,d/2);
        break;
      }
      case 'sink':{
        const rim=h-31,innerW=w*.75,innerD=d*.59,side=(w-innerW)/2,edge=(d-innerD)/2;
        for(const X of [-w/2+side/2,w/2-side/2])box(side,31,d,X,h-15.5,0,'stone');
        for(const Z of [-d/2+edge/2,d/2-edge/2])box(innerW,31,edge,0,h-15.5,Z,'stone');
        shell([[innerW+3,innerD+4,rim+29],[innerW-10,innerD-10,rim+23],[innerW-23,innerD-20,27],[innerW-60,innerD-62,11],[2,2,8]],.19,'steel');
        cylinder(24,24,3,0,11,0,'black');break;
      }
      case 'hob':
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
  homeTemplates.set(code,model);
  return model.clone();
}
