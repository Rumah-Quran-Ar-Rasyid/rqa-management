import { describe, expect, it } from "vitest";

import { QURAN_SURAHS } from "./quran-surahs";

describe("QURAN_SURAHS", () => {
  it("memuat tepat 114 surah secara berurutan", () => {
    expect(QURAN_SURAHS).toHaveLength(114);
    expect(QURAN_SURAHS.map(({ surahNumber }) => surahNumber)).toEqual(
      Array.from({ length: 114 }, (_, index) => index + 1),
    );
  });

  it("memiliki nama dan jumlah ayat yang valid", () => {
    for (const surah of QURAN_SURAHS) {
      expect(surah.arabicName.length).toBeGreaterThan(0);
      expect(surah.latinName.length).toBeGreaterThan(0);
      expect(surah.verseCount).toBeGreaterThan(0);
    }

    expect(QURAN_SURAHS[1].verseCount).toBe(286);
    expect(QURAN_SURAHS[113].verseCount).toBe(6);
  });
});
