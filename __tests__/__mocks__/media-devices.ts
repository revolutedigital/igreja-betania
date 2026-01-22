import { vi } from 'vitest'

export const mockMediaStream = {
  getTracks: vi.fn(() => [
    {
      stop: vi.fn(),
      kind: 'video',
      label: 'FaceTime HD Camera',
      enabled: true,
    },
  ]),
  getVideoTracks: vi.fn(() => [
    {
      stop: vi.fn(),
      kind: 'video',
      label: 'FaceTime HD Camera',
      enabled: true,
    },
  ]),
  getAudioTracks: vi.fn(() => []),
  active: true,
}

export const mockMediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
  enumerateDevices: vi.fn().mockResolvedValue([
    { kind: 'videoinput', deviceId: 'camera-1', label: 'FaceTime HD Camera' },
  ]),
}

export function setupMediaDevicesMocks() {
  Object.defineProperty(global.navigator, 'mediaDevices', {
    writable: true,
    value: mockMediaDevices,
  })

  // Mock HTMLVideoElement
  HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  HTMLVideoElement.prototype.pause = vi.fn()
  HTMLVideoElement.prototype.load = vi.fn()

  Object.defineProperty(HTMLVideoElement.prototype, 'srcObject', {
    set: vi.fn(),
    get: vi.fn().mockReturnValue(mockMediaStream),
  })

  Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
    value: 640,
  })

  Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
    value: 480,
  })

  // Mock HTMLCanvasElement
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    drawImage: vi.fn(),
    getImageData: vi.fn().mockReturnValue({
      data: new Uint8ClampedArray(640 * 480 * 4),
    }),
    putImageData: vi.fn(),
  })

  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue(
    'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
  )
}

export function mockCameraPermissionDenied() {
  mockMediaDevices.getUserMedia.mockRejectedValue(
    new DOMException('Permission denied', 'NotAllowedError')
  )
}

export function mockCameraPermissionGranted() {
  mockMediaDevices.getUserMedia.mockResolvedValue(mockMediaStream)
}
