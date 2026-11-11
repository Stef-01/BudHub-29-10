// components/admin/CookventureAnalyticsTab.tsx
// Cookventure India analytics: the plan's success metrics, the scoring-weight A/B test,
// and which regions / masalas / tadkas people pick.
import React, { useEffect, useMemo, useState } from 'react';
import {
  computeSuccessMetrics,
  computeVariantOutcomes,
  fetchRemoteInsights,
  getLocalEvents,
  getPreferenceInsights,
} from '../../services/cookventure/analytics';
import { SCORING_EXPERIMENT } from '../../services/cookventure/experiments';
import { listAssetSlots } from '../../services/cookventure/assets';
import { getMasalaName, getRegionName, getSubregionName, getTadkaName } from '../../services/cookventure/labels';

// Single-series bars use categorical slot 1 of the validated dataviz palette
const BAR_COLOR = '#2a78d6';

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`);

interface Metric {
  label: string;
  value: string;
  target: string;
  /** null = not enough data */
  met: boolean | null;
}

const MetricTile: React.FC<{ metric: Metric }> = ({ metric }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <p className="text-xs text-gray-500">{metric.label}</p>
    <p className="mt-1 text-2xl font-semibold text-gray-900">{metric.value}</p>
    <p className="mt-1 text-xs text-gray-600">
      Target {metric.target}
      {metric.met !== null && (
        <span className={`ml-2 font-semibold ${metric.met ? 'text-green-700' : 'text-amber-700'}`}>
          {metric.met ? '✓ on target' : '△ below target'}
        </span>
      )}
    </p>
  </div>
);

const RankedBars: React.FC<{ title: string; items: Array<{ id: string; count: number }>; name: (id: string) => string }> = ({
  title,
  items,
  name,
}) => {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-800 mb-2">{title}</h4>
      {items.length === 0 ? (
        <p className="text-xs text-gray-500">No data yet</p>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 6).map((item) => (
            <li key={item.id} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-2 text-xs" title={`${name(item.id)}: ${item.count}`}>
              <span className="truncate text-gray-700">{name(item.id)}</span>
              <span className="h-2.5 rounded-r bg-gray-100">
                <span className="block h-full rounded-r" style={{ width: `${(item.count / max) * 100}%`, background: BAR_COLOR }} />
              </span>
              <span className="text-right tabular-nums text-gray-700">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const CookventureAnalyticsTab: React.FC = () => {
  const events = useMemo(() => getLocalEvents(), []);
  const metrics = useMemo(() => computeSuccessMetrics(events), [events]);
  const variants = useMemo(() => computeVariantOutcomes(events), [events]);
  const insights = useMemo(() => getPreferenceInsights(events), [events]);
  const [remote, setRemote] = useState<Record<string, any> | null | undefined>(undefined);
  const assetSlots = useMemo(() => listAssetSlots(), []);
  const filledSlots = assetSlots.filter((slot) => slot.filled).length;

  useEffect(() => {
    fetchRemoteInsights(30).then(setRemote);
  }, []);

  const tiles: Metric[] = [
    {
      label: 'Survey completion',
      value: pct(metrics.surveyCompletionRate),
      target: '> 80%',
      met: metrics.surveyCompletionRate === null ? null : metrics.surveyCompletionRate > 0.8,
    },
    {
      label: 'Time to first match (median)',
      value: metrics.medianSecondsToFirstMatch === null ? '—' : `${metrics.medianSecondsToFirstMatch}s`,
      target: '< 2 min',
      met: metrics.medianSecondsToFirstMatch === null ? null : metrics.medianSecondsToFirstMatch < 120,
    },
    {
      label: 'Explored a swap',
      value: pct(metrics.swapExplorationRate),
      target: '> 40%',
      met: metrics.swapExplorationRate === null ? null : metrics.swapExplorationRate > 0.4,
    },
    {
      label: 'Rating of top-3 recipes',
      value: metrics.topThreeAverageRating === null ? '—' : `${metrics.topThreeAverageRating.toFixed(1)} / 5`,
      target: '4.2+',
      met: metrics.topThreeAverageRating === null ? null : metrics.topThreeAverageRating >= 4.2,
    },
    {
      label: 'Clicked “Make this”',
      value: pct(metrics.makeThisRate),
      target: '> 25%',
      met: metrics.makeThisRate === null ? null : metrics.makeThisRate > 0.25,
    },
    {
      label: 'Returned within 7 days',
      value: pct(metrics.repeatUsageRate),
      target: '> 60%',
      met: metrics.repeatUsageRate === null ? null : metrics.repeatUsageRate > 0.6,
    },
    {
      label: 'Picked 2+ regions',
      value: pct(metrics.multiRegionRate),
      target: '> 35%',
      met: metrics.multiRegionRate === null ? null : metrics.multiRegionRate > 0.35,
    },
  ];

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h3 className="text-lg font-bold text-gray-900">Success metrics</h3>
          <p className="text-xs text-gray-500">
            This device · {metrics.sessions} session{metrics.sessions === 1 ? '' : 's'} · {events.length} events
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {tiles.map((tile) => (
            <MetricTile key={tile.label} metric={tile} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Scoring weights A/B test</h3>
        <p className="text-xs text-gray-500 mb-3">
          Experiment <code>{SCORING_EXPERIMENT.id}</code>. Each person is assigned one variant by a hash of their user id
          (or device); add <code>?cv_variant=…</code> to the URL to preview one.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-4 font-medium">Variant</th>
                <th className="py-2 pr-4 font-medium">Weights</th>
                <th className="py-2 pr-4 font-medium text-right">Result sessions</th>
                <th className="py-2 pr-4 font-medium text-right">Opened</th>
                <th className="py-2 pr-4 font-medium text-right">Make this</th>
                <th className="py-2 pr-4 font-medium text-right">Avg rating</th>
                <th className="py-2 font-medium text-right" title="Mean reciprocal rank of opened recipes: 1 = always the top card">
                  MRR
                </th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {SCORING_EXPERIMENT.variants.map((v) => {
                const local = variants.find((o) => o.variant === v.id);
                const remoteStats = remote?.variants?.[v.id];
                return (
                  <tr key={v.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-semibold text-gray-900">{v.label}</td>
                    <td className="py-2 pr-4 text-xs text-gray-600">{v.description}</td>
                    <td className="py-2 pr-4 text-right">{local?.resultSessions ?? 0}</td>
                    <td className="py-2 pr-4 text-right">{local?.detailsOpened ?? 0}</td>
                    <td className="py-2 pr-4 text-right">{pct(local?.makeThisRate ?? null)}</td>
                    <td className="py-2 pr-4 text-right">{local?.averageRating ? local.averageRating.toFixed(1) : '—'}</td>
                    <td className="py-2 text-right">
                      {local?.meanReciprocalRank ? local.meanReciprocalRank.toFixed(2) : '—'}
                      {remoteStats?.mean_reciprocal_rank != null && (
                        <span className="block text-[10px] text-gray-500">all users {remoteStats.mean_reciprocal_rank}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-3">What people pick</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <RankedBars title="Regions" items={insights.regions} name={getRegionName} />
          <RankedBars title="Kitchens (sub-regions)" items={insights.subregions} name={getSubregionName} />
          <RankedBars title="Masala locker" items={insights.masalas} name={getMasalaName} />
          <RankedBars title="Favourite tadkas" items={insights.tadkas} name={getTadkaName} />
        </div>
        <div className="mt-6 max-w-md">
          <RankedBars title="Regions of top-3 matches" items={insights.topMatchRegions} name={getRegionName} />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Artwork</h3>
        <p className="text-xs text-gray-600 mb-3">
          {filledSlots} of {assetSlots.length} slots filled. Missing ones show their emoji; the list of files to deliver
          is in <code>docs/COOKVENTURE_ASSET_BRIEF.md</code>.
        </p>
        <details className="rounded-lg border border-gray-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-800">
            Show {assetSlots.length - filledSlots} missing files
          </summary>
          <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-xs text-gray-700">
            {assetSlots
              .filter((slot) => !slot.filled)
              .map((slot) => (
                <li key={`${slot.category}/${slot.id}`}>
                  <span aria-hidden="true">{slot.fallback}</span> <code>{`${slot.category}/${slot.id}`}</code> · {slot.name}
                </li>
              ))}
          </ul>
        </details>
      </section>

      <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-sm font-bold text-gray-900">All users (last 30 days)</h3>
        {remote === undefined && <p className="text-xs text-gray-500 mt-1">Loading…</p>}
        {remote === null && (
          <p className="text-xs text-gray-600 mt-1">
            Not available. Run <code>supabase/migrations/006_create_cookventure_events.sql</code> on the Supabase project to
            collect events from every device.
          </p>
        )}
        {remote && (
          <div className="mt-2 text-xs text-gray-700 space-y-1">
            <p>
              {remote.users ?? 0} people ·{' '}
              {Object.entries(remote.events || {})
                .map(([event, n]) => `${event.replace(/_/g, ' ')} ${n}`)
                .join(' · ') || 'no events yet'}
            </p>
            <p>
              Top regions:{' '}
              {Object.entries(remote.regions || {})
                .sort((a: any, b: any) => b[1] - a[1])
                .slice(0, 5)
                .map(([id, n]) => `${getRegionName(id)} (${n})`)
                .join(', ') || '—'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default CookventureAnalyticsTab;
