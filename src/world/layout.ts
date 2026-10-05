/**
 * The gallery's floor plan. One long hall running away from the visitor (−Z), with
 * a station every 5 m. Each station has the camera's position and its point of
 * interest; the camera glides from one to the next as the page scrolls.
 * World units are metres, with jewellery shown at 10× life size so it reads on screen.
 */
export type Vec3 = [number, number, number]

export const SPACING = 5.2

export const STATIONS = [
  { id: 'arrival', at: 0, cam: [0.55, 1.18, 1.25] as Vec3, look: [0, 1.06, 0] as Vec3 },
  { id: 'stone', at: 1, cam: [-0.35, 1.2, 0.95] as Vec3, look: [0, 1.12, 0] as Vec3 },
  { id: 'hallmark', at: 2, cam: [0.25, 1.42, 0.62] as Vec3, look: [0, 0.98, 0] as Vec3 },
  { id: 'tray', at: 3, cam: [0, 2.05, 1.05] as Vec3, look: [0, 0.92, -0.05] as Vec3 },
  { id: 'vault', at: 4, cam: [0.55, 1.75, 1.2] as Vec3, look: [0, 0.95, 0.1] as Vec3 },
  { id: 'weighing', at: 5, cam: [-0.45, 1.45, 1.35] as Vec3, look: [0, 1.25, 0] as Vec3 },
  { id: 'neck', at: 6, cam: [0.4, 1.45, 1.15] as Vec3, look: [0, 1.32, 0] as Vec3 },
  { id: 'gift', at: 7, cam: [0.5, 1.35, 0.95] as Vec3, look: [0, 1.0, 0] as Vec3 },
  { id: 'appointment', at: 8, cam: [0, 1.6, 2.6] as Vec3, look: [0, 1.25, -0.5] as Vec3 },
] as const

export type StationId = (typeof STATIONS)[number]['id']

/** World position of a station's centre. */
export function stationOrigin(i: number): Vec3 {
  return [0, 0, -i * SPACING]
}

export const JEWEL_SCALE = 10
