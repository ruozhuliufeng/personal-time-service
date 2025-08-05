<template>
  <div class="app-container" :style="{ opacity: appOpacity }">
    <SettingsPanel 
      v-if="showSettings" 
      @close="showSettings = false" 
      @settings-updated="updateSettings"
    />
    
    <div class="components-container">
      <!-- Calendar Component -->
      <CalendarComponent 
        v-if="settings.showCalendar"
        :opacity="settings.calendarOpacity"
        :position="calendarPosition"
        @move="updateCalendarPosition"
        @date-selected="onDateSelected"
        @task-selected="onTaskSelected"
      />
      
      <!-- Task List Component -->
      <TaskListComponent 
        v-if="settings.showTaskList"
        :opacity="settings.taskListOpacity"
        :position="taskListPosition"
        @move="updateTaskListPosition"
        @task-selected="onTaskSelected"
      />
    </div>
    
    <!-- Settings Toggle Button -->
    <button 
      class="settings-btn"
      @click="toggleSettings"
      @mouseenter="setClickThrough(false)"
      @mouseleave="setClickThrough(true)"
    >
      ⚙️
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import CalendarComponent from './components/Calendar/CalendarComponent.vue'
import TaskListComponent from './components/TaskManager/TaskListComponent.vue'
import SettingsPanel from './components/Settings/SettingsPanel.vue'
import { useTaskStore } from './stores/taskStore.js'

const { initializeNotifications } = useTaskStore()

const showSettings = ref(false)
const appOpacity = ref(0.9)

const defaultSettings = {
  showCalendar: true,
  showTaskList: true,
  calendarOpacity: 0.9,
  taskListOpacity: 0.9,
  backgroundOpacity: 0.1,
  clickThrough: true,
  alwaysOnTop: false,
  defaultCalendarView: 'month',
  weekStart: 0,
  enableNotifications: true,
  defaultReminderMinutes: 15
}

const settings = reactive({ ...defaultSettings })

const calendarPosition = reactive({ x: window.innerWidth - 320, y: 50 })
const taskListPosition = reactive({ x: 50, y: 50 })

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const setClickThrough = async (enabled) => {
  try {
    await invoke('set_click_through', { enabled })
  } catch (error) {
    console.error('Failed to set click through:', error)
  }
}

const updateWindowOpacity = async (opacity) => {
  try {
    await invoke('set_window_opacity', { opacity })
  } catch (error) {
    console.error('Failed to set window opacity:', error)
  }
}

const updateCalendarPosition = (newPosition) => {
  calendarPosition.x = newPosition.x
  calendarPosition.y = newPosition.y
  savePositions()
}

const updateTaskListPosition = (newPosition) => {
  taskListPosition.x = newPosition.x
  taskListPosition.y = newPosition.y
  savePositions()
}

const updateSettings = (newSettings) => {
  Object.assign(settings, newSettings)
  saveSettings()
}

const onDateSelected = (date) => {
  console.log('Date selected:', date)
}

const onTaskSelected = (task) => {
  console.log('Task selected:', task)
}

const saveSettings = () => {
  try {
    localStorage.setItem('personal-time-service-settings', JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('personal-time-service-settings')
    if (saved) {
      Object.assign(settings, JSON.parse(saved))
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
}

const savePositions = () => {
  try {
    const positions = {
      calendar: { ...calendarPosition },
      taskList: { ...taskListPosition }
    }
    localStorage.setItem('personal-time-service-positions', JSON.stringify(positions))
  } catch (error) {
    console.error('Failed to save positions:', error)
  }
}

const loadPositions = () => {
  try {
    const saved = localStorage.getItem('personal-time-service-positions')
    if (saved) {
      const positions = JSON.parse(saved)
      if (positions.calendar) {
        Object.assign(calendarPosition, positions.calendar)
      }
      if (positions.taskList) {
        Object.assign(taskListPosition, positions.taskList)
      }
    }
  } catch (error) {
    console.error('Failed to load positions:', error)
  }
}

// Watch for settings changes
watch(() => settings.backgroundOpacity, (newOpacity) => {
  appOpacity.value = newOpacity
  updateWindowOpacity(newOpacity)
})

watch(() => settings.clickThrough, (enabled) => {
  setClickThrough(enabled)
})

watch(() => settings.alwaysOnTop, async (enabled) => {
  try {
    await invoke('set_always_on_top', { enabled })
  } catch (error) {
    console.error('Failed to set always on top:', error)
  }
})

onMounted(async () => {
  loadSettings()
  loadPositions()
  
  // Initialize window properties
  await setClickThrough(settings.clickThrough)
  await updateWindowOpacity(settings.backgroundOpacity)
  
  // Set initial app opacity
  appOpacity.value = settings.backgroundOpacity
  
  // Initialize notification system
  await initializeNotifications()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body, html {
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  overflow: hidden;
}

.app-container {
  width: 100vw;
  height: 100vh;
  background: transparent;
  position: relative;
  pointer-events: none;
}

.components-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.settings-btn {
  position: fixed;
  top: 10px;
  left: 10px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  pointer-events: auto;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  z-index: 1000;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: scale(1.1);
}
</style>
