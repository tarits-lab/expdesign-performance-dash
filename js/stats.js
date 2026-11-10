(function (global) {
  "use strict";

  // Normal CDF (Abramowitz–Stegun 26.2.17)
  function normalCDF(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }

  // Inverse normal (Acklam)
  function normalInv(p) {
    if (p <= 0 || p >= 1) throw new Error("p harus di antara 0 dan 1");
    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
               1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
               6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
               -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
               3.754408661907416e+00];
    const pLow = 0.02425, pHigh = 1 - pLow;
    let q, r;
    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0]*q + c[1])*q + c[2])*q + c[3])*q + c[4])*q + c[5]) /
             ((((d[0]*q + d[1])*q + d[2])*q + d[3])*q + 1);
    } else if (p <= pHigh) {
      q = p - 0.5; r = q * q;
      return (((((a[0]*r + a[1])*r + a[2])*r + a[3])*r + a[4])*r + a[5]) * q /
             (((((b[0]*r + b[1])*r + b[2])*r + b[3])*r + b[4])*r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0]*q + c[1])*q + c[2])*q + c[3])*q + c[4])*q + c[5]) /
              ((((d[0]*q + d[1])*q + d[2])*q + d[3])*q + 1);
    }
  }

  // Sample size per varian (two-proportion z-test)
  function sampleSizePerVariant(p1, mdeRel, alpha, power) {
    const p2 = p1 * (1 + mdeRel);
    const zA = normalInv(1 - alpha / 2);
    const zB = normalInv(power);
    const num = Math.pow(zA + zB, 2) * (p1 * (1 - p1) + p2 * (1 - p2));
    const den = Math.pow(p2 - p1, 2);
    return Math.ceil(num / den);
  }

  // Two-proportion z-test + CI
  function twoProportionTest(nA, cA, nB, cB, alpha) {
    const pA = cA / nA, pB = cB / nB;
    const pPool = (cA + cB) / (nA + nB);
    const sePool = Math.sqrt(pPool * (1 - pPool) * (1 / nA + 1 / nB));
    const z = (pB - pA) / sePool;
    const pValue = 2 * (1 - normalCDF(Math.abs(z)));
    const seDiff = Math.sqrt(pA * (1 - pA) / nA + pB * (1 - pB) / nB);
    const zCrit = normalInv(1 - alpha / 2);
    return {
      pA, pB,
      absUplift: pB - pA,
      relUplift: pA === 0 ? NaN : (pB - pA) / pA,
      z, pValue,
      ciLow:  (pB - pA) - zCrit * seDiff,
      ciHigh: (pB - pA) + zCrit * seDiff,
      significant: pValue < alpha
    };
  }

   // ... (fungsi normalCDF, normalInv, dll tetap ada) ...

  // Fungsi RAL (One-Way ANOVA)
  function calculateANOVA(groups) {
    // groups = array of arrays berisi angka penjualan [[100, 120], [110, 130], ...]
    let totalN = 0;
    let grandSum = 0;
    groups.forEach(g => {
      totalN += g.length;
      grandSum += g.reduce((a, b) => a + b, 0);
    });
    const grandMean = grandSum / totalN;

    let ssBetween = 0;
    let ssWithin = 0;

    groups.forEach(g => {
      const n = g.length;
      const sum = g.reduce((a, b) => a + b, 0);
      const mean = sum / n;
      ssBetween += n * Math.pow(mean - grandMean, 2);
      g.forEach(val => { ssWithin += Math.pow(val - mean, 2); });
    });

    const ssTotal = ssBetween + ssWithin;
    const dfBetween = groups.length - 1;
    const dfWithin = totalN - groups.length;
    const dfTotal = totalN - 1;

    const msBetween = ssBetween / dfBetween;
    const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;
    const fValue = msWithin > 0 ? msBetween / msWithin : 0;

    // P-value menggunakan jStat (pastikan script jStat di-load di HTML)
    let pValue = 0;
    if (typeof jStat !== 'undefined') {
      pValue = 1 - jStat.centralF.cdf(fValue, dfBetween, dfWithin);
    }

    return { ssBetween, ssWithin, ssTotal, dfBetween, dfWithin, dfTotal, msBetween, msWithin, fValue, pValue };
  }

  global.Stats = { normalCDF, normalInv, sampleSizePerVariant, twoProportionTest, calculateANOVA };
})(window);