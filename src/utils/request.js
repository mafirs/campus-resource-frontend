import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store/user'

const DEFAULT_API_BASE_URL = 'https://tlrfzzmcbmzm.sealoshzh.site/api'

const resolveBaseUrl = () => {
  const raw = import.meta.env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
  return raw.endsWith('/') ? raw : `${raw}/`
}

const request = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000
})

request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
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

request.interceptors.response.use(
  (response) => {
    const payload = response.data

    if (payload && typeof payload === 'object' && 'code' in payload) {
      if (payload.code !== 200) {
        const message = payload.message || '请求失败'
        ElMessage.error(message)
        return Promise.reject(new Error(message))
      }
      return payload.data
    }

    return payload
  },
  (error) => {
    const userStore = useUserStore()

    if (error.response) {
      const { status, data } = error.response
      const message = data?.message || error.message || '请求失败'

      if (status === 401) {
        ElMessage.error('登录已过期，请重新登录')
        userStore.logout()
      } else if (status === 403) {
        ElMessage.error('没有权限访问该资源')
      } else if (status === 404) {
        ElMessage.error('请求的资源不存在')
      } else if (status >= 500) {
        ElMessage.error('服务器错误，请稍后重试')
      } else {
        ElMessage.error(message)
      }
    } else {
      ElMessage.error('网络错误，请检查您的网络连接')
    }

    return Promise.reject(error)
  }
)

export default request

