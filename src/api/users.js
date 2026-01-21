import request from '@/utils/request'

// 只读：获取用户列表（仅管理员可用）
export const getUsers = (params = {}) => request.get('users', { params })
