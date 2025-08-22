# 组件层次结构设计

## 组件架构概览

```
App
└── MainLayout
    ├── ViewTabs (视图标签切换)
    ├── ViewRenderer (视图渲染器)
    │   ├── SpatialRenderer (空间视图渲染器)
    │   │   └── WhiteboardView (白板视图)
    │   │       ├── UnifiedNode (统一节点组件)
    │   │       │   ├── DotNode (点模式)
    │   │       │   ├── BoxNode (框模式)
    │   │       │   └── CardNode (卡片模式/CustomNode)
    │   │       │       └── DraggableBlock (可拖拽内容块)
    │   │       │           └── PlateEditor (富文本编辑器)
    │   │       ├── GraphEdge (图边组件)
    │   │       ├── FloatingToolbar (浮动工具栏)
    │   │       └── EdgeFloatingToolbar (边浮动工具栏)
    │   ├── LinearRenderer (线性视图渲染器)
    │   └── MediaRenderer (媒体视图渲染器)
    └── RightPanel (右侧面板)
        ├── NodeView (节点详情视图)
        ├── EdgeView (边详情视图)
        └── RelationView (关系详情视图)
```

## 核心组件详解

### 1. App 根组件
**职责**: 应用初始化和全局配置
**核心功能**:
- 注册命令系统处理器
- 初始化示例数据
- 设置拖拽上下文 (DndProvider)
- 全局键盘快捷键绑定

### 2. MainLayout 主布局
**职责**: 应用整体布局和面板管理
**核心功能**:
- 左侧面板：视图切换和导航
- 中央区域：主要内容渲染
- 右侧面板：详情和编辑面板
- 响应式布局调整

### 3. ViewRenderer 视图渲染器
**职责**: 根据视图类型选择对应的渲染器
**支持的视图类型**:
- **spatial**: 空间类型视图 (白板、思维导图、时间线)
- **linear**: 线性类型视图 (富文本、表格、列表)
- **media**: 媒体类型视图 (PDF、图片、视频)

## 空间视图组件体系

### WhiteboardView 白板视图
**核心职责**: React Flow 图形交互管理
**关键功能**:
- 节点和边的渲染管理
- 拖拽和连接交互
- 缩放和平移控制
- 选择状态管理
- 坐标系统转换 (中心点 ↔ 左上角)

**状态管理**:
```typescript
// 数据转换流程
KnowledgeBase → ReactFlow格式
{
  nodes: FlowNode[],    // 转换后的节点
  edges: FlowEdge[]     // 转换后的边
}

// 位置计算
centerPosition → leftTopPosition (渲染)
leftTopPosition → centerPosition (保存)
```

### UnifiedNode 统一节点组件
**设计理念**: 一个组件支持多种显示模式
**显示模式**:
- **DOT**: 12×12 像素的圆点显示
- **BOX**: 紧凑的信息框显示 
- **CARD**: 完整的卡片编辑模式

**模式切换逻辑**:
```typescript
const displayMode = getNodeViewConfig(nodeId).displayMode;

switch(displayMode) {
  case 'DOT': return <DotNode />;
  case 'BOX': return <BoxNode />;
  case 'CARD': return <CardNode />;
}
```

### 节点模式组件详解

#### DotNode 点模式
**用途**: 大规模图谱的概览显示
**特点**:
- 固定 12×12 像素尺寸
- 居中对齐显示
- 悬停显示标题
- 支持状态颜色区分

#### BoxNode 框模式  
**用途**: 紧凑的信息展示
**特点**:
- 最小 120×80 像素
- 显示标题和简要内容
- 支持标题原地编辑
- 类型图标区分

#### CardNode 卡片模式
**用途**: 完整的内容编辑
**特点**:
- 动态尺寸调整
- 完整的块结构编辑
- 拖拽排序支持
- 富文本编辑能力

### DraggableBlock 可拖拽内容块
**核心功能**:
- 内容块的原地编辑
- 拖拽重新排序
- 块类型切换
- 快捷键操作 (Enter新增、Backspace删除)

**编辑状态管理**:
```typescript
interface BlockState {
  isEditing: boolean;       // 是否在编辑模式
  editingIndex: number;     // 当前编辑的块索引
  content: string;          // 当前内容
}
```

### PlateEditor 富文本编辑器
**集成策略**: 全系统统一的富文本编辑体验
**核心特性**:
- PlateJS 插件系统
- 字符串 ↔ Plate数据 格式转换
- 自动高度调整
- 键盘快捷键支持

**数据转换**:
```typescript
// 字符串转Plate格式
string → [{ type: 'p', children: [{ text: content }] }]

// Plate格式转字符串  
plateValue → textContent (去除格式，保留纯文本)
```

## 交互组件体系

### FloatingToolbar 浮动工具栏
**触发条件**: 节点右键菜单或悬停
**功能菜单**:
- 显示模式切换 (DOT/BOX/CARD)
- 节点复制/删除
- 添加连接
- 样式设置

### EdgeFloatingToolbar 边浮动工具栏
**触发条件**: 边选中或右键
**功能菜单**:
- 语义标签编辑
- 边属性设置
- 删除连接
- 样式调整

## 面板组件体系

### RightPanel 右侧面板
**面板类型**:
- **node**: 节点详情和编辑
- **edge**: 边属性和关系设置
- **relation**: 关系节点详情

**状态控制**:
```typescript
interface RightPanelState {
  isOpen: boolean;
  content: 'node' | 'edge' | 'relation' | null;
  entityId: EntityId | null;
}
```

### NodeView 节点详情视图
**编辑功能**:
- 基本信息编辑 (标题、描述)
- 元数据管理 (标签、分类)
- 扩展属性编辑
- 内容块管理

### EdgeView 边详情视图
**编辑功能**:
- 语义标签设置
- 关系强度调整
- 扩展属性编辑
- 连接信息显示

### RelationView 关系详情视图
**编辑功能**:
- 关系类型设置
- 参与者管理
- 关系描述编辑
- 复杂属性配置

## 组件通信模式

### 1. 状态管理通信
**模式**: Zustand Store 集中式状态管理
**优势**: 
- 组件间解耦
- 统一的状态更新
- 支持时间旅行调试

### 2. 命令模式通信
**模式**: 所有数据修改通过命令系统
**优势**:
- 完整的操作历史
- 撤销/重做支持
- 中间件扩展能力

### 3. 事件驱动通信
**模式**: 组件间通过回调函数通信
**使用场景**:
- UI 交互响应
- 异步操作处理
- 用户输入处理

## 性能优化策略

### 1. 组件级优化
```typescript
// 使用 React.memo 避免不必要的重渲染
export const UnifiedNode = React.memo(({ data, selected }) => {
  // 组件实现
});

// 使用 useMemo 缓存计算结果
const plateValue = useMemo(() => {
  return convertStringToPlate(value);
}, [value]);
```

### 2. 状态订阅优化
```typescript
// 使用选择器只订阅需要的状态片段
const currentNode = useGraphStore(state => 
  state.currentKnowledgeBase?.nodes[nodeId]
);
```

### 3. 虚拟化渲染
- 大规模图谱的节点虚拟化
- 视口外节点的延迟渲染
- 动态LOD (Level of Detail) 控制

## 扩展性设计

### 1. 组件插件化
```typescript
// 支持自定义节点类型
interface CustomNodeType {
  type: string;
  component: React.ComponentType;
  defaultProps: any;
}

nodeTypes.register('customType', CustomNodeComponent);
```

### 2. 视图格式扩展
```typescript
// 支持新的视图格式
interface ViewFormat {
  type: string;
  renderer: React.ComponentType;
  config: ViewConfig;
}
```

### 3. 编辑器扩展
```typescript
// PlateJS 插件扩展
const customPlugins = [
  BaseParagraphPlugin,
  CustomMathPlugin,
  CustomDiagramPlugin
];
```