import axios from '@/utils/axios'
import type { ApiResponse } from '@/types'

export interface ContactMessageRequest {
  name: string
  contact: string
  type: string
  content: string
}

const contactApi = {
  submitMessage(data: ContactMessageRequest): Promise<ApiResponse> {
    return axios.post('/contact-messages', data)
  }
}

export default contactApi
