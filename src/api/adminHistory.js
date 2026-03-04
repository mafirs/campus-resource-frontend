import request from '@/utils/request'

export const getAdminHistory = (params = {}) =>
  request.get('admin/history', { params })

