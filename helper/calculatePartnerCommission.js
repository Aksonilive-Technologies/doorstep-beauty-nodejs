export const calculatePartnerCommission = (finalPrice) => {
    const commissionTiers = [
      { min: 0, max: 800, commission: 9 },
      { min: 800, max: 900, commission: 10 },
      { min: 900, max: 1000, commission: 12 },
      { min: 1000, max: 1200, commission: 15 },
      { min: 1200, max: 1400, commission: 17 },
      { min: 1400, max: 1600, commission: 18 },
      { min: 1600, max: 1800, commission: 19 },
      { min: 1800, max: 2000, commission: 20 },
      { min: 2000, max: 2200, commission: 21 },
      { min: 2200, max: 2400, commission: 22 },
      { min: 2400, max: 2600, commission: 23 },
      { min: 2600, max: 2800, commission: 24 },
      { min: 2800, max: 3000, commission: 25 },
      { min: 3000, max: 3500, commission: 28 },
      { min: 3500, max: Infinity, commission: 30 }
    ];
  
    // Find the appropriate commission tier
    const tier = commissionTiers.find(t => finalPrice >= t.min && finalPrice < t.max);
    return tier ? tier.commission : 0;
};