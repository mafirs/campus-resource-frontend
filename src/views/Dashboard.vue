<template>
  <div class="dashboard page">
    <el-card class="welcome-card">
      <div class="welcome-content">
        <h2>欢迎，{{ userStore.userInfo.username }}！</h2>
        <p>当前角色：<el-tag :type="getRoleTagType()">{{ getRoleText() }}</el-tag></p>
      </div>
    </el-card>

    <!-- 数据统计卡片 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card" v-loading="statsLoading">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409eff">
              <el-icon :size="32"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalVenues }}</div>
              <div class="stat-label">场地总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card" v-loading="statsLoading">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon :size="32"><Box /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalMaterials }}</div>
              <div class="stat-label">物资种类</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card" v-loading="statsLoading">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon :size="32"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ todayApplications }}</div>
              <div class="stat-label">{{ todayApplicationsLabel }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card" v-loading="statsLoading">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon :size="32"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ pendingApplications }}</div>
              <div class="stat-label">{{ pendingApplicationsLabel }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ overviewTitle }}</span>
            </div>
          </template>
          <div class="my-app-stats">
            <el-tag
              v-for="item in personalStatusMeta"
              :key="item.key"
              :type="item.type"
              effect="dark"
            >
              {{ item.label }}：{{ overviewStats[item.key] ?? 0 }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row v-if="canViewTrends" :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card :body-style="{ padding: '0' }" v-loading="trendLoading">
          <template #header>
            <div class="card-header">
              <span>热门场地 Top 5</span>
            </div>
          </template>
          <div>
            <div
              v-if="topData.topVenues.length"
              ref="venueChartRef"
              style="width: 100%; height: 400px"
            ></div>
            <el-empty v-else description="暂无数据" />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" class="chart-col-mobile">
        <el-card :body-style="{ padding: '0' }" v-loading="trendLoading">
          <template #header>
            <div class="card-header">
              <span>热门物资 Top 5</span>
            </div>
          </template>
          <div>
            <div
              v-if="topData.topMaterials.length"
              ref="materialChartRef"
              style="width: 100%; height: 400px"
            ></div>
            <el-empty v-else description="暂无数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 申请状态统计 -->
    <el-row v-if="canViewTrends" :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card :body-style="{ padding: '0' }" v-loading="trendLoading">
          <template #header>
            <div class="card-header">
              <span>审批状态趋势</span>
            </div>
          </template>
          <div>
            <div
              v-if="trendData.applicationTrends.length"
              ref="statusChartRef"
              style="width: 100%; height: 300px"
            ></div>
            <el-empty v-else description="暂无数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useUserStore } from '@/store/user'
import { getDashboardStats, getDashboardTrends, getDashboardTop } from '@/api/dashboard'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { OfficeBuilding, Box, Document, Clock } from '@element-plus/icons-vue'

const userStore = useUserStore()

const stats = ref(null)
const statsLoading = ref(false)
const trendLoading = ref(false)
const trendData = ref({
  venueUsage: [],
  materialUsage: [],
  applicationTrends: []
})

// Top 5 数据（热门场地 / 热门物资）
const topData = ref({
  topVenues: [],
  topMaterials: []
})

const venueChartRef = ref(null)
const materialChartRef = ref(null)
const statusChartRef = ref(null)

let venueChart = null
let materialChart = null
let statusChart = null

const canViewTrends = computed(() => userStore.userInfo.role === 'admin')

// 动态定义“今日申请”卡片的文字
const todayApplicationsLabel = computed(() => {
  const role = userStore.userInfo.role
  if (role === 'admin') return '今日申请'
  if (role === 'reviewer') return '今日新增申请'
  return '我的今日申请'
})

// 动态定义“待审批”卡片的文字
const pendingApplicationsLabel = computed(() => {
  const role = userStore.userInfo.role
  if (role === 'admin') return '全站待审批'
  if (role === 'reviewer') return '待我审批'
  return '我的待审批'
})

const totalVenues = computed(() => stats.value?.totalVenues ?? 0)
const totalMaterials = computed(() => stats.value?.totalMaterials ?? 0)
const todayApplications = computed(() => stats.value?.todayApplications ?? 0)
const pendingApplications = computed(() => stats.value?.pendingApplications ?? 0)
const myApplicationStats = computed(() => stats.value?.myApplications ?? {
  total: 0,
  pending_reviewer: 0,
  pending_admin: 0,
  approved: 0,
  rejected: 0,
  cancelled: 0
})

// 系统级申请统计：仅 admin 后端会返回；其他角色为 null
const systemApplicationStats = computed(() => stats.value?.systemApplications ?? {
  total: 0,
  pending_reviewer: 0,
  pending_admin: 0,
  approved: 0,
  rejected: 0,
  cancelled: 0
})

// 概况区：admin 看系统概况，其它角色看我的概况
const overviewTitle = computed(() => (canViewTrends.value ? '系统申请概况' : '我的申请概况'))
const overviewStats = computed(() => (canViewTrends.value ? systemApplicationStats.value : myApplicationStats.value))

const statusLabelMap = {
  pending_reviewer: '待导员审批',
  pending_admin: '待管理员审批',
  approved: '已通过',
  rejected: '已驳回'
}

const personalStatusMeta = [
  { key: 'total', label: '总申请数', type: 'info' },
  { key: 'pending_reviewer', label: '待导员', type: 'warning' },
  { key: 'pending_admin', label: '待管理员', type: 'warning' },
  { key: 'approved', label: '已通过', type: 'success' },
  { key: 'rejected', label: '已驳回', type: 'danger' },
  { key: 'cancelled', label: '已取消', type: 'info' }
]

const fetchStats = async () => {
  statsLoading.value = true
  try {
    stats.value = await getDashboardStats()
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  } finally {
    statsLoading.value = false
  }
}

const fetchTrends = async () => {
  disposeCharts()
  if (!canViewTrends.value) {
    trendData.value = { venueUsage: [], materialUsage: [], applicationTrends: [] }
    topData.value = { topVenues: [], topMaterials: [] }
    return
  }

  trendLoading.value = true
  try {
    // 1) weekly：保留给“审批状态趋势”
    const data = await getDashboardTrends({ type: 'weekly' })
    trendData.value = {
      venueUsage: data?.venueUsage || [],
      materialUsage: data?.materialUsage || [],
      applicationTrends: data?.applicationTrends || []
    }

    // 2) top：给“热门场地/热门物资 Top5”
    const top = await getDashboardTop()
    topData.value = {
      topVenues: top?.topVenues || [],
      topMaterials: top?.topMaterials || []
    }
    await nextTick()
    renderCharts()
  } catch (error) {
    ElMessage.error('获取趋势数据失败')
  } finally {
    trendLoading.value = false
  }
}

const renderCharts = () => {
  initVenueChart()
  initMaterialChart()
  initStatusChart()
}

const initVenueChart = () => {
  if (!venueChartRef.value) return
  if (venueChart) venueChart.dispose()
  
  venueChart = echarts.init(venueChartRef.value)

  const names = topData.value.topVenues.map((i) => i.name)
  const counts = topData.value.topVenues.map((i) => i.count)

  venueChart.setOption({
    grid: { left: 120, right: 24, top: 24, bottom: 24 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    xAxis: {
      type: 'value',
      name: '预约次数'
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: names
    },
    series: [
      {
        name: '预约次数',
        type: 'bar',
        data: counts,
        itemStyle: { color: '#409eff' },
        barMaxWidth: 26
      }
    ]
  })
}

const initMaterialChart = () => {
  if (!materialChartRef.value) return
  if (materialChart) materialChart.dispose()
  
  materialChart = echarts.init(materialChartRef.value)

  const names = topData.value.topMaterials.map((i) => i.name)
  const counts = topData.value.topMaterials.map((i) => i.count)

  materialChart.setOption({
    grid: { left: 120, right: 24, top: 24, bottom: 24 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    xAxis: {
      type: 'value',
      name: '借出件数'
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: names
    },
    series: [
      {
        name: '借出件数',
        type: 'bar',
        data: counts,
        itemStyle: { color: '#67c23a' },
        barMaxWidth: 26
      }
    ]
  })
}

const initStatusChart = () => {
  if (!statusChartRef.value) return
  if (statusChart) statusChart.dispose()
  
  statusChart = echarts.init(statusChartRef.value)
  
  const dates = trendData.value.applicationTrends.map(item => item.date)
  const seriesKeys = Object.keys(statusLabelMap)
  const series = seriesKeys.map((key) => ({
    name: statusLabelMap[key],
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    data: trendData.value.applicationTrends.map(item => item[key] || 0)
  }))

  statusChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value',
      name: '申请数'
    },
    series
  })
}

const disposeCharts = () => {
  if (venueChart) {
    venueChart.dispose()
    venueChart = null
  }
  if (materialChart) {
    materialChart.dispose()
    materialChart = null
  }
  if (statusChart) {
    statusChart.dispose()
    statusChart = null
          }
        }

const handleResize = () => {
  if (venueChart) venueChart.resize()
  if (materialChart) materialChart.resize()
  if (statusChart) statusChart.resize()
}

const getRoleText = () => {
  const roleMap = {
    admin: '系统管理员',
    reviewer: '导员',
    teacher: '老师',
    user: '普通用户'
  }
  return roleMap[userStore.userInfo.role] || '未知角色'
}

const getRoleTagType = () => {
  const typeMap = {
    admin: 'danger',
    reviewer: 'warning',
    teacher: 'primary',
    user: 'info'
  }
  return typeMap[userStore.userInfo.role] || 'info'
}

onMounted(() => {
  fetchStats()
  fetchTrends()
  window.addEventListener('resize', handleResize)
})

watch(canViewTrends, () => {
  fetchTrends()
})

onBeforeUnmount(() => {
  disposeCharts()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.welcome-card {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.welcome-content {
  padding: 20px;
}

.welcome-content h2 {
  margin: 0 0 10px 0;
  font-size: 28px;
}

.welcome-content p {
  margin: 0;
  font-size: 16px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 10px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 15px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.card-header {
  font-size: 16px;
  font-weight: bold;
}

.my-app-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .welcome-content h2 {
    font-size: 22px;
  }
  
  .welcome-content p {
    font-size: 14px;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
  }
  
  .stat-icon :deep(.el-icon) {
    font-size: 24px !important;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  /* 在小屏幕上，图表卡片添加上边距 */
  .chart-col-mobile {
    margin-top: 20px;
  }
  
  /* 统计卡片在小屏幕上添加底部间距 */
  .stat-card {
    margin-bottom: 15px;
  }
}

@media (max-width: 480px) {
  .welcome-content h2 {
    font-size: 18px;
  }
  
  .welcome-content p {
    font-size: 12px;
  }
  
  .stat-content {
    padding: 5px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    margin-right: 10px;
  }
  
  .stat-icon :deep(.el-icon) {
    font-size: 20px !important;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .stat-label {
    font-size: 11px;
  }
  
  .card-header {
    font-size: 14px;
  }
}
</style>

