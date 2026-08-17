import { CategoryId, EnvironmentalImpact, ListingCondition } from '../types';

// SVS Methodology Factor Table (Per Category Baseline)
// Based on Life Cycle Assessment (LCA) estimation for avoidance of virgin production
const CATEGORY_IMPACT_FACTORS: Record<
  CategoryId,
  {
    co2Kg: number;
    waterL: number;
    energyKwh: number;
    rawMaterialKg: number;
    wasteKg: number;
  }
> = {
  elektronik: { co2Kg: 14.5, waterL: 380, energyKwh: 52, rawMaterialKg: 2.1, wasteKg: 1.2 },
  spor: { co2Kg: 11.2, waterL: 290, energyKwh: 40, rawMaterialKg: 3.4, wasteKg: 8.5 },
  ev_yasam: { co2Kg: 8.5, waterL: 210, energyKwh: 34, rawMaterialKg: 2.6, wasteKg: 4.2 },
  moda: { co2Kg: 7.8, waterL: 920, energyKwh: 22, rawMaterialKg: 1.4, wasteKg: 0.8 },
  hobi: { co2Kg: 5.6, waterL: 140, energyKwh: 28, rawMaterialKg: 1.8, wasteKg: 1.5 },
  kitap_muzik: { co2Kg: 3.4, waterL: 110, energyKwh: 14, rawMaterialKg: 1.1, wasteKg: 0.9 },
  bebek_cocuk: { co2Kg: 6.2, waterL: 340, energyKwh: 24, rawMaterialKg: 1.5, wasteKg: 1.8 },
  arac_parca: { co2Kg: 19.4, waterL: 490, energyKwh: 78, rawMaterialKg: 6.2, wasteKg: 7.5 },
  diger: { co2Kg: 5.0, waterL: 150, energyKwh: 20, rawMaterialKg: 1.0, wasteKg: 1.0 },
};

const CONDITION_MULTIPLIERS: Record<ListingCondition, number> = {
  zero: 1.15,
  like_new: 1.05,
  very_good: 0.95,
  good: 0.85,
  acceptable: 0.70,
};

export const impactService = {
  /**
   * Calculates the estimated SVS environmental impact for a given listing or trade.
   * NOTE: SVS is purely an environmental indicator, NOT a monetary price or currency.
   */
  calculateListingImpact(
    categoryId: CategoryId,
    condition: ListingCondition = 'very_good',
    weightModifier: number = 1.0
  ): EnvironmentalImpact {
    const base = CATEGORY_IMPACT_FACTORS[categoryId] || CATEGORY_IMPACT_FACTORS.diger;
    const mult = (CONDITION_MULTIPLIERS[condition] || 1.0) * weightModifier;

    return {
      co2eKg: parseFloat((base.co2Kg * mult).toFixed(1)),
      waterLiters: Math.round(base.waterL * mult),
      energyKwh: Math.round(base.energyKwh * mult),
      rawMaterialKg: parseFloat((base.rawMaterialKg * mult).toFixed(1)),
      wasteReductionKg: parseFloat((base.wasteKg * mult).toFixed(1)),
      reuseCount: 1,
      methodologyVersion: 'SVS-v2.1 (LCA Sürdürülebilirlik Metodolojisi)',
    };
  },

  calculateEstimatedImpact(
    categoryId: CategoryId,
    condition: ListingCondition = 'very_good',
    weightModifier: number = 1.0
  ): EnvironmentalImpact {
    return this.calculateListingImpact(categoryId, condition, weightModifier);
  },

  calculateCombinedTradeImpact(impacts: EnvironmentalImpact[]): EnvironmentalImpact {
    return impacts.reduce(
      (acc, curr) => ({
        co2eKg: parseFloat((acc.co2eKg + curr.co2eKg).toFixed(1)),
        waterLiters: acc.waterLiters + curr.waterLiters,
        energyKwh: acc.energyKwh + curr.energyKwh,
        rawMaterialKg: parseFloat((acc.rawMaterialKg + curr.rawMaterialKg).toFixed(1)),
        wasteReductionKg: parseFloat((acc.wasteReductionKg + curr.wasteReductionKg).toFixed(1)),
        reuseCount: acc.reuseCount + (curr.reuseCount || 1),
        methodologyVersion: 'SVS-v2.1',
      }),
      {
        co2eKg: 0,
        waterLiters: 0,
        energyKwh: 0,
        rawMaterialKg: 0,
        wasteReductionKg: 0,
        reuseCount: 0,
        methodologyVersion: 'SVS-v2.1',
      }
    );
  },

  getMethodologyDescription() {
    return {
      title: 'SVS Çevresel Etki Metodolojisi (SVS-v2.1)',
      principles: [
        {
          heading: 'SVS Kesinlikle Para Değildir',
          text: 'SVS bir ürün fiyatı, piyasa değeri veya takas eşleştirme puanı değildir. Swaloop’ta hiçbir takas parasal değerle kısıtlanamaz.',
        },
        {
          heading: 'Yaşam Döngüsü Analizi (LCA)',
          text: 'Her ürün kategorisi için sıfır üretim yerine mevcut ürünün tekrar kullanılmasıyla önlenen sera gazı emisyonları (CO₂e), harcanmayan sanayi suyu, korunan primer hammadde ve fosil enerji tasarrufu bilimsel LCA modelleriyle tahmin edilir.',
        },
        {
          heading: 'Kondisyon & Döngü Katsayısı',
          text: 'Ürünün kullanım ömrünü uzatma potansiyeli kondisyonuna göre hesaplanır. Takas tamamlandığında döngüsel ekonomiye sağlanan net fayda kullanıcı ve topluluk etki göstergelerine yazılır.',
        },
      ],
    };
  },
};
