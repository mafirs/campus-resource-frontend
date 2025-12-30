import request from '@/utils/request'

export const getMaterials = (params = {}) => request.get('materials', { params })

export const createMaterial = (payload) => request.post('materials', payload)

export const updateMaterial = (materialId, payload) => request.put(`materials/${materialId}`, payload)

export const deleteMaterial = (materialId) => request.delete(`materials/${materialId}`)

