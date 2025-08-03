import React, { useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { useGraphStore } from './store/graph-store';
import { healthCheck } from './services/api';
import './App.css';

// 检查后端连接状态
const checkBackendHealth = async () => {
  console.log('🔍 检查后端连接状态...');
  try {
    const result = await healthCheck.check();
    console.log('✅ 后端连接成功:', result);
    return true;
  } catch (error) {
    console.error('❌ 后端连接失败:', error);
    console.log('💡 请确保后端服务运行在 http://localhost:3001');
    return false;
  }
};

function App() {
  const { loadKnowledgeBase, currentKnowledgeBase, error, isLoading } = useGraphStore();

  // 应用启动时检查后端并加载数据
  useEffect(() => {
    const initApp = async () => {
      // 检查后端连接
      const backendOk = await checkBackendHealth();
      
      if (backendOk && !currentKnowledgeBase) {
        try {
          // 尝试加载示例知识库
          await loadKnowledgeBase('kb_sample');
        } catch (error) {
          console.log('示例知识库不存在，可能需要初始化后端数据');
        }
      }
    };

    initApp();
  }, [loadKnowledgeBase, currentKnowledgeBase]);

  // 显示错误状态
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">连接错误</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="text-sm text-gray-500">
            <p>请确保后端服务正在运行：</p>
            <code className="bg-gray-200 px-2 py-1 rounded">cd backend && python main.py</code>
            <p className="mt-2">服务地址: http://localhost:3014</p>
          </div>
        </div>
      </div>
    );
  }

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">正在加载图谱系统...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <MainLayout />
    </div>
  );
}

export default App;
