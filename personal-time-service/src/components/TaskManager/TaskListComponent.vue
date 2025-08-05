<template>
  <div 
    class="task-list-container"
    :style="{ 
      opacity: opacity,
      left: position.x + 'px',
      top: position.y + 'px'
    }"
    @mousedown="startDrag"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="task-list-header">
      <h3>Tasks</h3>
      <button @click="toggleCollapsed" class="collapse-btn">
        {{ isCollapsed ? '▼' : '▲' }}
      </button>
    </div>
    
    <div v-if="!isCollapsed" class="task-list-content">
      <div class="filter-tabs">
        <button 
          v-for="filter in filters" 
          :key="filter.key"
          :class="{ active: currentFilter === filter.key }"
          @click="setFilter(filter.key)"
          class="filter-tab"
        >
          {{ filter.label }}
        </button>
      </div>
      
      <div class="tasks-scroll">
        <div v-if="filteredTasks.length === 0" class="no-tasks">
          No tasks found
        </div>
        
        <div 
          v-for="task in filteredTasks" 
          :key="task.id"
          class="task-item"
          :class="`priority-${task.priority}`"
          @click="selectTask(task)"
        >
          <div class="task-main">
            <button 
              class="task-status-btn"
              @click="quickToggleStatus(task, $event)"
              :class="`status-${task.status}`"
            >
              {{ task.status === 'completed' ? '✓' : '○' }}
            </button>
            <div class="task-priority">{{ task.priority }}</div>
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-meta">
                <span class="task-due">{{ formatDueDate(task.dueDate) }}</span>
                <span class="task-status" :class="`status-${task.status}`">
                  {{ task.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Task Modal -->
      <TaskModal
        v-if="showTaskModal"
        :task="selectedTask"
        @close="closeTaskModal"
        @saved="onTaskSaved"
        @deleted="onTaskDeleted"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import dayjs from 'dayjs'
import { useTaskStore } from '../../stores/taskStore.js'
import TaskModal from './TaskModal.vue'

const props = defineProps({
  opacity: { type: Number, default: 0.9 },
  position: { type: Object, required: true }
})

const emit = defineEmits(['move', 'task-selected'])

const { 
  allTasks, 
  todayTasks, 
  overdueTasks, 
  updateTask, 
  toggleTaskStatus 
} = useTaskStore()

const isCollapsed = ref(false)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const currentFilter = ref('all')
const showTaskModal = ref(false)
const selectedTask = ref(null)

const filters = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'pending', label: 'Pending' },
  { key: 'overdue', label: 'Overdue' }
]

const filteredTasks = computed(() => {
  let filtered = allTasks.value
  
  switch (currentFilter.value) {
    case 'today':
      filtered = todayTasks.value
      break
    case 'pending':
      filtered = allTasks.value.filter(task => task.status === 'pending')
      break
    case 'overdue':
      filtered = overdueTasks.value
      break
  }
  
  return filtered.sort((a, b) => {
    const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
})

const formatDueDate = (date) => {
  const taskDate = dayjs(date)
  const now = dayjs()
  
  if (taskDate.isSame(now, 'day')) {
    return 'Today'
  } else if (taskDate.isSame(now.add(1, 'day'), 'day')) {
    return 'Tomorrow'
  } else if (taskDate.isBefore(now, 'day')) {
    return `${now.diff(taskDate, 'day')}d overdue`
  } else {
    return taskDate.format('MMM D')
  }
}

const toggleCollapsed = () => {
  isCollapsed.value = !isCollapsed.value
}

const setFilter = (filter) => {
  currentFilter.value = filter
}

const selectTask = (task) => {
  selectedTask.value = task
  showTaskModal.value = true
  emit('task-selected', task)
}

const closeTaskModal = () => {
  showTaskModal.value = false
  selectedTask.value = null
}

const onTaskSaved = (task) => {
  // Task is already saved in the store
  console.log('Task updated:', task)
}

const onTaskDeleted = (task) => {
  // Task is already deleted from the store
  console.log('Task deleted:', task)
}

const quickToggleStatus = (task, event) => {
  event.stopPropagation()
  toggleTaskStatus(task.id)
}

const handleMouseEnter = async () => {
  try {
    await invoke('set_click_through', { enabled: false })
  } catch (error) {
    console.error('Failed to disable click through:', error)
  }
}

const handleMouseLeave = async () => {
  if (!isDragging.value) {
    try {
      await invoke('set_click_through', { enabled: true })
    } catch (error) {
      console.error('Failed to enable click through:', error)
    }
  }
}

const startDrag = (e) => {
  if (e.target.closest('.task-modal')) return
  
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - props.position.x,
    y: e.clientY - props.position.y
  }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (e) => {
  if (isDragging.value) {
    const newPosition = {
      x: e.clientX - dragStart.value.x,
      y: e.clientY - dragStart.value.y
    }
    emit('move', newPosition)
  }
}

const stopDrag = async () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  
  try {
    await invoke('set_click_through', { enabled: true })
  } catch (error) {
    console.error('Failed to enable click through:', error)
  }
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.task-list-container {
  position: absolute;
  width: 320px;
  max-height: 500px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: auto;
  user-select: none;
  cursor: move;
  overflow: hidden;
}

.task-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.task-list-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.collapse-btn {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.collapse-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.task-list-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.filter-tabs {
  display: flex;
  padding: 8px 16px;
  gap: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.filter-tab {
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.filter-tab.active {
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
}

.filter-tab:hover {
  background: rgba(0, 0, 0, 0.05);
}

.tasks-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  max-height: 350px;
}

.no-tasks {
  text-align: center;
  color: #666;
  padding: 32px 16px;
  font-size: 14px;
}

.task-item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  border-left: 4px solid #ddd;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s;
}

.task-item:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-item.priority-P0 { border-left-color: #ef4444; }
.task-item.priority-P1 { border-left-color: #f97316; }
.task-item.priority-P2 { border-left-color: #eab308; }
.task-item.priority-P3 { border-left-color: #22c55e; }

.task-main {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.task-status-btn {
  background: none;
  border: 1px solid #ddd;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-top: 2px;
}

.task-status-btn.status-completed {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.task-status-btn:hover {
  border-color: #3b82f6;
}

.task-priority {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.1);
  height: fit-content;
  min-width: 24px;
  text-align: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.task-content {
  flex: 1;
}

.task-title {
  font-weight: 500;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  line-height: 1.4;
}

.task-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.task-due {
  font-size: 12px;
  color: #666;
}

.task-status {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 500;
}

.status-pending { background: #fef3c7; color: #92400e; }
.status-in-progress { background: #dbeafe; color: #1e40af; }
.status-completed { background: #d1fae5; color: #065f46; }
.status-overdue { background: #fecaca; color: #991b1b; }
</style>