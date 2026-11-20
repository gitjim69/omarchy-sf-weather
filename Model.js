// Hardcoded downtown San Francisco (ZIP 94105).
var LATITUDE = 37.7898
var LONGITUDE = -122.3942
var USER_AGENT = "james-sf-weather/0.1"
var FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
  + "?latitude=" + LATITUDE
  + "&longitude=" + LONGITUDE
  + "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day"
  + "&daily=temperature_2m_max,temperature_2m_min"
  + "&temperature_unit=fahrenheit"
  + "&wind_speed_unit=mph"
  + "&timezone=America/Los_Angeles"
  + "&forecast_days=1"

function forecastCommand() {
  return ["curl", "-fsS", "--max-time", "8", "-A", USER_AGENT, FORECAST_URL]
}

function roundedTemp(value) {
  if (value === undefined || value === null || value === "") return ""
  var n = parseFloat(String(value))
  return isNaN(n) ? "" : String(Math.round(n))
}

function conditionText(code) {
  var c = parseInt(String(code), 10)
  if (isNaN(c)) return "Unknown"
  if (c === 0) return "Clear"
  if (c === 1) return "Mainly clear"
  if (c === 2) return "Partly cloudy"
  if (c === 3) return "Overcast"
  if (c === 45 || c === 48) return "Fog"
  if (c === 51 || c === 53 || c === 55 || c === 56 || c === 57) return "Drizzle"
  if (c === 61 || c === 63 || c === 65 || c === 66 || c === 67) return "Rain"
  if (c === 71 || c === 73 || c === 75 || c === 77) return "Snow"
  if (c === 80 || c === 81 || c === 82) return "Showers"
  if (c === 85 || c === 86) return "Snow showers"
  if (c === 95 || c === 96 || c === 99) return "Thunderstorm"
  return "Cloudy"
}

function iconForCode(code, night) {
  var c = parseInt(String(code || "0"), 10)
  switch (c) {
    case 113: return night ? "" : ""
    case 116: return night ? "" : ""
    case 119: case 122: return ""
    case 143: case 248: case 260: return night ? "\ue346" : "\ue313"
    case 176: case 263: case 353: return night ? "" : ""
    case 179: case 227: case 230: case 323: case 326: case 368: return night ? "" : ""
    case 182: case 185: case 281: case 284: case 311: case 314:
    case 317: case 320: case 350: case 362: case 365: case 374: case 377: return ""
    case 200: case 386: case 389: case 392: case 395: return ""
    case 266: case 293: case 296: case 299: case 302: case 305: case 308: case 356: case 359: return ""
    case 329: case 332: case 335: case 338: case 371: return ""
    default: return ""
  }
}

function iconForOpenMeteoCode(code, night) {
  var c = parseInt(String(code || "0"), 10)
  if (c === 0) return iconForCode(113, night)
  if (c === 1 || c === 2) return iconForCode(116, night)
  if (c === 3) return iconForCode(119, night)
  if (c === 45 || c === 48) return iconForCode(143, night)
  if (c === 51 || c === 53 || c === 55 || c === 56 || c === 57 || c === 61) return iconForCode(266, night)
  if (c === 63 || c === 65 || c === 66 || c === 67 || c === 80 || c === 81 || c === 82) return iconForCode(308, night)
  if (c === 71 || c === 73 || c === 75 || c === 77 || c === 85 || c === 86) return iconForCode(338, night)
  if (c === 95 || c === 96 || c === 99) return iconForCode(389, night)
  return iconForCode(119, night)
}

function parseForecast(raw) {
  try {
    var data = JSON.parse(String(raw || ""))
    var current = data && data.current ? data.current : null
    var daily = data && data.daily ? data.daily : null
    if (!current || current.temperature_2m === undefined || current.temperature_2m === null) return null

    var temp = roundedTemp(current.temperature_2m)
    if (!temp) return null

    var night = Number(current.is_day) === 0
    var code = current.weather_code
    return {
      temp: temp,
      feels: roundedTemp(current.apparent_temperature),
      humidity: roundedTemp(current.relative_humidity_2m),
      wind: roundedTemp(current.wind_speed_10m),
      weatherCode: code,
      isDay: night ? 0 : 1,
      high: daily && daily.temperature_2m_max ? roundedTemp(daily.temperature_2m_max[0]) : "",
      low: daily && daily.temperature_2m_min ? roundedTemp(daily.temperature_2m_min[0]) : "",
      icon: iconForOpenMeteoCode(code, night),
      condition: conditionText(code)
    }
  } catch (e) {
    return null
  }
}

function barLabel(snapshot, vertical) {
  if (!snapshot || !snapshot.temp) return "—"
  var temp = snapshot.temp + "°"
  if (vertical) return (snapshot.icon ? snapshot.icon + "\n" : "") + temp
  return (snapshot.icon ? snapshot.icon + " " : "") + temp
}

function detailLine(snapshot) {
  if (!snapshot || !snapshot.temp) return "No weather data yet. Middle-click to refresh."
  var parts = []
  parts.push((snapshot.condition || "Unknown") + ", " + snapshot.temp + "°")
  if (snapshot.feels) parts.push("feels " + snapshot.feels + "°")
  if (snapshot.wind) parts.push("wind " + snapshot.wind + " mph")
  if (snapshot.humidity) parts.push("humidity " + snapshot.humidity + "%")
  if (snapshot.high || snapshot.low) {
    var range = []
    if (snapshot.high) range.push("high " + snapshot.high + "°")
    if (snapshot.low) range.push("low " + snapshot.low + "°")
    parts.push(range.join(" / "))
  }
  return parts.join(", ")
}

if (typeof module !== "undefined") {
  module.exports = {
    LATITUDE: LATITUDE,
    LONGITUDE: LONGITUDE,
    USER_AGENT: USER_AGENT,
    FORECAST_URL: FORECAST_URL,
    forecastCommand: forecastCommand,
    roundedTemp: roundedTemp,
    conditionText: conditionText,
    iconForCode: iconForCode,
    iconForOpenMeteoCode: iconForOpenMeteoCode,
    parseForecast: parseForecast,
    barLabel: barLabel,
    detailLine: detailLine
  }
}
