<template>
  <div class="venue-calendar">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>场地预约日历</span>
          <el-select
            v-model="selectedVenueId"
            placeholder="选择场地（默认显示全部）"
            clearable
            style="width: 250px"
          >
            <el-option
              v-for="venue in availableVenues"
              :key="venue.id"
              :label="venue.name"
              :value="venue.id"
            />
          </el-select>
        </div>
      </template>

      <!-- 日历说明 -->
      <el-alert
        title="使用说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <p>📅 日历显示所有<strong>已通过</strong>的场地预约</p>
        <p>🏢 可以通过上方下拉框筛选特定场地</p>
        <p>🎯 点击日期可以查看当天的活动详情</p>
      </el-alert>

      <!-- 统计信息 -->
      <div class="calendar-stats">
        <el-tag type="success" size="large">
          本月预约: {{ currentMonthEvents.length }} 个活动
        </el-tag>
        <el-tag type="primary" size="large" style="margin-left: 10px">
          {{ selectedVenueId ? '当前场地' : '所有场地' }}
        </el-tag>
      </div>

      <!-- 日历组件 -->
      <el-calendar v-model="calendarValue">
        <template #date-cell="{ data }">
          <div class="calendar-day">
            <div class="day-number">{{ data.day.split('-').slice(-1)[0] }}</div>
            <div class="day-events">
              <el-tag
                v-for="event in getEventsForDay(data.day)"
                :key="event.id"
                :type="getEventTagType(event)"
                size="small"
                class="event-tag"
                @click="showEventDetail(event)"
              >
                {{ event.activity_name }}
              </el-tag>
            </div>
          </div>
        </template>
      </el-calendar>
    </el-card>

    <!-- 活动详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="selectedEvent?.activity_name"
      width="600px"
    >
      <el-descriptions v-if="selectedEvent" :column="2" border>
        <el-descriptions-item label="活动名称" :span="2">
          <el-tag type="primary" size="large">{{ selectedEvent.activity_name }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请人">
          {{ selectedEvent.applicant_username }}
        </el-descriptions-item>
        <el-descriptions-item label="场地">
          {{ getVenueName(selectedEvent.venue_id) }}
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">
          {{ selectedEvent.start_time }}
        </el-descriptions-item>
        <el-descriptions-item label="结束时间">
          {{ selectedEvent.end_time }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag type="success">{{ selectedEvent.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="借用物资" :span="2">
          <div v-if="selectedEvent.requested_materials.length > 0">
            <el-tag
              v-for="(item, index) in selectedEvent.requested_materials"
              :key="index"
              style="margin: 2px"
            >
              {{ item.name }} × {{ item.quantity }}
            </el-tag>
          </div>
          <span v-else style="color: #909399">无</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { applicationList, venueList } from '@/mock/data.js'

// 选中的场地ID
const selectedVenueId = ref(null)

// 日历当前值
const calendarValue = ref(new Date())

// 详情对话框
const detailDialogVisible = ref(false)
const selectedEvent = ref(null)

// 可用场地列表（只显示开放预约的）
const availableVenues = computed(() => {
  return venueList.value.filter(venue => venue.status === '开放预约')
})

// 日历事件（已通过的申请）
const calendarEvents = computed(() => {
  let events = applicationList.value.filter(app => app.status === '已通过')
  
  // 如果选择了特定场地，则过滤
  if (selectedVenueId.value) {
    events = events.filter(app => app.venue_id === selectedVenueId.value)
  }
  
  return events
})

// 当前月份的事件
const currentMonthEvents = computed(() => {
  const currentMonth = calendarValue.value.getMonth()
  const currentYear = calendarValue.value.getFullYear()
  
  return calendarEvents.value.filter(event => {
    const eventDate = new Date(event.start_time)
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
  })
})

// 获取某一天的事件
const getEventsForDay = (day) => {
  // day 格式: YYYY-MM-DD
  const dayDate = new Date(day)
  const dayStr = dayDate.toISOString().split('T')[0]
  
  return calendarEvents.value.filter(event => {
    // 获取活动开始日期（只比较日期部分）
    const eventStartDate = new Date(event.start_time).toISOString().split('T')[0]
    return eventStartDate === dayStr
  })
}

// 获取事件标签类型
const getEventTagType = (event) => {
  // 根据场地ID返回不同颜色
  const colors = ['primary', 'success', 'warning', 'danger', 'info']
  return colors[event.venue_id % colors.length]
}

// 获取场地名称
const getVenueName = (venueId) => {
  const venue = venueList.value.find(v => v.id === venueId)
  return venue ? venue.name : '未知场地'
}

// 显示活动详情
const showEventDetail = (event) => {
  selectedEvent.value = event
  detailDialogVisible.value = true
}
</script>

<style scoped>
.venue-calendar {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.calendar-stats {
  margin-bottom: 20px;
}

.calendar-day {
  height: 100%;
  padding: 5px;
}

.day-number {
  text-align: right;
  font-weight: bold;
  color: #606266;
  margin-bottom: 5px;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.event-tag {
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: transform 0.2s;
}

.event-tag:hover {
  transform: scale(1.05);
  z-index: 10;
}

:deep(.el-calendar-table .el-calendar-day) {
  height: 100px;
  padding: 0;
}

:deep(.el-calendar-table td.is-selected) {
  background-color: #f0f9ff;
}

:deep(.el-calendar-table td.is-today) {
  background-color: #ecf5ff;
}

:deep(.el-calendar__header) {
  padding: 12px 20px;
  border-bottom: 1px solid #ebeef5;
}
</style>

