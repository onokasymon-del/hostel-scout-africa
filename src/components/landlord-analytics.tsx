import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Loader2, TrendingUp, Users, Heart, Star, DollarSign, BedDouble, Activity, Trophy } from "lucide-react";
import { getLandlordAnalytics, type LandlordAnalytics } from "@/lib/hostels-api";
import { formatPrice } from "@/lib/format";

const COLORS = ["var(--accent)", "var(--primary)", "var(--success)", "var(--destructive)", "#8b5cf6", "#f59e0b"];
const STATUS_COLORS: Record<string, string> = {
  approved: "var(--success)",
  pending: "var(--accent)",
  rejected: "var(--destructive)",
  cancelled: "var(--muted-foreground)",
};

type Range = 30 | 90 | 365;

export function LandlordAnalyticsPanel({ userId }: { userId: string }) {
  const [data, setData] = useState<LandlordAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>(90);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getLandlordAnalytics(userId)
      .then((d) => !cancelled && setData(d))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const filteredBookings = useMemo(() => {
    if (!data) return [];
    const cutoff = Date.now() - range * 86400000;
    return data.bookings.filter((b) => new Date(b.created_at).getTime() >= cutoff);
  }, [data, range]);

  const timeSeries = useMemo(() => {
    if (!data) return [];
    const bucketSize = range <= 30 ? 1 : range <= 90 ? 7 : 30;
    const buckets = Math.ceil(range / bucketSize);
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const series: { label: string; total: number; approved: number; pending: number }[] = [];
    for (let i = buckets - 1; i >= 0; i--) {
      const end = new Date(now.getTime() - i * bucketSize * 86400000);
      const start = new Date(end.getTime() - bucketSize * 86400000);
      const bucket = filteredBookings.filter((b) => {
        const t = new Date(b.created_at).getTime();
        return t > start.getTime() && t <= end.getTime();
      });
      series.push({
        label: end.toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
        total: bucket.length,
        approved: bucket.filter((b) => b.status === "approved").length,
        pending: bucket.filter((b) => b.status === "pending").length,
      });
    }
    return series;
  }, [filteredBookings, range]);

  const statusData = useMemo(() => {
    const counts = { approved: 0, pending: 0, rejected: 0, cancelled: 0 } as Record<string, number>;
    filteredBookings.forEach((b) => (counts[b.status] = (counts[b.status] ?? 0) + 1));
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filteredBookings]);

  const roomTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredBookings.forEach((b) => (counts[b.room_type] = (counts[b.room_type] ?? 0) + 1));
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredBookings]);

  const perHostelData = useMemo(() => {
    if (!data) return [];
    return data.performance
      .map((p) => ({
        name: p.hostel.name.length > 18 ? p.hostel.name.slice(0, 16) + "…" : p.hostel.name,
        bookings: p.bookings,
        wishlists: p.wishlists,
      }))
      .slice(0, 8);
  }, [data]);

  const occupancyData = useMemo(() => {
    if (!data) return [];
    return data.performance.map((p) => {
      const filled = Math.max((p.hostel.total_slots ?? 0) - (p.hostel.slots_left ?? 0), 0);
      return {
        name: p.hostel.name.length > 18 ? p.hostel.name.slice(0, 16) + "…" : p.hostel.name,
        filled,
        available: p.hostel.slots_left ?? 0,
      };
    });
  }, [data]);

  const revenueData = useMemo(() => {
    if (!data) return [];
    return data.performance
      .filter((p) => p.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map((p) => ({
        name: p.hostel.name.length > 18 ? p.hostel.name.slice(0, 16) + "…" : p.hostel.name,
        revenue: p.revenue,
      }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-16 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Crunching numbers…
      </div>
    );
  }

  if (!data || data.hostels.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <h3 className="text-lg font-bold">No data yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a hostel and start receiving bookings to unlock analytics.
        </p>
      </div>
    );
  }

  const t = data.totals;
  const currency = data.hostels[0]?.currency ?? "KES";

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight">Performance overview</h2>
        <div className="inline-flex rounded-full border border-border bg-card p-1 text-xs font-semibold">
          {([30, 90, 365] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1.5 transition ${
                range === r ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === 365 ? "1 year" : `${r} days`}
            </button>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Total bookings" value={String(t.totalBookings)} />
        <Kpi icon={<Activity className="h-4 w-4" />} label="Approved" value={String(t.approvedBookings)} tone="success" />
        <Kpi icon={<Users className="h-4 w-4" />} label="Pending" value={String(t.pendingBookings)} tone="accent" />
        <Kpi icon={<Heart className="h-4 w-4" />} label="Wishlists" value={String(t.totalWishlists)} />
        <Kpi
          icon={<Star className="h-4 w-4" />}
          label="Avg rating"
          value={t.avgRating !== null ? t.avgRating.toFixed(1) : "—"}
          sub={`${t.totalReviews} reviews`}
        />
        <Kpi
          icon={<DollarSign className="h-4 w-4" />}
          label="Projected revenue"
          value={formatPrice(t.projectedRevenue, currency)}
          sub="approved × months"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-4">
        <ChartCard title="Booking requests over time" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timeSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={2} dot={false} name="Requests" />
              <Line type="monotone" dataKey="approved" stroke="var(--success)" strokeWidth={2} dot={false} name="Approved" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Booking status mix">
          {statusData.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {statusData.map((d) => (
                    <Cell key={d.name} fill={STATUS_COLORS[d.name] ?? "var(--muted)"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, textTransform: "capitalize" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Bookings & wishlists per hostel">
          {perHostelData.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={perHostelData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="bookings" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="wishlists" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Occupancy (filled vs available)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={occupancyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="filled" stackId="a" fill="var(--success)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="available" stackId="a" fill="var(--muted)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 3 */}
      <div className="grid lg:grid-cols-3 gap-4">
        <ChartCard title="Projected revenue by hostel" className="lg:col-span-2">
          {revenueData.length === 0 ? (
            <Empty hint="Approve bookings to see projected revenue." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} width={120} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => formatPrice(v, currency)}
                />
                <Bar dataKey="revenue" fill="var(--accent)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Popular room types">
          {roomTypeData.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={roomTypeData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {roomTypeData.map((d, i) => (
                    <Cell key={d.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, textTransform: "capitalize" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Leaderboard */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <header className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
          <h3 className="text-sm font-bold inline-flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" /> Hostel leaderboard
          </h3>
          <p className="text-[11px] text-muted-foreground">Ranked by total bookings</p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Hostel</th>
                <th className="text-right px-3 py-2 font-semibold">Bookings</th>
                <th className="text-right px-3 py-2 font-semibold">Approved</th>
                <th className="text-right px-3 py-2 font-semibold">Conversion</th>
                <th className="text-right px-3 py-2 font-semibold">Occupancy</th>
                <th className="text-right px-3 py-2 font-semibold">Wishlists</th>
                <th className="text-right px-3 py-2 font-semibold">Rating</th>
                <th className="text-right px-4 py-2 font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {[...data.performance]
                .sort((a, b) => b.bookings - a.bookings)
                .map((p) => (
                  <tr key={p.hostel.id} className="border-t border-border">
                    <td className="px-4 py-2.5">
                      <div className="font-semibold truncate max-w-[220px]">{p.hostel.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[220px]">{p.hostel.location}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{p.bookings}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-success">{p.approved}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{(p.conversion * 100).toFixed(0)}%</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="h-3 w-3 text-muted-foreground" />
                        {(p.occupancy * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{p.wishlists}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {(p.hostel.reviews_count ?? 0) > 0 ? `⭐ ${(p.hostel.rating ?? 0).toFixed(1)}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold">
                      {formatPrice(p.revenue, currency)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
};

function Kpi({
  icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "accent" | "success";
}) {
  const toneClass =
    tone === "accent"
      ? "border-accent/40 bg-accent/10"
      : tone === "success"
        ? "border-success/40 bg-success/10"
        : "border-border bg-card";
  return (
    <div className={`rounded-2xl border p-3.5 ${toneClass}`}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-bold tracking-tight truncate">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 ${className}`}>
      <h3 className="text-sm font-bold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ hint }: { hint?: string }) {
  return (
    <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground text-center px-4">
      {hint ?? "Not enough data yet."}
    </div>
  );
}
