/**
 * AI演示入口文件
 * 简化的演示页面，展示AI操作图谱的核心功能
 */

import React from 'react';
import { AIGraphDemo } from './components/demo/AIGraphDemo';
import '@xyflow/react/dist/style.css';

export const AIDemo: React.FC = () => {
  return (
    <div className="ai-demo-app">
      <AIGraphDemo />
    </div>
  );
};

export default AIDemo;