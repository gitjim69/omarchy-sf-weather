# SF Weather

[![Test](https://github.com/gitjim69/omarchy-sf-weather/actions/workflows/test.yml/badge.svg)](https://github.com/gitjim69/omarchy-sf-weather/actions/workflows/test.yml)
[![Built for Omarchy: Plugin](https://raw.githubusercontent.com/tcballard/omarchy-badges/75975e5b5bf75e7ede3764bcd2950046f7abfe2c/badges/v1/omarchy-plugin.svg)](https://github.com/tcballard/omarchy-badges)

A tiny Omarchy bar widget for downtown San Francisco (ZIP 94105). It shows a
day/night weather glyph and the current temperature. There are no location
settings, no options form, and no multi-day panel.

## Usage

- The bar shows a Nerd Font weather glyph and the rounded temperature in °F,
  for example `54°`. A vertical bar stacks the glyph above the temperature.
- Hover for a one-line summary: condition, temperature, feels-like, wind,
  humidity, and today's high/low.
- Left-click opens a small popup under the widget with that summary and a
  12-hour table of temperature and precipitation. Click the widget again,
  press Escape, or click outside to close it.
- Middle-click refreshes immediately.

The location is hardcoded to 37.7898, -122.3942 (downtown 94105). Units are
°F and mph. To point it at another place, change `LATITUDE` and `LONGITUDE`
at the top of `Model.js`.

The widget fetches [Open-Meteo](https://open-meteo.com/) every 15 minutes,
retries a few times if a request fails, and keeps the last good reading.
Until the first successful fetch it shows a muted `—`. Requests send the
User-Agent `james-sf-weather/0.1`, because Open-Meteo's forecast endpoint
currently returns HTTP 403 to curl's default User-Agent.

## Requirements

- Omarchy 4 with Quattro shell-plugin support
- `curl` (already used by the built-in weather plugin)
- A Nerd Font in the bar so the weather glyphs render

Tested on Omarchy 4.5.0-3.

## Installation

The quick path on another Omarchy machine is the native git installer, which
clones into `~/.config/omarchy/plugins/james.sf-weather`, validates, rescans
the shell, and can enable the widget:

```bash
omarchy plugin add https://github.com/gitjim69/omarchy-sf-weather.git --enable
omarchy restart shell
```

With `--enable` it may ask which bar section to use. `centerEnd` is the usual
spot (where the built-in weather widget sat). You can also pass the section
yourself after a plain add:

```bash
omarchy plugin add https://github.com/gitjim69/omarchy-sf-weather.git
omarchy plugin enable james.sf-weather --section centerEnd
omarchy restart shell
```

To keep a checkout in `~/Projects`, the same pattern as the other personal
plugins:

```bash
git clone https://github.com/gitjim69/omarchy-sf-weather.git ~/Projects/omarchy-sf-weather
ln -sfn ~/Projects/omarchy-sf-weather ~/.config/omarchy/plugins/james.sf-weather
omarchy-shell shell rescanPlugins
omarchy plugin enable james.sf-weather --section centerEnd
omarchy restart shell
```

If `enable` says the plugin is unknown, run `omarchy-shell shell rescanPlugins`
and enable again. The native `plugin add --enable` path already rescans and
waits briefly for the shell to see it.

## Update

If you installed with `omarchy plugin add`:

```bash
omarchy plugin update james.sf-weather
omarchy restart shell
```

If you cloned into `~/Projects`:

```bash
git -C ~/Projects/omarchy-sf-weather pull
omarchy restart shell
```

## Removal

```bash
omarchy plugin remove james.sf-weather
omarchy restart shell
```

That disables the plugin and removes the clone or symlink under
`~/.config/omarchy/plugins`. If a `james.sf-weather` entry is still in
`~/.config/omarchy/shell.json`, you can delete it. This plugin stores no
data of its own.

## Tests

```bash
./tests/run
omarchy plugin validate .
```

## License

MIT © 2026 James (gitjim69)
