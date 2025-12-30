<template>
  <div class="user-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
        </div>
      </template>

      <el-result
        icon="info"
        title="暂未开放"
        sub-title="后端服务未提供用户管理接口，如需管理用户请直接联系系统管理员或使用后端脚本。"
      >
        <template #extra>
          <el-button type="primary" @click="$router.push('/dashboard')">
            返回首页
          </el-button>
        </template>
      </el-result>
    </el-card>
  </div>
</template>

<script setup>
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}
</style>

