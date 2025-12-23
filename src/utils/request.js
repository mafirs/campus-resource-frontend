import axios from 'axios'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'

// Create axios instance
const request = axios.create({
  baseURL: '/api', // Base URL for API requests
  timeout: 10000 // Request timeout
})

// Request interceptor
request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    
    // Add token to request headers if it exists
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
request.interceptors.response.use(
  (response) => {
    // Return response data directly
    return response.data
  },
  (error) => {
    const userStore = useUserStore()
    
    // Handle different error status codes
    if (error.response) {
      const { status } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - force logout
          ElMessage.error('登录已过期，请重新登录')
          userStore.logout()
          break
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(error.response.data?.message || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查您的网络连接')
    }
    
    return Promise.reject(error)
  }
)

export default request

