import request from '@/utils/request'

export const createApplication = (payload) => request.post('applications', payload)

export const getApplicationDetail = (applicationId) =>
  request.get(`applications/${applicationId}`)

export const getMyApplications = (params = {}) =>
  request.get('applications/my', { params })

export const cancelApplication = (applicationId) =>
  request.put(`applications/${applicationId}/cancel`)

