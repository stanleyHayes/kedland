import { NAV_GROUPS } from "@/components/shell/nav-config";

/**
 * Phase 0 placeholder. The real shell — fixed sidebar with collapsible grouped
 * nav, sticky contextual header, route-transition skeletons — lands in Phase 7
 * (agent_plan §8, modelled on the oguaaman admin layout).
 */
export default function OverviewPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h1>Kedland Dashboard</h1>
      <p className="mt-3 text-grey">
        Foundation scaffold. Sign-in, the app shell and every surface below arrive in Phase 7.
      </p>

      <h2 className="mt-10 text-h3">Planned sections</h2>
      <ul className="mt-4 space-y-4">
        {NAV_GROUPS.map((group) => (
          <li key={group.title} className="rounded-lg bg-white p-5 shadow-card">
            <h3 className="text-small font-bold uppercase tracking-[0.06em] text-grey">{group.title}</h3>
            <p className="mt-2">{group.items.map((item) => item.label).join(" · ")}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
