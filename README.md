# Personal Time Service

A lightweight desktop application for time management and task tracking with transparent overlay functionality.

## Features

- **Transparent Desktop Overlay**: Fully transparent background that doesn't interfere with other applications
- **Calendar View**: Feishu-inspired calendar with month/week/year navigation
- **Task Management**: Create, edit, and track tasks with priority levels (P0-P3)
- **Task Reminders**: Configurable notifications for upcoming tasks
- **Draggable Components**: Move calendar and task list anywhere on screen
- **Customizable Settings**: Adjust transparency, component visibility, and notification preferences
- **Local Data Storage**: All data saved locally with no cloud dependencies
- **Cross-Platform**: Available for Windows, macOS, and Linux

## Technology Stack

- **Backend**: Rust + Tauri
- **Frontend**: Vue 3 + Vite
- **Date Handling**: Day.js
- **Styling**: CSS with backdrop-filter effects

## Prerequisites

- Node.js (v16 or higher)
- Rust (latest stable)
- System-specific dependencies:
  - **Linux**: `webkit2gtk-4.0-dev`, `libnotify-dev`
  - **Windows**: Visual Studio Build Tools
  - **macOS**: Xcode Command Line Tools

## Installation

### Development Setup

1. Clone the repository
```bash
git clone <repository-url>
cd personal-time-service
```

2. Install dependencies
```bash
npm install
```

3. Run in development mode
```bash
npm run tauri dev
```

### Building for Production

#### Build for All Platforms
```bash
npm run build:all
```

#### Platform-Specific Builds

**Windows**
```bash
npm run build:windows
```

**Linux**
```bash
npm run build:linux
```

**macOS (Intel)**
```bash
npm run build:macos
```

**macOS (Apple Silicon)**
```bash
npm run build:macos-arm
```

## Usage

1. **Launch**: The app starts with a transparent overlay
2. **Settings**: Click the gear icon to configure transparency and components
3. **Calendar**: Click on dates to create new tasks
4. **Tasks**: Use the task list to view and manage existing tasks
5. **Dragging**: Click and drag components to reposition them
6. **Reminders**: Enable notifications in settings for task reminders

## Configuration

The application stores configuration in local storage:
- Settings: Transparency, component visibility, notification preferences
- Component positions: Saved automatically when moved
- Tasks: All task data including reminders

## Cross-Platform Notes

### Windows
- Builds as `.msi` installer and `.exe` portable
- Requires Visual Studio redistributables on target systems

### macOS
- Builds as `.dmg` and `.app` bundle
- Supports both Intel and Apple Silicon
- May require code signing for distribution

### Linux
- Builds as `.deb`, `.AppImage`, and `.tar.gz`
- Desktop integration via `.desktop` file
- Requires webkit2gtk and libnotify runtime dependencies

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

[Your License Here]

## Contributing

[Contributing guidelines if applicable]
