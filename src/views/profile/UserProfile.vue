<template>
  <div class="user-profile">
    <el-row :gutter="20">
      <!-- 个人信息卡片 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
            </div>
          </template>

          <div class="profile-avatar">
            <el-avatar :size="100" style="background-color: #409eff;">
              {{ userStore.userInfo.username.charAt(0).toUpperCase() }}
            </el-avatar>
          </div>

          <el-descriptions :column="1" border style="margin-top: 20px">
            <el-descriptions-item label="用户名">
              {{ userInfo.username || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="姓名">
              {{ userInfo.realName || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="角色">
              <el-tag :type="getRoleTagType()">
                {{ getRoleText() }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="邮箱">
              {{ userInfo.email || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="账号状态">
              <el-tag :type="userInfo.status === 'active' ? 'success' : 'danger'">
                {{ userInfo.status === 'active' ? '正常' : '已禁用' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 修改密码卡片 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>修改密码</span>
            </div>
          </template>

          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
          >
            <el-form-item label="原密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="请输入原密码"
                show-password
                clearable
              />
            </el-form-item>

            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                show-password
                clearable
              />
            </el-form-item>

            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password
                clearable
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleChangePassword">
                提交修改
              </el-button>
              <el-button @click="handleResetForm">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 账号安全提示 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>安全提示</span>
        </div>
      </template>

      <el-alert
        title="账号安全建议"
        type="info"
        :closable="false"
        show-icon
      >
        <ul style="margin: 10px 0; padding-left: 20px">
          <li>定期修改密码，建议每3个月更换一次</li>
          <li>密码长度建议在8位以上，包含字母、数字和特殊字符</li>
          <li>不要使用过于简单的密码，如生日、手机号等</li>
          <li>不要在多个平台使用相同的密码</li>
          <li>发现账号异常请及时联系管理员</li>
        </ul>
      </el-alert>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const passwordFormRef = ref(null)

const userInfo = computed(() => userStore.userInfo || {})

onMounted(() => {
  if (userStore.token) {
    userStore.ensureProfile().catch(() => {
      // ignore fetch errors (handled globally)
    })
  }
})

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 自定义验证：确认密码必须与新密码一致
const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 密码表单验证规则
const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
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

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate((valid) => {
    if (valid) {
      // Mock 环境：不真实验证原密码，只检查新密码一致性
      ElMessage.success('密码修改成功！（演示环境未接入后端接口）')
      handleResetForm()
    }
  })
}

// 重置表单
const handleResetForm = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  if (passwordFormRef.value) {
    passwordFormRef.value.clearValidate()
  }
}
</script>

<style scoped>
.user-profile {
  padding: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.profile-avatar {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

ul {
  line-height: 1.8;
}

ul li {
  margin: 8px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-profile {
    padding: 15px;
  }
  
  .card-header {
    font-size: 16px;
  }
  
  .profile-avatar {
    padding: 15px 0;
  }
  
  /* 在小屏幕上，修改密码卡片添加上边距 */
  .user-profile :deep(.el-col:nth-child(2)) {
    margin-top: 20px;
  }
}

@media (max-width: 480px) {
  .user-profile {
    padding: 10px;
  }
  
  .card-header {
    font-size: 14px;
  }
  
  ul {
    font-size: 13px;
  }
}
</style>

