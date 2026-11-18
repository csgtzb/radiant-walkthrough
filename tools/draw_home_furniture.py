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
    label(42,60,name,34);label(42,98,f'{code}　/　自拟设计　　宽 {w} × 深 {d} × 高 {h} mm',20)
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

part('退脚','oak','box',0,-35,1372,550,0,92)
part('岛柜','oak','box',0,-38,1430,570,90,875)
for x in [-478,0,478]:part('门板','oak','door',x,253,471,20,98,862)
part('岛台面','stone','box',0,0,1500,700,875,907)
sheet('K02','餐厨岛台',1500,700,907)
legs(263,263,624,30)
for x in [-131,131]:part('脚踏横档','oak','box',x,0,23,268,215,242)
for z in [-131,131]:part('脚踏横档','oak','box',0,z,268,23,215,242)
part('圆坐面','oak','stoolseat',0,0,343,343,614,654)
sheet('K03','岛台高凳',343,343,654)

# Kitchen faces local +Z. On this plan it faces north, so the fridge is on the west end.
part('踢脚','black','box',-364.5,-38,2341,489,0,90)
part('炉具地柜','oak','box',165,-42,1282,484,90,872)
part('水槽地柜底箱','oak','box',-776,-42,596,484,90,724)
part('洗碗机箱','steel','box',-1318,-42,481,484,90,865)
part('备餐台','stone','box',165,0,1282,630,872,903)
part('水槽台面','stone','sink',-776,0,600,630,728,903)
part('洗碗机台面','stone','box',-1318,0,484,630,872,903)
part('洗碗机','steel','appliance',-1318,241,481,69,90,868)
for b,t in [(97,330),(335,566),(571,859)]:
    part('备餐抽屉','oak','drawer',514.75,236,582.5,35,b,t)
for x in [-925,-627]:part('水槽柜门','oak','door',x,238,294,32,90,718)
part('水槽前封板','oak','box',-776,239,594,32,722,873)
part('炉台','black','hob',-120,9,573,537,903,919)
part('嵌入烤箱','steel','oven',-120,243,575,62,135,862)
part('龙头','steel','tap',-776,-212,66,176,901,1225)
part('冰箱箱体','steel','box',1190,-44,737,536,0,1922)
part('冷冻室','steel','appliance',1190,262,730,62,38,690)
part('冷藏室','steel','appliance',1190,262,730,62,698,1918)
for x, width in [(-1252,602),(-637,602),(-22,602),(543.5,525)]:
    part('吊柜','oak','upper',x,-147,width,330,1480,2140)
part('抽油烟机','steel','hood',-121,-64,581,455,1398,1480)
sheet('K01','一字型整体橱柜',3120,630,2140)

(folder/'designs.js').write_text('// Generated by tools/draw_home_furniture.py from the paired orthographic views.\nconst HOME_DESIGNS = '+
                                 json.dumps(library,ensure_ascii=False,separators=(',',':'))+';\n')
