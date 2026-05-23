interface WeatherLite {
  label: string;
  tempC: number;
}

export async function fetchOpenMeteo(lat: number, lon: number): Promise<WeatherLite> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather unreachable");

  interface Body {
    current_weather?: { temperature?: number; weathercode?: number };
  }

  const data = (await response.json()) as Body;
  const temp = Math.round(Number(data?.current_weather?.temperature ?? 0));
  const code = Number(data?.current_weather?.weathercode ?? 0);

  const desc = pickDescription(code);

  return { label: desc, tempC: temp };
}

function pickDescription(code: number): string {
  if (code === 0) return "Clear heavens";
  if ([1, 2, 3].includes(code)) return "Soft veil of clouds";
  if ([51, 53, 55, 56, 57, 61, 63, 65].includes(code)) return "Gentle rain washing the air";
  if ([95, 96, 99].includes(code)) return "Electric skies—sip warm tea steady";
  if ([71, 73, 75, 85, 86].includes(code)) return "Quiet snowfall hush";
  return "Quiet atmosphere—breathe deliberately";
}
