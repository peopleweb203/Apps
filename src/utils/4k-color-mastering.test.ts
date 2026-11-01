import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  buildMasteringPayload,
  DEFAULT_COLOR_GRADE,
  FILM_STOCK_PRESETS,
} from './4k-color-mastering';

describe('4K Color Mastering Pipeline', () => {
  test('builds mastering payload with DCI-P3 color space and Kodak 500T LUT', () => {
    const payload = buildMasteringPayload(DEFAULT_COLOR_GRADE);

    assert.strictEqual(payload.gamut, 'DCI-P3 Theatrical');
    assert.strictEqual(payload.stockName, FILM_STOCK_PRESETS['kodak-vision3-500t'].name);
    assert.ok(payload.lutProfile.includes('KODAK_VISION3_500T'));
    assert.ok(payload.masteringPromptTag.includes('soft highlight roll-off shoulder'));
    assert.strictEqual(payload.technicalSpecs.exportContainer, '4K DCI QuickTime MP4 / ProRes');
  });

  test('adjusts LUT profile and specs when film stock is changed to Arri LogC', () => {
    const payload = buildMasteringPayload({
      ...DEFAULT_COLOR_GRADE,
      filmStock: 'arri-logc-clean',
      gamut: 'Rec.709 Standard',
      aspectRatio: '16:9',
    });

    assert.strictEqual(payload.stockName, FILM_STOCK_PRESETS['arri-logc-clean'].name);
    assert.ok(payload.lutProfile.includes('ARRI_LOGC_CLEAN'));
    assert.strictEqual(payload.technicalSpecs.colorMatrix, 'ITU-R BT.709');
    assert.strictEqual(payload.technicalSpecs.aspectRatio, '16:9');
  });
});
