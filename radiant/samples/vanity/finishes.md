# V01 公卫柜饰面

| 使用部位 | 图源 | 纹理比例 |
| --- | --- | --- |
| 抽面、竖筋、侧板、背板、搁板、底座与封边 | [Poly Haven · Oak Veneer 01](https://polyhaven.com/a/oak_veneer_01)，Jenelle van Heerden，CC0 | 来源标注整张宽约 1.8 m。竖板沿高度顺纹，水平板沿宽度顺纹，两块抽面和竖筋按同一张木皮连续取样。 |
| 台面、24 mm 厚边与盆口切边 | [ambientCG · Marble 026](https://ambientcg.com/view?id=Marble026)，Photometric Stereo，CC0 | 平台未标注采样尺寸。样件暂按每幅宽 1.0 m 铺贴，待实物尺标校准。板边沿大面纹路展开映射。 |

样件采用上述公开材质作为选样。采购确认需对应供应商的品牌、饰面编号和实物样板。台盆与五金分别保留釉面陶瓷和深色金属的渲染参数。

取自两家官方的 2K JPG 素材包。木皮使用 Diffuse、nor_gl 和 ARM；石材使用 Color、NormalGL 和 Roughness。颜色按 sRGB 解码，法线和粗糙度按线性数据解码。粗糙度放在绿色通道，金属度为零。发布用颜色图 2048 px，法线和粗糙度图 1024 px。网页把六张图存为本地数据，GLB 内嵌同一组贴图与毫米尺度映射。

## 样件布光与细节参考

[HomeBeyond VA9130 产品图](https://www.homebeyond.com/products/freestanding-single-vanity-va9130) 用于对照竖纹柜面、五金与台面的明暗关系。模型沿用 V01 的图纸和选材。样件页可切换为产品透视、工程正投影和局部视角。

[model-viewer 的光照示例](https://modelviewer.dev/examples/lightingandenv/) 展示了 HDR 环境照明、反射与色调映射。此处采用 [Poly Haven 的 Studio Small 09 摄影棚 HDRI](https://polyhaven.com/a/studio_small_09)（CC0），以线性半浮点保留高亮范围。样件页使用中性色调映射。木板另有一套烘焙的环境遮蔽 UV，估算封闭抽面、搁板和背板彼此遮挡的入射光。GLB 内嵌板件遮蔽图；查看器的环境光独立于模型文件。
