<template>
  <div class="task-modal-overlay" @click="closeModal">
    <div class="task-modal" @click.stop>
      <div class="modal-header">
        <h2>{{ isEditing ? 'Edit Task' : 'Create New Task' }}</h2>
        <button @click="closeModal" class="close-btn">×</button>
      </div>
      
      <form @submit.prevent="saveTask" class="modal-content">
        <div class="form-group">
          <label for="title">Task Title *</label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            required
            placeholder="Enter task title"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="formData.description"
            placeholder="Enter task description"
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="priority">Priority</label>
            <select id="priority" v-model="formData.priority" class="form-select">
              <option 
                v-for="(priority, key) in PRIORITIES" 
                :key="key" 
                :value="priority.value"
              >
                {{ priority.label }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" v-model="formData.status" class="form-select">
              <option 
                v-for="(status, key) in STATUSES" 
                :key="key" 
                :value="status.value"
              >
                {{ status.label }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="dueDate">Due Date</label>
            <input
              id="dueDate"
              v-model="dueDateString"
              type="datetime-local"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="estimatedTime">Estimated Time (hours)</label>
            <input
              id="estimatedTime"
              v-model.number="formData.estimatedTime"
              type="number"
              min="0.5"
              step="0.5"
              placeholder="2"
              class="form-input"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="formData.reminder"
            />
            Enable Reminder
          </label>
        </div>
        
        <div v-if="formData.reminder" class="form-group">
          <label for="reminderMinutes">Remind me (minutes before due date)</label>
          <select id="reminderMinutes" v-model="formData.reminderMinutes" class="form-select">
            <option value="5">5 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="1440">1 day</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="tags">Tags (comma separated)</label>
          <input
            id="tags"
            v-model="tagsString"
            type="text"
            placeholder="work, personal, urgent"
            class="form-input"
          />
        </div>
        
        <div class="modal-footer">
          <button type="button" @click="closeModal" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary" :disabled="!formData.title.trim()">
            {{ isEditing ? 'Update Task' : 'Create Task' }}
          </button>
          <button 
            v-if="isEditing" 
            type="button" 
            @click="deleteTask" 
            class="btn-danger"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useTaskStore } from '../../stores/taskStore.js'
import dayjs from 'dayjs'

const props = defineProps({
  task: { type: Object, default: null },
  selectedDate: { type: Date, default: null }
})

const emit = defineEmits(['close', 'saved', 'deleted'])

const { addTask, updateTask, deleteTask: removeTask, PRIORITIES, STATUSES } = useTaskStore()

const isEditing = computed(() => !!props.task)

const formData = reactive({
  title: '',
  description: '',
  priority: 'P3',
  status: 'pending',
  dueDate: null,
  reminder: false,
  reminderMinutes: 15,
  estimatedTime: 1,
  tags: []
})

// Convert tags array to string for input
const tagsString = ref('')

// Convert date to datetime-local format
const dueDateString = ref('')

// Initialize form data
const initializeForm = () => {
  if (props.task) {
    // Editing existing task
    Object.assign(formData, {
      ...props.task,
      tags: [...props.task.tags]
    })
    tagsString.value = props.task.tags.join(', ')
    dueDateString.value = dayjs(props.task.dueDate).format('YYYY-MM-DDTHH:mm')
  } else {
    // Creating new task
    const defaultDate = props.selectedDate || dayjs().add(1, 'day').toDate()
    formData.dueDate = defaultDate
    dueDateString.value = dayjs(defaultDate).format('YYYY-MM-DDTHH:mm')
    tagsString.value = ''
  }
}

// Watch for date string changes
watch(dueDateString, (newValue) => {
  if (newValue) {
    formData.dueDate = new Date(newValue)
  }
})

// Watch for tags string changes
watch(tagsString, (newValue) => {
  formData.tags = newValue
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
})

const saveTask = () => {
  const taskData = {
    ...formData,
    dueDate: formData.dueDate,
    tags: formData.tags
  }
  
  let result
  if (isEditing.value) {
    result = updateTask(props.task.id, taskData)
  } else {
    result = addTask(taskData)
  }
  
  if (result) {
    emit('saved', result)
    closeModal()
  }
}

const deleteTask = () => {
  if (isEditing.value && confirm('Are you sure you want to delete this task?')) {
    const result = removeTask(props.task.id)
    if (result) {
      emit('deleted', result)
      closeModal()
    }
  }
}

const closeModal = () => {
  emit('close')
}

// Initialize on mount
initializeForm()
</script>

<style scoped>
.task-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  pointer-events: auto;
}

.task-modal {
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  color: #666;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: white;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.btn-primary, .btn-secondary, .btn-danger {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}
</style>