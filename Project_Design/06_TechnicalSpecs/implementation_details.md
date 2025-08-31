# 技术实现细节

## 分层架构实现策略

### 二层分离的技术实现

系统采用**知识层-视图层**分离架构，结合节点类型化设计，每层有明确的技术实现方案：

```typescript
// 二层架构接口定义
interface LayeredArchitecture {
  // 知识层：语义化节点类型系统
  knowledgeLayer: {
    contentNodes: Record<EntityId, ContentNode>;
    relationNodes: Record<EntityId, RelationNode>;
    workflowNodes: Record<EntityId, WorkflowNode>;
    computeNodes: Record<EntityId, ComputeNode>;
    mediaNodes: Record<EntityId, MediaNode>;
    edges: Record<EntityId, Edge>;
    operations: NodeTypeOperationSystem;
    aiIntegration: AICollaborationEngine;
  };
  
  // 视图层：表现形式和临时元素
  viewLayer: {
    renderers: Record<NodeType, NodeTypeRenderer>;
    layouts: Record<ViewId, LayoutManager>;
    styles: NodeTypeStyleManager;
    temporaryElements: TemporaryElementManager;
  };
}
```

### 白板元素处理流程

#### 1. 输入处理分流（节点类型化）
```typescript
interface InputProcessor {
  // 白板交互输入处理 - 直接分发到对应节点类型
  processWhiteboardInput(input: WhiteboardInput): NodeTypeAction {
    switch (input.type) {
      case 'create_text_box':
        // 文本框 → 内容节点
        return {
          nodeType: NodeType.CONTENT,
          action: 'createContentNode',
          data: { title: input.text, content: input.content }
        };
      
      case 'upload_media':
        // 媒体文件 → 媒体节点
        return {
          nodeType: NodeType.MEDIA,
          action: 'createMediaNode',
          data: { source: input.file, mediaType: input.mediaType }
        };
      
      case 'create_formula':
        // 公式 → 计算节点
        return {
          nodeType: NodeType.COMPUTE,
          action: 'createComputeNode',
          data: { formula: input.formula, dependencies: input.deps }
        };
      
      case 'connect_nodes':
        // 连线 → 边
        return {
          nodeType: 'edge',
          action: 'createEdge',
          data: { from: input.sourceId, to: input.targetId }
        };
      
      case 'free_draw':
        // 自由绘制 → 视图层临时元素
        return {
          layer: 'view',
          action: 'addTemporaryDrawing',
          data: { path: input.path, style: input.style }
        };
    }
  }
}
```

#### 2. 语义提升机制
```typescript
interface SemanticPromotion {
  // 视图层临时元素 → 知识层节点
  promoteTemporaryToKnowledge(temp: TemporaryElement): BaseNode {
    switch (temp.promotionType) {
      case 'text':
        return this.createContentNode({
          title: temp.extractedText,
          content: temp.extractedContent
        });
      
      case 'calculation':
        return this.createComputeNode({
          formula: temp.extractedFormula,
          dependencies: temp.identifiedDependencies
        });
      
      case 'workflow':
        return this.createWorkflowNode({
          workflow: temp.extractedSteps,
          triggers: temp.identifiedTriggers
        });
    }
  }
  
  // 智能识别临时元素的语义类型
  analyzeTemporaryElement(temp: TemporaryElement): PromotionSuggestion {
    // AI辅助分析临时元素应该提升为哪种节点类型
    return this.aiAnalyzer.suggestNodeType(temp);
  }
}
```

## 核心技术栈

### 前端框架与库
```json
{
  "react": "^19.1.0",              // 最新React版本，支持Concurrent特性
  "typescript": "~5.8.3",         // 严格类型检查
  "vite": "^7.0.4",              // 现代构建工具
  "zustand": "^5.0.7",           // 轻量级状态管理
  "@xyflow/react": "^12.8.2",    // 图形交互库
  "@tiptap/react": "^2.2.0",     // 轻量级富文本编辑器
  // 样式使用原生CSS模块化方案
  "react-dnd": "^16.0.1"         // 拖拽功能库
}
```

### 开发工具链
```json
{
  "eslint": "^9.30.1",           // 代码质量检查
  "typescript-eslint": "^8.35.1", // TS规则集
  "prettier": "配置中",           // 代码格式化
  "husky": "配置中",             // Git钩子
  "lint-staged": "配置中"        // 暂存区检查
}
```

## 状态管理架构

### 分层状态管理设计

#### 1. 分层状态结构
```typescript
interface LayeredGraphState {
  // 知识层状态
  knowledge: {
    currentKnowledgeBase: KnowledgeBase | null;
    knowledgeBases: Record<string, KnowledgeBase>;
    aiSuggestions: RelationSuggestion[];
    generationHistory: GenerationRecord[];
  };
  
  // 视图层状态  
  views: {
    currentViewId: EntityId | null;
    openViewIds: EntityId[];
    viewConfigs: Record<EntityId, ViewConfig>;
    layoutCache: Record<string, LayoutInfo>;
  };
  
  // 装饰层状态
  decorations: Record<ViewId, {
    drawings: FreeDrawing[];
    stickers: Sticker[];
    annotations: Annotation[];
    highlights: Highlight[];
  }>;
  
  // 选择状态（跨层）
  selection: {
    selectedEntities: SelectionState;
    selectionMode: 'single' | 'multiple' | 'area';
    selectionLayer: 'knowledge' | 'view' | 'decoration';
  };
  
  // AI协作状态
  ai: {
    isProcessing: boolean;
    currentTask: AITask | null;
    suggestions: AISuggestion[];
    preferences: AIPreferences;
  };
  
  // 插件系统状态
  plugins: {
    installed: Record<string, PluginInfo>;
    active: Set<string>;
    permissions: Record<string, Permission[]>;
    marketplace: PluginMarketplace;
  };
  
  // UI状态
  ui: {
    isLoading: boolean;
    error: string | null;
    rightPanelOpen: boolean;
    currentTool: string;
    whiteboardMode: 'draw' | 'select' | 'text';
  };
}
```

#### 2. 动作定义
```typescript
interface GraphActions {
  // 知识库操作
  loadKnowledgeBase: (kb: KnowledgeBase) => void;
  updateKnowledgeBase: (updates: Partial<KnowledgeBase>) => void;
  
  // 视图操作
  setCurrentView: (viewId: EntityId) => void;
  openView: (viewId: EntityId) => void;
  closeView: (viewId: EntityId) => void;
  
  // 选择操作
  selectNode: (nodeId: EntityId) => void;
  selectMultipleNodes: (nodeIds: EntityId[]) => void;
  clearSelection: () => void;
  
  // UI操作
  openRightPanel: (type: 'node' | 'edge' | 'relation', entityId: EntityId) => void;
  closeRightPanel: () => void;
}
```

#### 3. 选择器优化
```typescript
// 细粒度状态订阅，避免不必要的重渲染
const useCurrentView = () => useGraphStore(state => {
  const kb = state.currentKnowledgeBase;
  const viewId = state.currentViewId;
  return kb && viewId ? kb.views[viewId] : null;
});

const useSelectedNodes = () => useGraphStore(state => {
  const kb = state.currentKnowledgeBase;
  const selectedIds = state.selectedNodeIds;
  return kb ? Array.from(selectedIds).map(id => kb.nodes[id]).filter(Boolean) : [];
});
```

## 事件-命令系统实现

### 1. Event Sourcing 架构设计

#### 命令和事件接口定义
```typescript
// 事件只记录"发生了什么"，用于通知和审计
interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  timestamp: number;
  data: any;
}

// 可撤销命令接口
interface ReversibleCommand {
  id: string;
  type: string;
  timestamp: number;
  
  // 执行命令
  execute(): Promise<CommandResult>;
  
  // 撤销命令（命令知道如何撤销自己）
  undo(): Promise<void>;
  
  // 执行前捕获撤销所需的数据
  captureUndoData(): void;
}

interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  events?: DomainEvent[];  // 命令执行产生的事件
}
```

#### 命令系统实现（撤销基于命令）
```typescript
class CommandSystem {
  private eventStore: DomainEvent[] = [];           // 事件存储（审计日志）
  private executedCommands: ReversibleCommand[] = []; // 撤销栈（存储命令）
  private undoneCommands: ReversibleCommand[] = [];   // 重做栈（存储命令）
  
  // 执行命令 → 生成事件 → 记录命令历史
  async execute(command: ReversibleCommand): Promise<CommandResult> {
    // 1. 让命令捕获撤销所需的数据（执行前的状态）
    command.captureUndoData();
    
    // 2. 执行命令
    const result = await command.execute();
    
    if (result.success) {
      // 3. 将命令加入撤销栈（而不是事件）
      this.executedCommands.push(command);
      this.undoneCommands = []; // 清空重做栈
      
      // 4. 将事件存储到事件日志（用于审计和通知）
      if (result.events) {
        result.events.forEach(event => this.eventStore.push(event));
        this.publishEvents(result.events);
      }
    }
    
    return result;
  }
  
  // 撤销：让命令自己执行撤销操作
  async undo(): Promise<void> {
    const command = this.executedCommands.pop();
    if (!command) return;
    
    // 1. 命令知道如何撤销自己
    await command.undo();
    
    // 2. 将命令移到重做栈
    this.undoneCommands.push(command);
    
    // 3. 发布撤销事件
    this.publishEvent({ 
      type: 'system:command-undone', 
      data: { commandType: command.type, commandId: command.id }
    });
  }
  
  // 重做：重新执行命令
  async redo(): Promise<void> {
    const command = this.undoneCommands.pop();
    if (!command) return;
    
    // 1. 重新执行命令
    const result = await command.execute();
    
    if (result.success) {
      // 2. 将命令移回撤销栈
      this.executedCommands.push(command);
      
      // 3. 发布重做事件
      this.publishEvent({ 
        type: 'system:command-redone', 
        data: { commandType: command.type, commandId: command.id }
      });
    }
  }

### 2. 可撤销命令的具体实现

#### 创建节点命令示例
```typescript
class CreateNodeCommand implements ReversibleCommand {
  id: string;
  type = 'node:create';
  timestamp: number;
  
  private payload: CreateNodePayload;
  private createdNodeId?: string;  // 执行后记录创建的节点ID
  
  constructor(payload: CreateNodePayload) {
    this.id = generateId();
    this.timestamp = Date.now();
    this.payload = payload;
  }
  
  captureUndoData(): void {
    // 创建命令不需要捕获执行前的数据，因为执行前节点不存在
    // 撤销信息将在execute时生成（即createdNodeId）
  }
  
  async execute(): Promise<CommandResult> {
    const { getKnowledgeBase, updateKnowledgeBase } = useGraphStore.getState();
    const kb = getKnowledgeBase();
    if (!kb) throw new Error('No knowledge base loaded');
    
    // 创建新节点
    const newNode = nodeTypeSystem.createNode(this.payload.type, this.payload);
    this.createdNodeId = newNode.id;  // 记录创建的节点ID用于撤销
    
    // 更新状态
    const updatedKb = { ...kb, nodes: { ...kb.nodes, [newNode.id]: newNode } };
    updateKnowledgeBase(updatedKb);
    
    return {
      success: true,
      data: newNode,
      events: [{
        id: generateId(),
        type: 'node:created',
        aggregateId: newNode.id,
        timestamp: this.timestamp,
        data: newNode
      }]
    };
  }
  
  async undo(): Promise<void> {
    if (!this.createdNodeId) throw new Error('Cannot undo: no node was created');
    
    const { getKnowledgeBase, updateKnowledgeBase } = useGraphStore.getState();
    const kb = getKnowledgeBase();
    if (!kb) throw new Error('No knowledge base loaded');
    
    // 删除创建的节点
    const updatedNodes = { ...kb.nodes };
    delete updatedNodes[this.createdNodeId];
    
    const updatedKb = { ...kb, nodes: updatedNodes };
    updateKnowledgeBase(updatedKb);
  }
}

#### 更新节点属性命令示例
```typescript
class UpdateNodeCommand implements ReversibleCommand {
  id: string;
  type = 'node:update';
  timestamp: number;
  
  private nodeId: string;
  private newData: Partial<BaseNode>;
  private originalData?: Partial<BaseNode>;  // 撤销时需要的原始数据
  
  constructor(nodeId: string, newData: Partial<BaseNode>) {
    this.id = generateId();
    this.timestamp = Date.now();
    this.nodeId = nodeId;
    this.newData = newData;
  }
  
  captureUndoData(): void {
    // 捕获执行前的原始数据
    const { getKnowledgeBase } = useGraphStore.getState();
    const kb = getKnowledgeBase();
    if (!kb) throw new Error('No knowledge base loaded');
    
    const node = kb.nodes[this.nodeId];
    if (!node) throw new Error(`Node not found: ${this.nodeId}`);
    
    // 只保存将要修改的字段的原始值
    this.originalData = {};
    Object.keys(this.newData).forEach(key => {
      this.originalData![key] = node[key];
    });
  }
  
  async execute(): Promise<CommandResult> {
    const { getKnowledgeBase, updateKnowledgeBase } = useGraphStore.getState();
    const kb = getKnowledgeBase();
    if (!kb) throw new Error('No knowledge base loaded');
    
    // 更新节点
    const updatedNode = { ...kb.nodes[this.nodeId], ...this.newData };
    const updatedKb = { 
      ...kb, 
      nodes: { ...kb.nodes, [this.nodeId]: updatedNode } 
    };
    updateKnowledgeBase(updatedKb);
    
    return {
      success: true,
      data: updatedNode,
      events: [{
        id: generateId(),
        type: 'node:updated',
        aggregateId: this.nodeId,
        timestamp: this.timestamp,
        data: { nodeId: this.nodeId, changes: this.newData }
      }]
    };
  }
  
  async undo(): Promise<void> {
    if (!this.originalData) throw new Error('Cannot undo: no original data captured');
    
    const { getKnowledgeBase, updateKnowledgeBase } = useGraphStore.getState();
    const kb = getKnowledgeBase();
    if (!kb) throw new Error('No knowledge base loaded');
    
    // 恢复原始数据
    const restoredNode = { ...kb.nodes[this.nodeId], ...this.originalData };
    const updatedKb = { 
      ...kb, 
      nodes: { ...kb.nodes, [this.nodeId]: restoredNode } 
    };
    updateKnowledgeBase(updatedKb);
  }
}
```

### 3. 命令-事件协作机制

#### 关键设计原则
- **命令包含撤销逻辑**：每个命令知道如何撤销自己的操作
- **事件用于通知**：记录操作历史，通知插件和其他组件
- **撤销栈存储命令**：而不是存储事件或状态快照
- **高内聚性**：命令的执行和撤销逻辑紧密关联

## AI操作图谱系统实现

### 1. AI命令处理架构

#### 核心设计思路
```
用户自然语言指令 → AI解析 → 结构化操作序列 → 可撤销命令 → 图谱状态变更
```

#### AI命令处理器接口设计
```typescript
interface AICommandProcessor {
  // 核心方法：解析自然语言指令
  parseCommand(userInput: string): Promise<AIResponse>;
  
  // 执行AI生成的操作序列
  executeOperations(operations: AIOperation[]): Promise<void>;
  
  // 一键处理：解析+执行
  processUserCommand(userInput: string): Promise<string>;
}

interface AIOperation {
  type: 'create_node' | 'update_node' | 'create_edge' | 'arrange_layout';
  params: {
    nodeType?: NodeType;
    title?: string;
    content?: string;
    position?: Position;
    sourceId?: string;
    targetId?: string;
    relationType?: string;
  };
}

interface AIResponse {
  operations: AIOperation[];
  explanation?: string; // AI对操作的解释
}
```

#### AI提示词工程策略
```typescript
const AI_PROMPT_TEMPLATE = `
你是一个知识图谱助手。用户会给你一个指令，你需要将其转换为具体的图谱操作。

可用的操作类型：
1. create_node - 创建节点
   - nodeType: "content" | "relation" | "workflow" | "compute" | "media"
   - title: 节点标题
   - content: 节点内容
   - position: {x, y} 坐标

2. create_edge - 创建连接
   - sourceId: 源节点（可用节点标题引用）
   - targetId: 目标节点（可用节点标题引用）
   - relationType: "contains" | "related_to" | "depends_on"

用户指令: "${userInput}"

返回JSON格式：
{
  "operations": [...],
  "explanation": "我为你创建了..."
}

注意：
- 自动计算合适的节点布局位置
- 节点内容要有实际价值，不是占位文本
- 连接关系要符合语义逻辑
- 标题简洁明确，便于引用
`;
```

### 2. 增强命令系统实现

#### 支持AI操作的命令系统
```typescript
class EnhancedCommandSystem {
  private executedCommands: ReversibleCommand[] = [];    // 撤销栈
  private undoneCommands: ReversibleCommand[] = [];      // 重做栈
  private eventListeners = new Map<string, EventListener[]>();
  
  // 执行可撤销命令（AI操作的基础）
  async execute(command: ReversibleCommand): Promise<CommandResult> {
    // 1. 捕获撤销数据
    command.captureUndoData();
    
    // 2. 执行命令
    const result = await command.execute();
    
    if (result.success) {
      // 3. 添加到撤销栈
      this.executedCommands.push(command);
      this.undoneCommands = []; // 清空重做栈
      
      // 4. 发布事件通知
      if (result.events) {
        result.events.forEach(event => this.publishEvent(event));
      }
    }
    
    return result;
  }
  
  // AI批量操作支持
  async executeBatch(commands: ReversibleCommand[]): Promise<CommandResult[]> {
    const results: CommandResult[] = [];
    
    for (const command of commands) {
      const result = await this.execute(command);
      results.push(result);
      
      if (!result.success) {
        // 批量操作失败，撤销之前的操作
        await this.undoBatch(results.length - 1);
        break;
      }
    }
    
    return results;
  }
}
```

### 3. AI特定的可撤销命令

#### 智能节点创建命令
```typescript
class AICreateNodeCommand implements ReversibleCommand {
  constructor(
    private aiParams: {
      title: string;
      content: string;
      nodeType: NodeType;
      position: Position;
      aiGenerated: true; // 标记为AI生成
    }
  ) {}
  
  async execute(): Promise<CommandResult> {
    // 创建节点时记录AI上下文
    const newNode = {
      ...nodeData,
      metadata: {
        aiGenerated: true,
        aiPrompt: this.aiParams.originalPrompt,
        generatedAt: Date.now()
      }
    };
    
    // 执行创建逻辑...
    return result;
  }
  
  async undo(): Promise<void> {
    // AI创建的节点可以被完整撤销
    // 包括相关的边和布局调整
  }
}
```

#### 智能关系建立命令
```typescript
class AICreateRelationCommand implements ReversibleCommand {
  constructor(
    private aiParams: {
      sourceId: string;
      targetId: string;
      relationType: string;
      aiReasoning: string; // AI建立关系的推理
    }
  ) {}
  
  captureUndoData(): void {
    // 记录建立关系前的图谱状态
    // 用于撤销时恢复
  }
  
  async execute(): Promise<CommandResult> {
    // 创建边时包含AI推理信息
    const newEdge = {
      ...edgeData,
      metadata: {
        aiGenerated: true,
        reasoning: this.aiParams.aiReasoning
      }
    };
  }
}
```

### 4. AI操作的用户界面设计

#### AI助手交互组件架构
```typescript
interface AICommandInputComponent {
  // 状态管理
  state: {
    isExpanded: boolean;
    isProcessing: boolean;
    input: string;
    response: string;
    error: string;
  };
  
  // 核心方法
  handleSubmit(): Promise<void>;
  handleExampleClick(example: string): void;
  
  // 示例指令库
  exampleCommands: string[];
  
  // AI处理器实例
  aiProcessor: AICommandProcessor;
}
```

#### 交互设计规范
- **折叠状态**: 右下角浮动，显示"让AI帮你操作图谱..."
- **展开状态**: 完整输入界面，支持多行文本
- **实时反馈**: 显示AI处理进度和结果
- **快捷操作**: 预设示例指令，一键输入
- **键盘支持**: Ctrl+K打开，Ctrl+Enter发送

### 5. AI操作的错误处理和恢复

#### 错误分类和处理策略
```typescript
enum AIOperationError {
  PARSE_FAILED = 'AI无法理解指令',
  API_ERROR = 'AI服务暂时不可用', 
  INVALID_OPERATION = '生成的操作无效',
  EXECUTION_FAILED = '操作执行失败',
  PARTIAL_SUCCESS = '部分操作成功'
}

class AIErrorHandler {
  async handleError(error: AIOperationError, context: any): Promise<void> {
    switch (error) {
      case AIOperationError.PARSE_FAILED:
        // 提供指令改写建议
        break;
      case AIOperationError.PARTIAL_SUCCESS:
        // 显示成功的部分，询问是否重试失败部分
        break;
    }
  }
}
```

### 6. AI操作的性能优化

#### 响应时间优化策略
- **流式处理**: 支持AI流式返回，实时显示进度
- **预测性加载**: 根据用户输入预加载常见操作
- **缓存机制**: 缓存常用的AI响应模式
- **批量优化**: 将多个小操作合并为批量操作

#### 内存管理
```typescript
interface AIOperationCache {
  // 缓存常用AI响应
  responseCache: Map<string, AIResponse>;
  
  // 限制缓存大小
  maxCacheSize: number;
  
  // LRU淘汰策略
  evictLeastUsed(): void;
}
```

## Electron桌面应用实现

### 1. 主进程架构 (Main Process)

#### 应用程序生命周期管理
```typescript
interface MainProcessManager {
  // 应用启动和窗口管理
  applicationLifecycle: {
    createMainWindow(): BrowserWindow;
    handleAppReady(): void;
    handleWindowAllClosed(): void;
    handleActivate(): void;
  };
  
  // 文件系统操作
  fileSystemAPI: {
    saveKnowledgeBase(data: KnowledgeBase, path?: string): Promise<string>;
    loadKnowledgeBase(path: string): Promise<KnowledgeBase>;
    exportToFormat(data: KnowledgeBase, format: ExportFormat): Promise<void>;
    watchFileChanges(path: string): void;
  };
  
  // 安全存储管理
  secureStorage: {
    storeAPIKey(provider: string, key: string): Promise<void>;
    retrieveAPIKey(provider: string): Promise<string>;
    deleteAPIKey(provider: string): Promise<void>;
    listStoredKeys(): Promise<string[]>;
  };
}
```

#### IPC通信接口设计
```typescript
interface IPCChannels {
  // 文件操作
  'file:save': {
    request: { data: KnowledgeBase; path?: string };
    response: { success: boolean; path: string };
  };
  
  'file:load': {
    request: { path?: string }; // 不提供path时显示文件选择器
    response: { success: boolean; data?: KnowledgeBase };
  };
  
  'file:export': {
    request: { data: KnowledgeBase; format: 'png' | 'svg' | 'json' };
    response: { success: boolean; path?: string };
  };
  
  // AI密钥管理
  'ai:store-key': {
    request: { provider: 'openai' | 'anthropic'; key: string };
    response: { success: boolean };
  };
  
  'ai:get-key': {
    request: { provider: string };
    response: { key?: string };
  };
  
  // 应用控制
  'app:minimize': { request: {}; response: {} };
  'app:maximize': { request: {}; response: {} };
  'app:quit': { request: {}; response: {} };
  
  // 系统集成
  'system:tray-toggle': { request: {}; response: {} };
  'system:global-shortcut': { request: { action: string }; response: {} };
}
```

### 2. 渲染进程集成 (Renderer Process)

#### Electron API封装
```typescript
interface ElectronBridge {
  // 文件操作封装
  fileAPI: {
    save: (data: KnowledgeBase) => Promise<boolean>;
    load: () => Promise<KnowledgeBase | null>;
    export: (data: KnowledgeBase, format: string) => Promise<void>;
  };
  
  // AI密钥管理
  aiAPI: {
    storeKey: (provider: string, key: string) => Promise<boolean>;
    getKey: (provider: string) => Promise<string | null>;
    deleteKey: (provider: string) => Promise<void>;
  };
  
  // 应用控制
  appAPI: {
    minimize: () => void;
    maximize: () => void;
    quit: () => void;
    showInTray: () => void;
  };
  
  // 系统通知
  notificationAPI: {
    show: (title: string, message: string) => void;
    requestPermission: () => Promise<boolean>;
  };
}
```

#### React应用适配
```typescript
// Electron环境检测
const isElectron = () => {
  return window?.electronAPI !== undefined;
};

// AI密钥管理Hook
const useElectronAI = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  
  const storeAPIKey = async (provider: string, key: string) => {
    if (isElectron()) {
      await window.electronAPI.aiAPI.storeKey(provider, key);
      setApiKeys(prev => ({ ...prev, [provider]: key }));
    } else {
      // Web版本fallback到localStorage
      localStorage.setItem(`ai_key_${provider}`, key);
    }
  };
  
  const getAPIKey = async (provider: string) => {
    if (isElectron()) {
      return await window.electronAPI.aiAPI.getKey(provider);
    } else {
      return localStorage.getItem(`ai_key_${provider}`);
    }
  };
  
  return { storeAPIKey, getAPIKey };
};

// 文件操作Hook
const useElectronFile = () => {
  const saveFile = async (data: KnowledgeBase) => {
    if (isElectron()) {
      return await window.electronAPI.fileAPI.save(data);
    } else {
      // Web版本fallback到下载
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'knowledge_graph.json';
      a.click();
      return true;
    }
  };
  
  return { saveFile };
};
```

### 3. 原生功能集成

#### 系统托盘实现
```typescript
class TrayManager {
  private tray: Tray;
  private mainWindow: BrowserWindow;
  
  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.createTray();
  }
  
  private createTray() {
    this.tray = new Tray(path.join(__dirname, 'assets/tray-icon.png'));
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => this.showMainWindow()
      },
      {
        label: 'AI快速输入',
        accelerator: 'Cmd+Space',
        click: () => this.showAIInput()
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => app.quit()
      }
    ]);
    
    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('AI知识图谱');
  }
  
  private showAIInput() {
    // 创建轻量级AI输入窗口
    const aiWindow = new BrowserWindow({
      width: 400,
      height: 200,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    
    aiWindow.loadFile('ai-quick-input.html');
  }
}
```

#### 全局快捷键管理
```typescript
class ShortcutManager {
  constructor() {
    this.registerGlobalShortcuts();
  }
  
  private registerGlobalShortcuts() {
    // AI助手快捷键
    globalShortcut.register('CommandOrControl+Space', () => {
      this.toggleAIAssistant();
    });
    
    // 快速保存
    globalShortcut.register('CommandOrControl+S', () => {
      this.quickSave();
    });
    
    // 显示/隐藏主窗口
    globalShortcut.register('CommandOrControl+Shift+G', () => {
      this.toggleMainWindow();
    });
  }
  
  private toggleAIAssistant() {
    // 发送消息到渲染进程
    BrowserWindow.getFocusedWindow()?.webContents.send('shortcut:toggle-ai');
  }
}
```

### 4. 安全与性能优化

#### API密钥安全存储
```typescript
import { safeStorage } from 'electron';

class SecureKeyStorage {
  private static instance: SecureKeyStorage;
  private keyStore = new Map<string, string>();
  
  static getInstance(): SecureKeyStorage {
    if (!SecureKeyStorage.instance) {
      SecureKeyStorage.instance = new SecureKeyStorage();
    }
    return SecureKeyStorage.instance;
  }
  
  async storeKey(provider: string, key: string): Promise<void> {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('系统不支持安全存储');
    }
    
    const encrypted = safeStorage.encryptString(key);
    const keyPath = path.join(app.getPath('userData'), `${provider}_key.dat`);
    
    await fs.writeFile(keyPath, encrypted);
    this.keyStore.set(provider, key);
  }
  
  async retrieveKey(provider: string): Promise<string | null> {
    // 先从内存缓存获取
    if (this.keyStore.has(provider)) {
      return this.keyStore.get(provider)!;
    }
    
    const keyPath = path.join(app.getPath('userData'), `${provider}_key.dat`);
    
    try {
      const encrypted = await fs.readFile(keyPath);
      const decrypted = safeStorage.decryptString(encrypted);
      this.keyStore.set(provider, decrypted);
      return decrypted;
    } catch (error) {
      return null;
    }
  }
}
```

#### 性能优化策略
```typescript
interface ElectronPerformanceConfig {
  // 渲染进程优化
  rendererOptimization: {
    nodeIntegration: false;          // 安全性
    contextIsolation: true;          // 隔离上下文
    enableRemoteModule: false;       // 禁用remote
    webSecurity: true;               // Web安全
    preload: 'preload.js';          // 预加载脚本
  };
  
  // 内存管理
  memoryManagement: {
    maxMemoryUsage: '512MB';         // 限制内存使用
    enableGC: true;                  // 启用垃圾回收
    cacheSize: '100MB';             // 缓存大小限制
  };
  
  // 启动优化
  startupOptimization: {
    lazyLoadModules: true;          // 延迟加载模块
    splashScreen: true;             // 启动画面
    backgroundStart: false;         // 非后台启动
  };
}
```

### 5. 构建和分发

#### 构建配置 (electron-builder)
```json
{
  "build": {
    "appId": "com.yourcompany.relation-graph",
    "productName": "AI知识图谱",
    "directories": {
      "output": "dist"
    },
    "files": [
      "build/**/*",
      "node_modules/**/*",
      "public/electron.js"
    ],
    "mac": {
      "category": "public.app-category.productivity",
      "icon": "assets/icon.icns",
      "hardenedRuntime": true,
      "entitlements": "assets/entitlements.mac.plist"
    },
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "linux": {
      "target": "AppImage",
      "icon": "assets/icon.png",
      "category": "Office"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

## 坐标系统实现

### 1. 中心点坐标系统

#### 设计原理
```typescript
// 存储：中心点坐标
interface StoredPosition {
  x: number;  // 节点中心的X坐标
  y: number;  // 节点中心的Y坐标
}

// 渲染：左上角坐标  
interface RenderPosition {
  x: number;  // 节点左上角的X坐标
  y: number;  // 节点左上角的Y坐标
}

// 转换函数
const centerToTopLeft = (center: StoredPosition, size: {width: number, height: number}): RenderPosition => ({
  x: center.x - size.width / 2,
  y: center.y - size.height / 2
});

const topLeftToCenter = (topLeft: RenderPosition, size: {width: number, height: number}): StoredPosition => ({
  x: topLeft.x + size.width / 2,
  y: topLeft.y + size.height / 2
});
```

#### 节点尺寸管理
```typescript
const getNodeSize = (displayMode: NodeDisplayMode, customSize?: {width: number, height: number}) => {
  switch (displayMode) {
    case 'DOT':
      return { width: 12, height: 12 };
    case 'BOX':
      return { width: 120, height: 80 };
    case 'CARD':
      return customSize || { width: 280, height: 120 };
    default:
      return { width: 280, height: 120 };
  }
};
```

### 2. React Flow 集成

#### 节点数据转换
```typescript
const convertToFlowNode = (node: Node, viewConfig: NodeViewConfig): FlowNode => {
  const centerPosition = getCurrentView().layout.nodePositions[node.meta.id] || { x: 0, y: 0 };
  const nodeSize = getNodeSize(viewConfig.displayMode, getCurrentView().layout.nodeSizes?.[node.meta.id]);
  
  // 计算左上角位置用于React Flow渲染
  const position = centerToTopLeft(centerPosition, nodeSize);
  
  return {
    id: node.meta.id,
    type: 'graphNode',
    position,
    data: { node, viewConfig },
    style: {
      width: nodeSize.width,
      height: nodeSize.height
    }
  };
};
```

#### 位置更新处理
```typescript
const onNodeDragStop = useCallback(async (event: React.MouseEvent, flowNode: FlowNode) => {
  const nodeSize = getNodeSize(flowNode.data.viewConfig.displayMode, flowNode.style);
  
  // 将左上角位置转换为中心位置进行存储
  const centerPosition = topLeftToCenter(flowNode.position, nodeSize);
  
  // 通过命令系统更新位置
  await updateNodePositionCommand(
    getCurrentView().id,
    flowNode.id,
    centerPosition
  );
}, []);
```

## TipTap 集成实现

### 1. 编辑器配置

#### 基础配置
```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';

const TipTapEditor: React.FC<PlateEditorProps> = ({ value, onChange, onBlur, onKeyDown, placeholder, autoFocus }) => {
  const plugins = useMemo(() => [
    ParagraphPlugin.withComponent(PlateElement)
  ], []);
  
  // 字符串到Plate格式的转换
  const plateValue = useMemo(() => {
    if (!value || value.trim() === '') {
      return [{ type: 'p', children: [{ text: '' }] }];
    }
    
    if (!value.includes('\n')) {
      return [{ type: 'p', children: [{ text: value }] }];
    }
    
    const lines = value.split('\n');
    return lines.map(line => ({
      type: 'p',
      children: [{ text: line }]
    }));
  }, [value]);
  
  // Plate格式到字符串的转换
  const handlePlateChange = (newValue: Array<{ type: string; children: Array<{ text: string }> }>) => {
    const textValue = newValue
      .map((node) => node.children.map((child) => child.text || '').join(''))
      .join('\n')
      .replace(/\n+$/, ''); // 移除末尾换行符
    onChange(textValue);
  };
  
  return (
    <Plate plugins={plugins} value={plateValue} onChange={handlePlateChange}>
      <PlateContent
        className="block-input nodrag"
        placeholder={placeholder}
        autoFocus={autoFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        style={{ 
          minHeight: '32px',
          outline: 'none',
          border: 'none',
          padding: '6px 12px',
          fontSize: '14px',
          fontFamily: 'inherit'
        }}
      />
    </Plate>
  );
};
```

### 2. 数据格式转换

#### 双向转换逻辑
```typescript
// 字符串转Plate格式
const stringToPlate = (text: string): PlateValue => {
  if (!text) return [{ type: 'p', children: [{ text: '' }] }];
  
  // 处理单行文本
  if (!text.includes('\n')) {
    return [{ type: 'p', children: [{ text }] }];
  }
  
  // 处理多行文本
  return text.split('\n').map(line => ({
    type: 'p',
    children: [{ text: line }]
  }));
};

// Plate格式转字符串
const plateToString = (value: PlateValue): string => {
  return value
    .map(node => node.children.map(child => child.text || '').join(''))
    .join('\n')
    .replace(/\n+$/, ''); // 清理末尾换行
};
```

## 性能优化实现

### 1. 组件级优化

#### React.memo 使用
```typescript
export const UnifiedNode = React.memo<NodeProps>(({ data, selected }) => {
  // 组件实现
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return (
    prevProps.data.node.meta.id === nextProps.data.node.meta.id &&
    prevProps.data.node.meta.updatedAt === nextProps.data.node.meta.updatedAt &&
    prevProps.selected === nextProps.selected
  );
});
```

#### useMemo 缓存
```typescript
const DraggableBlock: React.FC<DraggableBlockProps> = ({ content, isEditing, onChange }) => {
  // 缓存Plate值转换
  const plateValue = useMemo(() => stringToPlate(content), [content]);
  
  // 缓存拖拽配置
  const dragConfig = useMemo(() => ({
    type: 'block',
    item: { id, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  }), [id, index]);
  
  return (
    // 组件JSX
  );
};
```

### 2. 状态订阅优化

#### 选择器模式
```typescript
// 只订阅需要的状态片段
const useNodeData = (nodeId: EntityId) => useGraphStore(
  useCallback(state => state.currentKnowledgeBase?.nodes[nodeId], [nodeId])
);

const useViewConfig = (entityId: EntityId, entityType: 'node' | 'edge' | 'relation') => useGraphStore(
  useCallback(state => {
    switch (entityType) {
      case 'node': return state.nodeViewConfigs[entityId];
      case 'edge': return state.edgeViewConfigs[entityId];
      case 'relation': return state.relationViewConfigs[entityId];
    }
  }, [entityId, entityType])
);
```

### 3. 虚拟化渲染

#### 大规模图谱优化
```typescript
const WhiteboardView: React.FC = () => {
  const viewportBounds = useViewport();
  
  // 只渲染视口内的节点
  const visibleNodes = useMemo(() => {
    return allNodes.filter(node => {
      const nodePos = node.position;
      const nodeSize = getNodeSize(node.data.viewConfig.displayMode);
      
      return isInViewport(nodePos, nodeSize, viewportBounds);
    });
  }, [allNodes, viewportBounds]);
  
  return (
    <ReactFlow
      nodes={visibleNodes}
      edges={visibleEdges}
      // ... 其他配置
    />
  );
};
```

## 错误处理与调试

### 1. 错误边界
```typescript
class GraphErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Graph component error:', error, errorInfo);
    // 发送错误报告
    this.reportError(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

### 2. 开发工具集成
```typescript
// Zustand DevTools
const useGraphStore = create<GraphState & GraphActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 状态和动作定义
    })),
    {
      name: 'graph-store',
      serialize: true
    }
  )
);

// 命令系统调试
const commandMiddleware: CommandMiddleware = {
  before: (command) => {
    console.log('Executing command:', command);
  },
  after: (command, result) => {
    console.log('Command result:', result);
  },
  error: (command, error) => {
    console.error('Command error:', command, error);
  }
};
```

### 3. 性能监控
```typescript
// React DevTools Profiler
const ProfiledComponent = React.forwardRef<HTMLDivElement, ComponentProps>((props, ref) => {
  return (
    <React.Profiler id="GraphComponent" onRender={onRenderCallback}>
      <Component {...props} ref={ref} />
    </React.Profiler>
  );
});

const onRenderCallback = (id: string, phase: string, actualDuration: number) => {
  if (actualDuration > 16) { // 超过16ms记录
    console.warn(`Slow render: ${id} took ${actualDuration}ms in ${phase} phase`);
  }
};
```

## AI协作系统实现

### 1. AI引擎集成架构

#### MCP协议集成
```typescript
interface MCPIntegration {
  // MCP客户端配置
  client: {
    protocol: 'MCP/1.0';
    transport: 'websocket' | 'stdio' | 'http';
    capabilities: MCPCapabilities;
  };
  
  // AI服务提供商集成
  providers: {
    openai: OpenAIProvider;
    anthropic: AnthropicProvider;
    local: LocalProvider;
  };
  
  // 工具注册
  tools: {
    knowledgeGraph: KnowledgeGraphTool;
    contentGeneration: ContentGenerationTool;
    relationAnalysis: RelationAnalysisTool;
  };
}
```

#### AI协作流程实现
```typescript
interface AICollaborationFlow {
  // 智能关系建议
  async suggestRelations(nodes: Node[]): Promise<RelationSuggestion[]> {
    const context = await this.buildContext(nodes);
    const prompt = this.buildRelationPrompt(context);
    
    const response = await this.aiProvider.complete({
      messages: [{ role: 'user', content: prompt }],
      tools: [this.knowledgeGraphTool],
      temperature: 0.3
    });
    
    return this.parseRelationSuggestions(response);
  }
  
  // 内容智能生成
  async generateContent(prompt: string, context: KnowledgeContext): Promise<GeneratedContent> {
    const enrichedPrompt = await this.enrichPromptWithContext(prompt, context);
    
    return await this.aiProvider.generateStructured({
      prompt: enrichedPrompt,
      schema: ContentSchema,
      context: this.buildKnowledgeContext(context)
    });
  }
  
  // 知识结构优化
  async optimizeStructure(knowledgeBase: KnowledgeBase): Promise<OptimizationSuggestion[]> {
    const analysis = await this.analyzeKnowledgeStructure(knowledgeBase);
    
    return await this.aiProvider.suggest({
      type: 'optimization',
      data: analysis,
      constraints: this.getOptimizationConstraints()
    });
  }
}
```

### 2. 分层AI操作实现

#### 知识层AI操作
```typescript
interface KnowledgeLayerAI {
  // AI在知识层的核心操作
  async processKnowledgeOperation(operation: AIKnowledgeOperation): Promise<Command[]> {
    switch (operation.type) {
      case 'generate_node':
        return await this.generateNode(operation.prompt, operation.context);
        
      case 'suggest_connections':
        return await this.suggestConnections(operation.nodes);
        
      case 'optimize_relations':
        return await this.optimizeRelations(operation.relationNodes);
        
      case 'extract_entities':
        return await this.extractEntities(operation.content);
    }
  }
  
  // 语义理解增强
  async enhanceSemanticUnderstanding(entity: KnowledgeEntity): Promise<SemanticEnhancement> {
    const semanticAnalysis = await this.aiProvider.analyze({
      content: entity.content,
      type: 'semantic_analysis',
      context: await this.getRelatedEntities(entity.id)
    });
    
    return {
      enhancedAttributes: semanticAnalysis.attributes,
      suggestedTags: semanticAnalysis.tags,
      relationHints: semanticAnalysis.relations,
      categoryPrediction: semanticAnalysis.category
    };
  }
}
```

#### 视图层AI辅助
```typescript
interface ViewLayerAI {
  // 自动布局优化
  async optimizeLayout(view: View): Promise<LayoutOptimization> {
    const graphAnalysis = await this.analyzeGraphStructure(view);
    const layoutAlgorithm = await this.selectOptimalAlgorithm(graphAnalysis);
    
    return await this.aiProvider.optimize({
      type: 'layout',
      algorithm: layoutAlgorithm,
      constraints: view.layoutConstraints,
      objectives: ['clarity', 'aesthetics', 'compactness']
    });
  }
  
  // 视觉样式建议
  async suggestVisualization(content: KnowledgeContent): Promise<VisualizationSuggestion> {
    const contentAnalysis = await this.analyzeContentType(content);
    
    return await this.aiProvider.suggest({
      type: 'visualization',
      contentType: contentAnalysis.type,
      complexity: contentAnalysis.complexity,
      userPreferences: await this.getUserPreferences()
    });
  }
}
```

## 插件系统实现

### 1. 插件架构设计

#### 插件生命周期管理
```typescript
interface PluginLifecycleManager {
  // 插件安装流程
  async install(pluginPackage: PluginPackage): Promise<InstallResult> {
    // 1. 验证插件合法性
    await this.validatePlugin(pluginPackage);
    
    // 2. 检查依赖关系
    await this.resolveDependencies(pluginPackage.dependencies);
    
    // 3. 沙箱环境准备
    const sandbox = await this.createSandbox(pluginPackage.manifest.permissions);
    
    // 4. 插件代码加载
    const plugin = await this.loadPlugin(pluginPackage, sandbox);
    
    // 5. 注册插件服务
    await this.registerPlugin(plugin);
    
    return { success: true, pluginId: plugin.id };
  }
  
  // 插件激活
  async activate(pluginId: string): Promise<void> {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`);
    
    // 权限检查
    await this.checkPermissions(plugin.manifest.permissions);
    
    // 初始化插件
    await plugin.initialize(this.createPluginContext(plugin));
    
    // 注册事件监听
    this.eventBus.register(plugin.id, plugin.eventHandlers);
    
    this.activePlugins.add(pluginId);
  }
}
```

#### 插件沙箱隔离
```typescript
interface PluginSandbox {
  // 安全执行环境
  createSecureContext(permissions: Permission[]): PluginContext {
    const context = {
      // 有限的API访问
      api: this.createRestrictedAPI(permissions),
      
      // 事件通信
      eventBus: this.createPluginEventBus(),
      
      // 存储访问
      storage: this.createPluginStorage(permissions.includes('storage')),
      
      // 网络访问（如果允许）
      network: permissions.includes('network') ? this.networkAPI : null
    };
    
    // 代码执行沙箱
    return new Proxy(context, {
      get: (target, prop) => {
        if (!this.isAllowedAccess(prop, permissions)) {
          throw new Error(`Access denied: ${String(prop)}`);
        }
        return target[prop];
      }
    });
  }
  
  // 资源隔离
  isolateResources(plugin: Plugin): ResourceIsolation {
    return {
      memory: new MemoryLimiter(plugin.manifest.resources.maxMemory),
      cpu: new CPULimiter(plugin.manifest.resources.maxCPU),
      storage: new StorageLimiter(plugin.manifest.resources.maxStorage),
      network: new NetworkLimiter(plugin.manifest.resources.maxBandwidth)
    };
  }
}
```

### 2. AI功能插件实现

#### AI插件标准接口
```typescript
interface AIFunctionPlugin extends Plugin {
  type: 'ai-function';
  
  // AI功能定义
  aiFunction: {
    name: string;
    description: string;
    parameters: ParameterSchema;
    examples: Example[];
  };
  
  // 执行接口
  async execute(
    params: AIFunctionParameters,
    context: KnowledgeContext
  ): Promise<AIFunctionResult>;
  
  // 流式执行（支持实时响应）
  async *executeStream(
    params: AIFunctionParameters,
    context: KnowledgeContext
  ): AsyncGenerator<AIFunctionPartialResult, AIFunctionResult>;
}
```

#### 插件市场集成
```typescript
interface PluginMarketplace {
  // 插件发现
  async searchPlugins(query: PluginSearchQuery): Promise<PluginSearchResult[]> {
    return await this.marketplaceAPI.search({
      query: query.text,
      category: query.category,
      tags: query.tags,
      compatibility: this.systemVersion,
      rating: { min: query.minRating }
    });
  }
  
  // 插件推荐
  async getRecommendations(context: RecommendationContext): Promise<PluginRecommendation[]> {
    const userProfile = await this.buildUserProfile();
    const usagePattern = await this.analyzeUsagePattern();
    
    return await this.aiProvider.recommend({
      userProfile,
      usagePattern,
      currentPlugins: this.getInstalledPlugins(),
      context: context
    });
  }
  
  // 自动更新
  async checkUpdates(): Promise<PluginUpdate[]> {
    const installedPlugins = this.getInstalledPlugins();
    const updateChecks = installedPlugins.map(plugin => 
      this.marketplaceAPI.checkVersion(plugin.id, plugin.version)
    );
    
    const results = await Promise.all(updateChecks);
    return results.filter(result => result.hasUpdate);
  }
}
```

### 3. 插件间通信机制

#### 事件驱动通信
```typescript
interface PluginMessageBus {
  // 插件间消息传递
  async sendMessage(
    fromPlugin: string,
    toPlugin: string,
    message: PluginMessage
  ): Promise<PluginMessageResponse> {
    // 权限检查
    await this.checkMessagingPermissions(fromPlugin, toPlugin);
    
    // 消息验证
    await this.validateMessage(message);
    
    // 异步传递
    const response = await this.routeMessage(toPlugin, message);
    
    return response;
  }
  
  // 广播事件
  broadcastEvent(event: PluginEvent, scope: BroadcastScope): void {
    const targetPlugins = this.resolveScope(scope);
    
    targetPlugins.forEach(plugin => {
      if (this.hasPermission(plugin.id, event.type)) {
        this.deliverEvent(plugin.id, event);
      }
    });
  }
  
  // 服务注册与发现
  registerService(pluginId: string, service: PluginService): void {
    this.serviceRegistry.set(service.name, {
      pluginId,
      service,
      permissions: this.getPlugin(pluginId).manifest.permissions
    });
  }
  
  async discoverServices(query: ServiceQuery): Promise<PluginService[]> {
    return Array.from(this.serviceRegistry.values())
      .filter(registration => this.matchesQuery(registration.service, query))
      .map(registration => registration.service);
  }
}
```

这种分层架构的技术实现确保了：
- **AI协作的深度集成**: 通过MCP协议和分层操作实现大模型的深度参与
- **插件系统的安全性**: 沙箱隔离和权限管理保证系统稳定性  
- **功能的可扩展性**: 清晰的接口设计支持第三方功能扩展
- **用户体验的一致性**: 统一的状态管理和事件通信机制

---

## 🚧 节点类型化架构技术实现

> **说明**: 本节描述节点类型化架构的具体技术实现细节

### 节点类型系统实现

#### 1. 节点类型注册与管理
```typescript
// 节点类型管理器
class NodeTypeManager {
  private typeRegistry: Map<NodeType, NodeTypeDefinition> = new Map();
  private handlerRegistry: Map<NodeType, NodeOperationHandler> = new Map();
  
  // 注册节点类型
  registerNodeType<T extends BaseNode>(
    type: NodeType,
    definition: NodeTypeDefinition<T>
  ): void {
    this.typeRegistry.set(type, definition);
    this.handlerRegistry.set(type, definition.handler);
  }
  
  // 创建节点
  createNode<T extends BaseNode>(
    type: NodeType,
    params: CreateNodeParams
  ): T {
    const definition = this.typeRegistry.get(type);
    if (!definition) {
      throw new Error(`Node type ${type} not registered`);
    }
    return definition.createNode(params) as T;
  }
  
  // 获取节点类型支持的操作
  getSupportedOperations(type: NodeType): Operation[] {
    const definition = this.typeRegistry.get(type);
    return definition?.supportedOperations || [];
  }
  
  // 检查节点是否支持特定操作
  supportsOperation(nodeType: NodeType, operationType: string): boolean {
    const operations = this.getSupportedOperations(nodeType);
    return operations.some(op => op.type === operationType);
  }
}
```

#### 2. 差异化操作分发实现
```typescript
// 操作分发器
class NodeOperationDispatcher {
  constructor(
    private nodeTypeManager: NodeTypeManager,
    private operationHandlers: Map<string, OperationHandler> = new Map()
  ) {}
  
  // 执行操作
  async executeOperation(
    node: BaseNode,
    operation: Operation,
    context?: OperationContext
  ): Promise<OperationResult> {
    // 1. 检查节点类型是否支持该操作
    if (!this.nodeTypeManager.supportsOperation(node.type, operation.type)) {
      return {
        success: false,
        reason: `Operation ${operation.type} not supported for node type ${node.type}`,
        supportedOperations: this.nodeTypeManager.getSupportedOperations(node.type)
      };
    }
    
    // 2. 获取操作处理器
    const handler = this.operationHandlers.get(operation.type);
    if (!handler) {
      throw new Error(`No handler registered for operation: ${operation.type}`);
    }
    
    // 3. 根据节点类型分发操作
    return await handler.handle(node, operation, context);
  }
  
  // 批量操作
  async executeBatchOperation(
    nodes: BaseNode[],
    operation: Operation,
    context?: OperationContext
  ): Promise<BatchOperationResult> {
    // 按节点类型分组
    const nodesByType = this.groupNodesByType(nodes);
    const results = new Map<NodeType, OperationResult[]>();
    
    // 分别处理每种类型
    for (const [nodeType, typeNodes] of nodesByType) {
      if (this.nodeTypeManager.supportsOperation(nodeType, operation.type)) {
        const typeResults = await Promise.all(
          typeNodes.map(node => this.executeOperation(node, operation, context))
        );
        results.set(nodeType, typeResults);
      } else {
        // 不支持的操作类型跳过
        results.set(nodeType, typeNodes.map(() => ({
          success: false,
          reason: `Operation ${operation.type} not supported for ${nodeType}`
        })));
      }
    }
    
    return {
      resultsByType: results,
      totalProcessed: nodes.length,
      successCount: Array.from(results.values()).flat().filter(r => r.success).length
    };
  }
  
  private groupNodesByType(nodes: BaseNode[]): Map<NodeType, BaseNode[]> {
    const grouped = new Map<NodeType, BaseNode[]>();
    for (const node of nodes) {
      if (!grouped.has(node.type)) {
        grouped.set(node.type, []);
      }
      grouped.get(node.type)!.push(node);
    }
    return grouped;
  }
}
```

#### 3. 具体操作处理器示例
```typescript
// 搜索操作处理器
class SearchOperationHandler implements OperationHandler {
  async handle(
    node: BaseNode,
    operation: SearchOperation,
    context?: OperationContext
  ): Promise<SearchResult[]> {
    switch (node.type) {
      case NodeType.CONTENT:
        return this.handleContentNode(node as ContentNode, operation);
      case NodeType.RELATION:
        return this.handleRelationNode(node as RelationNode, operation);
      case NodeType.WORKFLOW:
        return []; // 工作流节点不参与搜索
      case NodeType.COMPUTE:
        return []; // 计算节点不参与搜索
      case NodeType.MEDIA:
        return this.handleMediaNode(node as MediaNode, operation);
      default:
        return [];
    }
  }
  
  private handleContentNode(
    node: ContentNode,
    operation: SearchOperation
  ): SearchResult[] {
    const results: SearchResult[] = [];
    const query = operation.query.toLowerCase();
    
    // 搜索标题
    if (node.title.toLowerCase().includes(query)) {
      results.push({
        type: 'title',
        nodeId: node.meta.id,
        match: node.title,
        relevanceScore: this.calculateRelevance(node.title, query)
      });
    }
    
    // 搜索内容
    if (node.content.toLowerCase().includes(query)) {
      results.push({
        type: 'content',
        nodeId: node.meta.id,
        match: this.extractMatchContext(node.content, query),
        relevanceScore: this.calculateRelevance(node.content, query)
      });
    }
    
    // 搜索内容块
    for (const block of node.blocks) {
      if (block.content.toLowerCase().includes(query)) {
        results.push({
          type: 'block',
          nodeId: node.meta.id,
          blockId: block.id,
          match: this.extractMatchContext(block.content, query),
          relevanceScore: this.calculateRelevance(block.content, query)
        });
      }
    }
    
    // 搜索实体标签
    for (const tag of node.entityTags) {
      if (tag.name.toLowerCase().includes(query)) {
        results.push({
          type: 'entity_tag',
          nodeId: node.meta.id,
          match: tag.name,
          relevanceScore: 1.0 // 标签匹配给高分
        });
      }
    }
    
    return results;
  }
  
  private handleRelationNode(
    node: RelationNode,
    operation: SearchOperation
  ): SearchResult[] {
    const results: SearchResult[] = [];
    const query = operation.query.toLowerCase();
    
    // 搜索关系类型
    if (node.relationType.toLowerCase().includes(query)) {
      results.push({
        type: 'relation_type',
        nodeId: node.meta.id,
        match: node.relationType,
        relevanceScore: 1.0
      });
    }
    
    // 搜索语义标签
    for (const tag of node.semanticTags) {
      if (tag.name.toLowerCase().includes(query)) {
        results.push({
          type: 'semantic_tag',
          nodeId: node.meta.id,
          match: tag.name,
          relevanceScore: 1.0
        });
      }
    }
    
    return results;
  }
  
  private handleMediaNode(
    node: MediaNode,
    operation: SearchOperation
  ): SearchResult[] {
    const results: SearchResult[] = [];
    const query = operation.query.toLowerCase();
    
    // 只搜索元数据
    if (node.metadata.filename?.toLowerCase().includes(query)) {
      results.push({
        type: 'filename',
        nodeId: node.meta.id,
        match: node.metadata.filename,
        relevanceScore: 0.8
      });
    }
    
    if (node.metadata.description?.toLowerCase().includes(query)) {
      results.push({
        type: 'description',
        nodeId: node.meta.id,
        match: node.metadata.description,
        relevanceScore: 0.6
      });
    }
    
    return results;
  }
}
```

#### 4. AI操作处理器实现
```typescript
// AI操作处理器
class AIOperationHandler implements OperationHandler {
  constructor(private aiProvider: AIProvider) {}
  
  async handle(
    node: BaseNode,
    operation: AIOperation,
    context?: OperationContext
  ): Promise<AIOperationResult> {
    switch (node.type) {
      case NodeType.CONTENT:
        return this.handleContentNode(node as ContentNode, operation);
      case NodeType.RELATION:
        return this.handleRelationNode(node as RelationNode, operation);
      case NodeType.MEDIA:
        return this.handleMediaNode(node as MediaNode, operation);
      case NodeType.WORKFLOW:
      case NodeType.COMPUTE:
        throw new Error(`AI operations not supported for ${node.type} nodes`);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }
  
  private async handleContentNode(
    node: ContentNode,
    operation: AIOperation
  ): Promise<AIOperationResult> {
    switch (operation.subType) {
      case 'generate_content':
        return await this.aiProvider.generateContent({
          context: node.content,
          prompt: operation.prompt,
          style: 'knowledge_base'
        });
        
      case 'extract_entities':
        return await this.aiProvider.extractEntities({
          text: node.content,
          existingTags: node.entityTags
        });
        
      case 'summarize':
        return await this.aiProvider.summarize({
          content: [node.content, ...node.blocks.map(b => b.content)].join('\n'),
          maxLength: operation.params?.maxLength || 200
        });
        
      default:
        throw new Error(`AI operation ${operation.subType} not supported for ContentNode`);
    }
  }
  
  private async handleRelationNode(
    node: RelationNode,
    operation: AIOperation
  ): Promise<AIOperationResult> {
    switch (operation.subType) {
      case 'suggest_relations':
        return await this.aiProvider.suggestRelations({
          participants: node.participants,
          context: node.content,
          existingType: node.relationType
        });
        
      case 'analyze_semantics':
        return await this.aiProvider.analyzeSemantics({
          relationType: node.relationType,
          semanticTags: node.semanticTags,
          participants: node.participants
        });
        
      default:
        throw new Error(`AI operation ${operation.subType} not supported for RelationNode`);
    }
  }
  
  private async handleMediaNode(
    node: MediaNode,
    operation: AIOperation
  ): Promise<AIOperationResult> {
    switch (operation.subType) {
      case 'analyze_content':
        return await this.aiProvider.analyzeMedia({
          mediaType: node.mediaType,
          source: node.source,
          existingMetadata: node.metadata
        });
        
      case 'extract_text':
        if (node.mediaType === 'image') {
          return await this.aiProvider.extractTextFromImage(node.source);
        } else if (node.mediaType === 'audio') {
          return await this.aiProvider.transcribeAudio(node.source);
        }
        throw new Error(`Text extraction not supported for ${node.mediaType}`);
        
      default:
        throw new Error(`AI operation ${operation.subType} not supported for MediaNode`);
    }
  }
}
```

#### 5. React组件差异化渲染
```typescript
// 节点渲染器组件
const NodeRenderer: React.FC<NodeRendererProps> = ({ node, selected, onEdit }) => {
  // 根据节点类型渲染不同的组件
  const renderNodeContent = () => {
    switch (node.type) {
      case NodeType.CONTENT:
        return <ContentNodeRenderer node={node as ContentNode} />;
      case NodeType.RELATION:
        return <RelationNodeRenderer node={node as RelationNode} />;
      case NodeType.WORKFLOW:
        return <WorkflowNodeRenderer node={node as WorkflowNode} />;
      case NodeType.COMPUTE:
        return <ComputeNodeRenderer node={node as ComputeNode} />;
      case NodeType.MEDIA:
        return <MediaNodeRenderer node={node as MediaNode} />;
      default:
        return <div>Unknown node type: {node.type}</div>;
    }
  };
  
  return (
    <div className={`node-renderer ${selected ? 'selected' : ''}`}>
      {renderNodeContent()}
    </div>
  );
};

// 节点工具栏组件
const NodeToolbar: React.FC<NodeToolbarProps> = ({ node, onAction }) => {
  const getToolbarActions = (nodeType: NodeType): ToolbarAction[] => {
    switch (nodeType) {
      case NodeType.CONTENT:
        return [
          { id: 'edit', label: '编辑', icon: 'edit' },
          { id: 'format', label: '格式', icon: 'format' },
          { id: 'tag', label: '标签', icon: 'tag' },
          { id: 'ai_enhance', label: 'AI增强', icon: 'ai' }
        ];
      case NodeType.RELATION:
        return [
          { id: 'edit_relation', label: '编辑关系', icon: 'relation' },
          { id: 'add_participant', label: '添加参与者', icon: 'add_user' },
          { id: 'semantic_analysis', label: '语义分析', icon: 'analyze' }
        ];
      case NodeType.WORKFLOW:
        return [
          { id: 'edit_workflow', label: '编辑流程', icon: 'workflow' },
          { id: 'execute', label: '执行', icon: 'play' },
          { id: 'debug', label: '调试', icon: 'debug' }
        ];
      case NodeType.COMPUTE:
        return [
          { id: 'edit_formula', label: '编辑公式', icon: 'formula' },
          { id: 'view_dependencies', label: '查看依赖', icon: 'dependency' },
          { id: 'force_compute', label: '强制计算', icon: 'compute' }
        ];
      case NodeType.MEDIA:
        return [
          { id: 'preview', label: '预览', icon: 'preview' },
          { id: 'edit_metadata', label: '编辑信息', icon: 'info' },
          { id: 'analyze_content', label: '内容分析', icon: 'ai' }
        ];
      default:
        return [];
    }
  };
  
  const actions = getToolbarActions(node.type);
  
  return (
    <div className="node-toolbar">
      {actions.map(action => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          title={action.label}
          className="toolbar-button"
        >
          <Icon name={action.icon} />
        </button>
      ))}
    </div>
  );
};
```

### 架构优势总结

1. **类型安全**: TypeScript严格类型检查确保操作分发的正确性
2. **性能优化**: 操作只处理支持的节点类型，避免无效计算
3. **可扩展性**: 新节点类型通过注册机制轻松添加
4. **用户体验**: 界面和操作根据节点类型自动适配
5. **维护性**: 每种节点类型的逻辑完全独立，便于开发和调试

---

## 🚧 临时设计区域：工作流处理与响应式计算分层设计

> **说明**: 此区域用于保存工作流处理逻辑与响应式计算系统的架构设计讨论结果

### 核心差异分析

#### 工作流处理逻辑 (WorkflowLayer)
- **执行特性**: 主动执行，用户触发或定时执行的离散任务
- **状态管理**: 有明确的开始、执行中、完成状态，支持状态持久化
- **业务复杂度**: 支持分支判断、循环、异步调用等复杂业务逻辑
- **外部交互**: 可调用API、访问文件、执行系统命令、操作外部资源
- **错误处理**: 具备重试机制、错误恢复、人工干预等复杂错误处理

#### 响应式计算 (ReactiveLayer)  
- **执行特性**: 被动响应，数据变化时自动重新计算
- **状态管理**: 无状态执行，纯函数式，输入相同则输出相同
- **计算特点**: 实时更新，依赖数据改变时立即同步更新结果
- **作用范围**: 主要基于现有数据进行数学运算和逻辑推导
- **性能要求**: 高频触发，需要极高的执行效率和低延迟

### 具体实现对比

```typescript
// 工作流处理：制作布丁的复杂业务流程
const makePuddingWorkflow = {
  id: 'make-pudding-001',
  status: 'pending' | 'running' | 'completed' | 'failed',
  steps: [
    { 
      action: 'checkInventory', 
      params: ['milk', 'eggs', 'sugar'],
      retryCount: 3,
      timeout: 30000
    },
    { 
      action: 'reserveIngredients', 
      params: { milk: 500, eggs: 2, sugar: 100 },
      rollback: 'releaseReservation'
    },
    { 
      action: 'executeRecipe', 
      params: 'classic-pudding',
      parallelizable: false
    },
    { 
      action: 'updateInventory', 
      params: 'subtract-used',
      finalizer: true
    }
  ],
  errorHandling: {
    onFailure: 'rollback',
    notifications: ['user', 'admin'],
    retryPolicy: 'exponential-backoff'
  }
};

// 响应式计算：库存实时状态计算
const inventoryReactiveComputations = {
  // 可用牛奶量 = 总库存 - 预留量
  availableMilk: () => warehouse.milk - reservedIngredients.milk,
  
  // 可用鸡蛋数 = 总库存 - 预留量
  availableEggs: () => warehouse.eggs - reservedIngredients.eggs,
  
  // 可用糖量 = 总库存 - 预留量
  availableSugar: () => warehouse.sugar - reservedIngredients.sugar,
  
  // 可制作布丁数量（实时计算瓶颈资源）
  availablePuddings: () => Math.min(
    Math.floor(availableMilk() / 500),
    Math.floor(availableEggs() / 2), 
    Math.floor(availableSugar() / 100)
  ),
  
  // 库存预警状态
  inventoryAlert: () => ({
    milk: availableMilk() < 1000 ? 'low' : 'normal',
    eggs: availableEggs() < 10 ? 'low' : 'normal',
    sugar: availableSugar() < 500 ? 'low' : 'normal'
  })
};
```

### 五层分层架构中的定位

```
用户交互层 (InteractionLayer)
    ↓
工作流处理层 (WorkflowLayer)     ← 复杂业务逻辑，状态化执行
    ↓
响应式计算层 (ReactiveLayer)    ← 实时数据计算，无状态纯函数
    ↓
视图渲染层 (ViewLayer)
    ↓  
知识存储层 (KnowledgeLayer)
```

### 协同工作模式

1. **用户触发**: 用户在界面发起"制作布丁"操作
2. **工作流启动**: WorkflowLayer 开始执行复杂的业务流程
3. **实时计算**: ReactiveLayer 持续计算库存状态和可制作数量
4. **视图更新**: 界面实时显示库存变化和制作进度
5. **数据更新**: 工作流执行结果更新底层数据
6. **响应式传播**: 数据变化触发新一轮响应式计算
7. **用户反馈**: 用户看到最新的状态和建议

### 技术实现架构

```typescript
interface LayeredProcessingArchitecture {
  // 工作流处理层
  workflowLayer: {
    engine: WorkflowEngine;
    executors: Record<string, WorkflowExecutor>;
    stateManager: WorkflowStateManager;
    errorHandler: WorkflowErrorHandler;
  };
  
  // 响应式计算层
  reactiveLayer: {
    computeGraph: ComputationGraph;
    scheduler: ReactiveScheduler;
    cachingLayer: ComputationCache;
    dependencyTracker: DependencyTracker;
  };
  
  // 层间通信
  layerCommunication: {
    workflowToReactive: DataChangeNotifier;
    reactiveToView: StateChangeEmitter;
    crossLayerEventBus: EventBusManager;
  };
}
```

### 设计原则总结

- **职责分离**: 工作流处理复杂业务，响应式计算处理数据转换
- **性能优化**: 响应式计算高频优化，工作流处理注重稳定性
- **状态管理**: 工作流有状态持久化，响应式计算保持无状态
- **错误处理**: 工作流具备完整错误恢复，响应式计算快速失败
- **扩展性**: 两层独立演进，可插拔式功能扩展

这种分层设计确保了系统既能处理复杂的业务逻辑，又能保持高性能的实时响应。