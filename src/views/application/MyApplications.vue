<template>
  <div class="my-applications">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的申请</span>
          <el-button type="primary" @click="goToApply">发起新申请</el-button>
        </div>
      </template>

      <el-table :data="myApplications" stripe border style="width: 100%">
        <el-table-column prop="id" label="申请ID" width="80" />
        <el-table-column prop="activity_name" label="活动名称" min-width="150" />
        <el-table-column prop="venue_name" label="场地名称" min-width="120" />
        <el-table-column prop="start_time" label="开始时间" width="180" />
        <el-table-column prop="end_time" label="结束时间" width="180" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="借用物资" min-width="200">
          <template #default="{ row }">
            <div v-if="row.requested_materials.length > 0">
              <el-tag
                v-for="(item, index) in row.requested_materials"
                :key="index"
                size="small"
                style="margin: 2px"
              >
                {{ item.name }} × {{ item.quantity }}
              </el-tag>
            </div>
            <span v-else style="color: #909399">无</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="canCancel(row.status)"
              type="danger"
              link
              @click="handleCancel(row)"
            >
              取消申请
            </el-button>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="myApplications.length === 0" description="暂无申请记录" />
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user.js'
import { applicationList, venueList } from '@/mock/data.js'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

// 计算属性：过滤出当前用户的申请，并添加场地名称
const myApplications = computed(() => {
  const currentUsername = userStore.userInfo.username
  
  return applicationList.value
    .filter(app => app.applicant_username === currentUsername)
    .map(app => {
      // 查找对应的场地名称
      const venue = venueList.value.find(v => v.id === app.venue_id)
      return {
        ...app,
        venue_name: venue ? venue.name : '未知场地'
      }
    })
})

// 获取状态标签类型
const getStatusType = (status) => {
  const typeMap = {
    '待审核': 'primary',
    '已通过': 'success',
    '未通过': 'danger',
    '已取消': 'info'
  }
  return typeMap[status] || 'info'
}

// 判断是否可以取消申请
const canCancel = (status) => {
  return status === '待审核' || status === '已通过'
}

// 取消申请
const handleCancel = (row) => {
  ElMessageBox.confirm(
    `是否确认取消申请"${row.activity_name}"？`,
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 找到对应的申请并修改状态
    const application = applicationList.value.find(app => app.id === row.id)
    if (application) {
      application.status = '已取消'
      ElMessage.success('申请已取消')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

// 跳转到发起申请页面
const goToApply = () => {
  router.push('/apply/new')
}
</script>

<style scoped>
.my-applications {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}
</style>

