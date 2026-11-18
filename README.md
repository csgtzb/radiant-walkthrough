# Radiant 2C 住宅漫游

一个可在电脑浏览器中行走的两室两卫概念样板。建筑商可以先旋转俯视模型介绍布局，再带客户从玄关走到客厅、卧室和阳台。样板配有沙发、休闲椅、卧室家具、厨房电器、岛台和两卫洁具。在「图纸核对」里拖动家具或旋转 90°，切回三维模型即可查看新的摆位。

## 本地运行

克隆仓库后，用支持 WebGL 2 的桌面浏览器打开 `radiant/index.html` 即可离线体验。也可以在装有 Python 3 的电脑上运行本地预览：

```sh
git clone https://github.com/csgtzb/radiant-walkthrough.git
cd radiant-walkthrough
python3 -m http.server 8000 --bind 127.0.0.1 --directory radiant
```

在浏览器打开 [本地预览](http://127.0.0.1:8000/)。终端按 `Ctrl+C` 停止服务。Three.js 已随项目提供，网页可直接作为静态文件运行。

## 部署到 GitHub Pages

1. 打开仓库的 **Settings → Pages**。
2. 在 **Build and deployment** 下，将 **Source** 设为 **Deploy from a branch**。
3. 选择 **main** 分支和 **/(root)** 目录，点击 **Save**。
4. 在 **Actions** 查看 **pages build and deployment**。成功后回到 **Settings → Pages**，点击 **Visit site**。仓库根页面会自动进入 `radiant/`。

使用此仓库名时，Pages 地址为 `https://csgtzb.github.io/radiant-walkthrough/`。从自己的账号 fork 后部署时，以该仓库 Pages 设置中显示的网址为准。后续推送到所选分支会自动更新演示。[GitHub Pages 官方部署说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

### 部署到其他静态服务器

把 `radiant/` **目录内的全部文件**复制到站点发布目录，使 `index.html`、JavaScript、CSS 与 `assets/` 保持现有的相对位置。构建命令留空。部署后打开首页，分别点击「进入看房」和「图纸核对」，确认键鼠漫游可用、平面底图已加载。

## 演示操作

| 场景 | 操作 |
| --- | --- |
| 户型总览 | 拖动旋转，滚轮缩放，选择玄关或房间起点，点击「进入看房」 |
| 第一人称 | WASD 或方向键移动，鼠标转向。浏览器限制鼠标锁定时可按住鼠标拖动转向 |
| 昼夜对照 | 点击「白天 / 夜晚」，或在漫游中按 L。切换保留位置和视角。预览地址可加 `?room=living&light=night` 指定客厅起点和夜景 |
| 暂停 | 按 Esc，可调整视点高度、继续看房、回到玄关或返回总览 |
| 图纸核对 | 选择家具、拖动或旋转，点「复位此件」还原。摆位保存在当前浏览器。图层和底图浓度可独立调整 |

## 户型数据

墙体、开口、设备占地及尺寸来源记录在 [plan.js](radiant/plan.js)，模型坐标以米为单位。室内净高暂定 2.70 米，默认漫游视点高 1.40 米。门窗高度、洗烘叠放方式和柜体款式采用概念展示参数。建模与碰撞共用同一套平面数据。

### 常规家具库

厨房和两卫的大件参照户型图定位。活动家具摆位、各件立面与尺寸均为概念设计。每种新增样件在 `radiant/furniture/` 有一张以毫米标注的俯视及正立面 SVG。运行 `python3 tools/draw_home_furniture.py` 会重新输出这些图纸并从两视图读取尺寸，生成浏览器使用的 `designs.js`。

在 `radiant/plan.js` 的 `placements` 增加一条记录即可复用同款家具。例如 `["guest-nightstand","N01",2.82,0.725,"south"]` 依次指定实例名、床头柜型号、中心 X/Z（米）和正面朝向。摆位、图纸覆盖层和碰撞采用同一份尺寸。已保存在浏览器里的摆位优先于默认位置。

沙发采用灰色人字纹混纺，床面采用调成燕麦色的华夫格棉布，枕套使用 Terlenka 扫描织物。起居区铺木纹复合地板，厨卫使用暖白漆和灰米色陶砖。多伦多 Riverdale Park 的城市照片用于示意窗景。材料及摄影许可见[饰面与窗景来源](radiant/assets/credits.html)。釉面、玻璃和五金使用物理材质参数。所有预览贴图均随项目本地提供。

Three.js 的许可证随库保存在 [three-LICENSE.txt](radiant/assets/three-LICENSE.txt)。
