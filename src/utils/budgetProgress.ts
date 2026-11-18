export function parseBudgetInput(raw: string): number {
  return parseFloat(raw) || 0;
}

export function budgetProgressColor(percentage: number): string {
  if (percentage > 100) return 'bg-rose-500';
  if (percentage > 85) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function overallBudgetProgress(spent: number, configuredTarget: number) {
  const target = configuredTarget || 2500;
  const percentage = Math.round((spent / target) * 100);
  const remaining = target - spent;

  return {
    target,
    percentage,
    remaining,
    isOverBudget: remaining < 0,
  };
}

export function categoryBudgetProgress(
  spent: number,
  configuredTarget: number,
  fallbackTarget: number
) {
  const target = configuredTarget || fallbackTarget;
  const percentage = target > 0 ? Math.round((spent / target) * 100) : 0;

  return { target, percentage };
}
