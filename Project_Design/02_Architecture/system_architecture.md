# 系统架构设计

## 整体架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                     用户界面层 (UI Layer)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │  空间视图    │  │  线性视图    │  │     媒体视图         │   │
│  │ (Spatial)   │  │ (Linear)    │  │    (Media)         │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    交互控制层 (Interaction)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │  命令系统    │  │  状态管理    │  │     事件处理         │   │
│  │ (Command)   │  │ (Zustand)   │  │    (Events)        │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     数据模型层 (Data Model)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │    节点      │  │     边      │  │     关系节点         │   │
│  │   (Node)    │  │   (Edge)    │  │ (RelationNode)     │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 核心架构层次

### 1. 数据模型层 (Data Model Layer)

#### 核心实体
- **Node**: 知识节点，包含丰富的内容块
- **Edge**: 轻量级连接，表示节点间的语义关系
- **RelationNode**: 复杂关系节点，支持多参与者的超边
- **Block**: 结构化内容单元，支持多种媒体类型
- **View**: 视图配置，管理不同的展示和布局方式

#### 数据特征
- **版本化**: 所有实体都包含创建/更新时间和版本号
- **可扩展**: 支持自定义属性和标签系统
- **类型安全**: 完整的 TypeScript 类型定义

### 2. 状态管理层 (State Management)

#### Zustand Store 架构
```typescript
GraphStore {
  // 数据状态
  currentKnowledgeBase: KnowledgeBase
  currentViewId: EntityId
  
  // 选择状态
  selectedNodeIds: Set<EntityId>
  selectedEdgeIds: Set<EntityId>
  selectedRelationIds: Set<EntityId>
  
  // 视图配置
  nodeViewConfigs: Record<EntityId, NodeViewConfig>
  edgeViewConfigs: Record<EntityId, EdgeViewConfig>
  relationViewConfigs: Record<EntityId, RelationViewConfig>
  
  // UI 状态
  rightPanelOpen: boolean
  rightPanelContent: 'node' | 'edge' | 'relation'
}
```

#### 状态更新策略
- **命令驱动**: 所有状态修改通过命令系统执行
- **细粒度订阅**: 使用 Zustand 的选择器优化渲染性能
- **持久化**: 支持知识库的导入导出

### 3. 命令系统层 (Command System)

#### 命令模式实现
```typescript
Command Pattern {
  // 命令注册
  CommandRegistry.register(commandType, handler)
  
  // 命令执行
  commandSystem.execute(command)
  
  // 撤销重做
  commandSystem.undo()
  commandSystem.redo()
  
  // 中间件支持
  middleware: [logging, validation, persistence]
}
```

#### 命令类型分类
- **node-commands**: 节点的 CRUD 操作
- **edge-commands**: 边的创建、修改、删除
- **block-commands**: 内容块的操作
- **view-commands**: 视图和布局管理

### 4. 组件架构层 (Component Architecture)

#### 核心组件层次
```
MainLayout
├── ViewTabs (视图切换)
├── WhiteboardView (空间视图)
│   ├── UnifiedNode (统一节点组件)
│   │   ├── DotNode (点模式)
│   │   ├── BoxNode (框模式)
│   │   └── CardNode (卡片模式)
│   ├── GraphEdge (图边组件)
│   └── FloatingToolbar (浮动工具栏)
├── LinearView (线性视图)
├── MediaView (媒体视图)
└── RightPanel (右侧面板)
    ├── NodeView (节点详情)
    ├── EdgeView (边详情)
    └── RelationView (关系详情)
```

#### 组件设计原则
- **职责单一**: 每个组件专注于特定功能
- **数据流向**: 单向数据流，通过 props 和回调通信
- **状态提升**: 共享状态管理在 Zustand Store 中
- **组合优于继承**: 通过组件组合实现复杂功能

## 关键技术决策

### 1. 坐标系统设计
**决策**: 存储中心点坐标，渲染时计算左上角位置
**原因**: 
- 不同显示模式（点/框/卡片）保持位置一致性
- 简化节点切换显示模式的逻辑
- 便于实现精确的连接点对齐

### 2. 富文本编辑集成
**决策**: 全系统使用 PlateJS 统一编辑体验
**原因**:
- 一致的编辑体验和快捷键
- 强大的插件生态系统
- 支持复杂的块级结构编辑

### 3. 图形交互库选择
**决策**: 使用 React Flow 作为图形交互基础
**原因**:
- 成熟的节点拖拽和连接功能
- 良好的性能和扩展性
- 活跃的社区和文档支持

### 4. 状态管理方案
**决策**: Zustand + Command Pattern
**原因**:
- Zustand 提供轻量级状态管理
- Command Pattern 支持完整的撤销/重做
- 两者结合提供既简单又强大的状态控制

## 性能优化策略

### 1. 渲染优化
- **虚拟化**: 大规模图谱的节点虚拟化渲染
- **React.memo**: 组件级别的渲染优化
- **选择器优化**: Zustand 的细粒度状态订阅

### 2. 数据优化
- **增量更新**: 只更新变化的部分
- **延迟加载**: 按需加载视图数据
- **缓存策略**: 计算结果缓存和失效机制

### 3. 交互优化
- **防抖节流**: 频繁操作的性能保护
- **批量操作**: 合并相关的状态更新
- **异步处理**: 非阻塞的数据处理流程