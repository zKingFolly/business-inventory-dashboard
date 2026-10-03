import { API_BASE_URL } from '../config'
import { httpApi } from './http'
import { mockApi } from './mock'

// With no VITE_API_URL set the app runs fully on in-memory mock data.
// Set VITE_API_URL to your Python backend to switch to the real API.
export const isMock = !API_BASE_URL
export const api = isMock ? mockApi : httpApi
