@echo off
echo ================================================
echo        图谱笔记系统 v2.0 - 启动脚本
echo ================================================
echo.

echo 🔍 检查管理员权限...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ 已获得管理员权限
) else (
    echo ⚠️  未获得管理员权限，可能导致端口绑定失败
    echo 💡 建议：右键此文件选择"以管理员身份运行"
    echo.
)

echo 🚀 启动后端服务...
cd backend
start "后端服务" cmd /k "python main.py"
timeout /t 3 >nul

echo.
echo 🌐 启动前端服务...
cd ..\frontend
start "前端服务" cmd /k "npm run dev"

echo.
echo ✅ 启动完成！
echo 📡 后端: http://localhost:3001 (或其他可用端口)
echo 🌐 前端: http://localhost:5173
echo.
echo 💡 如果后端启动失败，请查看后端服务窗口的错误信息
pause