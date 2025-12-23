<template>
  <div class="application-form">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>发起申请</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-width="120px"
        style="max-width: 800px"
      >
        <!-- 活动信息 -->
        <el-divider content-position="left">
          <el-icon><InfoFilled /></el-icon>
          活动信息
        </el-divider>

        <el-form-item label="活动名称" prop="activity_name">
          <el-input
            v-model="formModel.activity_name"
            placeholder="请输入活动名称"
            clearable
          />
        </el-form-item>

        <!-- 场地预约 -->
        <el-divider content-position="left">
          <el-icon><OfficeBuilding /></el-icon>
          场地预约
        </el-divider>

        <el-form-item label="预约场地" prop="venue_id">
          <el-select
            v-model="formModel.venue_id"
            placeholder="请选择场地"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="venue in availableVenues"
              :key="venue.id"
              :label="`${venue.name} (${venue.location}, 容量${venue.capacity})`"
              :value="venue.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="预约时间" prop="time_range">
          <el-date-picker
            v-model="formModel.time_range"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 物资借用 -->
        <el-divider content-position="left">
          <el-icon><Box /></el-icon>
          物资借用
        </el-divider>

        <el-form-item>
          <div style="width: 100%">
            <div
              v-for="(item, index) in formModel.requested_materials"
              :key="index"
              style="display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start"
            >
              <el-form-item
                :prop="`requested_materials.${index}.material_id`"
                :rules="[{ required: true, message: '请选择物资', trigger: 'change' }]"
                style="flex: 1; margin-bottom: 0"
              >
                <el-select
                  v-model="item.material_id"
                  placeholder="请选择物资"
                  style="width: 100%"
                  clearable
                >
                  <el-option
                    v-for="material in materialList"
                    :key="material.id"
                    :label="`${material.name} (库存${material.total_stock})`"
                    :value="material.id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item
                :prop="`requested_materials.${index}.quantity`"
                :rules="[{ required: true, message: '请输入数量', trigger: 'blur' }]"
                style="width: 150px; margin-bottom: 0"
              >
                <el-input-number
                  v-model="item.quantity"
                  :min="1"
                  :max="10000"
                  placeholder="数量"
                  style="width: 100%"
                />
              </el-form-item>

              <el-button
                type="danger"
                :icon="Delete"
                circle
                @click="removeMaterial(index)"
              />
            </div>

            <el-button
              type="primary"
              :icon="Plus"
              @click="addMaterial"
              style="width: 100%"
            >
              添加物资
            </el-button>
          </div>
        </el-form-item>

        <!-- 提交按钮 -->
        <el-form-item>
          <el-button type="primary" size="large" @click="handleSubmit">
            提交申请
          </el-button>
          <el-button size="large" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user.js'
import { venueList, materialList, applicationList } from '@/mock/data.js'
import { ElMessage } from 'element-plus'
import { InfoFilled, OfficeBuilding, Box, Plus, Delete } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)

// 表单数据
const formModel = reactive({
  activity_name: '',
  venue_id: null,
  time_range: [],
  requested_materials: []
})

// 表单验证规则
const formRules = {
  activity_name: [
    { required: true, message: '请输入活动名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  venue_id: [
    { required: true, message: '请选择场地', trigger: 'change' }
  ],
  time_range: [
    { required: true, message: '请选择预约时间', trigger: 'change' }
  ]
}

// 可用场地（只显示开放预约的场地）
const availableVenues = computed(() => {
  return venueList.value.filter(venue => venue.status === '开放预约')
})

// 添加物资
const addMaterial = () => {
  formModel.requested_materials.push({
    material_id: null,
    quantity: 1
  })
}

// 删除物资
const removeMaterial = (index) => {
  formModel.requested_materials.splice(index, 1)
}

// 重置表单
const handleReset = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  formModel.requested_materials = []
}

// 提交申请
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      // 处理物资数据，添加物资名称
      const processedMaterials = formModel.requested_materials.map(item => {
        const material = materialList.value.find(m => m.id === item.material_id)
        return {
          material_id: item.material_id,
          name: material ? material.name : '未知物资',
          quantity: item.quantity
        }
      })

      // 生成新的申请ID
      const newId = applicationList.value.length > 0
        ? Math.max(...applicationList.value.map(app => app.id)) + 1
        : 1

      // 创建新申请对象
      const newApplication = {
        id: newId,
        activity_name: formModel.activity_name,
        applicant_username: userStore.userInfo.username,
        venue_id: formModel.venue_id,
        start_time: formModel.time_range[0],
        end_time: formModel.time_range[1],
        status: '待审核',
        requested_materials: processedMaterials
      }

      // 添加到全局申请列表
      applicationList.value.push(newApplication)

      // 显示成功提示
      ElMessage.success('申请提交成功！')

      // 跳转到"我的申请"页面
      router.push('/apply/my-list')
    } else {
      ElMessage.error('请填写完整的申请信息')
    }
  })
}
</script>

<style scoped>
.application-form {
  padding: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

:deep(.el-divider__text) {
  font-size: 16px;
  font-weight: 600;
}
</style>

