import { PricePeriod } from '@prisma/client';

export function computeRentalEndDate(
  startedAt: Date,
  pricePeriod: PricePeriod,
  duration: number,
): Date {
  const endsAt = new Date(startedAt);

  switch (pricePeriod) {
    case PricePeriod.DAY:
      endsAt.setDate(endsAt.getDate() + duration);
      break;
    case PricePeriod.MONTH:
      endsAt.setMonth(endsAt.getMonth() + duration);
      break;
    case PricePeriod.YEAR:
      endsAt.setFullYear(endsAt.getFullYear() + duration);
      break;
    default:
      throw new Error(`Unsupported price period: ${pricePeriod}`);
  }

  return endsAt;
}
