# 图谱笔记系统 v2.0

一个以"结构"为核心的图谱笔记系统，支持结构化笔记构建、图谱表达、多视图展示、AI 协作编辑。

## 🚀 快速启动

### 前置要求
- Node.js 18+ 
- Python 3.8+
- npm 或 yarn

### 启动步骤

#### 1. 启动后端服务
```bash
cd backend
python main.py
```

后端服务将在 http://localhost:3001 启动，包含：
- REST API 服务
- JSON 文件数据存储  
- 自动加载示例数据

**注意**: 如果遇到端口绑定错误，请：
- 以管理员身份运行命令提示符
- 或者检查端口 3001 是否被其他程序占用

#### 2. 启动前端服务
```bash
cd frontend
npm run dev
```

前端服务将在 http://localhost:5173 启动

### 手动启动（可选）

如果自动启动有问题，可以手动操作：

#### 后端手动启动
```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 初始化示例数据（首次运行）
python init_sample_data.py

# 启动服务
python main.py
```

#### 前端手动启动
```bash
cd frontend

# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev
```

## 🎯 主要功能

### 核心特性
- **三种节点模式** - 📋卡片、📦框、⚫圆点
- **漂浮工具栏** - 右键菜单，单独设置节点显示模式
- **实时编辑** - 双击节点打开详情编辑面板
- **拖拽布局** - 自由拖拽节点，位置自动保存
- **前后端分离** - JSON 文件持久化存储

### 界面布局
- **VSCode 风格** - 左侧边栏、中央白板、右侧详情面板
- **响应式设计** - 全屏布局，自适应调整
- **专业视觉** - 现代化 UI，流畅交互

## 🛠️ 技术架构

### 前端
- **React 19** + TypeScript
- **React Flow** - 图谱可视化
- **Zustand** - 状态管理
- **Tailwind CSS** - 样式框架
- **Vite** - 构建工具

### 后端
- **FastAPI** - REST API 框架
- **Pydantic** - 数据验证
- **JSON 文件** - 数据持久化
- **CORS** - 跨域支持

### 数据结构
- **Node** - 节点实体（标题、内容块、元数据）
- **Edge** - 关系连接（语义标签、超边支持）
- **Block** - 内容块（文本、图片、代码等）
- **View** - 视图配置（布局、显示规则）

## 📖 使用指南

### 基本操作
1. **浏览图谱** - 在白板中查看节点和连接关系
2. **拖拽节点** - 点击并拖动节点调整位置
3. **编辑内容** - 双击节点打开右侧编辑面板
4. **切换模式** - 右键节点选择显示模式
5. **缩放视图** - 鼠标滚轮缩放，拖拽平移画布

### 高级功能
- **侧边栏工具** - 左侧面板提供搜索、分析等功能
- **批量操作** - 在图谱工具中批量切换显示模式
- **数据持久化** - 所有更改自动保存到后端

## 🔧 开发说明

### 项目结构
```
Graph-cc/
├── frontend/          # React 前端
│   ├── src/
│   │   ├── components/ # UI 组件
│   │   ├── store/      # 状态管理
│   │   ├── types/      # TypeScript 类型
│   │   └── services/   # API 服务
│   └── package.json
├── backend/           # Python 后端
│   ├── main.py        # FastAPI 服务
│   ├── data/          # JSON 数据文件
│   └── requirements.txt
└── README.md
```

### API 接口
- `GET /api/knowledge-bases` - 获取知识库列表
- `GET /api/knowledge-bases/{id}` - 获取知识库详情
- `POST /api/knowledge-bases` - 创建知识库
- `PUT /api/knowledge-bases/{id}` - 更新知识库
- `DELETE /api/knowledge-bases/{id}` - 删除知识库

API 文档：http://localhost:3001/docs

### 数据存储
- 数据存储在 `backend/data/knowledge_bases.json`
- 支持实时读写，自动备份
- JSON 格式，便于迁移和备份

## 🎉 版本历史

### v2.0.0 (当前版本)
- ✅ 前后端分离架构
- ✅ JSON 文件持久化存储
- ✅ 漂浮工具栏和单节点模式切换
- ✅ 实时编辑和自动保存
- ✅ 完整的错误处理和加载状态

### v1.0.0
- ✅ 基础图谱功能
- ✅ 三种节点显示模式
- ✅ React Flow 白板视图
- ✅ 文本编辑器集成

## 📞 支持

如果遇到问题，请检查：
1. 后端服务是否正常启动（http://localhost:3001）
2. 前端是否能连接到后端（查看浏览器控制台）
3. 控制台是否有错误信息

### 调试步骤
1. **后端测试**: 访问 http://localhost:3001 应该看到 {"message": "图谱系统 API v2.0", "status": "running"}
2. **前端控制台**: 打开浏览器开发者工具，查看 Network 标签页检查 API 请求
3. **创建知识库**: 点击左侧边栏的"创建知识库"按钮，输入名称测试

启动后端失败常见原因：
- Python 版本不兼容
- 端口 3001 被占用  
- 依赖包安装失败
- Windows 防火墙权限限制（需管理员权限）