import axios from "axios"

export { isAxiosError } from "axios"

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || undefined,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      return Promise.reject(error)
    }

    return Promise.reject(error)
  },
)
