<template>
  <div class="dashboard">
    <el-card class="welcome-card">
      <div class="welcome-content">
        <h2>欢迎，{{ userStore.userInfo.username }}！</h2>
        <p>当前角色：<el-tag :type="getRoleTagType()">{{ getRoleText() }}</el-tag></p>
      </div>
    </el-card>

    <!-- 数据统计卡片 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409eff">
              <el-icon :size="32"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ venueList.length }}</div>
              <div class="stat-label">场地总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon :size="32"><Box /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ materialList.length }}</div>
              <div class="stat-label">物资种类</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon :size="32"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalApplications }}</div>
              <div class="stat-label">申请总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon :size="32"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ pendingApplications }}</div>
              <div class="stat-label">待审批</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>热门场地使用率</span>
            </div>
          </template>
          <div ref="venueChartRef" style="width: 100%; height: 400px"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" class="chart-col-mobile">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>热门物资借用统计</span>
            </div>
          </template>
          <div ref="materialChartRef" style="width: 100%; height: 400px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 申请状态统计 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>申请状态分布</span>
            </div>
          </template>
          <div ref="statusChartRef" style="width: 100%; height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/store/user'
import { applicationList, venueList, materialList } from '@/mock/data.js'
import * as echarts from 'echarts'
import { OfficeBuilding, Box, Document, Clock } from '@element-plus/icons-vue'

const userStore = useUserStore()

// 图表 ref
const venueChartRef = ref(null)
const materialChartRef = ref(null)
const statusChartRef = ref(null)

// 图表实例
let venueChart = null
let materialChart = null
let statusChart = null

// 统计数据
const totalApplications = computed(() => applicationList.value.length)
const pendingApplications = computed(() => {
  return applicationList.value.filter(app => app.status === '待审核').length
})

// 场地使用率统计
const venueUsageStats = computed(() => {
  // 统计已通过的申请
  const approvedApps = applicationList.value.filter(app => app.status === '已通过')
  
  // 按 venue_id 分组统计
  const venueCount = {}
  approvedApps.forEach(app => {
    venueCount[app.venue_id] = (venueCount[app.venue_id] || 0) + 1
  })
  
  // 转换为 ECharts 饼图格式
  return Object.entries(venueCount).map(([venueId, count]) => {
    const venue = venueList.value.find(v => v.id === parseInt(venueId))
    return {
      value: count,
      name: venue ? venue.name : '未知场地'
    }
  })
})

// 物资借用统计
const materialUsageStats = computed(() => {
  // 统计已通过的申请中的物资
  const approvedApps = applicationList.value.filter(app => app.status === '已通过')
  
  // 汇总物资借用数量
  const materialCount = {}
  approvedApps.forEach(app => {
    app.requested_materials.forEach(item => {
      materialCount[item.material_id] = (materialCount[item.material_id] || 0) + item.quantity
    })
  })
  
  // 转换为 ECharts 柱状图格式
  const names = []
  const values = []
  Object.entries(materialCount).forEach(([materialId, count]) => {
    const material = materialList.value.find(m => m.id === parseInt(materialId))
    names.push(material ? material.name : '未知物资')
    values.push(count)
  })
  
  return { names, values }
})

// 申请状态统计
const statusStats = computed(() => {
  const statusCount = {
    '待审核': 0,
    '已通过': 0,
    '未通过': 0,
    '已取消': 0
  }
  
  applicationList.value.forEach(app => {
    if (statusCount[app.status] !== undefined) {
      statusCount[app.status]++
    }
  })
  
  return Object.entries(statusCount).map(([name, value]) => ({ name, value }))
})

// 初始化场地使用率饼图
const initVenueChart = () => {
  if (!venueChartRef.value) return
  
  venueChart = echarts.init(venueChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        name: '场地使用次数',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: venueUsageStats.value
      }
    ]
  }
  
  venueChart.setOption(option)
}

// 初始化物资借用柱状图
const initMaterialChart = () => {
  if (!materialChartRef.value) return
  
  materialChart = echarts.init(materialChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: materialUsageStats.value.names,
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      name: '借用数量'
    },
    series: [
      {
        name: '借用数量',
        type: 'bar',
        data: materialUsageStats.value.values,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#2378f7' },
              { offset: 0.7, color: '#2378f7' },
              { offset: 1, color: '#83bff6' }
            ])
          }
        }
      }
    ]
  }
  
  materialChart.setOption(option)
}

// 初始化申请状态饼图
const initStatusChart = () => {
  if (!statusChartRef.value) return
  
  statusChart = echarts.init(statusChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      bottom: 10,
      left: 'center'
    },
    series: [
      {
        name: '申请状态',
        type: 'pie',
        radius: '60%',
        center: ['50%', '45%'],
        data: statusStats.value,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ],
    color: ['#409eff', '#67c23a', '#f56c6c', '#909399']
  }
  
  statusChart.setOption(option)
}

// 获取角色文本
const getRoleText = () => {
  const roleMap = {
    admin: '系统管理员',
    reviewer: '审核员',
    user: '普通用户'
  }
  return roleMap[userStore.userInfo.role] || '未知角色'
}

// 获取角色标签类型
const getRoleTagType = () => {
  const typeMap = {
    admin: 'danger',
    reviewer: 'warning',
    user: 'success'
  }
  return typeMap[userStore.userInfo.role] || 'info'
}

// 组件挂载时初始化图表
onMounted(() => {
  initVenueChart()
  initMaterialChart()
  initStatusChart()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

// 组件卸载时销毁图表
onBeforeUnmount(() => {
  if (venueChart) venueChart.dispose()
  if (materialChart) materialChart.dispose()
  if (statusChart) statusChart.dispose()
  window.removeEventListener('resize', handleResize)
})

// 处理窗口大小变化
const handleResize = () => {
  if (venueChart) venueChart.resize()
  if (materialChart) materialChart.resize()
  if (statusChart) statusChart.resize()
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
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
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
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

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard {
    padding: 15px;
  }
  
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
  .dashboard {
    padding: 10px;
  }
  
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
