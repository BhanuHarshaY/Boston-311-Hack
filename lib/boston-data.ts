/**
 * Server-side data fetchers for live Boston context.
 *
 * These run directly in the Next.js API route before calling the agent,
 * so the agent receives pre-fetched data as context in its instructions
 * rather than needing to call external function tools over the network.
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
      .slice(0, 10)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((a: any) => {
        const attr = a.attributes ?? {};
        return `[${attr.effect ?? "ALERT"}] ${attr.header ?? ""}${attr.description ? " — " + (attr.description as string).slice(0, 150) : ""}`;
      });
    if (alerts.length === 0) return "No active MBTA alerts.";
    return alerts.join("\n");
  } catch (err) {
    return `MBTA fetch failed: ${err instanceof Error ? err.message : err}`;
  }
}

export async function fetchBostonWeather(): Promise<string> {
  try {
    const key = process.env.OPENWEATHERMAP_API_KEY;
    if (!key) return "Weather unavailable (OPENWEATHERMAP_API_KEY not set).";
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Boston,MA,US&appid=${key}&units=imperial`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return `Weather API error: ${res.status}`;
    const d = await res.json();
    const rain = d.rain ? ", rain expected" : "";
    return `${Math.round(d.main.temp)}°F, feels like ${Math.round(d.main.feels_like)}°F, ${d.weather[0].description}, humidity ${d.main.humidity}%, wind ${Math.round(d.wind.speed)} mph${rain}.`;
  } catch (err) {
    return `Weather fetch failed: ${err instanceof Error ? err.message : err}`;
  }
}

export async function fetchCityEvents(): Promise<string> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    // Signal to the agent to search for events itself
    return "No events API key configured — use web_search to find Boston events tonight.";
  }
  try {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const res = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?city=Boston&stateCode=MA&countryCode=US&startDateTime=${today}T00:00:00Z&endDateTime=${tomorrow}T04:00:00Z&size=8&sort=relevance,desc&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return `Ticketmaster API error: ${res.status} — use web_search to find Boston events tonight.`;
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events = (data._embedded?.events ?? []).map((e: any) => {
      const time = e.dates?.start?.localTime?.slice(0, 5) ?? "TBD";
      const venue = e._embedded?.venues?.[0]?.name ?? "TBD";
      return `${e.name} @ ${venue} at ${time}`;
    });
    if (events.length === 0) return "No ticketed events found in Boston today — use web_search to check for more.";
    return events.join("\n");
  } catch (err) {
    return `Events fetch failed: ${err instanceof Error ? err.message : err} — use web_search to find Boston events tonight.`;
  }
}

export async function fetchCityBuzz(): Promise<string> {
  try {
    const res = await fetch(
      "https://data.boston.gov/api/3/action/datastore_search?resource_id=2968e2c0-d479-49ba-a884-4ef523ada3c0&limit=10&sort=open_dt desc",
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return `City buzz unavailable (Boston 311 ${res.status}).`;
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records: any[] = data?.result?.records ?? [];
    const items = records
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((r: any) => r.type && r.neighborhood)
      .slice(0, 6)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => `• ${r.type} in ${r.neighborhood}${r.open_dt ? " (reported " + r.open_dt.slice(0, 10) + ")" : ""}`);
    if (items.length === 0) return "No recent Boston 311 activity found.";
    return "Recent Boston 311 reports:\n" + items.join("\n");
  } catch (err) {
    return `City buzz unavailable: ${err instanceof Error ? err.message : err}`;
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
