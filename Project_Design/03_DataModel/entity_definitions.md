# 实体定义与数据模型

## 分层架构设计原则

系统采用**三层分离架构**，基于节点类型化设计实现功能分层和语义分离：

```
知识层（语义实体）→ 功能层（功能实体）→ 视图层（表现）
    ↓                  ↓               ↓
ContentNode/         WorkflowNode/    Layout/Style/
RelationNode/        ComputeNode/     UI/Temp
Edge                 MediaNode
```

### 设计理念
- **知识层**: 承载真正的知识内容和语义关系，是AI理解和操作的核心
- **功能层**: 提供具体的应用功能，如工作流执行、计算处理、媒体管理
- **视图层**: 负责所有实体的视觉表现和用户交互界面

## 节点类型化架构设计

系统采用**节点类型分化**策略，通过不同节点类型实现功能分层和差异化处理。这种设计避免了复杂的分层插件系统，让用户更直观地理解和使用不同功能。

### 核心设计理念
- **类型明确**: 每种节点类型有明确的职责和功能边界
- **差异化处理**: 同一操作在不同节点类型上表现出不同行为
- **无需转换**: 节点类型在创建时确定，无需复杂的类型转换机制
- **扩展性强**: 支持插件注册新的节点类型

## 节点类型的分层归属

### 知识层节点类型

#### 1. ContentNode (内容节点) 
- **分层归属**: 知识层核心实体
- **职责**: 承载真正的知识内容和概念
- **特性**: 富文本、内容块、实体标签、语义化内容
- **搜索支持**: 全文搜索（标题、内容、块结构）
- **AI处理**: 内容生成、实体提取、摘要、概念分析
- **标签系统**: 实体标签（entityTags）专属

#### 2. RelationNode (关系节点)
- **分层归属**: 知识层语义关系实体  
- **职责**: 表达复杂多方语义关系（超边）
- **特性**: 多参与者、语义标签、关系推理、知识建模
- **搜索支持**: 语义关系搜索（关系类型、语义标签）
- **AI处理**: 关系建议、语义分析、模式发现、知识推理
- **标签系统**: 语义标签（semanticTags）专属

#### 3. Edge (简单边)
- **分层归属**: 知识层基础连接实体
- **职责**: 表达简单的二元语义连接
- **特性**: 源节点、目标节点、语义标签
- **搜索支持**: 参与关系路径搜索
- **AI处理**: 关系推荐、连接分析
- **转换能力**: 可升级为RelationNode以支持复杂关系

### 功能层节点类型

#### 4. WorkflowNode (工作流节点)
- **分层归属**: 功能层执行实体
- **职责**: 业务流程执行和任务编排
- **特性**: 步骤定义、状态管理、条件分支、执行引擎
- **搜索支持**: 不参与语义搜索（有专用的流程搜索）
- **AI处理**: 不参与知识AI处理（有专用的流程AI）
- **显示模式**: 专用工作流编辑器和状态监控

#### 5. ComputeNode (计算节点)
- **分层归属**: 功能层计算实体
- **职责**: 实时计算和响应式数据处理
- **特性**: 计算公式、依赖追踪、自动更新、结果缓存
- **搜索支持**: 不参与语义搜索（有专用的公式搜索）
- **AI处理**: 不参与知识AI处理（有专用的计算AI）
- **显示模式**: 公式编辑器和结果预览

#### 6. MediaNode (媒体节点)
- **分层归属**: 功能层资源实体
- **职责**: 媒体资源管理和处理
- **特性**: 文件管理、格式转换、预览显示、元数据管理
- **搜索支持**: 元数据搜索和内容索引搜索
- **AI处理**: 媒体内容分析（图像识别、音频转录、视频理解）
- **显示模式**: 媒体预览和元数据编辑

## 节点类型定义

### 基础节点接口
```typescript
// 节点类型枚举
enum NodeType {
  CONTENT = 'content',
  RELATION = 'relation', 
  WORKFLOW = 'workflow',
  COMPUTE = 'compute',
  MEDIA = 'media'
}

// 基础节点接口
interface BaseNode {
  meta: EntityMeta;
  type: NodeType;
  title: string;
  position?: Position;
}
```

### 具体节点类型实现
```typescript
// 内容节点
interface ContentNode extends BaseNode {
  type: NodeType.CONTENT;
  content: string;
  blocks: Block[];
  entityTags: EntityTag[];  // 专属：实体标签
  attributes: ContentAttributes;
}

// 关系节点
interface RelationNode extends BaseNode {
  type: NodeType.RELATION;
  participants: ParticipantRef[];
  semanticTags: SemanticTag[];  // 专属：语义标签
  relationType: RelationType;
  attributes: RelationAttributes;
}

// 工作流节点
interface WorkflowNode extends BaseNode {
  type: NodeType.WORKFLOW;
  workflow: WorkflowDefinition;
  currentState: WorkflowState;
  triggers: WorkflowTrigger[];
  attributes: WorkflowAttributes;
}

// 计算节点
interface ComputeNode extends BaseNode {
  type: NodeType.COMPUTE;
  formula: ComputeFormula;
  dependencies: ComputeDependency[];
  output: ComputeOutput;
  attributes: ComputeAttributes;
}

// 媒体节点
interface MediaNode extends BaseNode {
  type: NodeType.MEDIA;
  mediaType: MediaType;
  source: MediaSource;
  metadata: MediaMetadata;
  attributes: MediaAttributes;
}
```

## 差异化操作分发系统

### 操作分发原理
差异化操作分发是指根据节点类型来决定如何处理同一个操作请求。同一操作（如搜索、编辑、AI处理）在不同类型节点上表现出完全不同的行为。

### 搜索操作分发示例
```typescript
interface SearchOperationHandler {
  // 内容节点：搜索标题、内容、块结构
  handleContentNode(node: ContentNode, query: string): SearchResult[] {
    // 搜索标题、内容、内容块、实体标签
    return this.searchContentFields(node, query);
  }
  
  // 关系节点：搜索关系类型、语义标签
  handleRelationNode(node: RelationNode, query: string): SearchResult[] {
    // 搜索关系类型、语义标签
    return this.searchRelationFields(node, query);
  }
  
  // 工作流节点：不参与内容搜索
  handleWorkflowNode(node: WorkflowNode, query: string): SearchResult[] {
    return []; // 工作流节点不参与搜索
  }
  
  // 媒体节点：只搜索元数据
  handleMediaNode(node: MediaNode, query: string): SearchResult[] {
    return this.searchMetadata(node.metadata, query);
  }
}
```

### 用户界面差异化
```typescript
// 不同节点类型的编辑界面配置
interface NodeTypeRendering {
  [NodeType.CONTENT]: {
    defaultDisplay: 'CARD';
    editingMode: 'inline';
    toolbar: ['format', 'block', 'tag'];
  };
  
  [NodeType.RELATION]: {
    defaultDisplay: 'RELATION';
    editingMode: 'modal';
    toolbar: ['participant', 'semantic', 'type'];
  };
  
  [NodeType.WORKFLOW]: {
    defaultDisplay: 'WORKFLOW';
    editingMode: 'dedicated_editor';
    toolbar: ['step', 'condition', 'trigger'];
  };
  
  [NodeType.COMPUTE]: {
    defaultDisplay: 'COMPUTE';
    editingMode: 'formula_editor';
    toolbar: ['formula', 'dependency', 'output'];
  };
  
  [NodeType.MEDIA]: {
    defaultDisplay: 'MEDIA_PREVIEW';
    editingMode: 'metadata_only';
    toolbar: ['info', 'transform', 'link'];
  };
}
```

### 操作分发器实现
```typescript
class NodeOperationDispatcher {
  private handlers: Map<NodeType, NodeOperationHandler> = new Map();
  
  // 核心分发逻辑
  async executeOperation(node: BaseNode, operation: Operation): Promise<OperationResult> {
    // 1. 获取节点类型对应的处理器
    const handler = this.handlers.get(node.type);
    if (!handler) {
      throw new Error(`No handler registered for node type: ${node.type}`);
    }
    
    // 2. 检查操作是否被该节点类型支持
    if (!handler.supportsOperation(operation.type)) {
      return { success: false, reason: 'Operation not supported' };
    }
    
    // 3. 分发到具体的处理方法
    return await handler.executeOperation(node, operation);
  }
}
```

## 节点类型扩展机制

### 节点类型注册系统
```typescript
interface NodeTypeRegistry {
  // 注册新的节点类型
  registerNodeType<T extends BaseNode>(
    type: string,
    definition: NodeTypeDefinition<T>
  ): void;
  
  // 创建指定类型的节点
  createNode<T extends BaseNode>(
    type: NodeType,
    params: CreateNodeParams
  ): T;
  
  // 获取节点类型的处理器
  getNodeHandler<T extends BaseNode>(type: NodeType): NodeHandler<T>;
}

// 节点类型定义接口
interface NodeTypeDefinition<T extends BaseNode> {
  typeName: string;
  displayName: string;
  description: string;
  icon: string;
  
  // 创建逻辑
  createNode: (params: CreateNodeParams) => T;
  
  // 渲染配置
  renderConfig: NodeRenderConfig;
  
  // 支持的操作
  supportedOperations: Operation[];
  
  // 类型特定的组件
  components: {
    editor?: React.ComponentType<NodeEditorProps<T>>;
    renderer?: React.ComponentType<NodeRendererProps<T>>;
    toolbar?: React.ComponentType<NodeToolbarProps<T>>;
  };
}
```

## 唯一的类型转换：边 → 关系节点

系统设计中不需要复杂的节点类型转换，唯一的转换场景是将简单的边（Edge）转换为复杂的关系节点（RelationNode）：

```typescript
interface EdgeToRelationConverter {
  // 简单边转换为复杂关系节点
  convertEdgeToRelation(edge: Edge): RelationNode {
    return {
      type: NodeType.RELATION,
      participants: [
        { nodeId: edge.from, role: 'source' },
        { nodeId: edge.to, role: 'target' }
      ],
      semanticTags: [edge.label], // 边的标签转为语义标签
      relationType: 'binary_relation',
      // ... 其他属性
    };
  }
}
```

## 核心实体概览（传统节点定义）

除了新的节点类型化架构，系统仍保持对传统实体的支持：**节点(Node)**、**边(Edge)**、**关系节点(RelationNode)**。每种实体都具有版本化的元数据和可扩展的属性系统。

## 1. 节点 (Node) - 传统定义

### 定义与用途
传统节点是知识图谱中的基本知识单元，现在主要对应ContentNode类型。

### 数据结构
```typescript
interface Node {
  meta: NodeMetaProperties;     // 元数据
  title: string;                // 标题
  content: string;              // 主要内容
  blocks: Block[];              // 结构化内容块
  attributes: DynamicProperties; // 扩展属性
}

interface NodeMetaProperties extends MetaProperties {
  entityLabel?: string;         // 实体标签ID（注册标签系统）
}
```

### 关键特性
- **富内容支持**: 通过 blocks 数组支持多种内容类型
- **版本管理**: 完整的创建/更新时间戳和版本控制
- **混合标签系统**: 
  - `entityLabel`: 结构化实体类型标签（可选，注册标签系统）
  - `tags`: 通用自由标签数组（用户自定义）
- **模板化初始化**: 通过实体标签触发属性模板初始化
- **扩展属性**: attributes 允许添加任意键值对信息

### 使用示例
```typescript
const conceptNode: Node = {
  meta: {
    id: 'node_concept_1',
    createdAt: 1640995200000,
    updatedAt: 1640995200000,
    version: 1,
    tags: ['概念', '核心'],
    entityLabel: 'concept'  // 注册标签ID
  },
  title: '知识图谱',
  content: '用于表示实体及其关系的图结构数据模型',
  blocks: [
    {
      id: 'block_1',
      type: 'text',
      content: '知识图谱由节点和边构成...',
      properties: {},
      order: 0
    }
  ],
  attributes: {
    domain: '计算机科学',
    complexity: 'intermediate',
    source: 'Wikipedia'
  }
}
```

## 2. 边 (Edge)

### 定义与用途
边表示节点之间的轻量级关系连接，具有明确的语义标签，适合表示简单的二元关系。

### 数据结构
```typescript
interface Edge {
  meta: EdgeMetaProperties;     // 元数据
  sourceNodeId: EntityId;       // 源节点ID
  targetNodeId: EntityId;       // 目标节点ID
  attributes: DynamicProperties; // 扩展属性
}

interface EdgeMetaProperties extends MetaProperties {
  semanticLabel?: string;       // 语义标签ID（注册标签系统）
}
```

### 语义标签设计
语义标签现在基于**注册标签系统**管理，每个语义标签都有稳定的ID和多语言显示名称。

**主要语义标签类别**:
- **引用关系**: `cites`, `references`, `based_on`
- **逻辑关系**: `implies`, `proves`, `contradicts`  
- **分类关系**: `instance_of`, `subclass_of`, `part_of`
- **依赖关系**: `depends_on`, `requires`, `influences`
- **时序关系**: `precedes`, `follows`, `concurrent`

详细的语义标签定义请参考 [标签系统设计](label_system_design.md)。

### 使用示例
```typescript
const dependencyEdge: Edge = {
  meta: {
    id: 'edge_dep_1',
    createdAt: 1640995200000,
    updatedAt: 1640995200000,
    version: 1,
    tags: ['技术依赖'],
    semanticLabel: 'depends_on'  // 注册标签ID
  },
  sourceNodeId: 'node_system',
  targetNodeId: 'node_library',
  attributes: {
    strength: 'strong',
    note: '系统核心功能依赖此库',
    confidence: 0.95
  }
}
```

## 3. 关系节点 (RelationNode)

### 定义与用途
关系节点（超边）表示涉及多个参与者的复杂关系，自身可以包含丰富的内容和属性。

### 数据结构
```typescript
interface RelationNode {
  meta: RelationMetaProperties; // 元数据
  title: string;                // 关系标题
  content: string;              // 关系描述
  blocks: Block[];              // 内容块
  participants: EntityId[];     // 参与者列表
  attributes: DynamicProperties; // 扩展属性
}

interface RelationMetaProperties extends MetaProperties {
  relationType?: string;        // 关系类型ID（注册标签系统）
}
```

### 关系类型设计
关系类型基于**注册标签系统**管理，支持复杂的多参与者关系建模。

**主要关系类型类别**:
- **因果关系**: `causal_chain`, `root_cause_analysis`, `result_prediction`
- **争论结构**: `argument`, `debate`, `evidence_support`
- **验证关系**: `validation`, `experiment`, `observation`, `testing`
- **演化过程**: `evolution_chain`, `version_development`, `improvement_process`
- **集合关系**: `collection`, `grouping`, `classification`, `clustering`

详细的关系类型定义请参考 [标签系统设计](label_system_design.md)。

### 使用示例
```typescript
const causalRelation: RelationNode = {
  meta: {
    id: 'relation_causal_1',
    createdAt: 1640995200000,
    updatedAt: 1640995200000,
    version: 1,
    tags: ['因果分析'],
    relationType: 'causal_chain'  // 注册标签ID
  },
  title: '用户需求驱动的产品迭代',
  content: '分析用户反馈如何推动产品功能的持续改进',
  blocks: [
    {
      id: 'block_analysis',
      type: 'text',
      content: '用户反馈 → 需求分析 → 功能设计 → 开发实现 → 用户验证',
      properties: {},
      order: 0
    }
  ],
  participants: [
    'node_user_feedback',
    'node_requirement_analysis', 
    'node_feature_design',
    'node_development',
    'node_user_validation'
  ],
  attributes: {
    timespan: '3个月',
    confidence: 'high',
    evidence: ['用户调研报告', '产品数据分析']
  }
}
```

## 4. 内容块 (Block)

### 定义与用途
内容块是结构化内容的基本单元，支持多种媒体类型和富文本编辑。

### 数据结构
```typescript
interface Block {
  id: EntityId;                 // 块ID
  type: BlockType;              // 块类型
  content: any;                 // 内容（类型相关）
  properties: DynamicProperties; // 块属性
  order: number;                // 显示顺序
}

type BlockType = 'text' | 'image' | 'file' | 'code' | 'table' | 'embed';
```

### 块类型详解
- **text**: 富文本内容，支持 TipTap 格式
- **image**: 图片文件，包含URL和元数据
- **file**: 文件附件，支持各种格式
- **code**: 代码片段，包含语言标识
- **table**: 结构化表格数据
- **embed**: 嵌入内容（视频、网页等）

## 5. 视图 (View)

### 定义与用途
视图定义了知识图谱的特定展示方式，包含实体集合、布局信息和样式配置。

### 数据结构
```typescript
interface View {
  id: EntityId;                 // 视图ID
  name: string;                 // 视图名称
  viewType: ViewType;           // 视图类型
  format: ViewFormat;           // 具体格式
  nodeIds: EntityId[];          // 包含的节点
  edgeIds: EntityId[];          // 包含的边
  relationIds: EntityId[];      // 包含的关系节点
  layout: LayoutInfo;           // 布局信息
  isTemporary: boolean;         // 是否为临时视图
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 布局信息
```typescript
interface LayoutInfo {
  nodePositions: Record<EntityId, {x: number, y: number}>;      // 节点中心位置
  nodeSizes: Record<EntityId, {width: number, height: number}>; // 节点尺寸
  relationPositions: Record<EntityId, {x: number, y: number}>;  // 关系节点位置
  relationSizes: Record<EntityId, {width: number, height: number}>; // 关系节点尺寸
  nodeStyles: Record<EntityId, any>;                           // 节点样式
  edgeStyles: Record<EntityId, any>;                           // 边样式
  viewBox?: {x: number, y: number, width: number, height: number}; // 视口范围
}
```

## 6. 知识库 (KnowledgeBase)

### 定义与用途
知识库是所有实体的顶层容器，提供统一的数据管理和访问接口。

### 数据结构
```typescript
interface KnowledgeBase {
  id: string;                   // 知识库ID
  name: string;                 // 知识库名称
  description: string;          // 描述
  mainViewId: EntityId;         // 主视图ID
  nodes: Record<EntityId, Node>;           // 节点集合
  edges: Record<EntityId, Edge>;           // 边集合
  relations: Record<EntityId, RelationNode>; // 关系节点集合
  views: Record<EntityId, View>;           // 视图集合
  blocks: Record<EntityId, Block>;         // 内容块集合
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 7. 标签系统集成

### 混合标签体系
系统采用**结构化标签 + 通用标签**的混合架构：

```typescript
interface MetaProperties {
  id: EntityId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
  tags: string[];              // 通用标签：用户自由标记
  
  // 结构化标签（通过继承添加）
  // entityLabel?, semanticLabel?, relationType?
}
```

### 标签系统特性
1. **注册标签管理**: 结构化标签通过注册表统一管理，避免重复污染
2. **多语言支持**: 注册标签支持多语言显示名和别名
3. **属性模板**: 实体标签可绑定属性模板，初始化节点字段
4. **图算法支持**: 标签作为图算法一等公民，支持类型化查询和推理
5. **灵活扩展**: 模板仅做初始化，不强制约束后续修改

详细的标签系统设计请参考 [标签系统设计文档](label_system_design.md)。

## 数据完整性约束

### 引用完整性
- 边的 sourceNodeId 和 targetNodeId 必须存在于 nodes 或 relations 中
- 关系节点的 participants 必须引用有效的实体ID
- 视图的 nodeIds、edgeIds、relationIds 必须引用存在的实体

### 版本一致性
- 所有实体都必须包含完整的元数据
- 更新操作必须递增版本号
- 时间戳必须反映真实的创建和修改时间

### 数据清理
- 支持孤立节点的自动检测和清理
- 无效引用的自动修复或警告
- 临时视图的定期清理机制

## 8. 白板兼容性设计

### 白板元素与知识模型映射

系统通过**二层架构**实现白板自由度与知识结构语义的完美结合：

| 白板元素 | 知识层映射 | 视图层处理 |
|---------|-----------|----------|
| **便签/文本框** | `ContentNode` | `shape`, `color`, `size` |
| **形状(矩形/圆形)** | `ContentNode` | `shape: "rect"/"circle"` |
| **箭头/连线** | `Edge` | `lineStyle`, `arrowType` |
| **图片/媒体** | `MediaNode` | `displayMode`, `preview` |
| **关系图形** | `RelationNode` | `relationStyle`, `participantLayout` |
| **计算结果** | `ComputeNode` | `resultDisplay`, `formulaView` |
| **流程图** | `WorkflowNode` | `flowStyle`, `stepLayout` |
| **自由绘制/标注** | - | `临时标注`（视图级别存储）|
| **框选/分组** | `关系节点` 或 `视图分组` | `groupStyle` |

### 二层数据处理策略

#### 知识层（核心语义）
```typescript
// 白板操作自动转换为对应的节点类型
interface WhiteboardToKnowledge {
  // 文本框 → 内容节点
  createContentNodeFromTextBox(textBox: TextBox): ContentNode;
  
  // 连线 → 边
  createEdgeFromConnection(connection: Connection): Edge;
  
  // 分组 → 关系节点
  createRelationFromGroup(group: Group): RelationNode;
  
  // 媒体文件 → 媒体节点
  createMediaNodeFromFile(file: File): MediaNode;
  
  // 公式 → 计算节点
  createComputeNodeFromFormula(formula: string): ComputeNode;
  
  // 流程图 → 工作流节点
  createWorkflowNodeFromDiagram(diagram: FlowDiagram): WorkflowNode;
}
```

#### 视图层（表现形式和临时元素）
```typescript
// 每个实体在不同视图中的表现
interface ViewLayerProperties {
  // 节点视图属性（按类型差异化）
  nodeViewConfigs: {
    [NodeType.CONTENT]: ContentNodeViewConfig;
    [NodeType.RELATION]: RelationNodeViewConfig;
    [NodeType.WORKFLOW]: WorkflowNodeViewConfig;
    [NodeType.COMPUTE]: ComputeNodeViewConfig;
    [NodeType.MEDIA]: MediaNodeViewConfig;
  };
  
  // 边视图属性  
  edgeViewConfig: {
    lineStyle: 'solid' | 'dashed' | 'dotted';
    arrowType: 'none' | 'simple' | 'filled';
    curvature: number;
  };
  
  // 临时视觉元素（不进入知识层）
  temporaryElements: {
    freeDrawings: FreeDrawing[];      // 自由绘制
    annotations: Annotation[];        // 临时标注
    highlights: Highlight[];          // 高亮区域
  };
}

// 自由绘制等临时元素存储在视图层
interface FreeDrawing {
  id: string;
  path: string;                     // SVG路径
  style: DrawingStyle;
  viewId: string;                   // 所属视图
  isTemporary: boolean;             // 标记为临时元素
}
```

### 白板交互转换规则

#### 1. 语义提升机制
```typescript
// 视图层临时元素 → 知识层的升级路径
interface SemanticUpgrade {
  // 将自由绘制转换为内容节点
  promoteDrawingToContentNode(drawing: FreeDrawing): ContentNode;
  
  // 将临时分组转换为关系节点
  promoteGroupToRelation(group: ViewGroup): RelationNode;
  
  // 将临时标注转换为节点属性
  promoteAnnotationToAttribute(annotation: Annotation, entityId: EntityId): void;
  
  // 将临时计算转换为计算节点
  promoteCalculationToComputeNode(calculation: TempCalculation): ComputeNode;
}
```

#### 2. AI协作优势
```typescript
// AI主要在知识层工作
interface AIKnowledgeOperations {
  // 智能关系建议
  suggestConnections(nodes: Node[]): Edge[];
  
  // 内容智能生成
  generateNodeContent(context: Node[], prompt: string): Node;
  
  // 知识结构优化
  optimizeLayout(knowledge: KnowledgeBase): LayoutSuggestion[];
}

// AI辅助视图优化
interface AIViewOptimization {
  // 自动布局优化
  optimizeLayout(view: View): LayoutInfo;
  
  // 视觉样式建议
  suggestStyling(content: string): ViewLayerProperties;
}
```

### 渐进式使用体验

#### 初级用户：自由白板
1. 在白板上随意绘制、添加文本
2. 系统自动识别可语义化的元素
3. 提示用户是否转换为结构化知识

#### 中级用户：混合模式
1. 直接创建节点和边
2. 使用装饰层进行标注和美化
3. AI协助优化布局和样式

#### 高级用户：知识建模
1. 直接操作知识层结构
2. 多视图展示同一知识
3. AI深度协作进行内容生成和关系发现

### 分层数据持久化策略

```typescript
interface LayeredPersistenceStrategy {
  // 知识层：核心知识资产，重点保护
  knowledgeLayer: {
    contentNodes: Record<EntityId, ContentNode>;
    relationNodes: Record<EntityId, RelationNode>;
    edges: Record<EntityId, Edge>;
    // 知识层的持久化策略：版本控制、备份、同步
    persistenceConfig: {
      versioning: true;
      backup: 'incremental';
      sync: 'real-time';
      priority: 'high';
    };
  };
  
  // 功能层：应用功能实体和状态
  functionalLayer: {
    workflowNodes: Record<EntityId, WorkflowNode>;
    computeNodes: Record<EntityId, ComputeNode>;
    mediaNodes: Record<EntityId, MediaNode>;
    // 功能层的持久化策略：状态管理、缓存、清理
    persistenceConfig: {
      stateManagement: true;
      caching: 'aggressive';
      cleanup: 'periodic';
      priority: 'medium';
    };
  };
  
  // 视图层：表现配置和临时元素
  viewLayer: Record<ViewId, {
    layout: LayoutInfo;
    nodeViewConfigs: Record<EntityId, NodeViewConfig>;
    edgeViewConfigs: Record<EntityId, EdgeViewConfig>;
    temporaryElements: {
      freeDrawings: FreeDrawing[];
      annotations: Annotation[];
      highlights: Highlight[];
    };
    // 视图层的持久化策略：用户配置、个性化
    persistenceConfig: {
      userSpecific: true;
      sync: 'on-demand';
      priority: 'low';
    };
  }>;
}
```

### 三层架构优势

这种**知识层-功能层-视图层**的分层设计确保了：

#### 1. **语义纯净性**
- **知识层**: 只包含真正的知识实体（ContentNode、RelationNode、Edge），语义清晰
- **功能层**: 承载应用功能实体，与知识语义分离
- **视图层**: 纯表现层，不影响业务逻辑

#### 2. **AI处理精确性** 
- **知识AI**: 专注于ContentNode和RelationNode的语义理解和内容生成
- **功能AI**: 针对不同功能节点提供专门的AI能力（如工作流优化、计算分析）
- **分工明确**: AI系统可以根据实体层级选择合适的处理策略

#### 3. **搜索系统分层**
- **语义搜索**: 主要在知识层进行，搜索ContentNode内容和RelationNode关系
- **功能搜索**: 在功能层进行专用搜索（工作流搜索、公式搜索、媒体搜索）
- **性能优化**: 不同层级可以使用不同的索引和搜索策略

#### 4. **扩展性和模块化**
- **知识扩展**: 新的知识类型节点归属知识层
- **功能扩展**: 新的功能类型节点归属功能层  
- **插件友好**: 插件可以针对特定层级提供功能
- **独立演进**: 各层可以相对独立地发展和优化

#### 5. **用户体验分层**
- **知识编辑**: 提供语义化的知识建模界面
- **功能操作**: 提供专业化的功能操作界面
- **视觉呈现**: 统一的视觉风格和交互体验

#### 6. **数据管理清晰**
- **知识持久化**: 知识层数据是核心资产，需要重点保护和备份
- **功能状态**: 功能层包含执行状态，可以有不同的持久化策略  
- **视图配置**: 视图层配置可以灵活调整，支持个性化