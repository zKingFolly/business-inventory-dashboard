import { api } from '.'
import { useApp } from '../context/AppContext'
import { invalidate, useMutation, useQuery } from './query'

export const useBusinesses = () => useQuery(['businesses'], api.listBusinesses)

export function useDashboard(range) {
  const { businessId } = useApp()
  return useQuery(['dashboard', businessId, range], () => api.getDashboard(businessId, range), !!businessId)
}

export function useProducts() {
  const { businessId } = useApp()
  return useQuery(['products', businessId], () => api.listProducts(businessId), !!businessId)
}

export function useSales(range) {
  const { businessId } = useApp()
  return useQuery(['sales', businessId, range], () => api.listSales(businessId, range), !!businessId)
}

function useBusinessMutation(fn) {
  const { businessId } = useApp()
  return useMutation(
    (input) => fn(businessId, input),
    () => {
      invalidate(['products', businessId])
      invalidate(['sales', businessId])
      invalidate(['dashboard', businessId])
    },
  )
}

export const useCreateProduct = () => useBusinessMutation(api.createProduct)
export const useLogSale = () => useBusinessMutation(api.logSale)
export const useRestock = () =>
  useBusinessMutation((businessId, { productId, qty }) => api.restockProduct(businessId, productId, qty))

export function useChats() {
  const { businessId } = useApp()
  return useQuery(['chats', businessId], () => api.listChats(businessId), !!businessId)
}

export function useChat(chatId) {
  const { businessId } = useApp()
  return useQuery(['chat', businessId, chatId], () => api.getChat(businessId, chatId), !!businessId && !!chatId)
}

export function useSendMessage() {
  const { businessId } = useApp()
  return useMutation(
    (input) => api.sendMessage(businessId, input),
    ({ chatId }) => {
      invalidate(['chats', businessId])
      invalidate(['chat', businessId, chatId])
    },
  )
}
