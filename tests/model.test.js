const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const Model = require("../Model.js")

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "../demo/fixtures/example.json"), "utf8"))

test("forecast command sends a custom User-Agent", () => {
  const command = Model.forecastCommand()
  assert.deepEqual(command.slice(0, 6), ["curl", "-fsS", "--max-time", "8", "-A", "james-sf-weather/0.1"])
  assert.match(command[6], /latitude=37\.7898/)
  assert.match(command[6], /longitude=-122\.3942/)
  assert.match(command[6], /hourly=temperature_2m,precipitation_probability,precipitation/)
  assert.match(command[6], /temperature_unit=fahrenheit/)
  assert.match(command[6], /wind_speed_unit=mph/)
  assert.match(command[6], /precipitation_unit=inch/)
  assert.match(command[6], /timezone=America\/Los_Angeles/)
  assert.match(command[6], /forecast_days=2/)
})

test("parseForecast reads current and daily values", () => {
  const snapshot = Model.parseForecast(JSON.stringify(fixture))
  assert.equal(snapshot.temp, "49")
  assert.equal(snapshot.feels, "46")
  assert.equal(snapshot.humidity, "91")
  assert.equal(snapshot.wind, "7")
  assert.equal(snapshot.high, "55")
  assert.equal(snapshot.low, "45")
  assert.equal(snapshot.isDay, 0)
  assert.equal(snapshot.condition, "Overcast")
  assert.equal(snapshot.icon, Model.iconForOpenMeteoCode(3, true))
  assert.equal(snapshot.currentTime, "2026-11-20T06:30")
  assert.ok(snapshot.hourly.length > 12)
})

test("parseForecast rejects empty or invalid payloads", () => {
  assert.equal(Model.parseForecast(""), null)
  assert.equal(Model.parseForecast("{"), null)
  assert.equal(Model.parseForecast(JSON.stringify({ current: {} })), null)
})

test("barLabel is glyph plus temp, stacked when vertical", () => {
  const snapshot = Model.parseForecast(JSON.stringify(fixture))
  assert.equal(Model.barLabel(null, false), "—")
  assert.equal(Model.barLabel(snapshot, false), snapshot.icon + " 49°")
  assert.equal(Model.barLabel(snapshot, true), snapshot.icon + "\n49°")
})

test("detailLine is a single summary", () => {
  const snapshot = Model.parseForecast(JSON.stringify(fixture))
  assert.equal(
    Model.detailLine(snapshot),
    "Overcast, 49°, feels 46°, wind 7 mph, humidity 91%, high 55° / low 45°"
  )
  assert.match(Model.detailLine(null), /No weather data yet/)
})

test("icons are day/night aware for clear skies", () => {
  assert.notEqual(Model.iconForOpenMeteoCode(0, false), Model.iconForOpenMeteoCode(0, true))
  assert.equal(Model.conditionText(0), "Clear")
  assert.equal(Model.conditionText(95), "Thunderstorm")
})

test("upcomingHourly picks the next 12 hours after now", () => {
  const snapshot = Model.parseForecast(JSON.stringify(fixture))
  const hours = Model.upcomingHourly(snapshot, "2026-11-20T06:30")
  assert.equal(hours.length, 12)
  assert.deepEqual(hours.map((hour) => hour.time), [
    "2026-11-20T07:00",
    "2026-11-20T08:00",
    "2026-11-20T09:00",
    "2026-11-20T10:00",
    "2026-11-20T11:00",
    "2026-11-20T12:00",
    "2026-11-20T13:00",
    "2026-11-20T14:00",
    "2026-11-20T15:00",
    "2026-11-20T16:00",
    "2026-11-20T17:00",
    "2026-11-20T18:00"
  ])
  assert.equal(Model.formatHourlyLine(hours[0]), "7 AM  50°  10%  0.00\"")
  assert.equal(Model.formatHourlyLine(hours[5]), "12 PM  55°  25%  0.00\"")
  assert.equal(Model.formatHourlyLine(hours[7]), "2 PM  53°  40%  0.12\"")
  assert.equal(Model.formatHourLabel("2026-11-21T00:00"), "12 AM")
})

test("upcomingHourly crosses midnight when the evening is late", () => {
  const snapshot = Model.parseForecast(JSON.stringify(fixture))
  const hours = Model.upcomingHourly(snapshot, "2026-11-20T22:30")
  assert.equal(hours.length, 12)
  assert.equal(hours[0].time, "2026-11-20T23:00")
  assert.equal(hours[1].time, "2026-11-21T00:00")
  assert.equal(hours[11].time, "2026-11-21T10:00")
  assert.equal(Model.formatHourlyLine(hours[0]), "11 PM  46°  8%  0.00\"")
  assert.equal(Model.formatHourlyLine(hours[1]), "12 AM  46°  5%  0.00\"")
})

test("heroLine and metaLine split the header from the muted details", () => {
  const snapshot = Model.parseForecast(JSON.stringify(fixture))
  assert.equal(Model.heroLine(snapshot), snapshot.icon + "  49°  Overcast")
  assert.equal(Model.metaLine(snapshot), "feels 46° · wind 7 mph · 91%")
  assert.equal(Model.rangeLine(snapshot), "H 55° / L 45°")
  assert.equal(Model.heroLine(null), "No weather data yet")
  assert.match(Model.metaLine(null), /refresh/)
})

test("hourlyTableRows is a 12-row aligned table starting at the upcoming hour", () => {
  const snapshot = Model.parseForecast(JSON.stringify(fixture))
  const rows = Model.hourlyTableRows(snapshot, "2026-11-20T06:30")
  assert.equal(rows.length, 12)
  assert.deepEqual(rows[0], { hour: "7 AM", temp: "50°", chance: "10%", precip: "0.00\"" })
  assert.deepEqual(rows[5], { hour: "12 PM", temp: "55°", chance: "25%", precip: "0.00\"" })
  assert.deepEqual(rows[7], { hour: "2 PM", temp: "53°", chance: "40%", precip: "0.12\"" })
  assert.deepEqual(rows[11], { hour: "6 PM", temp: "49°", chance: "20%", precip: "0.00\"" })
  const late = Model.hourlyTableRows(snapshot, "2026-11-20T22:30")
  assert.equal(late[0].hour, "11 PM")
  assert.equal(late[1].hour, "12 AM")
  assert.equal(late[11].hour, "10 AM")
})

test("retryDelayMs: quick retries, then backoff only while there is no data", () => {
  assert.equal(Model.retryDelayMs(0, false), 2500)
  assert.equal(Model.retryDelayMs(2, true), 2500)
  assert.equal(Model.retryDelayMs(3, true), 0)
  assert.equal(Model.retryDelayMs(3, false), 30000)
  assert.equal(Model.retryDelayMs(4, false), 60000)
  assert.equal(Model.retryDelayMs(20, false), 300000)
})
