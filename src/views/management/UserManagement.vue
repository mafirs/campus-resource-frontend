<template>
  <div class="user-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <div class="header-buttons">
            <el-button type="success" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出 Excel
            </el-button>
            <el-button type="primary" @click="handleAdd">新增用户</el-button>
          </div>
        </div>
      </template>

      <el-table :data="userList" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)">
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="department" label="所属部门" min-width="150" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="userForm.username"
            placeholder="请输入用户名"
            :disabled="isEdit"
            clearable
          />
        </el-form-item>

        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input
            v-model="userForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item label="角色" prop="role">
          <el-select
            v-model="userForm.role"
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option label="系统管理员" value="admin" />
            <el-option label="审核员" value="reviewer" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>

        <el-form-item label="所属部门" prop="department">
          <el-input
            v-model="userForm.department"
            placeholder="请输入所属部门"
            clearable
          />
        </el-form-item>

        <el-form-item label="联系电话" prop="phone">
          <el-input
            v-model="userForm.phone"
            placeholder="请输入联系电话"
            clearable
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { userList } from '@/mock/data.js'
import { exportToExcelWithColumns } from '@/utils/export.js'

// 对话框相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentEditId = ref(null)

// 表单数据
const userFormRef = ref(null)
const userForm = reactive({
  username: '',
  password: '',
  role: '',
  department: '',
  phone: ''
})

// 表单验证规则
const userRules = computed(() => ({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: isEdit.value ? [] : [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  department: [
    { required: true, message: '请输入所属部门', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}))

// 对话框标题
const dialogTitle = computed(() => {
  return isEdit.value ? '编辑用户' : '新增用户'
})

// 获取角色文本
const getRoleText = (role) => {
  const roleMap = {
    admin: '系统管理员',
    reviewer: '审核员',
    user: '普通用户'
  }
  return roleMap[role] || '未知角色'
}

// 获取角色标签类型
const getRoleTagType = (role) => {
  const typeMap = {
    admin: 'danger',
    reviewer: 'warning',
    user: 'success'
  }
  return typeMap[role] || 'info'
}

// 重置表单
const resetForm = () => {
  userForm.username = ''
  userForm.password = ''
  userForm.role = ''
  userForm.department = ''
  userForm.phone = ''
  if (userFormRef.value) {
    userFormRef.value.clearValidate()
  }
}

// 新增用户
const handleAdd = () => {
  isEdit.value = false
  currentEditId.value = null
  resetForm()
  dialogVisible.value = true
}

// 编辑用户
const handleEdit = (row) => {
  isEdit.value = true
  currentEditId.value = row.id
  
  // 填充表单数据
  userForm.username = row.username
  userForm.role = row.role
  userForm.department = row.department
  userForm.phone = row.phone
  
  dialogVisible.value = true
}

// 删除用户
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `是否确认删除用户"${row.username}"？`,
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 从数组中删除
    const index = userList.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      userList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!userFormRef.value) return
  
  await userFormRef.value.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        // 编辑模式：更新数据
        const index = userList.value.findIndex(item => item.id === currentEditId.value)
        if (index !== -1) {
          userList.value[index] = {
            id: currentEditId.value,
            username: userForm.username,
            role: userForm.role,
            department: userForm.department,
            phone: userForm.phone
          }
          ElMessage.success('编辑成功')
        }
      } else {
        // 新增模式：添加数据
        const newId = Math.max(...userList.value.map(item => item.id)) + 1
        userList.value.push({
          id: newId,
          username: userForm.username,
          role: userForm.role,
          department: userForm.department,
          phone: userForm.phone
        })
        ElMessage.success('新增成功')
      }
      
      dialogVisible.value = false
      resetForm()
    }
  })
}

// 对话框关闭时重置表单
const handleDialogClose = () => {
  resetForm()
}

// 导出 Excel
const handleExport = () => {
  // 转换角色为中文
  const exportData = userList.value.map(user => ({
    id: user.id,
    username: user.username,
    role: getRoleText(user.role),
    department: user.department,
    phone: user.phone
  }))
  
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'username', label: '用户名' },
    { key: 'role', label: '角色' },
    { key: 'department', label: '所属部门' },
    { key: 'phone', label: '联系电话' }
  ]
  
  const success = exportToExcelWithColumns(exportData, columns, '用户列表')
  if (success) {
    ElMessage.success('导出成功')
  } else {
    ElMessage.error('导出失败')
  }
}
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.header-buttons {
  display: flex;
  gap: 10px;
}
</style>

