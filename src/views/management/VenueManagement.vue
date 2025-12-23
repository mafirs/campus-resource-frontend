<template>
  <div class="venue-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>场地管理</span>
          <div class="header-buttons">
            <el-button type="success" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出 Excel
            </el-button>
            <el-button type="primary" @click="handleAdd">新增场地</el-button>
          </div>
        </div>
      </template>

      <el-table :data="venueList" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="场地名称" min-width="150" />
        <el-table-column prop="location" label="位置" min-width="120" />
        <el-table-column prop="capacity" label="容量" width="100" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === '开放预约' ? 'success' : 'warning'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
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
        ref="venueFormRef"
        :model="venueForm"
        :rules="venueRules"
        label-width="100px"
      >
        <el-form-item label="场地名称" prop="name">
          <el-input
            v-model="venueForm.name"
            placeholder="请输入场地名称"
            clearable
          />
        </el-form-item>

        <el-form-item label="位置" prop="location">
          <el-input
            v-model="venueForm.location"
            placeholder="请输入位置"
            clearable
          />
        </el-form-item>

        <el-form-item label="容量" prop="capacity">
          <el-input-number
            v-model="venueForm.capacity"
            :min="1"
            :max="10000"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select
            v-model="venueForm.status"
            placeholder="请选择状态"
            style="width: 100%"
          >
            <el-option label="开放预约" value="开放预约" />
            <el-option label="维修中" value="维修中" />
          </el-select>
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
import { venueList } from '@/mock/data.js'
import { exportToExcelWithColumns } from '@/utils/export.js'

// 对话框相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentEditId = ref(null)

// 表单数据
const venueFormRef = ref(null)
const venueForm = reactive({
  name: '',
  location: '',
  capacity: 1,
  status: '开放预约'
})

// 表单验证规则
const venueRules = {
  name: [
    { required: true, message: '请输入场地名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  location: [
    { required: true, message: '请输入位置', trigger: 'blur' }
  ],
  capacity: [
    { required: true, message: '请输入容量', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 对话框标题
const dialogTitle = computed(() => {
  return isEdit.value ? '编辑场地' : '新增场地'
})

// 重置表单
const resetForm = () => {
  venueForm.name = ''
  venueForm.location = ''
  venueForm.capacity = 1
  venueForm.status = '开放预约'
  if (venueFormRef.value) {
    venueFormRef.value.clearValidate()
  }
}

// 新增场地
const handleAdd = () => {
  isEdit.value = false
  currentEditId.value = null
  resetForm()
  dialogVisible.value = true
}

// 编辑场地
const handleEdit = (row) => {
  isEdit.value = true
  currentEditId.value = row.id
  
  // 填充表单数据
  venueForm.name = row.name
  venueForm.location = row.location
  venueForm.capacity = row.capacity
  venueForm.status = row.status
  
  dialogVisible.value = true
}

// 删除场地
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `是否确认删除场地"${row.name}"？`,
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 从数组中删除
    const index = venueList.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      venueList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!venueFormRef.value) return
  
  await venueFormRef.value.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        // 编辑模式：更新数据
        const index = venueList.value.findIndex(item => item.id === currentEditId.value)
        if (index !== -1) {
          venueList.value[index] = {
            id: currentEditId.value,
            name: venueForm.name,
            location: venueForm.location,
            capacity: venueForm.capacity,
            status: venueForm.status
          }
          ElMessage.success('编辑成功')
        }
      } else {
        // 新增模式：添加数据
        const newId = Math.max(...venueList.value.map(item => item.id)) + 1
        venueList.value.push({
          id: newId,
          name: venueForm.name,
          location: venueForm.location,
          capacity: venueForm.capacity,
          status: venueForm.status
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
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: '场地名称' },
    { key: 'location', label: '位置' },
    { key: 'capacity', label: '容量' },
    { key: 'status', label: '状态' }
  ]
  
  const success = exportToExcelWithColumns(venueList.value, columns, '场地列表')
  if (success) {
    ElMessage.success('导出成功')
  } else {
    ElMessage.error('导出失败')
  }
}
</script>

<style scoped>
.venue-management {
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

