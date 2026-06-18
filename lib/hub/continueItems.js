/**
 * @param {import('@/lib/worksheets/hubStatus').WorksheetHubStatusEntry[]} items
 * @returns {import('@/lib/worksheets/hubStatus').WorksheetHubStatusEntry[]}
 */
export function pickContinueItems(items) {
  const coreItems = items
    .filter((item) => typeof item.coreRank === 'number' && item.integrationStatus !== 'planned')
    .sort((a, b) => (a.coreRank || 0) - (b.coreRank || 0));

  const inProgress = coreItems.filter((item) => item.status === 'in_progress');
  if (inProgress.length > 0) {
    return inProgress.slice(0, 3);
  }

  const nextCore = coreItems.find((item) => item.status === 'not_started');
  if (nextCore) {
    return [nextCore];
  }

  const recentIntegrated = items
    .filter(
      (item) =>
        item.integrationStatus !== 'planned' &&
        item.status === 'complete' &&
        item.lastUpdatedAt &&
        item.href,
    )
    .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());

  return recentIntegrated.slice(0, 2);
}
