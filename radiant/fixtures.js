// Each fixture is built facing local +Z. Its bounds include the front hardware.
function createFixture(fixture) {
  const T=THREE;
  const group=new T.Group();
  const [x0,z0,x1,z1]=fixture.bounds;
  const w=x1-x0, d=z1-z0, h=fixture.height;
  group.name=fixture.id;
  group.position.set((x0+x1)/2,0,(z0+z1)/2);
  if(fixture.front==='north')group.rotation.y=Math.PI;
  const finish=(color,roughness,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const enamel=finish(0xf4f2e9,.42), metal=finish(0x9ca6a5,.28,.45);
  function mesh(geometry,material,x,y,z){
    const part=new T.Mesh(geometry,material);
    part.position.set(x,y,z);
    part.castShadow=true;part.receiveShadow=true;group.add(part);
    return part;
  }
  function box(width,height,depth,material,x,y,z){
    return mesh(new T.BoxGeometry(width,height,depth),material,x,y,z);
  }
  if(fixture.kind==='laundryStack'){
    const fascia=finish(0xe1e4df,.43), rubber=finish(0x485456,.68), window=finish(0x34464a,.13,.32);
    const unitH=h/2, front=d/2-.04, radius=w*.29;
    function disc(r,depth,mat,x,y,z){
      const part=mesh(new T.CylinderGeometry(r,r,depth,48),mat,x,y,z);
      part.rotation.x=Math.PI/2;
    }
    for(const bottom of [0,unitH]){
      box(w-.012,unitH-.015,d-.04,enamel,0,bottom+unitH/2,-.02);
      const drumY=bottom+unitH*.46;
      disc(radius+.025,.02,metal,0,drumY,front+.010);
      disc(radius,.014,rubber,0,drumY,front+.023);
      disc(radius*.84,.009,window,0,drumY,front+.033);
      const ring=mesh(new T.TorusGeometry(radius*.90,.008,8,48),metal,0,drumY,front+.031);
      ring.name='door-rim';
      box(w-.026,.119,.009,fascia,0,bottom+unitH-.086,front+.005);
      disc(.029,.022,metal,-w*.10,bottom+unitH-.084,front+.018);
      box(w*.20,.040,.011,window,w*.28,bottom+unitH-.085,front+.014);
      box(w*.20,.008,.016,metal,-w*.32,bottom+unitH-.10,front+.016);
    }
  }else if(fixture.kind==='vanity'){
    const cabinet=finish(0xe3e3d9,.66), reveal=finish(0x9ba49a,.66);
    const ceramic=finish(0xfaf8ef,.26);
    const front=d/2, boxH=h-.115, centerY=.075+boxH/2, midZ=.018;
    box(w-.084,.09,d-.085,reveal,0,.045,-.023);
    // Open cabinet top leaves space for the recessed bowl.
    for(const side of [-1,1])box(.018,boxH,d-.03,cabinet,side*(w/2-.019),centerY,-.006);
    box(w-.034,boxH,.018,cabinet,0,centerY,-d/2+.016);
    for(const side of [-1,1]){
      box(w/2-.016,boxH,.019,cabinet,side*(w/4-.002),centerY,front-.032);
      box(.012,.098,.023,metal,side*.032,h-.19,front-.012);
    }
    const outline=new T.Shape();
    outline.moveTo(-w/2,-d/2);outline.lineTo(w/2,-d/2);outline.lineTo(w/2,d/2);outline.lineTo(-w/2,d/2);outline.closePath();
    const rx=w*.32, rz=d*.30;
    const hole=new T.Path();hole.absellipse(0,-midZ,rx,rz,0,Math.PI*2,true,0);outline.holes.push(hole);
    const top=mesh(new T.ExtrudeGeometry(outline,{depth:.04,bevelEnabled:false,curveSegments:28}),ceramic,0,h-.04,0);
    top.rotation.x=-Math.PI/2;
    const profile=[[.01,-.15],[.28,-.148],[.65,-.118],[.91,-.06],[1,-.012],[1,0]]
      .map(([r,y])=>new T.Vector2(r,y));
    const porcelain=ceramic.clone();porcelain.side=T.DoubleSide;
    const bowl=mesh(new T.LatheGeometry(profile,56),porcelain,0,h,midZ);bowl.scale.set(rx,1,rz);
    mesh(new T.CylinderGeometry(.018,.018,.005,24),metal,0,h-.148,midZ);
    const tapZ=-d*.33;
    mesh(new T.CylinderGeometry(.019,.023,.135,20),metal,0,h+.067,tapZ);
    box(.03,.025,.109,metal,0,h+.124,tapZ+.048);
    box(.014,.014,.051,metal,0,h+.149,tapZ-.004);
  }
  return group;
}
