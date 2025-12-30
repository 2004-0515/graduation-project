import axios from '@/utils/axios'
import type { ApiResponse } from '@/types'

export interface Music {
  id: number
  title: string
  artist: string
  url: string
  cover: string
  duration: number
  sortOrder: number
  status: number
  createdTime: string
  updatedTime: string
}

const musicApi = {
  getEnabledMusic(): Promise<ApiResponse<Music[]>> {
    return axios.get('/music/enabled')
  },
  
  getAllMusic(): Promise<ApiResponse<Music[]>> {
    return axios.get('/music')
  },
  
  addMusic(music: Partial<Music>): Promise<ApiResponse<Music>> {
    return axios.post('/music', music)
  },
  
  updateMusic(id: number, music: Partial<Music>): Promise<ApiResponse<Music>> {
    return axios.put(`/music/${id}`, music)
  },
  
  deleteMusic(id: number): Promise<ApiResponse<void>> {
    return axios.delete(`/music/${id}`)
  },
  
  updateStatus(id: number, status: number): Promise<ApiResponse<void>> {
    return axios.put(`/music/${id}/status`, { status })
  },
  
  uploadMusic(file: File): Promise<ApiResponse<string>> {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post('/music/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  uploadCover(file: File): Promise<ApiResponse<string>> {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post('/music/upload-cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export default musicApi
