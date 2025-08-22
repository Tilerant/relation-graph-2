# 标签系统设计

## 设计理念

### 核心原则
标签系统是知识图谱的核心基础设施，不仅用于数据组织和用户交互，更是图算法、语义查询和知识推理的一等公民。

### 设计目标
1. **语义明确性** - 通过结构化标签提供清晰的语义定义
2. **灵活性与约束平衡** - 模板初始化提供指导，使用中保持自由
3. **规范化管理** - 避免标签重复和数据污染
4. **图算法支持** - 标签直接参与图建模、查询、推理与可视化
5. **多语言国际化** - 支持多语言显示和别名系统

## 标签系统架构

### 1. 混合标签体系

系统采用**结构化标签 + 通用标签**的混合架构：

```typescript
interface MetaProperties {
  // 结构化标签（系统级）
  entityLabel?: string;         // 实体标签ID（节点）
  semanticLabel?: string;       // 语义标签ID（边）
  relationType?: string;        // 关系类型ID（关系节点）
  
  // 通用标签（用户级）
  tags: string[];              // 自由标签列表
  
  // 其他元数据...
  id: EntityId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}
```

### 2. 标签注册系统

所有结构化标签通过注册表管理，确保数据一致性和语义清晰性：

```typescript
interface LabelRegistry {
  entityLabels: Record<string, EntityLabelDefinition>;
  semanticLabels: Record<string, SemanticLabelDefinition>;
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

## 实体标签系统

### 定义与用途
实体标签用于标识节点的**类型或身份**，明确回答节点"是什么"的问题。

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

### 属性模板系统

```typescript
interface PropertyTemplate {
  fields: PropertyField[];
  suggested: boolean;                  // 是否建议使用此模板
  version: string;                     // 模板版本
  description?: string;                // 模板说明
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

## 语义标签系统

### 定义与用途
语义标签用于标识关系的**语义含义**，是图算法与语义查询的基础。

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

## 关系类型系统

### 定义与用途
关系类型用于标识多元关系（关系节点）的结构模式，支持复杂的多参与者关系建模。

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

## 图算法集成

### 标签感知查询接口

```typescript
// 基于实体标签的节点查询
function getNodesByEntityType(
  graph: KnowledgeBase, 
  entityTypeId: string
): Node[]

// 基于语义标签的关系查询  
function getEdgesBySemanticLabel(
  graph: KnowledgeBase,
  semanticLabelId: string
): Edge[]

// 语义路径查询
function findSemanticPath(
  graph: KnowledgeBase,
  fromNodeId: EntityId,
  toNodeId: EntityId,
  semanticLabels: string[]
): Path[]

// 类型化子图提取
function extractTypedSubgraph(
  graph: KnowledgeBase,
  entityTypes: string[],
  semanticTypes: string[]
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

## 用户界面设计

### 标签输入体验

#### 结构化标签选择
- **实体标签**: 下拉选择 + 搜索，显示图标和描述
- **语义标签**: 上下文感知推荐，基于源目标节点类型
- **关系类型**: 参与者数量感知推荐

#### 通用标签输入
- **自动补全**: 基于历史标签和智能推荐
- **标签云**: 常用标签的可视化展示
- **批量编辑**: 支持多选批量添加/移除标签

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

这个标签系统设计为知识图谱提供了强大的语义基础，既保持了用户友好的标签体验，又为高级的图算法和知识推理奠定了坚实基础。