<template>
  <div class="placeholder-view">
    <el-card>
      <el-empty description="此页面功能待开发">
        <el-button type="primary" @click="goBack">返回</el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.placeholder-view {
  padding: 20px;
}
</style>

