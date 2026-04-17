/**
 * Server-side data fetchers for live Boston context.
 * Injected as pre-fetched context into the agent instructions.
 */

export interface BostonLiveData {
  mbta: string;
  weather: string;
  events: string;
  buzz: string;
}

export async function fetchMBTAAlerts(): Promise<string> {
  try {
    const res = await fetch(
      "https://api-v3.mbta.com/alerts?filter[activity]=BOARD&filter[lifecycle]=NEW,ONGOING,ONGOING_UPCOMING&sort=severity",
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return `MBTA API error: ${res.status}`;
    const data = await res.json();
    const alerts = (data.data ?? [])
      .slice(0, 5)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((a: any) => {
        const attr = a.attributes ?? {};
        return `[${attr.effect ?? "ALERT"}] ${attr.header ?? ""}`;
      });
    if (alerts.length === 0) return "No active MBTA alerts.";
    return alerts.join("\n");
  } catch (err) {
    return `MBTA fetch failed: ${err instanceof Error ? err.message : err}`;
  }
}

export async function fetchBostonWeather(): Promise<string> {
  try {
    // Open-Meteo — no API key needed
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=42.36&longitude=-71.06&current=temperature_2m,weather_code,precipitation,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph",
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return `Weather API error: ${res.status}`;
    const d = await res.json();
    const c = d.current;
    const temp = Math.round(c.temperature_2m);
    const precip = c.precipitation > 0 ? `, ${c.precipitation}mm precipitation` : "";
    const wind = Math.round(c.wind_speed_10m);
    const condition = weatherCodeToDesc(c.weather_code);
    return `${temp}°F, ${condition}, wind ${wind} mph${precip}.`;
  } catch (err) {
    return `Weather fetch failed: ${err instanceof Error ? err.message : err}`;
  }
}

function weatherCodeToDesc(code: number): string {
  if (code === 0) return "clear sky";
  if (code <= 3) return "partly cloudy";
  if (code <= 49) return "foggy";
  if (code <= 59) return "drizzle";
  if (code <= 69) return "rain";
  if (code <= 79) return "snow";
  if (code <= 82) return "rain showers";
  if (code <= 84) return "snow showers";
  if (code <= 99) return "thunderstorms";
  return "overcast";
}

export async function fetchCityEvents(): Promise<string> {
  // Mock events — real API can be swapped in later
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return `Events for ${today}:
• Free Concert at Boston Common Bandstand — 6:00 PM (outdoor, bring a blanket)
• Farmers Market at Copley Square — 9:00 AM–2:00 PM (fresh produce & local vendors)
• Children's Story Time at Boston Public Library — 3:00 PM (all ages welcome, free)`;
}

// Current resource IDs (updated 2026)
const RESOURCE_2026 = "1a0b420d-99f1-4887-9851-990b2a5a6e17";
const RESOURCE_2025 = "9d7c2214-4709-478a-a2e8-fb2020a5bb94";

export async function fetchCityBuzz(): Promise<string> {
  try {
    const res = await fetch(
      `https://data.boston.gov/api/3/action/datastore_search?resource_id=${RESOURCE_2026}&limit=8&sort=open_dt desc`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return `Boston 311 unavailable (${res.status}).`;
    const data = await res.json();
    if (!data.success) return `Boston 311 error: ${data.error?.message ?? "unknown"}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records: any[] = data?.result?.records ?? [];
    const items = records
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((r: any) => r.case_title && r.neighborhood)
      .slice(0, 5)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => `• ${r.case_title} in ${r.neighborhood} (${r.case_status ?? "Open"})`);
    if (items.length === 0) return "No recent 311 activity found.";
    return "Recent 311 reports:\n" + items.join("\n");
  } catch (err) {
    return `311 data unavailable: ${err instanceof Error ? err.message : err}`;
  }
}

export async function fetchAllBostonData(): Promise<BostonLiveData> {
  const [mbta, weather, events, buzz] = await Promise.all([
    fetchMBTAAlerts(),
    fetchBostonWeather(),
    fetchCityEvents(),
    fetchCityBuzz(),
  ]);
  return { mbta, weather, events, buzz };
}

// ── Standalone tool functions (called by agent function tools) ──

export async function query311Cases(params: {
  neighborhood?: string;
  caseType?: string;
  caseId?: string;
  streetName?: string;
  limit?: number;
}) {
  try {
    const { neighborhood, caseType, caseId, streetName, limit = 10 } = params;

    // Build SQL WHERE clauses — search both 2026 and 2025 resources
    const conditions: string[] = [];
    if (neighborhood) conditions.push(`neighborhood ILIKE '%${neighborhood.replace(/'/g, "''")}%'`);
    if (caseType) conditions.push(`case_title ILIKE '%${caseType.replace(/'/g, "''")}%'`);
    if (caseId) conditions.push(`case_enquiry_id = '${caseId.replace(/'/g, "''")}'`);
    if (streetName) conditions.push(`location_street_name ILIKE '%${streetName.replace(/'/g, "''")}%'`);

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const fields = "case_enquiry_id, case_status, case_title, neighborhood, location_street_name, open_dt, closed_dt, sla_target_dt, on_time";

    // Try 2026 first, fall back to 2025 for older cases
    const sql2026 = encodeURIComponent(`SELECT ${fields} FROM "${RESOURCE_2026}" ${where} ORDER BY open_dt DESC LIMIT ${limit}`);
    const res = await fetch(
      `https://data.boston.gov/api/3/action/datastore_search_sql?sql=${sql2026}`,
      { signal: AbortSignal.timeout(10000) },
    );

    if (!res.ok) return { error: `Boston 311 API error: ${res.status}` };
    const data = await res.json();
    if (!data.success) return { error: `311 query error: ${data.error?.message ?? "unknown"}` };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let records: any[] = data?.result?.records ?? [];

    // If few results in 2026, also check 2025
    if (records.length < 3 && !caseId) {
      try {
        const sql2025 = encodeURIComponent(`SELECT ${fields} FROM "${RESOURCE_2025}" ${where} ORDER BY open_dt DESC LIMIT ${limit}`);
        const res2 = await fetch(
          `https://data.boston.gov/api/3/action/datastore_search_sql?sql=${sql2025}`,
          { signal: AbortSignal.timeout(8000) },
        );
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2.success) records = [...records, ...(data2?.result?.records ?? [])];
        }
      } catch { /* 2025 fallback optional */ }
    }

    if (records.length === 0) {
      const searchDesc = [streetName, caseType, neighborhood].filter(Boolean).join(", ");
      return { cases: [], summary: `No 311 cases found${searchDesc ? ` for ${searchDesc}` : ""}.` };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cases = records.map((r: any) => ({
      case_id: r.case_enquiry_id,
      status: r.case_status,
      description: r.case_title,
      street: r.location_street_name,
      neighborhood: r.neighborhood,
      opened_date: r.open_dt?.slice(0, 10),
      closed_date: r.closed_dt?.slice(0, 10) ?? null,
      sla_target: r.sla_target_dt?.slice(0, 10) ?? null,
      on_time: r.on_time,
    }));

    const open = cases.filter((c) => c.status !== "Closed").length;
    const closed = cases.filter((c) => c.status === "Closed").length;
    return {
      cases,
      summary: `Found ${cases.length} case(s): ${open} open, ${closed} closed.`,
    };
  } catch (err) {
    return { error: `311 query failed: ${err instanceof Error ? err.message : err}` };
  }
}

export async function getWeatherTool(params: { lat?: number; lon?: number }) {
  try {
    const lat = params.lat ?? 42.36;
    const lon = params.lon ?? -71.06;
    // precipitation_probability_max is daily-only; use hourly for current-hour chance
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,precipitation,wind_speed_10m&hourly=precipitation_probability&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=1`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return { error: `Weather API error: ${res.status}` };
    const d = await res.json();
    if (d.error) return { error: `Weather error: ${d.reason ?? d.error}` };
    const c = d.current;
    const temp = Math.round(c.temperature_2m);
    const condition = weatherCodeToDesc(c.weather_code);
    // Get precipitation probability for the current hour
    const currentHour = new Date().getHours();
    const precipChance = d.hourly?.precipitation_probability?.[currentHour] ?? 0;
    const wind = Math.round(c.wind_speed_10m);
    const summary = precipChance > 50
      ? `It's ${temp}°F and ${condition}. Bring an umbrella — ${precipChance}% chance of rain.`
      : `It's ${temp}°F and ${condition}. ${wind > 15 ? "Breezy today — " : ""}${precipChance > 20 ? `${precipChance}% chance of rain.` : "Looks like a nice day!"}`;
    return { temp_f: temp, condition, precipitation_chance_pct: precipChance, wind_mph: wind, summary };
  } catch (err) {
    return { error: `Weather fetch failed: ${err instanceof Error ? err.message : err}` };
  }
}

export async function getLocalEventsTool(params: { neighborhood?: string }) {
  const neighborhood = params.neighborhood ?? "Boston";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return {
    date: today,
    neighborhood,
    events: [
      {
        name: "Free Concert at Boston Common Bandstand",
        time: "6:00 PM",
        location: "Boston Common, Boston",
        description: "Free outdoor concert. Bring a blanket or lawn chair.",
        cost: "Free",
      },
      {
        name: "Farmers Market at Copley Square",
        time: "9:00 AM – 2:00 PM",
        location: "Copley Square, Back Bay",
        description: "Fresh produce, local food vendors, and crafts.",
        cost: "Free entry",
      },
      {
        name: "Children's Story Time at Boston Public Library",
        time: "3:00 PM",
        location: "Boston Public Library, Copley",
        description: "Free story time for children of all ages. All are welcome.",
        cost: "Free",
      },
    ],
  };
}

export async function getNeighborhoodTrends(params: { neighborhood: string; metric?: string }) {
  try {
    const { neighborhood } = params;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const sql = encodeURIComponent(
      `SELECT case_title, case_status, open_dt FROM "${RESOURCE_2026}" WHERE neighborhood ILIKE '%${neighborhood.replace(/'/g, "''")}%' AND open_dt >= '${thirtyDaysAgo}' ORDER BY open_dt DESC LIMIT 100`
    );
    const res = await fetch(
      `https://data.boston.gov/api/3/action/datastore_search_sql?sql=${sql}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return { error: `311 API error: ${res.status}` };
    const data = await res.json();
    if (!data.success) return { error: `311 error: ${data.error?.message ?? "unknown"}` };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records: any[] = data?.result?.records ?? [];

    const typeCounts: Record<string, number> = {};
    for (const r of records) {
      const t = r.case_title ?? "Unknown";
      typeCounts[t] = (typeCounts[t] ?? 0) + 1;
    }
    const topTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => `${type}: ${count}`);

    const openCount = records.filter((r) => r.case_status !== "Closed").length;
    const closedCount = records.filter((r) => r.case_status === "Closed").length;

    const summary = records.length === 0
      ? `No recent 311 reports found for ${neighborhood} in the last 30 days.`
      : `${neighborhood} had ${records.length} 311 reports in the last 30 days. ${openCount} still open, ${closedCount} resolved. Top issues: ${topTypes.slice(0, 3).join(", ")}.`;

    return {
      neighborhood,
      period: "last 30 days",
      total_reports: records.length,
      open: openCount,
      closed: closedCount,
      top_complaint_types: typeCounts,
      summary,
    };
  } catch (err) {
    return { error: `Trends fetch failed: ${err instanceof Error ? err.message : err}` };
  }
}
