import 'server-only';

function validateNumber(value, fieldName) {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    throw new Error(`Invalid ${fieldName}.`);
  }
}

export function runProprietaryAnalysis({ hours, hourlyRate, complexityIndex }) {
  validateNumber(hours, 'hours');
  validateNumber(hourlyRate, 'hourlyRate');
  validateNumber(complexityIndex, 'complexityIndex');

  const baseCost = hours * hourlyRate;

  // Proprietary scoring model intentionally server-side for IP protection.
  const protectedValueIndex =
    baseCost * (1 + complexityIndex * 0.22) + Math.pow(complexityIndex, 2) * 175;

  const riskBand = protectedValueIndex > 18000 ? 'High' : protectedValueIndex > 8000 ? 'Medium' : 'Low';

  return {
    baseCost,
    protectedValueIndex: Number(protectedValueIndex.toFixed(2)),
    riskBand,
    calculatedAt: new Date().toISOString(),
  };
}
