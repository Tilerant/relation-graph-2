# 系统架构设计

## Electron桌面应用架构

### 跨平台桌面应用设计

基于Electron的AI知识图谱桌面应用，提供原生应用体验和本地数据安全。

```
┌─────────────────────────────────────────────────────────────┐
│                   Electron应用架构                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  主进程      │    │  渲染进程    │    │  原生集成    │     │
│  │ (Main)      │    │(Renderer)  │    │ (Native)   │     │
│  │             │    │             │    │             │     │
│  │• 应用生命周期  │    │• React前端   │    │• 文件系统    │     │
│  │• 窗口管理    │    │• AI交互界面  │    │• 系统托盘    │     │
│  │• IPC通信     │    │• 图谱渲染    │    │• 全局快捷键  │     │
│  │• 安全存储    │    │• 状态管理    │    │• 自动更新    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Electron特定优势

#### 1. 原生桌面体验
- **系统级快捷键**: Cmd+Space唤起AI助手等全局快捷键
- **文件关联**: .graph文件双击自动打开
- **系统托盘**: 后台运行，随时调用
- **原生窗口**: 系统原生外观和操作

#### 2. 数据安全与隐私
- **本地存储**: 所有用户数据完全本地化
- **加密API密钥**: 系统级安全存储API密钥
- **离线可用**: 核心编辑功能无需网络
- **自动备份**: 本地增量备份机制

#### 3. AI集成优势
- **多模型支持**: OpenAI、Claude、本地模型灵活切换
- **请求缓存**: 本地缓存AI响应，节省成本
- **使用统计**: 本地跟踪AI使用量和费用
- **隐私保护**: AI请求通过主进程，增强安全性

## 分层架构核心理念

基于**节点类型化架构**，系统采用**三层分离设计**，实现知识语义、功能应用与视觉呈现的完美分离：

```
知识层（语义实体）→ 功能层（功能实体）→ 视图层（表现）
    ↓                  ↓               ↓
ContentNode/         WorkflowNode/    Layout/Style/
RelationNode/        ComputeNode/     UI/Temp
Edge                 MediaNode
     ↓                  ↓               ↓
   AI理解             专用功能         多视图呈现
```

### 架构设计优势
- **语义纯净**: 知识层只包含真正的知识实体，AI可专注语义操作
- **功能分层**: 功能层承载应用逻辑，与知识语义分离
- **类型安全**: 节点类型化设计确保操作的精确性和安全性
- **AI协作**: 大模型根据实体层级选择合适的处理策略

## 节点类型化架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                      视图层 (View Layer)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │  白板视图    │  │  线性视图    │  │   临时元素管理       │   │
│  │(Whiteboard) │  │ (Linear)    │  │ (Temp Elements)   │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    功能层 (Functional Layer)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │  工作流节点   │  │   计算节点   │  │     媒体节点         │   │
│  │(WorkflowNode)│ │(ComputeNode)│  │  (MediaNode)       │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    交互控制层 (Interaction)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │  命令系统    │  │ AI协作引擎   │  │   Obsidian风格     │   │
│  │ (Command)   │  │ (AI Engine) │  │   插件系统         │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    知识层 (Knowledge Layer)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │   内容节点    │  │   关系节点   │  │       简单边         │   │
│  │(ContentNode)│  │(RelationNode)│ │     (Edge)         │   │
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

### 3. 交互控制层 (Interaction Layer)

#### 核心组件
- **命令系统**: 统一的操作入口，支持撤销/重做
- **AI协作引擎**: 大模型深度集成，智能辅助操作  
- **插件管理**: 动态加载、热插拔的功能扩展
#### AI协作引擎架构

核心价值：**AI直接操作白板，用自然语言创建知识结构**

```typescript
interface AICollaborationEngine {
  // 🎯 核心功能：自然语言图谱操作
  naturalLanguageOperations: {
    // 一句话创建整个知识结构
    createKnowledgeStructure(prompt: string): Promise<GraphOperation[]>;
    
    // 智能节点和关系生成
    parseUserIntent(input: string): Promise<AIOperation[]>;
    
    // 实时图谱操作
    executeGraphCommands(operations: AIOperation[]): Promise<CommandResult[]>;
  };
  
  // 🧠 智能关系建议
  relationSuggestion: {
    analyzeContent(nodes: Node[]): RelationSuggestion[];
    suggestConnections(context: KnowledgeBase): Edge[];
    detectPatterns(graph: KnowledgeGraph): Pattern[];
    autoLayout(nodes: Node[], edges: Edge[]): LayoutSuggestion;
  };
  
  // ✨ 内容智能生成  
  contentGeneration: {
    generateNode(prompt: string, context: Node[]): Node;
    expandContent(node: Node, direction: string): Block[];
    summarizeGraph(view: View): string;
    generateRelationContent(edge: Edge): RelationDescription;
  };
  
  // 🔄 知识优化
  knowledgeOptimization: {
    optimizeStructure(kb: KnowledgeBase): OptimizationSuggestion[];
    detectDuplicates(nodes: Node[]): DuplicateGroup[];
    suggestCategories(nodes: Node[]): Category[];
    improveConnections(graph: Graph): ConnectionImprovement[];
  };
  
  // 🎛️ AI配置和模型管理
  modelConfiguration: {
    setAPIKey(provider: 'openai' | 'anthropic', key: string): void;
    configureModel(model: AIModel): void;
    adjustParameters(params: AIParameters): void;
  };
}
```

#### AI操作的"魔法瞬间"实现

**用户体验目标**：用一句话，让AI创建并连接多个节点，构建完整知识结构

```typescript
// 用户输入："创建一个关于人工智能的知识图谱"
// AI输出：
interface AIGraphCreationExample {
  input: "创建一个关于人工智能的知识图谱";
  
  aiResponse: {
    operations: [
      {
        type: 'create_node',
        params: {
          nodeType: 'content',
          title: '人工智能',
          content: '人工智能(AI)是计算机科学的一个分支...',
          position: { x: 200, y: 100 }
        }
      },
      {
        type: 'create_node',
        params: {
          nodeType: 'content', 
          title: '机器学习',
          content: '机器学习是AI的核心技术...',
          position: { x: 100, y: 250 }
        }
      },
      {
        type: 'create_edge',
        params: {
          sourceId: '人工智能',
          targetId: '机器学习', 
          relationType: 'contains'
        }
      }
      // ... 更多操作
    ],
    explanation: '我为你创建了人工智能知识图谱，包含主要分支和核心概念的连接关系。'
  }
}
```

#### AI与命令系统集成架构

```typescript
interface AICommandIntegration {
  // AI操作转换为可撤销命令
  aiToCommand: {
    convertOperation(operation: AIOperation): ReversibleCommand;
    batchConvert(operations: AIOperation[]): ReversibleCommand[];
    validateOperations(operations: AIOperation[]): ValidationResult;
  };
  
  // 命令执行与AI反馈
  commandExecution: {
    executeWithFeedback(commands: ReversibleCommand[]): Promise<AIFeedback>;
    handlePartialFailure(results: CommandResult[]): Promise<RecoveryPlan>;
    provideExecutionSummary(results: CommandResult[]): ExecutionSummary;
  };
  
  // AI上下文管理
  contextManagement: {
    maintainConversationContext(history: AIInteraction[]): AIContext;
    trackGraphChanges(before: Graph, after: Graph): ChangeContext;
    suggestFollowUpActions(context: AIContext): FollowUpSuggestion[];
  };
}
```

## Obsidian风格插件系统架构

### 插件系统核心设计

借鉴Obsidian的成功经验，Graph-cc采用**社区驱动的插件生态**，支持灵活扩展和第三方开发：

```typescript
interface GraphPluginSystem {
  // 插件分类体系
  pluginCategories: {
    // 核心插件（官方维护）
    corePlugins: CorePlugin[];
    // 社区插件（社区开发）
    communityPlugins: CommunityPlugin[];
    // 主题插件（视觉定制）
    themePlugins: ThemePlugin[];
  };
  
  // 插件能力接口
  pluginCapabilities: {
    // UI扩展能力
    uiExtensions: UIExtensionAPI;
    // 数据访问能力
    dataAccess: DataAccessAPI;
    // 节点类型扩展
    nodeTypeExtensions: NodeTypeAPI;
    // AI功能扩展
    aiFunctionExtensions: AIFunctionAPI;
  };
  
  // 插件管理系统
  pluginManager: {
    // 插件发现和安装
    discovery: PluginDiscoveryService;
    // 生命周期管理
    lifecycle: PluginLifecycleManager;
    // 权限和沙箱
    security: PluginSecurityManager;
    // 插件通信
    messaging: PluginMessageBus;
  };
}
```

### 插件能力范围设计

#### 1. UI扩展能力
```typescript
interface UIExtensionAPI {
  // 主要面板扩展
  panels: {
    leftRibbon: RibbonActionAPI;      // 左侧工具栏
    rightSidebar: SidebarPaneAPI;     // 右侧面板
    statusBar: StatusBarItemAPI;      // 状态栏
    commandPalette: CommandAPI;       // 命令面板
  };
  
  // 编辑器扩展
  editor: {
    nodeEditors: NodeEditorAPI;       // 节点编辑器扩展
    toolbars: ToolbarAPI;             // 工具栏扩展
    contextMenus: ContextMenuAPI;     // 右键菜单
    shortcuts: ShortcutAPI;           // 快捷键
  };
  
  // 视图扩展
  views: {
    customViews: ViewRendererAPI;     // 自定义视图
    layoutEngines: LayoutAPI;         // 布局算法
    visualEffects: EffectAPI;         // 视觉效果
  };
}
```

#### 2. 数据访问能力
```typescript
interface DataAccessAPI {
  // 知识库访问
  knowledgeBase: {
    // 节点操作
    nodes: {
      create: (type: NodeType, data: NodeData) => Promise<BaseNode>;
      update: (nodeId: EntityId, updates: Partial<BaseNode>) => Promise<void>;
      delete: (nodeId: EntityId) => Promise<void>;
      query: (criteria: QueryCriteria) => Promise<BaseNode[]>;
    };
    
    // 关系操作
    relations: {
      createEdge: (from: EntityId, to: EntityId, label?: string) => Promise<Edge>;
      createRelation: (participants: EntityId[], type: string) => Promise<RelationNode>;
      queryPaths: (from: EntityId, to: EntityId) => Promise<Path[]>;
    };
    
    // 视图操作
    views: {
      getCurrentView: () => View;
      switchView: (viewId: EntityId) => Promise<void>;
      createView: (config: ViewConfig) => Promise<View>;
    };
  };
  
  // 元数据缓存
  metadata: {
    getNodeMetadata: (nodeId: EntityId) => CachedMetadata;
    getRelationships: () => Record<EntityId, RelationshipCache>;
    getTags: () => Record<string, TagUsage>;
    getBacklinks: (nodeId: EntityId) => BacklinkCache[];
  };
}
```

#### 3. 节点类型扩展能力
```typescript
interface NodeTypeAPI {
  // 注册新节点类型
  registerNodeType<T extends BaseNode>(definition: NodeTypeDefinition<T>): void;
  
  // 节点类型定义
  NodeTypeDefinition: {
    typeName: string;
    displayName: string;
    icon: string;
    
    // 创建逻辑
    createNode: (params: CreateNodeParams) => T;
    
    // 渲染组件
    components: {
      editor: React.ComponentType<NodeEditorProps<T>>;
      renderer: React.ComponentType<NodeRendererProps<T>>;
      toolbar: React.ComponentType<NodeToolbarProps<T>>;
      inspector: React.ComponentType<NodeInspectorProps<T>>;
    };
    
    // 支持的操作
    operations: {
      search: (node: T, query: string) => SearchResult[];
      export: (node: T, format: string) => ExportData;
      ai: (node: T, operation: AIOperation) => Promise<AIResult>;
    };
  };
}
```

#### 4. AI功能扩展能力
```typescript
interface AIFunctionAPI {
  // 注册AI功能
  registerAIFunction(definition: AIFunctionDefinition): void;
  
  // AI功能定义
  AIFunctionDefinition: {
    name: string;
    description: string;
    category: 'content' | 'relation' | 'analysis' | 'automation';
    
    // 适用的节点类型
    supportedNodeTypes: NodeType[];
    
    // 执行接口
    execute: (params: AIFunctionParams, context: KnowledgeContext) => Promise<AIFunctionResult>;
    
    // 流式执行（可选）
    executeStream?: (params: AIFunctionParams) => AsyncGenerator<PartialResult, FinalResult>;
    
    // 配置界面
    settingsComponent?: React.ComponentType<AIFunctionSettingsProps>;
  };
  
  // AI提供商集成
  aiProviders: {
    registerProvider: (provider: AIProvider) => void;
    getAvailableProviders: () => AIProvider[];
    setDefaultProvider: (providerId: string) => void;
  };
}
```

### 插件分类和功能示例

#### 1. 核心插件类型
```typescript
// 官方维护的核心插件
interface CorePlugins {
  // 知识管理核心
  knowledgeCore: {
    graphAnalysis: GraphAnalysisPlugin;      // 图分析
    contentSearch: ContentSearchPlugin;      // 内容搜索
    backlinks: BacklinksPlugin;             // 反向链接
    tags: TagManagerPlugin;                 // 标签管理
  };
  
  // AI协作核心
  aiCore: {
    relationSuggestion: RelationSuggestionPlugin;  // 关系建议
    contentGeneration: ContentGenerationPlugin;    // 内容生成
    knowledgeOptimization: OptimizationPlugin;     // 知识优化
  };
  
  // 视图核心
  viewCore: {
    whiteboardView: WhiteboardPlugin;       // 白板视图
    linearView: LinearViewPlugin;           // 线性视图
    mediaView: MediaViewPlugin;             // 媒体视图
  };
}
```

#### 2. 社区插件分类
```typescript
interface CommunityPluginCategories {
  // 编辑增强类
  editingEnhancement: {
    advancedEditor: TipTapAdvancedPlugin;   // 高级编辑器
    templates: TemplatePlugin;              // 模板系统
    textExpander: TextExpanderPlugin;       // 文本扩展
    mathEditor: MathEditorPlugin;           // 数学公式编辑
  };
  
  // 知识管理类
  knowledgeManagement: {
    spacedRepetition: SpacedRepetitionPlugin;  // 间隔重复
    flashcards: FlashcardPlugin;               // 闪卡
    citation: CitationPlugin;                  // 引用管理
    bibliography: BibliographyPlugin;          // 文献管理
  };
  
  // 可视化增强类
  visualization: {
    mindMap: MindMapPlugin;                 // 思维导图
    timeline: TimelinePlugin;               // 时间线
    kanban: KanbanPlugin;                  // 看板
    calendar: CalendarPlugin;              // 日历视图
    charts: ChartsPlugin;                  // 图表生成
  };
  
  // 工作流集成类
  workflowIntegration: {
    taskManagement: TaskManagerPlugin;      // 任务管理
    projectPlanning: ProjectPlanPlugin;     // 项目规划
    timeTracking: TimeTrackingPlugin;       // 时间追踪
    automation: AutomationPlugin;           // 自动化
  };
  
  // 外部集成类
  externalIntegration: {
    git: GitIntegrationPlugin;              // Git集成
    cloud: CloudSyncPlugin;                 // 云同步
    api: APIConnectorPlugin;                // API连接器
    database: DatabasePlugin;               // 数据库连接
  };
  
  // AI专业化类
  aiSpecialization: {
    codeAnalysis: CodeAnalysisPlugin;       // 代码分析AI
    academicWriting: AcademicWritingPlugin; // 学术写作AI
    businessAnalysis: BusinessAnalysisPlugin; // 商业分析AI
    creativeWriting: CreativeWritingPlugin; // 创意写作AI
  };
}
```

### 插件开发框架

#### 1. 插件基础结构
```typescript
// 插件主类
export default class MyPlugin extends GraphPlugin {
  settings: MyPluginSettings;
  
  async onload() {
    // 插件加载时执行
    await this.loadSettings();
    
    // 注册命令
    this.addCommand({
      id: 'my-plugin-command',
      name: 'My Plugin Command',
      callback: () => this.executeCommand(),
      hotkeys: [{ modifiers: ['Mod'], key: 'k' }]
    });
    
    // 注册UI组件
    this.addRibbonIcon('my-icon', 'My Plugin', () => {
      this.openPluginView();
    });
    
    // 注册节点类型（如果需要）
    this.registerNodeType({
      typeName: 'my-custom-node',
      displayName: 'My Custom Node',
      createNode: this.createCustomNode.bind(this),
      components: {
        editor: CustomNodeEditor,
        renderer: CustomNodeRenderer
      }
    });
  }
  
  onunload() {
    // 插件卸载时执行清理
    this.cleanup();
  }
  
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  
  async saveSettings() {
    await this.saveData(this.settings);
  }
}
```

#### 2. 插件配置系统
```typescript
class PluginSettingsTab extends PluginSettingTab {
  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
  }
  
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    // API配置
    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Enter your API key for external services')
      .addText(text => text
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value;
          await this.plugin.saveSettings();
        }));
    
    // 功能开关
    new Setting(containerEl)
      .setName('Enable Advanced Features')
      .setDesc('Enable advanced plugin features')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableAdvanced)
        .onChange(async (value) => {
          this.plugin.settings.enableAdvanced = value;
          await this.plugin.saveSettings();
        }));
  }
}
```

### 插件生态管理

#### 1. 插件发现和安装
```typescript
interface PluginDiscoveryService {
  // 插件市场
  marketplace: {
    searchPlugins: (query: string, filters: SearchFilters) => Promise<PluginSearchResult[]>;
    getPluginDetails: (pluginId: string) => Promise<PluginDetails>;
    getPluginReviews: (pluginId: string) => Promise<PluginReview[]>;
    installPlugin: (pluginId: string) => Promise<InstallResult>;
  };
  
  // 插件分类
  categories: {
    listCategories: () => PluginCategory[];
    getPluginsByCategory: (categoryId: string) => Promise<Plugin[]>;
    getFeaturedPlugins: () => Promise<Plugin[]>;
    getRecommendedPlugins: (userProfile: UserProfile) => Promise<Plugin[]>;
  };
  
  // 更新管理
  updates: {
    checkForUpdates: () => Promise<PluginUpdate[]>;
    updatePlugin: (pluginId: string) => Promise<UpdateResult>;
    autoUpdateEnabled: (pluginId: string) => boolean;
    setAutoUpdate: (pluginId: string, enabled: boolean) => void;
  };
}
```

#### 2. 插件质量保证
```typescript
interface PluginQualityAssurance {
  // 代码审查
  codeReview: {
    securityScan: (pluginCode: string) => SecurityScanResult;
    performanceAnalysis: (plugin: Plugin) => PerformanceReport;
    compatibilityCheck: (plugin: Plugin, version: string) => CompatibilityResult;
  };
  
  // 社区评价
  communityFeedback: {
    ratings: PluginRating[];
    reviews: PluginReview[];
    reportIssue: (pluginId: string, issue: IssueReport) => Promise<void>;
    flagContent: (pluginId: string, reason: string) => Promise<void>;
  };
  
  // 官方认证
  certification: {
    verifiedDeveloper: boolean;
    officialPlugin: boolean;
    securityCertified: boolean;
    performanceCertified: boolean;
  };
}
```

### 插件系统优势

#### 1. **开发者友好**
- 完整的API文档和开发工具
- 热重载开发环境
- TypeScript类型安全
- 丰富的示例和模板

#### 2. **用户体验**
- 一键安装和管理
- 细粒度权限控制
- 自动更新和回滚
- 个性化推荐

#### 3. **生态健康**
- 开源社区驱动
- 质量保证机制
- 开发者激励
- 长期维护支持

这种Obsidian风格的插件系统将为Graph-cc提供强大的扩展能力，让社区能够贡献各种专业化的功能，同时保持核心系统的稳定性和简洁性。

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

### 3. 事件-命令系统层 (Event-Command System)

#### Event Sourcing 架构
基于事件溯源模式，事件作为状态记录和撤销/重做的基础：

```typescript
Event Sourcing Pattern {
  // 命令执行 → 事件生成 → 状态变更
  command → events → state_change
  
  // 事件存储（历史记录）
  eventStore: DomainEvent[]
  
  // 撤销/重做栈
  undoStack: DomainEvent[]
  redoStack: DomainEvent[]
  
  // 状态重建
  rebuildState(events) → currentState
}
```

#### 核心原理
- **命令包含撤销逻辑**：每个命令知道如何执行和撤销自己的操作
- **事件记录操作历史**：事件用于审计、通知和历史记录，不包含撤销逻辑
- **撤销栈存储命令**：撤销/重做基于命令对象，而非事件回溯
- **高内聚设计**：命令的执行和撤销逻辑紧密关联，便于维护和扩展

#### 命令类型分类
- **node-commands**: 节点的 CRUD 操作，产生节点相关事件
- **edge-commands**: 边的创建、修改、删除，产生关系事件  
- **block-commands**: 内容块的操作，产生内容事件
- **view-commands**: 视图和布局管理，产生视图事件

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