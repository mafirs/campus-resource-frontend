import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '../router'
import { login as loginApi, logout as logoutApi, getProfile } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const storedInfo = localStorage.getItem('userInfo')
  const userInfo = ref(storedInfo ? JSON.parse(storedInfo) : {})
  const profileLoaded = ref(!!storedInfo)

  const isLoggedIn = computed(() => !!token.value)

  const persistSession = () => {
    if (token.value) {
      localStorage.setItem('token', token.value)
    } else {
      localStorage.removeItem('token')
    }

    if (userInfo.value && Object.keys(userInfo.value).length > 0) {
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    } else {
      localStorage.removeItem('userInfo')
    }
  }

  const login = async (loginForm) => {
    const data = await loginApi(loginForm)
    token.value = data.token
    userInfo.value = data.user
    profileLoaded.value = true
    persistSession()
    return data.user
  }

  const fetchProfile = async () => {
    if (!token.value) return null
    const profile = await getProfile()
    userInfo.value = profile
    profileLoaded.value = true
    persistSession()
    return profile
  }

  const ensureProfile = async () => {
    if (!token.value) {
      profileLoaded.value = false
      return null
    }

    if (!profileLoaded.value) {
      try {
        return await fetchProfile()
      } catch (error) {
        await logout()
        throw error
      }
    }

    return userInfo.value
  }

  const logout = async () => {
    try {
      if (token.value) {
        await logoutApi()
      }
    } catch (error) {
      // ignore logout API errors
    } finally {
      token.value = ''
      userInfo.value = {}
      profileLoaded.value = false
      persistSession()
      if (router.currentRoute.value.path !== '/login') {
    router.push('/login')
      }
      // 刷新页面以确保状态完全清除
      window.location.reload()
    }
  }

  const loadUserFromStorage = () => {
    const storedToken = localStorage.getItem('token')
    const storedUserInfo = localStorage.getItem('userInfo')

    if (storedToken) {
      token.value = storedToken
    }
    if (storedUserInfo) {
      try {
      userInfo.value = JSON.parse(storedUserInfo)
        profileLoaded.value = true
      } catch {
        userInfo.value = {}
        profileLoaded.value = false
      }
    }
  }

  return {
    token,
    userInfo,
    profileLoaded,
    isLoggedIn,
    login,
    logout,
    fetchProfile,
    ensureProfile,
    loadUserFromStorage
  }
})

