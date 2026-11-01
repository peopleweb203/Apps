import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  autoCategorizeCharacterAssets,
  filterCharactersByTags,
  computeCharacterTagDistribution,
} from './character-tag-engine';
import { INITIAL_CHARACTERS } from '../mock/studio-data';

describe('Character Asset Auto-Tagging & Retrieval Engine', () => {
  it('automatically categorizes Elena Cross, Director Chen, and Kaelen Vance by mood, outfit style, and role', () => {
    const elena = INITIAL_CHARACTERS.find((c) => c.id === 'char-elena')!;
    const chen = INITIAL_CHARACTERS.find((c) => c.id === 'char-chen')!;
    const kael = INITIAL_CHARACTERS.find((c) => c.id === 'char-kael')!;

    const elenaTags = autoCategorizeCharacterAssets(elena);
    assert.equal(elenaTags.mood, 'Gritty & Defiant');
    assert.equal(elenaTags.outfitStyle, 'Tactical Ballistic');
    assert.equal(elenaTags.roleCategory, 'Lead Protagonist');
    assert.ok(elenaTags.keywords.includes('ballistic-gear'));

    const chenTags = autoCategorizeCharacterAssets(chen);
    assert.equal(chenTags.mood, 'Calculating & Cold');
    assert.equal(chenTags.outfitStyle, 'Bespoke Executive');
    assert.equal(chenTags.roleCategory, 'Primary Antagonist');
    assert.ok(chenTags.keywords.includes('bespoke-tailoring'));

    const kaelTags = autoCategorizeCharacterAssets(kael);
    assert.equal(kaelTags.mood, 'Urgent & Kinetic');
    assert.equal(kaelTags.outfitStyle, 'Cyber-Tech Streetwear');
    assert.equal(kaelTags.roleCategory, 'Tech Specialist / Ally');
    assert.ok(kaelTags.keywords.includes('holo-visor'));
  });

  it('filters characters accurately by mood, outfit style, role category, and search query', () => {
    const byMood = filterCharactersByTags(INITIAL_CHARACTERS, {
      mood: 'Calculating & Cold',
    });
    assert.equal(byMood.length, 1);
    assert.equal(byMood[0].id, 'char-chen');

    const byOutfit = filterCharactersByTags(INITIAL_CHARACTERS, {
      outfitStyle: 'Cyber-Tech Streetwear',
    });
    assert.equal(byOutfit.length, 1);
    assert.equal(byOutfit[0].id, 'char-kael');

    const byRole = filterCharactersByTags(INITIAL_CHARACTERS, {
      roleCategory: 'Lead Protagonist',
    });
    assert.equal(byRole.length, 1);
    assert.equal(byRole[0].id, 'char-elena');

    const bySearch = filterCharactersByTags(INITIAL_CHARACTERS, {
      searchQuery: 'double-breasted',
    });
    assert.equal(bySearch.length, 1);
    assert.equal(bySearch[0].id, 'char-chen');
  });

  it('respects custom tags and manual category overrides on character profiles', () => {
    const customizedElena = {
      ...INITIAL_CHARACTERS[0],
      moodOverride: 'Enigmatic & Noir' as const,
      outfitStyleOverride: 'High-Fashion Luxury' as const,
      customTags: ['#red-carpet-gala', 'velvet-cape'],
    };

    const tags = autoCategorizeCharacterAssets(customizedElena);
    assert.equal(tags.mood, 'Enigmatic & Noir');
    assert.equal(tags.outfitStyle, 'High-Fashion Luxury');
    assert.ok(tags.keywords.includes('red-carpet-gala'));
    assert.ok(tags.keywords.includes('velvet-cape'));
  });

  it('computes accurate distribution counts across mood, outfit style, and role categories', () => {
    const dist = computeCharacterTagDistribution(INITIAL_CHARACTERS);
    assert.equal(dist.byRoleCategory['Lead Protagonist'], 1);
    assert.equal(dist.byRoleCategory['Primary Antagonist'], 1);
    assert.equal(dist.byRoleCategory['Tech Specialist / Ally'], 1);
  });
});
