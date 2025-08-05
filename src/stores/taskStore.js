import { reactive, computed } from 'vue'
import dayjs from 'dayjs'
import { notificationService } from '../utils/notificationService.js'

// Task priorities
export const PRIORITIES = {
  P0: { value: 'P0', label: 'P0 - Critical', color: '#ef4444' },
  P1: { value: 'P1', label: 'P1 - High', color: '#f97316' },
  P2: { value: 'P2', label: 'P2 - Medium', color: '#eab308' },
  P3: { value: 'P3', label: 'P3 - Low', color: '#22c55e' }
}

// Task statuses
export const STATUSES = {
  PENDING: { value: 'pending', label: 'Pending', color: '#eab308' },
  IN_PROGRESS: { value: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  COMPLETED: { value: 'completed', label: 'Completed', color: '#10b981' },
  CANCELLED: { value: 'cancelled', label: 'Cancelled', color: '#6b7280' }
}

// Task store
const state = reactive({
  tasks: [
    {
      id: '1',
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation for the new feature including API references and usage examples.',
      priority: 'P1',
      status: 'in-progress',
      dueDate: dayjs().add(2, 'days').toDate(),
      createdDate: dayjs().toDate(),
      completedDate: null,
      reminder: true,
      reminderMinutes: 15,
      tags: ['work', 'documentation']
    },
    {
      id: '2',
      title: 'Review pull requests',
      description: 'Review and approve pending pull requests from the team.',
      priority: 'P2',
      status: 'pending',
      dueDate: dayjs().add(1, 'day').toDate(),
      createdDate: dayjs().subtract(1, 'day').toDate(),
      completedDate: null,
      reminder: false,
      reminderMinutes: 30,
      tags: ['work', 'review']
    },
    {
      id: '3',
      title: 'Plan weekend trip',
      description: 'Research and book accommodation for the weekend getaway.',
      priority: 'P3',
      status: 'pending',
      dueDate: dayjs().add(5, 'days').toDate(),
      createdDate: dayjs().toDate(),
      completedDate: null,
      reminder: true,
      reminderMinutes: 60,
      tags: ['personal', 'travel']
    }
  ],
  nextId: 4,
  isNotificationServiceInitialized: false
})

// Computed properties
const tasksComputed = {
  allTasks: computed(() => state.tasks),
  
  tasksByDate: computed(() => {
    const grouped = {}
    state.tasks.forEach(task => {
      const dateKey = dayjs(task.dueDate).format('YYYY-MM-DD')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(task)
    })
    return grouped
  }),
  
  todayTasks: computed(() => 
    state.tasks.filter(task => 
      dayjs(task.dueDate).isSame(dayjs(), 'day')
    )
  ),
  
  overdueTasks: computed(() => 
    state.tasks.filter(task => 
      dayjs(task.dueDate).isBefore(dayjs(), 'day') && 
      task.status !== 'completed' && 
      task.status !== 'cancelled'
    )
  ),
  
  upcomingTasks: computed(() => 
    state.tasks.filter(task => 
      dayjs(task.dueDate).isAfter(dayjs(), 'day') && 
      task.status !== 'completed' && 
      task.status !== 'cancelled'
    )
  ),
  
  completedTasks: computed(() => 
    state.tasks.filter(task => task.status === 'completed')
  )
}

// Actions
const actions = {
  async initializeNotifications() {
    if (!state.isNotificationServiceInitialized) {
      await notificationService.initialize()
      notificationService.scheduleAllTaskReminders(state.tasks)
      state.isNotificationServiceInitialized = true
      
      // Check for overdue tasks on startup
      setTimeout(() => {
        notificationService.checkOverdueTasks(state.tasks)
      }, 2000)
    }
  },

  addTask(taskData) {
    const newTask = {
      id: String(state.nextId++),
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      priority: taskData.priority || 'P3',
      status: taskData.status || 'pending',
      dueDate: taskData.dueDate || dayjs().add(1, 'day').toDate(),
      createdDate: new Date(),
      completedDate: null,
      reminder: taskData.reminder !== undefined ? taskData.reminder : false,
      reminderMinutes: taskData.reminderMinutes || 15,
      tags: taskData.tags || []
    }
    
    state.tasks.push(newTask)
    this.saveTasks()
    
    // Schedule reminder for new task
    if (newTask.reminder) {
      notificationService.scheduleTaskReminder(newTask)
    }
    
    return newTask
  },
  
  updateTask(taskId, updates) {
    const taskIndex = state.tasks.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      const task = state.tasks[taskIndex]
      const oldReminder = task.reminder
      const oldReminderMinutes = task.reminderMinutes
      const oldDueDate = task.dueDate
      
      // If status is being changed to completed, set completed date
      if (updates.status === 'completed' && task.status !== 'completed') {
        updates.completedDate = new Date()
        // Clear reminder when task is completed
        notificationService.clearTaskReminder(taskId)
      } else if (updates.status !== 'completed') {
        updates.completedDate = null
      }
      
      Object.assign(task, updates)
      this.saveTasks()
      
      // Update reminders if reminder settings or due date changed
      if (task.status !== 'completed' && task.status !== 'cancelled') {
        const reminderChanged = task.reminder !== oldReminder || 
                              task.reminderMinutes !== oldReminderMinutes ||
                              task.dueDate !== oldDueDate
        
        if (reminderChanged) {
          notificationService.clearTaskReminder(taskId)
          if (task.reminder) {
            notificationService.scheduleTaskReminder(task)
          }
        }
      }
      
      return task
    }
    return null
  },
  
  deleteTask(taskId) {
    const taskIndex = state.tasks.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      const deletedTask = state.tasks.splice(taskIndex, 1)[0]
      
      // Clear any scheduled reminders
      notificationService.clearTaskReminder(taskId)
      
      this.saveTasks()
      return deletedTask
    }
    return null
  },
  
  getTask(taskId) {
    return state.tasks.find(task => task.id === taskId)
  },
  
  getTasksForDate(date) {
    const dateKey = dayjs(date).format('YYYY-MM-DD')
    return tasksComputed.tasksByDate.value[dateKey] || []
  },
  
  toggleTaskStatus(taskId) {
    const task = this.getTask(taskId)
    if (task) {
      const statusProgression = {
        'pending': 'in-progress',
        'in-progress': 'completed',
        'completed': 'pending',
        'cancelled': 'pending'
      }
      this.updateTask(taskId, { status: statusProgression[task.status] })
    }
  },
  
  saveTasks() {
    try {
      localStorage.setItem('personal-time-service-tasks', JSON.stringify(state.tasks))
    } catch (error) {
      console.error('Failed to save tasks:', error)
    }
  },
  
  loadTasks() {
    try {
      const saved = localStorage.getItem('personal-time-service-tasks')
      if (saved) {
        const tasks = JSON.parse(saved)
        // Convert date strings back to Date objects
        tasks.forEach(task => {
          task.dueDate = new Date(task.dueDate)
          task.createdDate = new Date(task.createdDate)
          if (task.completedDate) {
            task.completedDate = new Date(task.completedDate)
          }
        })
        state.tasks = tasks
        
        // Update nextId to avoid conflicts
        const maxId = Math.max(...tasks.map(task => parseInt(task.id) || 0), 0)
        state.nextId = maxId + 1
        
        // Reschedule all reminders after loading
        if (state.isNotificationServiceInitialized) {
          notificationService.scheduleAllTaskReminders(state.tasks)
        }
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  },
  
  clearAllTasks() {
    // Clear all reminders first
    notificationService.clearAllReminders()
    
    state.tasks = []
    this.saveTasks()
  },

  async sendTestNotification() {
    await notificationService.sendTestNotification()
  },

  async checkOverdueTasks() {
    await notificationService.checkOverdueTasks(state.tasks)
  }
}

// Initialize store
actions.loadTasks()

export const useTaskStore = () => {
  return {
    ...tasksComputed,
    ...actions,
    PRIORITIES,
    STATUSES
  }
}