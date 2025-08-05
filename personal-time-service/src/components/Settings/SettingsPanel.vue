<template>
  <div class="settings-overlay" @click="closeSettings">
    <div class="settings-panel" @click.stop>
      <div class="settings-header">
        <h2>Settings</h2>
        <button @click="closeSettings" class="close-btn">×</button>
      </div>
      
      <div class="settings-content">
        <div class="settings-section">
          <h3>Window Settings</h3>
          
          <div class="setting-item">
            <label>Background Opacity</label>
            <input 
              type="range" 
              min="0.1" 
              max="1" 
              step="0.1"
              v-model="localSettings.backgroundOpacity"
              @input="updateSetting('backgroundOpacity', $event.target.value)"
            />
            <span class="setting-value">{{ Math.round(localSettings.backgroundOpacity * 100) }}%</span>
          </div>
          
          <div class="setting-item">
            <label>
              <input 
                type="checkbox" 
                v-model="localSettings.clickThrough"
                @change="updateSetting('clickThrough', $event.target.checked)"
              />
              Click Through Mode
            </label>
          </div>
          
          <div class="setting-item">
            <label>
              <input 
                type="checkbox" 
                v-model="localSettings.alwaysOnTop"
                @change="updateSetting('alwaysOnTop', $event.target.checked)"
              />
              Always on Top
            </label>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>Component Visibility</h3>
          
          <div class="setting-item">
            <label>
              <input 
                type="checkbox" 
                v-model="localSettings.showCalendar"
                @change="updateSetting('showCalendar', $event.target.checked)"
              />
              Show Calendar
            </label>
          </div>
          
          <div class="setting-item" v-if="localSettings.showCalendar">
            <label>Calendar Opacity</label>
            <input 
              type="range" 
              min="0.3" 
              max="1" 
              step="0.1"
              v-model="localSettings.calendarOpacity"
              @input="updateSetting('calendarOpacity', $event.target.value)"
            />
            <span class="setting-value">{{ Math.round(localSettings.calendarOpacity * 100) }}%</span>
          </div>
          
          <div class="setting-item">
            <label>
              <input 
                type="checkbox" 
                v-model="localSettings.showTaskList"
                @change="updateSetting('showTaskList', $event.target.checked)"
              />
              Show Task List
            </label>
          </div>
          
          <div class="setting-item" v-if="localSettings.showTaskList">
            <label>Task List Opacity</label>
            <input 
              type="range" 
              min="0.3" 
              max="1" 
              step="0.1"
              v-model="localSettings.taskListOpacity"
              @input="updateSetting('taskListOpacity', $event.target.value)"
            />
            <span class="setting-value">{{ Math.round(localSettings.taskListOpacity * 100) }}%</span>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>Calendar Settings</h3>
          
          <div class="setting-item">
            <label>Default View</label>
            <select 
              v-model="localSettings.defaultCalendarView"
              @change="updateSetting('defaultCalendarView', $event.target.value)"
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="year">Year</option>
            </select>
          </div>
          
          <div class="setting-item">
            <label>Week Start</label>
            <select 
              v-model="localSettings.weekStart"
              @change="updateSetting('weekStart', $event.target.value)"
            >
              <option value="0">Sunday</option>
              <option value="1">Monday</option>
            </select>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>Notification Settings</h3>
          
          <div class="setting-item">
            <label>
              <input 
                type="checkbox" 
                v-model="localSettings.enableNotifications"
                @change="updateSetting('enableNotifications', $event.target.checked)"
              />
              Enable Task Reminders
            </label>
          </div>
          
          <div class="setting-item" v-if="localSettings.enableNotifications">
            <label>Default Reminder Time (minutes before)</label>
            <input 
              type="number" 
              min="5" 
              max="1440"
              v-model="localSettings.defaultReminderMinutes"
              @input="updateSetting('defaultReminderMinutes', parseInt($event.target.value))"
            />
          </div>
          
          <div class="setting-item">
            <button @click="testNotification" class="test-notification-btn">
              Test Notification
            </button>
          </div>
        </div>
      </div>
      
      <div class="settings-footer">
        <button @click="resetToDefaults" class="reset-btn">Reset to Defaults</button>
        <button @click="closeSettings" class="apply-btn">Apply</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { useTaskStore } from '../../stores/taskStore.js'

const emit = defineEmits(['close', 'settings-updated'])

const { sendTestNotification } = useTaskStore()

const defaultSettings = {
  backgroundOpacity: 0.1,
  clickThrough: true,
  alwaysOnTop: false,
  showCalendar: true,
  showTaskList: true,
  calendarOpacity: 0.9,
  taskListOpacity: 0.9,
  defaultCalendarView: 'month',
  weekStart: 0,
  enableNotifications: true,
  defaultReminderMinutes: 15
}

const localSettings = reactive({ ...defaultSettings })

const closeSettings = () => {
  emit('close')
}

const updateSetting = async (key, value) => {
  localSettings[key] = value
  
  try {
    switch (key) {
      case 'backgroundOpacity':
        await invoke('set_window_opacity', { opacity: parseFloat(value) })
        break
      case 'clickThrough':
        await invoke('set_click_through', { enabled: value })
        break
      case 'alwaysOnTop':
        await invoke('set_always_on_top', { enabled: value })
        break
    }
  } catch (error) {
    console.error(`Failed to update ${key}:`, error)
  }
  
  emit('settings-updated', { ...localSettings })
  saveSettings()
}

const resetToDefaults = () => {
  Object.assign(localSettings, defaultSettings)
  emit('settings-updated', { ...localSettings })
  saveSettings()
}

const saveSettings = () => {
  localStorage.setItem('personal-time-service-settings', JSON.stringify(localSettings))
}

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('personal-time-service-settings')
    if (saved) {
      Object.assign(localSettings, JSON.parse(saved))
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
}

const testNotification = async () => {
  try {
    await sendTestNotification()
  } catch (error) {
    console.error('Failed to send test notification:', error)
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  pointer-events: auto;
}

.settings-panel {
  width: 500px;
  max-height: 80vh;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.settings-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.settings-section {
  margin-bottom: 32px;
}

.settings-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid rgba(59, 130, 246, 0.2);
  padding-bottom: 8px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 16px;
}

.setting-item label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.setting-item input[type="range"] {
  flex: 1;
  max-width: 120px;
}

.setting-item input[type="number"] {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.setting-item select {
  min-width: 100px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.setting-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.setting-value {
  font-size: 12px;
  color: #666;
  min-width: 40px;
  text-align: right;
  font-weight: 500;
}

.settings-footer {
  display: flex;
  justify-content: space-between;
  padding: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.reset-btn, .apply-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.reset-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.apply-btn {
  background: rgba(59, 130, 246, 1);
  color: white;
}

.apply-btn:hover {
  background: rgba(37, 99, 235, 1);
}

.test-notification-btn {
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.test-notification-btn:hover {
  background: #059669;
}
</style>