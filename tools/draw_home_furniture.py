"""Draft the sample furniture in millimetres. Paired plan/elevation shapes drive the 3D library."""
import json
from pathlib import Path
from xml.etree import ElementTree as ET

folder = Path(__file__).resolve().parents[1] / 'radiant/furniture'
library = {}
parts = []
colors = {'oak':'#c89f77','stone':'#ece6d8','linen':'#8092a0','cloth':'#d7cbb4','plaid':'#ac9986',
          'ceramic':'#f3f1e7','seat':'#e6e5db','steel':'#aaaead','glass':'#c8dce0','black':'#464744','water':'#bed4ce'}

colors.update(wool='#838079',waffle='#ddd2bc',runner='#667169')

def part(label, material, kind, x, z, w, d, bottom, top):
    parts.append((label, material, kind, x, z, w, d, bottom, top))

def legs(w,d,h,thick=45):
    for x in [-w/2,w/2]:
        for z in [-d/2,d/2]:
            part('支脚','oak','foot',x,z,thick,thick,0,h)

def sheet(code,name,w,d,h):
    svg=ET.Element('svg',xmlns='http://www.w3.org/2000/svg',viewBox='0 0 1160 680',width='1160',height='680')
    ET.SubElement(svg,'title').text=name+' · 俯视 / 正立面'
    ET.SubElement(svg,'rect',width='1160',height='680',fill='#fbfaf5')
    def label(x,y,txt,size):
        ET.SubElement(svg,'text',x=str(x),y=str(y),fill='#36473c',style=f'font:{size}px sans-serif').text=txt
    source = 'Unionville OPT3 适配' if code in ('K01','K02') else '自拟设计'
    label(42,60,name,34);label(42,98,f'{code}　/　{source}　　宽 {w} × 深 {d} × 高 {h} mm',20)
    label(42,155,'俯视',21);label(608,155,'正立面',21)
    scale=min(475/w,395/max(h,d))
    def view(tag,cx,cy):
        return ET.SubElement(svg,'g',id=tag, transform=f'translate({cx} {cy}) scale({scale})',
                             stroke='#62665b',**{'stroke-width':str(1.25/scale),'stroke-linejoin':'round'})
    plan=view('plan',283,395);front=view('front',853,395+h*scale/2)
    def draw(parent,i,a,b,W,H,material,kind,rounding,ellipse=False):
        attrs={'data-part':str(i),'fill':colors[material]}
        if ellipse:
            return ET.SubElement(parent,'ellipse',cx=str(a+W/2),cy=str(b+H/2),rx=str(W/2),ry=str(H/2),**attrs)
        return ET.SubElement(parent,'rect',x=str(a),y=str(b),width=str(W),height=str(H),rx=str(rounding),**attrs)
    for i,p in sorted(enumerate(parts),key=lambda row:row[1][-1]):
        title,mat,kind,x,z,W,D,b,t=p
        el=draw(plan,i,x-W/2,z-D/2,W,D,mat,kind,min(30,W/6,D/6) if kind in ['pad','tub','basin'] else 0,kind in ['wc','ring','disc','foot','roundtop','stoolseat'])
        el.set('data-material',mat);el.set('data-shape',kind);el.set('data-name',title)
    for i,p in sorted(enumerate(parts),key=lambda row:row[1][4]+row[1][6]/2):
        title,mat,kind,x,z,W,D,b,t=p
        draw(front,i,x-W/2,-t,W,t-b,mat,kind,min(35,W/8,(t-b)/6) if kind in ['pad','wc','tub','seat','stoolseat'] else 0)
    label(42,638,'图示朝前方向为俯视图下方。尺寸单位为毫米。',18)
    file=folder/(code+'.svg');ET.ElementTree(svg).write(file,encoding='utf-8')
    # Extract footprint from plan geometry and thickness from the matching elevation.
    xml=ET.parse(file);ns={'s':'http://www.w3.org/2000/svg'}
    items=[]
    for el in xml.find(".//s:g[@id='plan']",ns):
        get=lambda k:float(el.get(k))
        if el.tag.endswith('ellipse'):
            x,z,W,D=get('cx'),get('cy'),2*get('rx'),2*get('ry')
        else:
            W,D=get('width'),get('height');x,z=get('x')+W/2,get('y')+D/2
        elev=xml.find(".//s:g[@id='front']/s:rect[@data-part='"+el.get('data-part')+"']",ns)
        top=-float(elev.get('y'));bottom=top-float(elev.get('height'))
        items.append([el.get('data-name'),el.get('data-material'),el.get('data-shape'),x,z,W,D,bottom,top])
    library[code]=dict(name=name,size=[w,d,h],parts=items)
    parts.clear()

legs(1570,627,115,58)
part('座架','wool','soft',0,0,1780,810,95,332)
part('承背','wool','soft',0,-338,1780,160,245,752)
for x in [-836,836]:part('扶手','wool','soft',x,0,148,840,207,620)
for x in [-377,377]:
    part('座垫','wool','pad',x,57,746,696,306,456)
    part('靠垫','wool','back',x,-245,750,233,428,838)
part('腰枕','plaid','back',-450,-82,435,134,449,661)
sheet('S02','双人布艺沙发',1820,840,838)

part('底座','ceramic','wc',0,65,365,550,0,391)
part('水箱','ceramic','soft',0,-253,385,170,300,748)
part('箱盖','ceramic','soft',0,-253,396,178,738,771)
part('双档按钮','steel','button',61,-253,47,31,771,776)
part('座圈','seat','ring',0,68,368,535,393,423)
part('立起的盖板','seat','lid',0,-143,336,22,424,817)
sheet('T01','落地式坐便器',396,684,817)

part('浴缸与内胆','ceramic','tub',0,0,725,1480,0,530)
part('缸沿龙头','steel','tap',0,-647,72,155,528,686)
sheet('T02','直裙边浴缸',725,1480,686)

part('防水底盘','ceramic','tray',0,0,730,1430,0,75)
part('固定玻璃侧屏','glass','box',359,272,8,872,75,2040)
part('玻璃底槽','steel','box',359,272,12,872,74,90)
part('恒温淋浴柱','steel','shower',-195,610,260,202,735,2080)
sheet('T03','步入式淋浴间',730,1430,2080)

part('锥形底座','oak','pedestal',0,0,320,320,0,352)
part('石面','stone','roundtop',0,0,610,610,352,384)
sheet('L02','圆形茶几',610,610,384)

def bed(code,name,w,d):
    legs(w-200,d-240,145,54)
    part('床框','oak','soft',0,0,w,d,110,305)
    part('包布床头','cloth','soft',0,-d/2+52,w,104,215,880)
    part('床垫','cloth','pad',0,40,w-56,d-104,294,465)
    part('被面','waffle','quilt',0,233,w-19,d-500,448,540)
    part('床尾搭毯','runner','quilt',0,d/2-292,w-12,390,525,553)
    for x in [-w*.225,w*.225]:part('枕头','cloth','pillow',x,-d/2+345,w*.424,391,465,595)
    sheet(code,name,w,d,880)
bed('B01','主卧双人床',1530,2090)
bed('B02','次卧双人床',1370,1970)
legs(290,260,125,32)
part('柜体','oak','box',0,0,390,354,100,467)
part('抽面','oak','drawer',0,179,380,12,226,450)
part('台板','stone','box',0,0,400,412,467,486)
sheet('N01','单抽床头柜',400,412,486)

def wardrobe(code,width):
    part('柜体','oak','box',0,-14,width,540,0,2120)
    for x in [-width/4,width/4]:part('通高门板','oak','door',x,253,width/2-5,23,50,2112)
    sheet(code,'双门衣柜',width,572,2120)
wardrobe('W01',1360)
wardrobe('W02',1240)

# The Unionville OPT3 island elevation, adapted to the existing 1500 mm footprint.
part('岛台踢脚','black','box',0,-25,1436,554,0,100)
part('岛台柜体','oak','box',0,-26,1464,580,100,891)
for x,width in [(-432,600),(168,600),(600,264)]:
    part('岛台平板门','oak','box',x,277,width-4,20,102,889)
part('岛台面','stone','box',0,0,1500,700,891,911)
sheet('K02','Unionville 餐厨岛台',1500,700,911)
legs(263,263,624,30)
for x in [-131,131]:part('脚踏横档','oak','box',x,0,23,268,215,242)
for z in [-131,131]:part('脚踏横档','oak','box',0,z,268,23,215,242)
part('圆坐面','oak','stoolseat',0,0,343,343,614,654)
sheet('K03','岛台高凳',343,343,654)

# Unionville Sales Center, option 3. Keep the 900 mm sink and cooking bays,
# remove the steam tower and drawer bank, and use a 450 mm integrated dishwasher.
# Right of the worktop, a 15.5 mm reveal separates it from the refrigerator.
part('踢脚','black','box',-390.5,-30,2307,492,0,100)
part('左收口','oak','box',-1551,-2,18,604,100,891)
part('水槽底箱','oak','box',-1092,-42,900,506,100,720)
for x in [-1317,-867]:
    part('水槽平板门','oak','box',x,277,446,20,102,880)
part('水槽台面','stone','sink',-1092,0,900,630,733,911)
part('左台面收口','stone','box',-1551,0,18,630,891,911)
part('备餐台','stone','box',60.5,0,1405,630,891,911)
part('龙头','steel','tap',-1092,-185,60,174,911,1224)
part('洗碗机箱','steel','box',-417,-28,446,548,100,885)
part('洗碗机一体门板','oak','box',-417,277,446,20,102,880)
part('烤箱左封板','oak','box',-118,277,144,20,102,880)
part('烤箱右封板','oak','box',634,277,144,20,102,880)
part('烤箱上封板','oak','box',258,277,600,20,704,880)
part('嵌入烤箱','steel','oven',258,260,598,54,103,702)
part('炉台','black','hob',258,5,600,510,911,924)
part('台面右收口','oak','box',735.5,0,55,571,100,891)

# 610 mm counter-to-upper clearance. The central stone continues up behind the inset hood.
part('整板挡水墙','stone','box',-398.5,-300,2323,18,911,1521)
# Stone-clad hood projects over the hob. The 865 x 276 inlet sits in the underside.
part('烟机石饰面','stone','box',258,139,900,18,1521,2377)
for x in [-183.5,699.5]:
    part('烟机侧板','stone','box',x,-85,17,430,1521,2377)
part('烟机底前边','stone','box',258,115,864,30,1521,1539)
part('烟机底后边','stone','box',258,-238,864,124,1521,1539)
for x in [-1317,-867]:
    part('竖纹玻璃吊柜','glass','reeded',x,-112,448,400,1521,2377)
part('浅灰吊柜','oak','upperSolid',-417,-108,448,407,1521,2377)
part('顶柜下沿','oak','box',-398.5,-10,2323,600,2377,2395)
for x,width in [(-1092,900),(-417,450),(258,900)]:
    part('木饰面顶柜','oak','box',x,-8,width-3,594,2395,2668)
part('顶柜右收口','oak','box',735.5,-8,55,594,1521,2668)
part('上封板','oak','box',-398.5,-8,2323,594,2670,2695)
part('嵌入式烟机','steel','hood',258,-38,865,276,1522,1556)
part('冰箱旁木饰收口','oak','box',754,-8,18,594,911,1521)

# Panel-ready refrigerator with two freezer drawers, a tall door, and an overhead cabinet.
part('冰箱箱体','steel','box',1159.5,-31,762,556,100,2011)
part('冰箱踢脚','black','box',1159.5,-32,762,492,0,98)
for label,lo,hi in [('下冷冻抽屉',100,525),('上冷冻抽屉',531,873),('冷藏室',879,2011)]:
    part(label,'oak','box',1159.5,264,758,20,lo,hi)
    vertical=label=='冷藏室'
    part('冷藏门拉手' if vertical else '冷冻抽屉拉手','steel','box',
         818 if vertical else 1159.5,289,10 if vertical else 495,21,
         lo+72 if vertical else hi-36,lo+585 if vertical else hi-27)
part('冰箱顶柜','oak','box',1159.5,-9,762,596,2017,2668)
part('冰箱上封板','oak','box',1159.5,-9,762,596,2670,2695)
part('冰箱右侧板','oak','box',1551,0,18,608,100,2695)
sheet('K01','Unionville 一字型橱柜',3120,630,2695)

(folder/'designs.js').write_text('// Generated by tools/draw_home_furniture.py from the paired orthographic views.\nconst HOME_DESIGNS = '+
                                 json.dumps(library,ensure_ascii=False,separators=(',',':'))+';\n')
