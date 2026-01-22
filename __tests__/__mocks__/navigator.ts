import { vi } from 'vitest'

// Mock service worker
export const mockServiceWorkerRegistration = {
  scope: '/',
  pushManager: {
    getSubscription: vi.fn().mockResolvedValue(null),
    subscribe: vi.fn().mockResolvedValue({
      endpoint: 'https://push.example.com/123',
      getKey: vi.fn().mockReturnValue(new ArrayBuffer(0)),
      toJSON: vi.fn().mockReturnValue({
        endpoint: 'https://push.example.com/123',
        keys: {},
      }),
      unsubscribe: vi.fn().mockResolvedValue(true),
    }),
  },
}

export const mockServiceWorker = {
  register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
  ready: Promise.resolve(mockServiceWorkerRegistration),
  controller: null,
  getRegistrations: vi.fn().mockResolvedValue([]),
}

// Mock Notification
export const mockNotification = {
  permission: 'default' as NotificationPermission,
  requestPermission: vi.fn().mockResolvedValue('granted'),
}

export function setupNavigatorMocks() {
  Object.defineProperty(global.navigator, 'serviceWorker', {
    writable: true,
    value: mockServiceWorker,
  })

  Object.defineProperty(global, 'Notification', {
    writable: true,
    value: class MockNotification {
      static permission = mockNotification.permission
      static requestPermission = mockNotification.requestPermission

      constructor(
        public title: string,
        public options?: NotificationOptions
      ) {}
    },
  })
}

export function setOffline() {
  Object.defineProperty(global.navigator, 'onLine', {
    writable: true,
    value: false,
  })
}

export function setOnline() {
  Object.defineProperty(global.navigator, 'onLine', {
    writable: true,
    value: true,
  })
}

export function setNotificationPermission(permission: NotificationPermission) {
  mockNotification.permission = permission
  ;(global.Notification as unknown as { permission: string }).permission = permission
}
