import request from '@/utils/request'

export const getNotifications = (params = {}) =>
  request.get('notifications', { params })

export const markAsRead = (id) =>
  request.put(`notifications/${id}/read`)

export const markAllAsRead = () =>
  request.put('notifications/read-all')
