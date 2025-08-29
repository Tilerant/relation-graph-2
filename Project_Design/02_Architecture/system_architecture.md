# 系统架构设计

## 分层架构核心理念

系统采用**三层分离架构**，实现知识语义的纯净性与白板交互的灵活性完美结合：

```
知识层（语义）→ 视图层（表现）→ 装饰层（无语义）
    ↓             ↓            ↓
  Node/Edge     Shape/Style   Drawing/Sticker
     ↓             ↓            ↓
   AI理解        多视图呈现     视觉装饰
```

### 架构设计优势
- **语义纯净**: 知识层不被视觉元素污染，AI可专注语义操作
- **交互灵活**: 白板层完全自由，支持任意视觉表现
- **渐进增强**: 从简单绘制到复杂知识建模的平滑过渡
- **AI协作**: 大模型在知识层深度参与，视图层自动适配

## 整体架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    装饰层 (Decoration Layer)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │  自由绘制    │  │  贴纸表情    │  │     批注高亮         │   │
│  │ (Drawing)   │  │ (Sticker)   │  │  (Annotation)      │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     视图层 (View Layer)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │  白板视图    │  │  线性视图    │  │     媒体视图         │   │
│  │(Whiteboard) │  │ (Linear)    │  │    (Media)         │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    交互控制层 (Interaction)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │  命令系统    │  │ AI协作引擎   │  │     插件管理         │   │
│  │ (Command)   │  │ (AI Engine) │  │   (Plugin Mgr)     │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    知识层 (Knowledge Layer)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │    节点      │  │     边      │  │     关系节点         │   │
│  │   (Node)    │  │   (Edge)    │  │ (RelationNode)     │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 核心架构层次

### 1. 知识层 (Knowledge Layer) - 语义核心

#### 核心实体
- **Node**: 知识节点，包含结构化内容块，AI理解的基本单元
- **Edge**: 语义连接，表示节点间的关系，支持类型化查询
- **RelationNode**: 复杂关系(超边)，支持多参与者，AI推理的重点
- **Block**: 结构化内容单元，notion风格的富内容载体
- **KnowledgeBase**: 知识库容器，AI操作的主要对象

#### 特征与优势
- **语义纯净**: 不包含视觉表现信息，专注语义结构
- **AI友好**: 大模型可直接理解和操作的数据结构  
- **版本化**: 完整的创建/更新历史，支持协作和回滚
- **可扩展**: 支持自定义属性和动态标签系统
- **类型安全**: 严格的 TypeScript 类型定义

### 2. 视图层 (View Layer) - 表现形式

#### 多视图支持
- **白板视图**: 自由空间布局，支持图形化交互
- **线性视图**: 富文本、表格、看板、列表等结构化展示
- **媒体视图**: PDF、图片、视频等媒体内容渲染
- **自定义视图**: 插件扩展的专业化视图

#### 视图特性
- **同一知识多样呈现**: 一个知识结构可以有多种视觉表现
- **布局与样式分离**: 布局信息独立于知识结构存储
- **响应式适配**: 支持不同设备和屏幕尺寸
- **插件扩展**: 支持第三方视图格式插件

### 3. 装饰层 (Decoration Layer) - 纯视觉

#### 装饰元素
- **自由绘制**: 手绘线条、涂鸦、标记
- **贴纸表情**: 视觉装饰元素、情感表达
- **批注高亮**: 临时标记、重点突出
- **视觉辅助**: 引导线、框选、分组视觉提示

#### 装饰特性
- **无语义**: 不进入知识层，不影响AI理解
- **视图专属**: 每个视图独立的装饰层
- **可选持久化**: 根据需要决定是否保存
- **实时协作**: 支持多用户共同装饰

### 4. 交互控制层 (Interaction Layer)

#### 核心组件
- **命令系统**: 统一的操作入口，支持撤销/重做
- **AI协作引擎**: 大模型深度集成，智能辅助操作  
- **插件管理**: 动态加载、热插拔的功能扩展
#### AI协作引擎架构
```typescript
interface AICollaborationEngine {
  // 智能关系建议
  relationSuggestion: {
    analyzeContent(nodes: Node[]): RelationSuggestion[];
    suggestConnections(context: KnowledgeBase): Edge[];
    detectPatterns(graph: KnowledgeGraph): Pattern[];
  };
  
  // 内容智能生成
  contentGeneration: {
    generateNode(prompt: string, context: Node[]): Node;
    expandContent(node: Node, direction: string): Block[];
    summarizeGraph(view: View): string;
  };
  
  // 知识优化
  knowledgeOptimization: {
    optimizeStructure(kb: KnowledgeBase): OptimizationSuggestion[];
    detectDuplicates(nodes: Node[]): DuplicateGroup[];
    suggestCategories(nodes: Node[]): Category[];
  };
}
```

#### 插件系统架构
```typescript
interface PluginSystem {
  // 插件生命周期
  lifecycle: {
    install(plugin: Plugin): Promise<void>;
    activate(pluginId: string): Promise<void>;
    deactivate(pluginId: string): Promise<void>;
    uninstall(pluginId: string): Promise<void>;
  };
  
  // 插件类型
  pluginTypes: {
    aiFunction: AIFunctionPlugin;    // AI功能插件
    viewRenderer: ViewPlugin;       // 自定义视图
    dataSource: DataSourcePlugin;   // 数据源集成
    export: ExportPlugin;          // 导出格式
  };
  
  // 插件通信
  messaging: {
    emit(event: PluginEvent): void;
    subscribe(event: string, handler: Function): void;
    requestPermission(permission: string): Promise<boolean>;
  };
}
```

#### 状态管理架构
```typescript
GraphStore {
  // 知识层状态
  knowledge: {
    currentKnowledgeBase: KnowledgeBase;
    knowledgeBases: Record<string, KnowledgeBase>;
  };
  
  // 视图层状态
  views: {
    currentViewId: EntityId;
    viewConfigs: Record<EntityId, ViewConfig>;
    layoutCache: Record<string, LayoutInfo>;
  };
  
  // 装饰层状态
  decorations: Record<ViewId, DecorationLayer>;
  
  // AI协作状态
  ai: {
    suggestions: RelationSuggestion[];
    generationHistory: GenerationRecord[];
    isProcessing: boolean;
  };
  
  // 插件系统状态
  plugins: {
    installed: Record<string, Plugin>;
    active: Set<string>;
    permissions: Record<string, Permission[]>;
  };
  
  // UI状态
  ui: {
    selectedEntities: SelectionState;
    rightPanelOpen: boolean;
    currentTool: string;
  };
}
```

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
**决策**: 全系统使用 TipTap 统一编辑体验
**原因**:
- 轻量级架构，更好的性能
- 现代化API设计，易于扩展
- 更好的AI工具兼容性

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

## 分层数据流架构

### 数据流向设计

系统的数据在三个层次间按照明确的规则流动：

```
用户操作 → 交互控制层 → 知识层/视图层/装饰层 → 状态更新 → UI重渲染
    ↓           ↓             ↓                ↓         ↓
  白板交互    命令分发      分层数据处理         状态同步    视觉反馈
    ↓           ↓             ↓                ↓         ↓
  AI建议      插件处理      语义提升机制        订阅通知    多视图同步
```

### 层间交互规则

#### 1. 知识层优先原则
```typescript
// AI优先在知识层工作
interface KnowledgeLayerFirst {
  // ✅ 推荐：AI直接操作语义结构
  ai.generateNode(prompt, context) → Node
  
  // ✅ 推荐：用户操作自动提升到知识层
  whiteboard.createTextBox(text) → Node.create(title: text)
  
  // ❌ 避免：直接在视图层做AI操作
  ai.styleSuggestion(nodeVisual) // 应该基于Node内容，不是visual
}
```

#### 2. 视图层响应机制
```typescript
// 知识层变化 → 多视图自动更新
interface ViewLayerResponse {
  onKnowledgeChange: {
    // 同一个Node在不同视图中的表现自动同步
    updateWhiteboardView(node: Node): void;
    updateLinearView(node: Node): void;
    updateMediaView(node: Node): void;
  };
  
  // 视图特定的样式变化不影响其他视图
  onViewStyleChange: {
    updateCurrentViewOnly(nodeId: EntityId, style: ViewStyle): void;
  };
}
```

#### 3. 装饰层隔离机制
```typescript
// 装饰层完全独立，不影响知识和视图
interface DecorationLayerIsolation {
  // 装饰操作
  addFreeDrawing(path: SVGPath, viewId: ViewId): void;
  addSticker(sticker: Sticker, position: Point): void;
  
  // 装饰提升（用户主动）
  promoteDrawingToNode(drawingId: string): Node;
  promoteAnnotationToAttribute(annotationId: string, entityId: EntityId): void;
}
```

### AI协作数据流

#### AI在知识层的深度集成
```typescript
interface AIKnowledgeIntegration {
  // 输入：知识结构 + 用户意图
  input: {
    currentKnowledge: KnowledgeBase;
    userPrompt: string;
    context: Node[];
  };
  
  // AI处理：语义理解 + 结构生成
  processing: {
    analyzeSemantics(input): SemanticAnalysis;
    generateStructure(analysis): KnowledgeStructure;
    optimizeRelations(structure): OptimizedStructure;
  };
  
  // 输出：知识层更新 + 视图自适应
  output: {
    knowledgeUpdates: Command[];
    viewSuggestions: ViewOptimization[];
    decorationHints: DecorationSuggestion[];
  };
}
```

#### AI与插件系统的协作
```typescript
interface AIPluginCollaboration {
  // AI功能插件化
  aiPlugins: {
    relationSuggestion: RelationSuggestionPlugin;
    contentGeneration: ContentGenerationPlugin;
    knowledgeOptimization: OptimizationPlugin;
  };
  
  // 插件间通信
  pluginMessaging: {
    // AI插件可以调用其他功能插件
    aiPlugin.requestDataSource(query) → dataSourcePlugin.fetch(query);
    aiPlugin.requestExport(format) → exportPlugin.generate(format);
  };
  
  // 插件权限管理
  permissions: {
    aiPlugins: ['knowledge.read', 'knowledge.write', 'network.access'];
    viewPlugins: ['view.render', 'view.style'];
    dataPlugins: ['data.import', 'data.export'];
  };
}
```

### 渐进式用户体验数据流

#### 从白板到知识图谱的升级路径
```typescript
interface ProgressiveUpgrade {
  // 阶段1：自由白板
  freeDrawing: {
    userAction: 'draw rectangle, add text';
    systemResponse: 'store in decoration layer';
    aiSuggestion: 'convert to knowledge node?';
  };
  
  // 阶段2：半结构化
  semiStructured: {
    userAction: 'accept AI suggestion';
    systemResponse: 'promote to view layer with semantic hint';
    aiSuggestion: 'suggest relations with existing nodes?';
  };
  
  // 阶段3：完全结构化
  fullyStructured: {
    userAction: 'confirm relations';
    systemResponse: 'create in knowledge layer';
    aiSuggestion: 'optimize knowledge structure?';
  };
}
```

### 数据持久化策略

#### 分层持久化机制
```typescript
interface LayeredPersistence {
  // 知识层：完整持久化
  knowledgeLayer: {
    storage: 'primary database';
    backup: 'version control with full history';
    sync: 'real-time collaboration';
  };
  
  // 视图层：按需持久化
  viewLayer: {
    storage: 'layout cache + user preferences';
    backup: 'periodic snapshots';
    sync: 'layout sharing between users';
  };
  
  // 装饰层：可选持久化
  decorationLayer: {
    storage: 'session storage + optional save';
    backup: 'user explicit save only';
    sync: 'real-time visual collaboration';
  };
}
```

这种分层数据流架构确保了：
- **语义稳定性**: 知识结构不被临时视觉元素干扰
- **AI理解能力**: 大模型可以专注于语义层的操作
- **用户体验灵活性**: 支持从简单绘制到复杂建模的渐进使用
- **系统扩展性**: 清晰的层次划分便于功能扩展和插件开发