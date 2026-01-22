<template>
  <div class="venue-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="title">
            <span>场地资源浏览（未来 7 天）</span>
            <el-tag type="info" style="margin-left: 10px">空闲优先 · 占用置底</el-tag>
          </div>

          <div class="actions">
            <el-input
              v-model="keyword"
              placeholder="搜索：场地名称 / 位置"
              clearable
              style="width: 260px"
              @keyup.enter="handleRefresh"
              @clear="handleRefresh"
            />
            <el-button type="primary" :loading="refreshing" @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新状态
            </el-button>
          </div>
        </div>
      </template>

      <el-alert
        title="说明"
        type="info"
        :closable="false"
        style="margin-bottom: 16px"
      >
        <p>“占用中”根据当前时间是否落在预约区间内计算（实时状态查询）。</p>
      </el-alert>

      <el-table
        :data="sortedRows"
        stripe
        border
        v-loading="loading"
        style="width: 100%"
        row-key="id"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand">
              <div class="expand-header">
                <div class="expand-title">未来 7 天占用时间轴</div>
                <el-tag v-if="row.bookings.length === 0" type="success">暂无占用</el-tag>
              </div>

              <el-timeline v-if="row.bookings.length" style="margin-top: 10px">
                <el-timeline-item
                  v-for="b in row.bookings"
                  :key="b._key"
                  :timestamp="formatDateRange(b.startTime, b.endTime)"
                  :type="isNowWithin(b.startTime, b.endTime) ? 'danger' : 'primary'"
                >
                  <div class="booking-title">{{ b.activityName || b.title || '（未命名活动）' }}</div>
                  <div class="booking-meta">
                    <span>申请人：{{ maskName(b.applicantName) }}<template v-if="b.applicantDepartment">（{{ b.applicantDepartment }}）</template></span>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="场地" min-width="180" />
        <el-table-column prop="location" label="位置" min-width="160" />
        <el-table-column prop="capacity" label="容量" width="90" />
        <el-table-column label="实时状态" width="140">
          <template #default="{ row }">
            <el-tag v-if="row.isOccupiedNow" type="danger">占用中</el-tag>
            <el-tag v-else-if="row.bookingsCount > 0" type="warning">未来有预约</el-tag>
            <el-tag v-else type="success">空闲</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="未来 7 天预约数" width="140">
          <template #default="{ row }">
            <el-tag :type="row.bookingsCount ? 'info' : 'success'">
              {{ row.bookingsCount }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下一场预约" min-width="170">
          <template #default="{ row }">
            <span v-if="row.nextBookingStart">{{ formatDateTime(row.nextBookingStart) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="占用结束（若占用中）" min-width="190">
          <template #default="{ row }">
            <span v-if="row.currentBookingEnd">{{ formatDateTime(row.currentBookingEnd) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="footer-hint">
        <span>提示：点击每行左侧展开箭头，可查看该场地未来 7 天的占用时间轴。</span>
        <span style="margin-left: 12px">自动刷新：每 {{ Math.round(refreshIntervalMs / 1000) }} 秒一次</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getVenues, getVenueBookings } from '@/api/venues'
import { formatShanghaiDateTime, toShanghaiMs } from '@/utils/datetime'

const DAYS = 7

const loading = ref(false)
const refreshing = ref(false)
const keyword = ref('')

const venues = ref([])
const bookingsByVenueId = ref(new Map())

const refreshIntervalMs = 30000
let timer = null

const normalize = (v) => (v ?? '').toString().trim().toLowerCase()

const parseTime = (v) => toShanghaiMs(v)

const isNowWithin = (start, end) => {
  const now = Date.now()
  const s = parseTime(start)
  const e = parseTime(end)
  if (s == null || e == null) return false
  return now >= s && now <= e
}

const formatDateTime = formatShanghaiDateTime

const formatDateRange = (start, end) => {
  const s = formatDateTime(start)
  const e = formatDateTime(end)
  return `${s} - ${e}`
}

// 姓名脱敏：马小明 -> 马**
const maskName = (name) => {
  if (!name || name.length < 2) return name || '-'
  return name[0] + '**'
}

const fetchVenues = async () => {
  loading.value = true
  try {
    const data = await getVenues({ page: 1, size: 200, status: 'available' })
    venues.value = data?.list || []
  } catch (e) {
    ElMessage.error('加载场地列表失败')
    venues.value = []
  } finally {
    loading.value = false
  }
}

const fetchBookingsForVenue = async (venueId) => {
  const data = await getVenueBookings(venueId, { days: DAYS })
  const raw = Array.isArray(data) ? data : []
  return raw
    .map((b, idx) => ({
      ...b,
      _key: b.id ?? `${venueId}-${idx}-${b.startTime ?? ''}-${b.endTime ?? ''}`
    }))
    .filter((b) => b.startTime && b.endTime)
    .sort((a, b) => (parseTime(a.startTime) ?? 0) - (parseTime(b.startTime) ?? 0))
}

const fetchBookingsForAllVenues = async () => {
  const list = venues.value || []
  const requests = list.map((v) =>
    fetchBookingsForVenue(v.id)
      .then((bookings) => ({ ok: true, id: v.id, bookings }))
      .catch(() => ({ ok: false, id: v.id, bookings: [] }))
  )

  const results = await Promise.all(requests)
  const next = new Map()
  for (const r of results) {
    next.set(r.id, r.bookings)
  }
  bookingsByVenueId.value = next
}

const buildRow = (venue) => {
  const bookings = bookingsByVenueId.value.get(venue.id) || []
  const now = Date.now()

  const current = bookings.find((b) => {
    const s = parseTime(b.startTime)
    const e = parseTime(b.endTime)
    if (s == null || e == null) return false
    return now >= s && now <= e
  })

  const future = bookings.filter((b) => {
    const s = parseTime(b.startTime)
    return s != null && s > now
  })

  const nextBookingStart = future.length ? future[0].startTime : null
  const currentBookingEnd = current ? current.endTime : null

  return {
    ...venue,
    bookings,
    bookingsCount: bookings.length,
    isOccupiedNow: !!current,
    nextBookingStart,
    currentBookingEnd
  }
}

const filteredRows = computed(() => {
  const kw = normalize(keyword.value)
  const list = (venues.value || []).map(buildRow)
  if (!kw) return list
  return list.filter((v) => {
    const hay = `${normalize(v.name)} ${normalize(v.location)}`
    return hay.includes(kw)
  })
})

// 智能排序：空闲（且未来无预约）优先；其次空闲但未来有预约；占用中置底（并按“最早可释放”优先）
const sortedRows = computed(() => {
  const list = [...filteredRows.value]

  const rank = (row) => {
    if (row.isOccupiedNow) return 2
    if (row.bookingsCount > 0) return 1
    return 0
  }

  return list.sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    if (ra !== rb) return ra - rb

    // rank 0：都完全空闲，按容量降序（更通用）
    if (ra === 0) return (b.capacity || 0) - (a.capacity || 0)

    // rank 1：都空闲但未来有预约，越晚被占用越靠前（空闲更久）
    if (ra === 1) {
      const ta = parseTime(a.nextBookingStart) ?? -1
      const tb = parseTime(b.nextBookingStart) ?? -1
      return tb - ta
    }

    // rank 2：都占用中，越早结束越靠前（更快可用）
    const ea = parseTime(a.currentBookingEnd) ?? Number.POSITIVE_INFINITY
    const eb = parseTime(b.currentBookingEnd) ?? Number.POSITIVE_INFINITY
    return ea - eb
  })
})

const handleRefresh = async () => {
  refreshing.value = true
  try {
    if (!venues.value.length) {
      await fetchVenues()
    }
    await fetchBookingsForAllVenues()
    ElMessage.success('状态已更新')
  } catch {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

onMounted(async () => {
  await fetchVenues()
  await fetchBookingsForAllVenues()
  timer = window.setInterval(() => {
    // 只刷新 bookings（更轻），venues 变更可以手动刷新
    fetchBookingsForAllVenues()
  }, refreshIntervalMs)
})

onBeforeUnmount(() => {
  if (timer) {
    window.clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
.venue-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.expand {
  padding: 10px 12px;
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.expand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.expand-title {
  font-weight: 600;
  color: #303133;
}

.booking-title {
  font-weight: 600;
}

.booking-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #606266;
}

.footer-hint {
  margin-top: 12px;
  color: #909399;
  font-size: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>

