<template>
  <div 
    class="calendar-container"
    :style="{ 
      opacity: opacity,
      left: position.x + 'px',
      top: position.y + 'px'
    }"
    @mousedown="startDrag"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="calendar-header">
      <button @click="previousMonth" class="nav-btn">‹</button>
      <h3>{{ currentMonthYear }}</h3>
      <button @click="nextMonth" class="nav-btn">›</button>
    </div>
    
    <div class="calendar-grid">
      <div class="day-header" v-for="day in dayHeaders" :key="day">
        {{ day }}
      </div>
      
      <div 
        v-for="date in calendarDates" 
        :key="date.key"
        class="calendar-date"
        :class="{
          'other-month': !date.isCurrentMonth,
          'today': date.isToday,
          'has-tasks': date.tasks.length > 0
        }"
        @click="selectDate(date)"
      >
        <span class="date-number">{{ date.day }}</span>
        <div class="tasks-indicator" v-if="date.tasks.length > 0">
          <div 
            v-for="task in date.tasks.slice(0, 3)" 
            :key="task.id"
            class="task-dot"
            :class="`priority-${task.priority}`"
            :title="task.title"
          ></div>
          <span v-if="date.tasks.length > 3" class="more-tasks">
            +{{ date.tasks.length - 3 }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Task Modal -->
    <TaskModal
      v-if="showTaskModal"
      :task="selectedTask"
      :selected-date="selectedDate"
      @close="closeTaskModal"
      @saved="onTaskSaved"
      @deleted="onTaskDeleted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import dayjs from 'dayjs'
import { useTaskStore } from '../../stores/taskStore.js'
import TaskModal from '../TaskManager/TaskModal.vue'

const props = defineProps({
  opacity: { type: Number, default: 0.9 },
  position: { type: Object, required: true }
})

const emit = defineEmits(['move', 'date-selected', 'task-selected'])

const { getTasksForDate } = useTaskStore()

const currentDate = ref(dayjs())
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const showTaskModal = ref(false)
const selectedTask = ref(null)
const selectedDate = ref(null)

const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const currentMonthYear = computed(() => {
  return currentDate.value.format('MMMM YYYY')
})

const calendarDates = computed(() => {
  const startOfMonth = currentDate.value.startOf('month')
  const endOfMonth = currentDate.value.endOf('month')
  const startOfCalendar = startOfMonth.startOf('week')
  const endOfCalendar = endOfMonth.endOf('week')
  
  const dates = []
  let date = startOfCalendar
  
  while (date.isBefore(endOfCalendar) || date.isSame(endOfCalendar)) {
    const dateObj = {
      key: date.format('YYYY-MM-DD'),
      day: date.date(),
      fullDate: date,
      isCurrentMonth: date.month() === currentDate.value.month(),
      isToday: date.isSame(dayjs(), 'day'),
      tasks: getTasksForDate(date.toDate())
    }
    dates.push(dateObj)
    date = date.add(1, 'day')
  }
  
  return dates
})

const previousMonth = () => {
  currentDate.value = currentDate.value.subtract(1, 'month')
}

const nextMonth = () => {
  currentDate.value = currentDate.value.add(1, 'month')
}

const selectDate = (date) => {
  selectedDate.value = date.fullDate.toDate()
  selectedTask.value = null
  showTaskModal.value = true
  emit('date-selected', date)
}

const closeTaskModal = () => {
  showTaskModal.value = false
  selectedTask.value = null
  selectedDate.value = null
}

const onTaskSaved = (task) => {
  // Task is already saved in the store, no need to do anything
  console.log('Task saved:', task)
}

const onTaskDeleted = (task) => {
  // Task is already deleted from the store, no need to do anything
  console.log('Task deleted:', task)
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
.calendar-container {
  position: absolute;
  width: 300px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: auto;
  user-select: none;
  cursor: move;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.calendar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.nav-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.nav-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-header {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  padding: 8px 0;
}

.calendar-date {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;
  position: relative;
  min-height: 36px;
}

.calendar-date:hover {
  background: rgba(59, 130, 246, 0.1);
}

.calendar-date.other-month {
  color: #ccc;
}

.calendar-date.today {
  background: rgba(59, 130, 246, 0.2);
  color: #1d4ed8;
  font-weight: 600;
}

.calendar-date.has-tasks {
  background: rgba(16, 185, 129, 0.1);
}

.date-number {
  font-size: 14px;
  margin-bottom: 2px;
}

.tasks-indicator {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  justify-content: center;
}

.task-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
}

.task-dot.priority-P0 { background: #ef4444; }
.task-dot.priority-P1 { background: #f97316; }
.task-dot.priority-P2 { background: #eab308; }
.task-dot.priority-P3 { background: #22c55e; }

.more-tasks {
  font-size: 8px;
  color: #666;
  margin-left: 2px;
}
</style>