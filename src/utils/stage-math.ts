export interface Point2D {
  x: number;
  y: number;
}

export type LensType = '24mm' | '35mm' | '50mm' | '85mm' | '100mm';

export interface StageSetup {
  actorA: Point2D;
  actorB: Point2D;
  camera: Point2D;
  cameraTarget?: Point2D;
  referenceSide?: number; // 1 or -1 (which side of the line was designated as shooting side)
  lens?: LensType;
}

export interface AxisAnalysis {
  isCrossed: boolean;
  isOnLine: boolean;
  side: number; // 1, -1, or 0
  distanceToAxis: number;
  axisAngleDeg: number;
  cameraAngleDeg: number;
  eyeLineActorA: { angleDeg: number; screenSide: 'LEFT' | 'RIGHT' | 'CENTER' };
  eyeLineActorB: { angleDeg: number; screenSide: 'LEFT' | 'RIGHT' | 'CENTER' };
  fovDeg: number;
  status: 'OPTIMAL' | 'WARNING_ON_LINE' | 'VIOLATION_CROSSED';
  message: string;
}

const LENS_FOV_MAP: Record<LensType, number> = {
  '24mm': 74,
  '35mm': 54,
  '50mm': 40,
  '85mm': 24,
  '100mm': 20,
};

export function getLensFOV(lens: LensType = '35mm'): number {
  return LENS_FOV_MAP[lens] || 54;
}

/**
 * Calculates 180-degree rule status, eye-line vectors, and camera angles
 */
export function analyze180DegreeAxis(setup: StageSetup): AxisAnalysis {
  const { actorA, actorB, camera, referenceSide = 1, lens = '35mm' } = setup;

  // Vector from Actor A to Actor B
  const dx = actorB.x - actorA.x;
  const dy = actorB.y - actorA.y;
  const axisLength = Math.hypot(dx, dy);

  // Signed 2D cross product with screen coordinates (y increases downward):
  // When camera is downstage (camera.y > line) and A is left of B (dx > 0), crossProduct > 0
  const crossProduct = (camera.y - actorA.y) * dx - (camera.x - actorA.x) * dy;
  const distanceToAxis = axisLength > 0 ? Math.abs(crossProduct) / axisLength : 0;

  const side = crossProduct > 1 ? 1 : crossProduct < -1 ? -1 : 0;
  const isOnLine = distanceToAxis < 4;

  const isCrossed = !isOnLine && referenceSide !== 0 && Math.sign(crossProduct) !== Math.sign(referenceSide);

  // Axis angle in degrees
  const axisAngleDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);

  // Camera angle relative to scene center
  const centerX = (actorA.x + actorB.x) / 2;
  const centerY = (actorA.y + actorB.y) / 2;
  const camDx = centerX - camera.x;
  const camDy = centerY - camera.y;
  const cameraAngleDeg = Math.round((Math.atan2(camDy, camDx) * 180) / Math.PI);

  // Determine screen direction for eye-lines
  // In the standard camera perspective, when camera is on referenceSide:
  // Actor A appears screen-left and looks screen-right
  // Actor B appears screen-right and looks screen-left
  const actorAScreenSide = isCrossed ? 'RIGHT' : 'LEFT';
  const actorBScreenSide = isCrossed ? 'LEFT' : 'RIGHT';

  let status: AxisAnalysis['status'] = 'OPTIMAL';
  let message = 'AXIS LOCKED: 180° rule respected. Character eyelines are cinematic and coherent.';

  if (isOnLine) {
    status = 'WARNING_ON_LINE';
    message = 'HEAD-ON AXIS: Camera is aligned directly on the axis of action. Characters will occlude each other.';
  } else if (isCrossed) {
    status = 'VIOLATION_CROSSED';
    message = 'AXIS CROSSED (180° VIOLATION): Camera crossed the action line! Actor positions and eyelines will reverse on cut.';
  }

  return {
    isCrossed,
    isOnLine,
    side,
    distanceToAxis: Math.round(distanceToAxis * 10) / 10,
    axisAngleDeg,
    cameraAngleDeg,
    eyeLineActorA: { angleDeg: 0, screenSide: actorAScreenSide },
    eyeLineActorB: { angleDeg: 180, screenSide: actorBScreenSide },
    fovDeg: getLensFOV(lens),
    status,
    message,
  };
}
