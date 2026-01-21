<template>
  <div class="user-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>用户管理（只读）</span>
            <el-tag type="info" style="margin-left: 10px">教务中心同步 · 本页仅展示</el-tag>
          </div>

          <div class="header-actions">
            <el-select
              v-model="roleFilter"
              placeholder="按角色筛选"
              clearable
              style="width: 180px"
              @change="handleRoleChange"
            >
              <el-option label="管理员" value="admin" />
              <el-option label="导员" value="reviewer" />
              <el-option label="老师" value="teacher" />
              <el-option label="学生/普通用户" value="user" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="users" stripe border style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="账号" min-width="140" />
        <el-table-column prop="realName" label="姓名" min-width="140" />
        <el-table-column label="角色" width="140">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)">
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="180">
          <template #default="{ row }">
            <span>{{ formatDateTime(row.createdAt) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && users.length === 0" description="暂无用户数据" />

      <div class="table-pagination" v-if="!loading && total > 0">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="total"
          :page-size="pagination.size"
          :current-page="pagination.page"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUsers } from '@/api/users'
import { formatShanghaiDateTime as formatDateTime } from '@/utils/datetime'

const loading = ref(false)
const users = ref([])
const total = ref(0)

const pagination = reactive({
  page: 1,
  size: 20
})

const roleFilter = ref('')

const fetchUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size
    }
    if (roleFilter.value) params.role = roleFilter.value

    const data = await getUsers(params)
    users.value = data.list || []
    total.value = data.total || 0
  } catch (e) {
    ElMessage.error('加载用户列表失败')
    users.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchUsers()
}

const handleRoleChange = () => {
  pagination.page = 1
  fetchUsers()
}

const getRoleText = (role) => {
  const map = {
    admin: '管理员',
    reviewer: '导员',
    teacher: '老师',
    user: '学生/普通用户'
  }
  return map[role] || '未知'
}

// 你要求的颜色语义：
// 学生 user：灰/蓝；老师 teacher：绿；导员 reviewer：橙；管理员 admin：红
const getRoleTagType = (role) => {
  const map = {
    admin: 'danger',
    reviewer: 'warning',
    teacher: 'success',
    user: 'info'
  }
  return map[role] || 'info'
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 18px;
  font-weight: bold;
}

.header-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
