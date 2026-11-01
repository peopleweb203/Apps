import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze180DegreeAxis, getLensFOV } from './stage-math';

test('getLensFOV returns correct focal length field-of-view', () => {
  assert.equal(getLensFOV('24mm'), 74);
  assert.equal(getLensFOV('35mm'), 54);
  assert.equal(getLensFOV('50mm'), 40);
  assert.equal(getLensFOV('85mm'), 24);
});

test('analyze180DegreeAxis detects optimal side and warns on crossing', () => {
  // Actor A at (30, 50), Actor B at (70, 50). Horizontal line of action along y = 50.
  const actorA = { x: 30, y: 50 };
  const actorB = { x: 70, y: 50 };

  // Camera in front (y = 80).
  const cameraFront = { x: 50, y: 80 };
  const frontAnalysis = analyze180DegreeAxis({
    actorA,
    actorB,
    camera: cameraFront,
    referenceSide: 1,
    lens: '35mm',
  });

  assert.equal(frontAnalysis.isCrossed, false);
  assert.equal(frontAnalysis.status, 'OPTIMAL');
  assert.equal(frontAnalysis.eyeLineActorA.screenSide, 'LEFT');
  assert.equal(frontAnalysis.eyeLineActorB.screenSide, 'RIGHT');

  // Camera placed behind the line of action (y = 20) -> crosses the line!
  const cameraBehind = { x: 50, y: 20 };
  const behindAnalysis = analyze180DegreeAxis({
    actorA,
    actorB,
    camera: cameraBehind,
    referenceSide: 1,
    lens: '35mm',
  });

  assert.equal(behindAnalysis.isCrossed, true);
  assert.equal(behindAnalysis.status, 'VIOLATION_CROSSED');
  assert.ok(behindAnalysis.message.includes('AXIS CROSSED'));
  // Eyelines reverse when crossing
  assert.equal(behindAnalysis.eyeLineActorA.screenSide, 'RIGHT');
  assert.equal(behindAnalysis.eyeLineActorB.screenSide, 'LEFT');
});

test('analyze180DegreeAxis identifies head-on camera placement', () => {
  const actorA = { x: 30, y: 50 };
  const actorB = { x: 70, y: 50 };
  const cameraOnLine = { x: 10, y: 50 };

  const onLineAnalysis = analyze180DegreeAxis({
    actorA,
    actorB,
    camera: cameraOnLine,
    referenceSide: 1,
  });

  assert.equal(onLineAnalysis.isOnLine, true);
  assert.equal(onLineAnalysis.status, 'WARNING_ON_LINE');
});
