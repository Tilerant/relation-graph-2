# 标签系统设计

## 设计理念

### 核心原则
基于**节点类型化架构**，标签系统现在作为**ContentNode**和**RelationNode**的特殊属性系统，为不同类型节点提供专用的语义标注能力。

### 设计目标
1. **类型专用性** - 不同节点类型拥有专属的标签系统
2. **语义明确性** - 通过类型化标签提供清晰的语义定义  
3. **功能分工** - 实体标签属于内容节点，语义标签属于关系节点
4. **图算法支持** - 标签直接参与类型化查询、推理与可视化
5. **差异化处理** - 不同标签类型支持不同的操作和功能

## 节点类型化标签架构

### 1. 类型专用标签体系

基于节点类型化架构，不同节点类型拥有专属的标签系统：

```typescript
// ContentNode 专属实体标签
interface ContentNode extends BaseNode {
  type: NodeType.CONTENT;
  entityTags: EntityTag[];      // 专属：实体标签系统
  content: string;
  blocks: Block[];
  attributes: ContentAttributes;
}

// RelationNode 专属语义标签
interface RelationNode extends BaseNode {
  type: NodeType.RELATION;
  semanticTags: SemanticTag[];  // 专属：语义标签系统
  participants: ParticipantRef[];
  relationType: RelationType;
  attributes: RelationAttributes;
}

// 其他节点类型不使用结构化标签系统
interface WorkflowNode extends BaseNode {
  type: NodeType.WORKFLOW;
  // 工作流节点有自己的专用属性，不使用标签
}

interface ComputeNode extends BaseNode {
  type: NodeType.COMPUTE;
  // 计算节点有自己的专用属性，不使用标签
}

interface MediaNode extends BaseNode {
  type: NodeType.MEDIA;
  // 媒体节点有自己的专用属性，不使用标签
}
```

### 2. 类型化标签注册系统

不同类型的标签分别管理，确保类型安全和功能分离：

```typescript
interface TypedLabelRegistry {
  // ContentNode 专用：实体标签注册表
  entityLabels: Record<string, EntityLabelDefinition>;
  
  // RelationNode 专用：语义标签注册表  
  semanticLabels: Record<string, SemanticLabelDefinition>;
  
  // RelationNode 专用：关系类型注册表
  relationTypes: Record<string, RelationTypeDefinition>;
}

interface EntityLabelDefinition {
  id: string;                           // 唯一标识符
  displayNames: Record<string, string>; // 多语言显示名
  aliases: string[];                    // 别名列表
  description: string;                  // 标签描述
  template: PropertyTemplate;           // 属性模板
  icon?: string;                       // 显示图标
  color?: string;                      // 默认颜色
  category?: string;                   // 标签分类
  deprecated?: boolean;                // 是否已废弃
}

interface SemanticLabelDefinition {
  id: string;
  displayNames: Record<string, string>;
  aliases: string[];
  description: string;
  arity: number;                       // 关系元数（2=二元，3+=多元）
  domain?: string[];                   // 源实体类型约束
  range?: string[];                    // 目标实体类型约束
  inverse?: string;                    // 逆关系标签ID
  symmetric?: boolean;                 // 是否对称
  transitive?: boolean;                // 是否传递
  functional?: boolean;                // 是否函数式
  icon?: string;
  color?: string;
  category?: string;
}

interface RelationTypeDefinition {
  id: string;
  displayNames: Record<string, string>;
  aliases: string[];
  description: string;
  participantTypes?: string[];         // 参与者类型约束
  minParticipants: number;             // 最少参与者数量
  maxParticipants?: number;            // 最多参与者数量
  template: PropertyTemplate;
  icon?: string;
  color?: string;
  category?: string;
}
```

## ContentNode 专属：实体标签系统

### 定义与用途
实体标签是**ContentNode**的专属属性，用于标识内容节点的**类型或身份**，明确回答节点"是什么"的问题。

### 专属性说明
- **仅适用于**: ContentNode类型节点
- **不适用于**: RelationNode、WorkflowNode、ComputeNode、MediaNode
- **搜索集成**: 实体标签参与ContentNode的搜索操作
- **AI处理**: 实体标签可被AI用于内容生成和实体提取

### 核心特性
- **类型标识**: 如 `#论文`、`#实验`、`#人物`、`#工具`
- **模板绑定**: 每个实体标签可绑定属性模板
- **初始化指导**: 赋予标签时自动初始化对应字段
- **灵活扩展**: 初始化后用户可自由增删属性

### 预设实体标签类别

#### 学术研究类
- `paper` (论文): 标题、作者、发表年份、期刊、摘要、关键词
- `experiment` (实验): 实验名称、假设、方法、数据、结论
- `researcher` (研究者): 姓名、机构、领域、联系方式
- `theory` (理论): 理论名称、提出者、核心概念、应用领域

#### 技术开发类  
- `project` (项目): 项目名称、描述、技术栈、状态、负责人
- `component` (组件): 组件名称、功能、接口、依赖
- `tool` (工具): 工具名称、用途、平台、版本
- `framework` (框架): 框架名称、特性、适用场景、文档链接

#### 知识概念类
- `concept` (概念): 概念名称、定义、示例、相关概念
- `method` (方法): 方法名称、步骤、适用场景、效果
- `problem` (问题): 问题描述、原因分析、解决方案、状态

### ContentNode 属性模板系统

实体标签可以为ContentNode提供属性模板，用于初始化节点的attributes字段：

```typescript
interface ContentNodePropertyTemplate {
  fields: PropertyField[];
  nodeType: NodeType.CONTENT;         // 明确标明适用于内容节点
  suggested: boolean;
  version: string;
  description?: string;
}

interface PropertyField {
  key: string;                         // 属性键名
  displayName: Record<string, string>; // 多语言显示名
  type: PropertyType;                  // 属性类型
  required: boolean;                   // 是否必填
  defaultValue?: any;                  // 默认值
  validation?: ValidationRule;         // 验证规则
  indexed?: boolean;                   // 是否建议建立索引
  description?: string;                // 字段说明
  placeholder?: string;                // 输入提示
}

type PropertyType = 
  | 'string'     // 文本
  | 'number'     // 数字
  | 'date'       // 日期
  | 'boolean'    // 布尔值
  | 'reference'  // 实体引用
  | 'enum'       // 枚举值
  | 'list'       // 列表
  | 'object'     // 对象
  | 'file'       // 文件
  | 'url';       // 链接

interface ValidationRule {
  min?: number;                        // 最小值/长度
  max?: number;                        // 最大值/长度
  pattern?: string;                    // 正则表达式
  options?: string[];                  // 枚举选项
  custom?: string;                     // 自定义验证器
}
```

### 模板示例

```typescript
const paperTemplate: PropertyTemplate = {
  fields: [
    {
      key: 'title',
      displayName: { 'zh-CN': '标题', 'en': 'Title' },
      type: 'string',
      required: true,
      indexed: true
    },
    {
      key: 'authors',
      displayName: { 'zh-CN': '作者', 'en': 'Authors' },
      type: 'list',
      required: true,
      indexed: true
    },
    {
      key: 'publishYear',
      displayName: { 'zh-CN': '发表年份', 'en': 'Publication Year' },
      type: 'number',
      validation: { min: 1900, max: 2030 }
    },
    {
      key: 'journal',
      displayName: { 'zh-CN': '期刊', 'en': 'Journal' },
      type: 'string',
      indexed: true
    },
    {
      key: 'doi',
      displayName: { 'zh-CN': 'DOI', 'en': 'DOI' },
      type: 'string',
      validation: { pattern: '^10\\.\\d+/.+' }
    }
  ],
  suggested: true,
  version: '1.0'
};
```

## RelationNode 专属：语义标签系统

### 定义与用途
语义标签是**RelationNode**的专属属性，用于标识关系节点的**语义含义**，是图算法与语义查询的基础。

### 专属性说明
- **仅适用于**: RelationNode类型节点
- **不适用于**: ContentNode、WorkflowNode、ComputeNode、MediaNode
- **关系查询**: 语义标签参与RelationNode的搜索和分析操作
- **AI处理**: 语义标签可被AI用于关系建议和语义分析

### 核心特性
- **关系语义**: 明确关系的含义，如"引用"、"依赖"、"包含"
- **类型约束**: 定义关系的定义域和值域
- **逻辑属性**: 支持对称性、传递性、函数性等逻辑特性
- **查询基础**: 为结构化查询和图推理提供语义基础

### 预设语义标签分类

#### 引用关系
- `cites` (引用): 学术引用关系
- `references` (参考): 一般参考关系  
- `based_on` (基于): 基础依赖关系

#### 逻辑关系
- `implies` (推导): 逻辑推导关系
- `proves` (证明): 证明关系
- `contradicts` (反驳): 矛盾关系
- `supports` (支持): 支持关系

#### 分类关系
- `instance_of` (实例): 实例与类型关系
- `subclass_of` (子类): 子类与父类关系
- `part_of` (部分): 部分与整体关系
- `contains` (包含): 包含关系

#### 依赖关系
- `depends_on` (依赖): 技术依赖关系
- `requires` (需要): 必要条件关系
- `influences` (影响): 影响关系
- `caused_by` (导致): 因果关系

#### 时序关系
- `precedes` (先于): 时间先后关系
- `follows` (后于): 时间跟随关系
- `concurrent` (同时): 时间并行关系

### 语义标签属性示例

```typescript
const citesLabel: SemanticLabelDefinition = {
  id: 'cites',
  displayNames: {
    'zh-CN': '引用',
    'en': 'Cites'
  },
  aliases: ['references', '引用'],
  description: '学术文献引用关系',
  arity: 2,
  domain: ['paper', 'article'],      // 只有论文可以引用
  range: ['paper', 'article', 'book'], // 可以引用论文、文章、书籍
  transitive: false,                 // 引用关系不传递
  functional: false,                 // 一篇论文可以引用多篇文献
  category: 'academic'
};

const dependsOnLabel: SemanticLabelDefinition = {
  id: 'depends_on',
  displayNames: {
    'zh-CN': '依赖于',
    'en': 'Depends On'
  },
  aliases: ['requires', '依赖', '需要'],
  description: '技术组件依赖关系',
  arity: 2,
  domain: ['component', 'project', 'tool'],
  range: ['component', 'framework', 'library'],
  transitive: true,                  // 依赖关系具有传递性
  functional: false,
  category: 'technical'
};
```

## RelationNode 专属：关系类型系统

### 定义与用途
关系类型是**RelationNode**的专属属性，用于标识关系节点的结构模式，支持复杂的多参与者关系建模。

### 与语义标签的区别
- **关系类型**: 定义关系的结构模式（如"因果链"、"争论结构"）
- **语义标签**: 定义关系的具体语义（如"支持"、"反对"、"证明"）
- **协同工作**: 一个RelationNode可以同时具有关系类型和多个语义标签

### 预设关系类型

#### 因果关系
- `causal_chain` (因果链): 多步骤因果关系
- `root_cause_analysis` (根因分析): 问题根因分析结构

#### 争论结构
- `argument` (争论): 观点-证据-反驳结构
- `debate` (辩论): 多方观点对比
- `evidence_support` (证据支持): 证据与结论关系

#### 协作关系
- `collaboration` (协作): 多方协作关系
- `teamwork` (团队合作): 团队项目关系
- `partnership` (合作伙伴): 合作伙伴关系

#### 比较分析
- `comparison` (比较): 多对象比较分析
- `evaluation` (评估): 多维度评估
- `ranking` (排序): 优先级排序关系

## 节点类型化查询集成

### 类型化标签查询接口

```typescript
// 基于实体标签的内容节点查询
function getContentNodesByEntityType(
  graph: KnowledgeBase, 
  entityTypeId: string
): ContentNode[]

// 基于语义标签的关系节点查询
function getRelationNodesBySemanticLabel(
  graph: KnowledgeBase,
  semanticLabelId: string
): RelationNode[]

// 节点类型感知的语义路径查询
function findTypedSemanticPath(
  graph: KnowledgeBase,
  fromNodeId: EntityId,
  toNodeId: EntityId,
  allowedNodeTypes: NodeType[],
  semanticLabels: string[]
): Path[]

// 节点类型和标签的复合子图提取
function extractNodeTypeAndLabelSubgraph(
  graph: KnowledgeBase,
  nodeTypes: NodeType[],
  entityTypes?: string[],    // 仅对ContentNode有效
  semanticTypes?: string[]   // 仅对RelationNode有效
): Subgraph

// 基于标签的邻居查询
function getTypedNeighbors(
  graph: KnowledgeBase,
  nodeId: EntityId,
  semanticLabel: string,
  direction: 'in' | 'out' | 'both'
): Node[]
```

### 语义推理支持

```typescript
// 传递性推理
function computeTransitiveClosure(
  graph: KnowledgeBase,
  semanticLabel: string
): Edge[]

// 对称性补全
function completeSymmetricRelations(
  graph: KnowledgeBase,
  semanticLabel: string
): Edge[]

// 类型约束验证
function validateSemanticConstraints(
  graph: KnowledgeBase
): ValidationResult[]

// 逆关系生成
function generateInverseRelations(
  graph: KnowledgeBase,
  semanticLabel: string
): Edge[]
```

## 节点类型化用户界面设计

### 差异化标签输入体验

#### ContentNode 的实体标签选择
- **专属界面**: 仅在编辑ContentNode时显示
- **类型感知**: 基于内容分析推荐合适的实体标签
- **模板触发**: 选择实体标签后自动应用属性模板

#### RelationNode 的语义标签选择  
- **专属界面**: 仅在编辑RelationNode时显示
- **参与者感知**: 基于参与者类型推荐语义标签
- **关系类型联动**: 关系类型选择影响语义标签推荐

#### 其他节点类型
- **WorkflowNode**: 显示工作流专用的状态和属性编辑器
- **ComputeNode**: 显示公式编辑器和依赖管理界面
- **MediaNode**: 显示媒体信息和元数据编辑界面

### 类型化操作分发

```typescript
// 标签操作根据节点类型分发
interface NodeTypeLabelOperations {
  // ContentNode 专用操作
  addEntityTag(node: ContentNode, entityTag: EntityTag): void;
  removeEntityTag(node: ContentNode, tagId: string): void;
  applyEntityTemplate(node: ContentNode, templateId: string): void;
  
  // RelationNode 专用操作
  addSemanticTag(node: RelationNode, semanticTag: SemanticTag): void;
  removeSemanticTag(node: RelationNode, tagId: string): void;
  setRelationType(node: RelationNode, relationType: RelationType): void;
  
  // 其他节点类型不支持标签操作
  // WorkflowNode, ComputeNode, MediaNode 有各自的专用操作
}
```

### 标签管理界面

#### 标签注册表管理
- **标签浏览器**: 分类浏览所有注册标签
- **标签编辑器**: 创建和修改标签定义
- **模板设计器**: 可视化属性模板设计
- **依赖图**: 标签间关系的可视化

#### 使用统计和分析
- **标签使用频率**: 统计各标签的使用情况
- **标签关联分析**: 发现标签间的共现模式
- **模板效果评估**: 评估属性模板的使用效果

## 数据存储策略

### 标签注册表存储
```typescript
// 本地存储结构
interface StoredLabelRegistry {
  version: string;
  lastUpdated: Timestamp;
  entityLabels: Record<string, EntityLabelDefinition>;
  semanticLabels: Record<string, SemanticLabelDefinition>;
  relationTypes: Record<string, RelationTypeDefinition>;
}

// 增量更新支持
interface LabelRegistryDelta {
  added: Partial<LabelRegistry>;
  modified: Partial<LabelRegistry>;
  removed: string[];
  version: string;
}
```

### 标签索引优化
```typescript
// 为高频查询建立索引
interface LabelIndex {
  entityTypeToNodes: Record<string, EntityId[]>;
  semanticTypeToEdges: Record<string, EntityId[]>;
  relationTypeToRelations: Record<string, EntityId[]>;
  tagToEntities: Record<string, EntityId[]>;
}
```

## 实现路线图

### Phase 1: 基础标签系统 (4周)
1. **Week 1**: 标签注册表设计和基础数据结构
2. **Week 2**: 实体标签系统和属性模板
3. **Week 3**: 语义标签系统和关系约束
4. **Week 4**: 基础标签管理UI和数据迁移

### Phase 2: 模板与约束 (3周)  
1. **Week 5**: 属性模板初始化和验证系统
2. **Week 6**: 语义约束检查和自动修复
3. **Week 7**: 标签驱动的UI增强和用户体验优化

### Phase 3: 查询与推理 (3周)
1. **Week 8**: 标签感知的查询接口实现
2. **Week 9**: 语义推理引擎和传递性计算
3. **Week 10**: 高级图算法集成和性能优化

### Phase 4: 高级功能 (2周)
1. **Week 11**: 标签分析和智能推荐
2. **Week 12**: 多语言支持和标签国际化

## 质量保证

### 数据完整性
- 标签引用完整性检查
- 模板约束验证
- 语义一致性验证

### 性能优化
- 标签索引和缓存策略
- 查询优化和结果缓存
- 大规模图的标签处理

### 用户体验
- 标签操作的响应速度
- 智能推荐的准确性
- 标签管理的易用性

## 节点类型化标签系统优势

### 1. **类型安全**
- 实体标签只能应用于ContentNode，避免类型错误
- 语义标签只能应用于RelationNode，确保语义一致性
- 编译时类型检查，减少运行时错误

### 2. **功能专用**
- 不同节点类型的标签有不同的功能和操作
- AI操作可以基于节点类型和标签类型进行精准分发
- 搜索系统可以按节点类型和标签类型优化查询

### 3. **界面简洁**
- 用户界面根据节点类型显示相关的标签控件
- 避免无关标签选项的干扰
- 提供最相关的标签推荐

### 4. **扩展性强**
- 新的节点类型可以定义自己的标签系统
- 插件可以为特定节点类型添加专用标签
- 标签系统与节点类型协同演进

### 5. **性能优化**
- 标签查询可以先按节点类型过滤，减少搜索范围
- 索引可以按节点类型和标签类型分别建立
- 缓存策略可以基于类型进行优化

这种**节点类型化标签系统**将标签的语义价值与节点的功能价值完美结合，为不同类型的知识实体提供了专门化的标注和管理能力。