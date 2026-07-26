type ClientStatsSnapshot = {
  totalSpent: number;
  balanceDue: number;
  transactionCount: number;
};

export function getClientAccountStatus(stats: ClientStatsSnapshot): string {
  if (stats.transactionCount === 0) {
    return "Sans activité";
  }

  if (stats.balanceDue > 0) {
    return "Encours";
  }

  return "À jour";
}
