import { renderHook, act, waitFor } from '@testing-library/react'
import { useAlertsStore } from '../alertsStore'
import { apiClient } from '@/lib/api'

jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}))

describe('alertsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAlertsStore.setState({
      alerts: [],
      isLoading: false,
      error: null,
    })
  })

  describe('fetchAlerts', () => {
    it('fetches alerts successfully', async () => {
      const mockAlerts = [
        { id: '1', title: 'Alert 1', message: 'Message 1', read: false },
        { id: '2', title: 'Alert 2', message: 'Message 2', read: true },
      ]

      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: mockAlerts })

      const { result } = renderHook(() => useAlertsStore())

      await act(async () => {
        await result.current.fetchAlerts()
      })

      expect(result.current.alerts).toEqual(mockAlerts)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('handles fetch error', async () => {
      const mockError = new Error('Failed to fetch')
      ;(apiClient.get as jest.Mock).mockRejectedValue(mockError)

      const { result } = renderHook(() => useAlertsStore())

      await act(async () => {
        try {
          await result.current.fetchAlerts()
        } catch (error) {
          // El error se maneja internamente en el store
        }
      })

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch')
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('markAsRead', () => {
    it('marks alert as read', async () => {
      const mockAlerts = [
        { id: '1', title: 'Alert 1', message: 'Message 1', read: false },
      ]

      useAlertsStore.setState({ alerts: mockAlerts })
      ;(apiClient.patch as jest.Mock).mockResolvedValue({})
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: [{ ...mockAlerts[0], read: true }] })

      const { result } = renderHook(() => useAlertsStore())

      await act(async () => {
        await result.current.markAsRead('1')
      })

      expect(apiClient.patch).toHaveBeenCalledWith('/alerts/1/mark-read', { is_read: true })
    })
  })

  describe('createAlert', () => {
    it('creates alert successfully', async () => {
      const newAlert = {
        type: 'expired_documentation',
        title: 'New Alert',
        message: 'Alert message',
      }

      ;(apiClient.post as jest.Mock).mockResolvedValue({ data: { id: '1', ...newAlert } })
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: [{ id: '1', ...newAlert }] })

      const { result } = renderHook(() => useAlertsStore())

      await act(async () => {
        await result.current.createAlert(newAlert)
      })

      expect(apiClient.post).toHaveBeenCalledWith('/alerts', expect.objectContaining(newAlert))
    })
  })
})
