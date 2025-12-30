import request from '@/utils/request'

export const login = (payload) => request.post('auth/login', payload)

export const logout = () => request.post('auth/logout')

export const getProfile = () => request.get('auth/profile')

