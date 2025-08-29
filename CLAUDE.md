# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **React-based knowledge graph system** that visualizes and manages interconnected information through nodes, edges, and relations. The system combines structured knowledge representation with interactive visual editing capabilities.

## Development Commands

### Frontend Development
- **Start development server**: `cd frontend && npm run dev`
- **Type checking**: `cd frontend && npx tsc --noEmit`
- **Linting**: `cd frontend && npm run lint`
- **Build production**: `cd frontend && npm run build`
- **Preview production build**: `cd frontend && npm run preview`

### Key Technologies
- **React 19** with TypeScript
- **Vite** for build tooling
- **React Flow** (@xyflow/react) for interactive graph visualization
- **Zustand** for state management
- **Native CSS** with CSS modules and CSS variables for styling
- **React DND** for drag-and-drop functionality

## Architecture Overview

### Core Data Model
The system is built around three primary entity types:
- **Nodes**: Individual knowledge entities with rich content blocks
- **Edges**: Lightweight connections between nodes with semantic labels
- **RelationNodes**: Complex multi-participant relationships (hyperedges)

All entities support:
- Versioned metadata with timestamps and tags
- Extensible attributes for custom properties
- Rich content through structured blocks

### State Management (Zustand Store)
- **GraphStore** (`src/store/graph-store.ts`): Central state management
- Manages current knowledge base, views, selections, and UI state
- Supports multiple view configurations per entity

### Command System Architecture
The system implements a comprehensive **Command Pattern** with undo/redo support:

- **Command Registry** (`src/core/command-system.ts`): Central command dispatcher
- **Command Handlers** in `src/core/`:
  - `node-commands.ts`: Node CRUD operations
  - `edge-commands.ts`: Edge management
  - `block-commands.ts`: Content block operations
  - `view-commands.ts`: View and layout management
- **Keyboard Handler** (`src/core/keyboard-handler.ts`): Ctrl+Z/Ctrl+Y support
- All data modifications go through the command system for consistency

### View System
- **Multi-format support**: Spatial (whiteboard, mindmap), Linear (rich-text, table), Media (pdf, image)
- **View-specific configurations**: Each entity can have different display modes per view
- **Layout management**: Stores positions, sizes, and styling per view
- **Center-based positioning**: All node coordinates store center positions, with rendering calculations for different display modes


### Graph Visualization (React Flow)
- **WhiteboardView** (`src/components/graph/WhiteboardView.tsx`): Main graph interface
- **UnifiedNode** component handles multiple display modes:
  - DOT mode: Minimal 12×12 pixel nodes
  - BOX mode: Compact informational display
  - CARD mode: Full-featured content editing
- **Position coordination**: Automatic conversion between center positions (storage) and top-left positions (React Flow rendering)
- **Custom edge rendering** with semantic labeling

### Component Architecture

#### Node Components
- **UnifiedNode** (`src/components/graph/nodes/UnifiedNode.tsx`): Handles all node display modes
- **CustomNode** (`src/components/graph/nodes/CustomNode.tsx`): Full-featured card editing
- **DraggableBlock** (`src/components/graph/nodes/DraggableBlock.tsx`): Content block with drag-and-drop reordering

#### Layout Components
- **MainLayout** (`src/components/layout/MainLayout.tsx`): Application shell
- **ViewManager** and **ViewRenderer**: Multi-view system
- **NodeList**, **RelationView**, **EdgeView**: Entity-specific panels

## Important Implementation Details

### Coordinate System
- **Storage**: All node positions are stored as center coordinates
- **Rendering**: Positions are converted to top-left for React Flow display
- **Node sizing**: Different display modes use different dimensions (DOT: 12×12, BOX: 120×80, CARD: dynamic)


### Data Structure Type Definitions
Key types in `src/types/structure.ts`:
- `Node`, `Edge`, `RelationNode`: Core entities
- `Block`: Structured content units
- `View`: View configurations with layout information
- `KnowledgeBase`: Top-level container

### Development Patterns
- All data mutations must go through the command system
- Use the GraphStore for state access and mutations
- Entity IDs are strings, positions are `{x, y}` objects
- Views can contain nodes, edges, and relations simultaneously
- Missing/deleted entities are handled with placeholder nodes

## Testing and Quality
- TypeScript strict mode enabled
- ESLint configuration for React and TypeScript
- No test framework currently configured
- Hot module replacement via Vite for rapid development

## Sample Data
The application initializes with sample data showing the system's capabilities:
- Demonstrates node-to-node connections
- Shows relation nodes (hyperedges) with multiple participants
- Includes different content types and metadata structures

## Development Workflow and Git Integration

### Automated Git Workflow
When implementing features, follow this workflow:

1. **Development Phase**: Implement requested features/changes
2. **Testing Phase**: Wait for user testing and explicit confirmation
3. **Git Push Phase**: Only after user confirms testing is complete

### Git Push Triggers
Auto-push to git repository when user provides explicit confirmation such as:
- "可以推送了" / "测试通过，推送吧" / "功能正常，提交代码"
- "push it" / "commit and push" / "ready to push"
- Any clear indication that testing is complete and changes should be committed

### Git Push Process
When user confirms, execute the following sequence:
```bash
git add .
git commit -m "[Descriptive commit message]

🤖 Generated with Claude Code(https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

### Important Rules
- **NEVER push without explicit user confirmation after testing**
- **ALWAYS wait for user to test functionality before pushing**
- **Write meaningful commit messages describing actual changes**
- **Include Claude Code attribution in commit messages**
- **Verify push status and confirm success**

This ensures code quality through user testing while automating the git workflow for efficiency.