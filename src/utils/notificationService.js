import { invoke } from '@tauri-apps/api/core'
import dayjs from 'dayjs'

class NotificationService {
  constructor() {
    this.reminderTimers = new Map()
    this.isInitialized = false
  }

  async initialize() {
    if (this.isInitialized) return
    
    try {
      // Request notification permission from the browser
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
      }
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize notifications:', error)
    }
  }

  async sendNotification(title, body, options = {}) {
    try {
      await this.initialize()
      
      // Use Tauri's notification system
      await invoke('send_notification', {
        title,
        body
      })
      
      console.log('Notification sent:', title)
    } catch (error) {
      console.error('Failed to send notification:', error)
      
      // Fallback to browser notification if Tauri fails
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: options.icon,
          tag: options.tag
        })
      }
    }
  }

  scheduleTaskReminder(task) {
    // Clear existing reminder for this task
    this.clearTaskReminder(task.id)

    if (!task.reminder || !task.dueDate) {
      return
    }

    const dueTime = dayjs(task.dueDate)
    const reminderTime = dueTime.subtract(task.reminderMinutes || 15, 'minutes')
    const now = dayjs()

    if (reminderTime.isBefore(now)) {
      // If reminder time has passed, don't schedule
      return
    }

    const timeUntilReminder = reminderTime.diff(now)
    
    const timerId = setTimeout(() => {
      this.sendTaskReminderNotification(task)
      this.reminderTimers.delete(task.id)
    }, timeUntilReminder)

    this.reminderTimers.set(task.id, timerId)
    
    console.log(`Scheduled reminder for task "${task.title}" at ${reminderTime.format('YYYY-MM-DD HH:mm')}`)
  }

  clearTaskReminder(taskId) {
    const timerId = this.reminderTimers.get(taskId)
    if (timerId) {
      clearTimeout(timerId)
      this.reminderTimers.delete(taskId)
    }
  }

  async sendTaskReminderNotification(task) {
    const dueTime = dayjs(task.dueDate)
    const timeUntilDue = dueTime.diff(dayjs(), 'minutes')
    
    let timeText = ''
    if (timeUntilDue <= 0) {
      timeText = 'now!'
    } else if (timeUntilDue < 60) {
      timeText = `in ${timeUntilDue} minute${timeUntilDue !== 1 ? 's' : ''}`
    } else {
      const hours = Math.floor(timeUntilDue / 60)
      timeText = `in ${hours} hour${hours !== 1 ? 's' : ''}`
    }

    const title = `Task Reminder: ${task.title}`
    const body = `This task is due ${timeText}. Priority: ${task.priority}`

    await this.sendNotification(title, body, {
      tag: `task-reminder-${task.id}`,
      icon: this.getPriorityIcon(task.priority)
    })
  }

  getPriorityIcon(priority) {
    // Return different icons based on priority
    const icons = {
      'P0': '🔴',
      'P1': '🟠', 
      'P2': '🟡',
      'P3': '🟢'
    }
    return icons[priority] || '📋'
  }

  scheduleAllTaskReminders(tasks) {
    // Clear all existing reminders
    this.clearAllReminders()
    
    // Schedule reminders for all tasks that need them
    tasks.forEach(task => {
      if (task.status !== 'completed' && task.status !== 'cancelled') {
        this.scheduleTaskReminder(task)
      }
    })
  }

  clearAllReminders() {
    this.reminderTimers.forEach((timerId) => {
      clearTimeout(timerId)
    })
    this.reminderTimers.clear()
  }

  async sendTestNotification() {
    await this.sendNotification(
      'Test Notification',
      'Personal Time Service notifications are working!',
      { tag: 'test' }
    )
  }

  // Check for overdue tasks and send notifications
  async checkOverdueTasks(tasks) {
    const now = dayjs()
    const overdueTasks = tasks.filter(task => 
      task.status !== 'completed' && 
      task.status !== 'cancelled' && 
      dayjs(task.dueDate).isBefore(now)
    )

    if (overdueTasks.length > 0) {
      const title = `${overdueTasks.length} Overdue Task${overdueTasks.length !== 1 ? 's' : ''}`
      const taskNames = overdueTasks.slice(0, 3).map(t => t.title).join(', ')
      const body = overdueTasks.length <= 3 
        ? `${taskNames}`
        : `${taskNames} and ${overdueTasks.length - 3} more`

      await this.sendNotification(title, body, {
        tag: 'overdue-tasks'
      })
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationService()

// Export class for direct usage if needed
export { NotificationService }