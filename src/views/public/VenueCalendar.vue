<template>
  <div class="venue-calendar">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>场地预约日历</span>
          <el-select
            v-model="selectedVenueId"
            placeholder="选择场地（默认全部）"
            clearable
            style="width: 260px"
            @change="fetchBookings"
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

      <el-alert
        title="使用说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <p>日历展示后端返回的<strong>已通过</strong>预约</p>
        <p>可通过上方下拉框筛选特定场地</p>
        <p>点击标签可查看活动详情</p>
      </el-alert>

      <div class="calendar-stats">
        <el-tag type="success" size="large">
          本月预约: {{ currentMonthEvents.length }} 个活动
        </el-tag>
        <el-tag type="primary" size="large" style="margin-left: 10px">
          {{ selectedVenueId ? currentVenueName : '所有场地' }}
        </el-tag>
      </div>

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
                {{ event.activityName }}
              </el-tag>
            </div>
          </div>
        </template>
      </el-calendar>
    </el-card>

    <el-dialog
      v-model="detailDialogVisible"
      :title="selectedEvent?.activityName"
      width="600px"
    >
      <el-descriptions v-if="selectedEvent" :column="2" border>
        <el-descriptions-item label="活动名称" :span="2">
          <el-tag type="primary" size="large">{{ selectedEvent.activityName }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请人">
          {{ selectedEvent.applicantName }}
        </el-descriptions-item>
        <el-descriptions-item label="场地">
          {{ selectedEvent.venueName }}
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">
          {{ formatDateTime(selectedEvent.startTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="结束时间">
          {{ formatDateTime(selectedEvent.endTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag type="success">已通过</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getVenues, getVenueBookings } from '@/api/venues'

const selectedVenueId = ref(null)
const calendarValue = ref(new Date())

const detailDialogVisible = ref(false)
const selectedEvent = ref(null)

const venues = ref([])
const events = ref([])
const loadingVenues = ref(false)
const loadingEvents = ref(false)

const availableVenues = computed(() => venues.value.filter(v => v.status === 'available'))

const currentVenueName = computed(() => {
  const venue = venues.value.find(v => v.id === selectedVenueId.value)
  return venue ? venue.name : '所有场地'
})

const currentMonthEvents = computed(() => {
  const month = calendarValue.value.getMonth()
  const year = calendarValue.value.getFullYear()
  return events.value.filter((event) => {
    const start = new Date(event.startTime)
    return start.getMonth() === month && start.getFullYear() === year
  })
})

const fetchVenues = async () => {
  loadingVenues.value = true
  try {
    const data = await getVenues({ page: 1, size: 100, status: 'available' })
    venues.value = data.list || []
    if (!selectedVenueId.value && venues.value.length > 0) {
      selectedVenueId.value = null
    }
  } catch (error) {
    ElMessage.error('加载场地列表失败')
  } finally {
    loadingVenues.value = false
  }
}

const fetchBookings = async () => {
  loadingEvents.value = true
  try {
    let bookings = []
    if (selectedVenueId.value) {
      const venue = venues.value.find((v) => v.id === selectedVenueId.value)
      const data = await getVenueBookings(selectedVenueId.value, { days: 30 })
      bookings = (data || []).map((item) => ({
        ...item,
        venueId: venue?.id,
        venueName: venue?.name
      }))
    } else {
      const requests = venues.value.map((venue) =>
        getVenueBookings(venue.id, { days: 30 }).then((data) =>
          (data || []).map((item) => ({ ...item, venueId: venue.id, venueName: venue.name }))
        )
      )
      const results = await Promise.allSettled(requests)
      bookings = results
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value)
    }

    events.value = bookings.map((item) => ({
      ...item,
      venueName: item.venueName || getVenueName(item.venueId),
      applicantName: item.applicantName || ''
    }))
  } catch (error) {
    ElMessage.error('加载预约信息失败')
  } finally {
    loadingEvents.value = false
  }
}

const getEventsForDay = (day) => {
  const dayStr = new Date(day).toISOString().split('T')[0]
  return events.value.filter((event) => {
    const eventStart = new Date(event.startTime).toISOString().split('T')[0]
    return eventStart === dayStr
  })
}

const getEventTagType = (event) => {
  const colors = ['primary', 'success', 'warning', 'danger', 'info']
  const venueIndex = event.venueId || 0
  return colors[venueIndex % colors.length]
}

const getVenueName = (venueId) => {
  const venue = venues.value.find((v) => v.id === venueId)
  return venue ? venue.name : '未知场地'
}

const formatDateTime = (value) => {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

const showEventDetail = (event) => {
  selectedEvent.value = {
    ...event,
    venueName: event.venueName || getVenueName(event.venueId)
  }
  detailDialogVisible.value = true
}

onMounted(async () => {
  await fetchVenues()
  await fetchBookings()
})
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

