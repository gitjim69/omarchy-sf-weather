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
  assert.match(command[6], /temperature_unit=fahrenheit/)
  assert.match(command[6], /wind_speed_unit=mph/)
  assert.match(command[6], /timezone=America\/Los_Angeles/)
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
