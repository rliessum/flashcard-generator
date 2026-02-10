import { describe, it, expect } from 'vitest';
import { t, LANGS, I18N, getSupportedLanguages, isSupported } from '../src/js/i18n.js';

// ─── Language registry ────────────────────────────────────────────────────────

describe('LANGS', () => {
  it('has 5 supported languages', () => {
    expect(Object.keys(LANGS)).toHaveLength(5);
  });

  it('each language has flag, label, and name', () => {
    Object.values(LANGS).forEach((lang) => {
      expect(lang).toHaveProperty('flag');
      expect(lang).toHaveProperty('label');
      expect(lang).toHaveProperty('name');
      expect(lang.flag).toBeTruthy();
      expect(lang.label).toBeTruthy();
      expect(lang.name).toBeTruthy();
    });
  });

  it('includes en, nl, de, fr, es', () => {
    expect(Object.keys(LANGS).sort()).toEqual(['de', 'en', 'es', 'fr', 'nl']);
  });
});

// ─── getSupportedLanguages ────────────────────────────────────────────────────

describe('getSupportedLanguages', () => {
  it('returns all language codes', () => {
    const langs = getSupportedLanguages();
    expect(langs).toContain('en');
    expect(langs).toContain('nl');
    expect(langs).toContain('de');
    expect(langs).toContain('fr');
    expect(langs).toContain('es');
  });
});

// ─── isSupported ──────────────────────────────────────────────────────────────

describe('isSupported', () => {
  it('returns true for supported languages', () => {
    expect(isSupported('en')).toBe(true);
    expect(isSupported('nl')).toBe(true);
  });

  it('returns false for unsupported languages', () => {
    expect(isSupported('ja')).toBe(false);
    expect(isSupported('')).toBe(false);
    expect(isSupported('xx')).toBe(false);
  });
});

// ─── Translation function t() ─────────────────────────────────────────────────

describe('t()', () => {
  it('returns English translation for known key', () => {
    expect(t('en', 'title')).toBe('Flashcard Generator');
  });

  it('returns Dutch translation', () => {
    expect(t('nl', 'generate')).toBe('Genereren');
  });

  it('returns German translation', () => {
    expect(t('de', 'clear')).toBe('Löschen');
  });

  it('returns French translation', () => {
    expect(t('fr', 'generate')).toBe('Générer');
  });

  it('returns Spanish translation', () => {
    expect(t('es', 'generate')).toBe('Generar');
  });

  it('falls back to English for missing key in language', () => {
    // All languages have a 'title', but if a hypothetical key is missing
    // from a specific language, it should fall back to English
    expect(t('nl', 'title')).toBe('Flashcard Generator');
  });

  it('returns the key itself if not found in any language', () => {
    expect(t('en', 'nonExistentKey')).toBe('nonExistentKey');
  });

  it('falls back to English for unsupported language', () => {
    expect(t('ja', 'title')).toBe('Flashcard Generator');
  });

  // ── Dynamic translations (functions) ──

  it('handles loadedCards with count argument', () => {
    expect(t('en', 'loadedCards', 5)).toBe('Loaded 5 cards');
    expect(t('nl', 'loadedCards', 3)).toBe('3 kaarten geladen');
    expect(t('de', 'loadedCards', 10)).toBe('10 Karten geladen');
  });

  it('handles pastedCards singular/plural', () => {
    expect(t('en', 'pastedCards', 1)).toBe('Pasted 1 card');
    expect(t('en', 'pastedCards', 5)).toBe('Pasted 5 cards');
  });

  it('handles dupesDetected', () => {
    expect(t('en', 'dupesDetected', 1)).toBe('1 duplicate card detected');
    expect(t('en', 'dupesDetected', 3)).toBe('3 duplicate cards detected');
  });

  it('handles counterText with three arguments', () => {
    const result = t('en', 'counterText', 16, 2, 4);
    expect(result).toContain('16');
    expect(result).toContain('2 pages');
    expect(result).toContain('4 sheets');
  });

  it('handles counterText singular', () => {
    const result = t('en', 'counterText', 1, 1, 2);
    expect(result).toContain('1');
    expect(result).toContain('1 page');
  });

  it('handles clearedCards', () => {
    expect(t('en', 'clearedCards', 8)).toBe('Cleared 8 cards.');
    expect(t('nl', 'clearedCards', 5)).toBe('5 kaarten gewist.');
  });
});

// ─── Translation completeness ─────────────────────────────────────────────────

describe('translation completeness', () => {
  const enKeys = Object.keys(I18N.en);

  ['nl', 'de', 'fr', 'es'].forEach((lang) => {
    it(`${lang} has all keys from English`, () => {
      const langKeys = Object.keys(I18N[lang]);
      const missing = enKeys.filter((k) => !langKeys.includes(k));
      expect(missing).toEqual([]);
    });

    it(`${lang} has no extra keys not in English`, () => {
      const langKeys = Object.keys(I18N[lang]);
      const extra = langKeys.filter((k) => !enKeys.includes(k));
      expect(extra).toEqual([]);
    });
  });

  it('all static translations are non-empty strings', () => {
    Object.entries(I18N).forEach(([lang, translations]) => {
      Object.entries(translations).forEach(([key, value]) => {
        if (typeof value === 'string') {
          expect(value.length, `${lang}.${key} should not be empty`).toBeGreaterThan(0);
        }
      });
    });
  });

  it('all dynamic translations are functions', () => {
    const dynamicKeys = [
      'loadedCards',
      'generatedCards',
      'exportedCards',
      'pastedCards',
      'clearedCards',
      'dupesDetected',
      'counterText',
    ];
    Object.entries(I18N).forEach(([lang, translations]) => {
      dynamicKeys.forEach((key) => {
        expect(
          typeof translations[key],
          `${lang}.${key} should be a function`
        ).toBe('function');
      });
    });
  });
});
