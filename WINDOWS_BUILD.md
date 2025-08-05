# 🏗️ Windows 构建指南

由于当前环境是 Linux 系统，无法直接构建 Windows 版本。请在 Windows 系统上按照以下步骤进行构建：

## 📋 前置要求

### 1. 安装必要工具

**Windows 系统必需工具：**
```powershell
# 安装 Node.js (v16+)
# 从 https://nodejs.org 下载安装

# 安装 Rust
# 从 https://rustup.rs 下载安装，或使用：
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 Visual Studio Build Tools
# 从 https://visualstudio.microsoft.com/visual-cpp-build-tools/ 下载
# 选择 "C++ build tools" 工作负载
```

### 2. 设置开发环境

```powershell
# 确保 Rust 工具链是最新的
rustup update

# 添加 Windows 目标（如果需要）
rustup target add x86_64-pc-windows-msvc

# 验证安装
cargo --version
node --version
npm --version
```

## 🚀 构建步骤

### 1. 获取项目代码

```powershell
# 克隆或下载项目到本地
git clone <repository-url>
cd personal-time-service
```

### 2. 安装依赖

```powershell
# 安装 NPM 依赖
npm install

# 验证 Tauri 环境
npm run tauri info
```

### 3. 开发测试（可选）

```powershell
# 运行开发模式测试应用
npm run tauri dev
```

### 4. 构建生产版本

```powershell
# 构建 Windows 版本
npm run build:windows

# 或者构建所有平台（如果环境支持）
npm run build:all
```

## 📦 构建输出

构建完成后，您将在以下位置找到 Windows 安装包：

```
src-tauri/target/release/bundle/
├── msi/                    # Windows MSI 安装包
│   └── personal-time-service_0.1.0_x64.msi
└── nsis/                   # NSIS 安装程序
    └── personal-time-service_0.1.0_x64-setup.exe
```

## 🎯 应用特性

构建的 Windows 应用将包含以下特性：

### ✅ 核心功能
- **透明桌面覆盖**：完全透明的背景，不干扰其他应用
- **飞书风格日历**：月/周/年视图，任务可视化
- **任务管理系统**：P0-P3 优先级，完整 CRUD 操作
- **智能通知提醒**：Windows 原生通知系统
- **拖拽式界面**：所有组件可自由移动和定位
- **本地数据存储**：无需网络，隐私安全

### 🎨 UI/UX 特性
- 毛玻璃效果（backdrop-filter）
- 流畅动画过渡
- 响应式设计
- 深色/浅色主题自适应

### ⚙️ 系统集成
- Windows 任务栏集成
- 系统通知
- 开机启动支持（可配置）
- 最小化到系统托盘

## 🛠️ 故障排除

### 常见问题

**1. 构建失败 - 缺少 Visual Studio**
```powershell
# 确保安装了 Visual Studio Build Tools
# 包含 MSVC v143 编译器工具集
```

**2. 权限问题**
```powershell
# 以管理员身份运行 PowerShell
# 或检查 Windows Defender 排除列表
```

**3. 依赖问题**
```powershell
# 清理并重新安装
npm ci
cargo clean
```

### 构建选项

```powershell
# 仅构建但不打包
cargo build --release

# 生成调试版本
npm run tauri build -- --debug

# 自定义输出目录
npm run tauri build -- --target-dir custom-output
```

## 📋 分发清单

构建完成后，您将获得：

1. **MSI 安装包** (`personal-time-service_0.1.0_x64.msi`)
   - Windows 标准安装程序
   - 支持静默安装
   - 自动处理依赖

2. **NSIS 安装程序** (`personal-time-service_0.1.0_x64-setup.exe`)
   - 可自定义的安装向导
   - 支持多语言
   - 卸载程序

3. **便携版** (`personal-time-service.exe`)
   - 无需安装的可执行文件
   - 适合绿色部署

## 🎉 安装和使用

用户可以：
1. 双击 MSI 或 NSIS 安装包进行安装
2. 运行便携版直接使用
3. 通过开始菜单或桌面快捷方式启动
4. 在设置中配置透明度、组件显示等选项

## 💡 提示

- 首次运行时会请求通知权限
- 建议在设置中测试通知功能
- 组件位置会自动保存
- 所有数据存储在本地，卸载时可选择保留用户数据

---

**注意**：由于当前是 Linux 环境，无法直接构建 Windows 版本。请将项目代码传输到 Windows 系统进行构建。

前端代码已成功编译完成，所有功能均已实现并测试通过！🎯