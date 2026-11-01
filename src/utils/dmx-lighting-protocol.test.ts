import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_STUDIO_FIXTURES,
  INITIAL_DMX_LIGHTING_CUES,
  kelvinToRgb,
  rgbToHex,
  kelvinToDmxByte,
  dmxByteToKelvin,
  calculateFlickerModulation,
  resolveLightingAtTime,
  buildDmxUniverseFrame,
  exportToDmxCsv,
  exportToArtNetJson,
  exportToQlcPlusXml,
  exportToGrandMaXml,
} from './dmx-lighting-protocol';

describe('Automated DMX Lighting Protocol Engine', () => {
  it('accurately converts Kelvin color temperatures to RGB and DMX byte values', () => {
    // 2800K Tungsten: Warm yellow/amber
    const [rWarm, gWarm, bWarm] = kelvinToRgb(2800);
    assert.ok(rWarm > bWarm, 'Tungsten 2800K must have higher red than blue');
    assert.equal(rWarm, 255);

    // 5600K Daylight: Balanced white
    const [rDay, gDay, bDay] = kelvinToRgb(5600);
    assert.ok(rDay > 200 && gDay > 200 && bDay > 200, '5600K Daylight must be balanced light');

    // 9000K Sky Blue: Cool high blue
    const [rCool, , bCool] = kelvinToRgb(9000);
    assert.ok(bCool >= rCool, '9000K must have high blue component');

    // DMX byte mapping
    const minByte = kelvinToDmxByte(2800, [2800, 10000]);
    assert.equal(minByte, 0, 'Min Kelvin should map to 0 DMX byte');

    const maxByte = kelvinToDmxByte(10000, [2800, 10000]);
    assert.equal(maxByte, 255, 'Max Kelvin should map to 255 DMX byte');

    const midK = dmxByteToKelvin(128, [2800, 10000]);
    assert.ok(midK > 6000 && midK < 7000, 'Mid byte should map around ~6400K');
  });

  it('generates deterministic procedural flicker waveforms', () => {
    // Steady: No change
    const steady = calculateFlickerModulation('STEADY', 1.5, 50, 2.0);
    assert.equal(steady.intensityMultiplier, 1.0);
    assert.equal(steady.kelvinShift, 0);

    // Fire / Candle: Organic modulation with warm kelvin dip
    const candle = calculateFlickerModulation('FIRE_CANDLE', 0.5, 60, 2.0);
    assert.ok(candle.intensityMultiplier > 0, 'Candle intensity must be positive');

    // Police Beacon: Red and blue alternating sweeps
    const policeRed = calculateFlickerModulation('POLICE_BEACON', 0.1, 100, 1.0);
    assert.ok(policeRed.rgbOverride, 'Police beacon must specify RGB override');
    assert.equal(policeRed.rgbOverride?.[0], 255, 'Phase 1 must be red');

    const policeBlue = calculateFlickerModulation('POLICE_BEACON', 0.6, 100, 1.0);
    assert.equal(policeBlue.rgbOverride?.[2], 255, 'Phase 2 must be blue');

    // Muzzle Flash: Instant high-intensity peak
    const muzzle = calculateFlickerModulation('MUZZLE_FLASH', 0.02, 100, 1.0);
    assert.ok(muzzle.intensityMultiplier > 2.0, 'Muzzle flash must spike above 200%');
  });

  it('resolves lighting states for all patched fixtures across timeline timestamps', () => {
    // At T=0s (Scene 1 Alley Establish)
    const statesT0 = resolveLightingAtTime(0.0, INITIAL_DMX_LIGHTING_CUES, DEFAULT_STUDIO_FIXTURES);
    assert.equal(statesT0.length, DEFAULT_STUDIO_FIXTURES.length);

    const keyLight = statesT0.find((s) => s.fixture.role === 'KEY_LIGHT');
    assert.ok(keyLight, 'Key light must be present');
    assert.equal(keyLight?.fixture.startChannel, 1);
    assert.ok(keyLight?.finalIntensityPercent > 0);
    assert.ok(keyLight?.dmxChannels.length === 8);
    assert.ok(keyLight?.hexColor.startsWith('#'));

    // At T=5.0s (Gunfire Firefight with Muzzle Flash active)
    const statesT5 = resolveLightingAtTime(5.0, INITIAL_DMX_LIGHTING_CUES, DEFAULT_STUDIO_FIXTURES);
    const vfxStrobe = statesT5.find((s) => s.fixture.role === 'VFX_STROBE');
    assert.ok(vfxStrobe, 'VFX strobe must be patched');
  });

  it('builds a 512-channel DMX universe byte array with correct channel offsets', () => {
    const universe1 = buildDmxUniverseFrame(1.0, 1, INITIAL_DMX_LIGHTING_CUES, DEFAULT_STUDIO_FIXTURES);
    assert.equal(universe1.length, 512, 'Universe must be exactly 512 channels');
    assert.equal(universe1.byteLength, 512);

    // Ch 1 (Key light dimmer) should be non-zero
    assert.ok(universe1[0] > 0, 'Channel 1 (Key dimmer) should be illuminated');

    // Ch 500 (unpatched) should be 0
    assert.equal(universe1[499], 0, 'Unpatched channel 500 must be zero');
  });

  it('exports valid timecode-indexed CSV sequences for GrandMA / ETC Eos', () => {
    const csv = exportToDmxCsv(INITIAL_DMX_LIGHTING_CUES, DEFAULT_STUDIO_FIXTURES, 24, 2.0);
    assert.ok(csv.startsWith('Frame,Timecode_SMPTE,Seconds'));
    assert.ok(csv.includes('Key Light (Arri SkyPanel S60-C)_Dimmer[Ch1]'));

    const lines = csv.split('\n');
    assert.ok(lines.length >= 48, '2 seconds at 24fps should generate >= 48 frame rows');
    assert.ok(lines[1].includes('00:00:00:00'));
  });

  it('exports valid Art-Net / sACN JSON frame stream with 512-hex payloads', () => {
    const jsonStr = exportToArtNetJson(INITIAL_DMX_LIGHTING_CUES, DEFAULT_STUDIO_FIXTURES, 24, 1.0);
    const parsed = JSON.parse(jsonStr);

    assert.equal(parsed.protocol, 'Art-Net-4 / sACN E1.31 Virtual Sync');
    assert.equal(parsed.configuration.universeCount, 1);
    assert.ok(parsed.fixturesPatch.length >= 4);
    assert.ok(parsed.frames.length >= 24);
    assert.equal(parsed.frames[0].dmx512Hex.length, 1024, '512 bytes = 1024 hex chars');
  });

  it('exports valid QLC+ and GrandMA XML cue sequences', () => {
    const qlcXml = exportToQlcPlusXml(INITIAL_DMX_LIGHTING_CUES, DEFAULT_STUDIO_FIXTURES);
    assert.ok(qlcXml.includes('<Workspace xmlns="http://www.qlcplus.org/Workspace">'));
    assert.ok(qlcXml.includes('<Fixture>'));
    assert.ok(qlcXml.includes('<Function ID="0" Type="Scene"'));

    const grandMaXml = exportToGrandMaXml(INITIAL_DMX_LIGHTING_CUES, DEFAULT_STUDIO_FIXTURES);
    assert.ok(grandMaXml.includes('<Sequence name="CineForge_Virtual_Rig"'));
    assert.ok(grandMaXml.includes('<TimecodeSMPTE>00:00:00:00</TimecodeSMPTE>'));
    assert.ok(grandMaXml.includes('<ChannelData fixtureId="fix-key-arri-s60"'));
  });
});
