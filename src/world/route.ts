/** The pathname of the page that last declared a room (see Room.tsx and WorldProvider). */
export const roomPath = { current: '' }

/**
 * Navigation depth, for keying transition direction: deeper routes (a piece) wipe one way,
 * shallower (back to a room, home) the other.
 */
export function depthOf(path: string) {
  if (path === '/') return 0
  if (path.startsWith('/piece/')) return 2
  return 1
}
