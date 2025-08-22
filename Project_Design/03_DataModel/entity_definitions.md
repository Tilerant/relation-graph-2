# 实体定义与数据模型

## 核心实体概览

系统基于三种核心实体构建知识图谱：**节点(Node)**、**边(Edge)**、**关系节点(RelationNode)**。每种实体都具有版本化的元数据和可扩展的属性系统。

## 1. 节点 (Node)

### 定义与用途
节点是知识图谱中的基本知识单元，代表概念、对象、事件等独立的信息实体。

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
- **text**: 富文本内容，支持 PlateJS 格式
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