<template>
  <div class="approval-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>待我审批</span>
          <el-tag type="primary">{{ pendingApplications.length }} 条待审批</el-tag>
        </div>
      </template>

      <el-table :data="pendingApplications" stripe border style="width: 100%">
        <!-- 展开行 -->
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-content">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="活动名称" :span="2">
                  <el-tag type="primary" size="large">{{ row.activity_name }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="申请人">
                  {{ row.applicant_username }}
                </el-descriptions-item>
                <el-descriptions-item label="场地">
                  {{ row.venue_name }}
                </el-descriptions-item>
                <el-descriptions-item label="开始时间">
                  {{ row.start_time }}
                </el-descriptions-item>
                <el-descriptions-item label="结束时间">
                  {{ row.end_time }}
                </el-descriptions-item>
                <el-descriptions-item label="借用物资" :span="2">
                  <div v-if="row.requested_materials.length > 0" class="materials-list">
                    <el-table :data="row.requested_materials" size="small" border>
                      <el-table-column prop="name" label="物资名称" width="200" />
                      <el-table-column prop="quantity" label="借用数量" width="120">
                        <template #default="{ row: material }">
                          <el-tag size="small">{{ material.quantity }}</el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column label="库存状态" width="150">
                        <template #default="{ row: material }">
                          <el-tag
                            :type="getStockStatus(material.material_id, material.quantity).type"
                            size="small"
                          >
                            {{ getStockStatus(material.material_id, material.quantity).text }}
                          </el-tag>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                  <span v-else style="color: #909399">无</span>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="id" label="申请ID" width="80" />
        <el-table-column prop="activity_name" label="活动名称" min-width="150" />
        <el-table-column prop="applicant_username" label="申请人" width="120" />
        <el-table-column prop="venue_name" label="场地名称" min-width="120" />
        <el-table-column prop="start_time" label="申请时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="success"
              size="small"
              @click="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleReject(row)"
            >
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-if="pendingApplications.length === 0"
        description="暂无待审批的申请"
      />
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { applicationList, venueList, materialList, notificationList } from '@/mock/data.js'
import { ElMessage, ElMessageBox } from 'element-plus'

// 计算属性：过滤待审核的申请，并添加场地名称
const pendingApplications = computed(() => {
  return applicationList.value
    .filter(app => app.status === '待审核')
    .map(app => {
      // 查找对应的场地名称
      const venue = venueList.value.find(v => v.id === app.venue_id)
      return {
        ...app,
        venue_name: venue ? venue.name : '未知场地'
      }
    })
})

// 获取物资库存状态
const getStockStatus = (materialId, requestedQuantity) => {
  const material = materialList.value.find(m => m.id === materialId)
  if (!material) {
    return { type: 'info', text: '未知物资' }
  }

  const stock = material.total_stock
  if (requestedQuantity > stock) {
    return { type: 'danger', text: `库存不足 (仅剩${stock})` }
  } else if (requestedQuantity > stock * 0.8) {
    return { type: 'warning', text: `库存紧张 (剩余${stock})` }
  } else {
    return { type: 'success', text: `库存充足 (剩余${stock})` }
  }
}

// 通过申请
const handleApprove = (row) => {
  ElMessageBox.confirm(
    `确认通过"${row.activity_name}"的申请吗？`,
    '审批确认',
    {
      confirmButtonText: '确认通过',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(() => {
    // 找到对应的申请并修改状态
    const application = applicationList.value.find(app => app.id === row.id)
    if (application) {
      application.status = '已通过'
      
      // 创建通知
      notificationList.value.push({
        id: Date.now(),
        recipient: application.applicant_username,
        message: `您的申请 [${application.activity_name}] 已被通过`,
        time: new Date().toLocaleString(),
        read: false
      })
      
      ElMessage.success('审批通过')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

// 驳回申请
const handleReject = (row) => {
  ElMessageBox.prompt(
    '请输入驳回理由',
    '驳回申请',
    {
      confirmButtonText: '确认驳回',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入驳回理由（必填）',
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return '驳回理由不能为空'
        }
        return true
      }
    }
  ).then(({ value }) => {
    // 找到对应的申请并修改状态
    const application = applicationList.value.find(app => app.id === row.id)
    if (application) {
      application.status = '未通过'
      // 存储驳回理由
      application.reject_reason = value
      
      // 创建通知
      notificationList.value.push({
        id: Date.now(),
        recipient: application.applicant_username,
        message: `您的申请 [${application.activity_name}] 已被驳回，理由：${value}`,
        time: new Date().toLocaleString(),
        read: false
      })
      
      ElMessage.warning('申请已驳回')
    }
  }).catch(() => {
    // 用户取消操作
  })
}
</script>

<style scoped>
.approval-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.expand-content {
  padding: 20px;
  background-color: #f5f7fa;
}

.materials-list {
  margin-top: 10px;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}
</style>

