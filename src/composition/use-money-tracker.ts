import { createMoneyUseCases } from '@/src/application/money/money-use-cases';
import { moneyRepository } from '@/src/infrastructure/database/money-database';
import { createMoneyTrackerStore } from '@/src/features/money-tracking/state/money-tracker-store';

export const useMoneyTracker = createMoneyTrackerStore(
  createMoneyUseCases(moneyRepository),
);
