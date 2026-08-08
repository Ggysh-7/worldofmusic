# Musicword 3D Album Box - 会话上下文

## 项目位置
`E:\开发\musicword\musicword-app`

## GitHub
https://github.com/Ggysh-7/worldofmusic.git

## 当前状态 (Last Working Version)
- Build 成功，dev server 运行在 http://localhost:5174
- 白色背景，8 张专辑的 3D 盒子展示

## 核心文件结构
```
src/
├── App.jsx              # Canvas + 灯光 + 轮播事件
├── main.jsx             # React entry
├── index.css            # 白色背景样式
├── components/
│   ├── Albums.jsx       # 主要交互逻辑 (AlbumBox + 状态机)
│   └── UIOverlay.jsx    # 顶部/底部 UI
├── data/
│   └── albums.js        # 8 张专辑数据
└── store/
    └── albumStore.js    # Zustand store
```

## 交互逻辑 (已完成)
1. **入口动画**: 专辑从右侧进入，stagger 动画
2. **Browse 状态**: 侧面展示（旋转 Y=π/2），鼠标滚轮沿 X 轴横向滚动
3. **Hover Tilt**: 悬停时 tilted-card 效果（围绕基础旋转叠加偏移）
4. **Focus**: 点击专辑 → 居中 + 正面朝向 + 放大 1.2x
5. **Open**: 再次点击 → 封面左滑 (position.x = -BOX_W/2 - 0.05)，光盘右滑 (position.x = BOX_W/2 + 0.15)
6. **Playing**: 光盘持续旋转 (useFrame)
7. **Close**: 点击空白区域或 Close 按钮 → 重置

## 盒子结构
- BOX_W = 1.2, BOX_H = 1.6, BOX_D = 0.35
- X 轴 = 封面方向, Z 轴 = 书脊厚度, Y 轴 = 高度
- 封面组在 front (+Z)，内含封面图和背面
- Inner face (白色，hidden) 在 open 时显示
- Disc (cylinder) hidden，open 时滑出

## 状态机
`browse` → `focus` → `open` → `playing` → `open` → `focus` → `browse`

## 技术栈
- React 19 + Vite 8
- Three.js 0.185 + @react-three/fiber 9 + @react-three/drei 10
- GSAP 3.15 (动画)
- Zustand 5 (状态管理)

## 待完善项
- 用户指出封面图应该在翻开的封面面板上，而不是中间大平面
- 需要调整盒子结构使其符合设计图

## 命令
```powershell
cd E:\开发\musicword\musicword-app
npm run build     # 构建验证
npm run dev -- --port 5174  # 开发服务器
```
