# SF Weather

[![Built for Omarchy: Plugin](https://raw.githubusercontent.com/tcballard/omarchy-badges/75975e5b5bf75e7ede3764bcd2950046f7abfe2c/badges/v1/omarchy-plugin.svg)](https://github.com/tcballard/omarchy-badges)

A tiny Omarchy bar widget for downtown San Francisco (ZIP 94105). It shows a
day/night weather glyph and the current temperature. There are no location
settings, no options form, and no multi-day panel.

## Usage

- The bar shows a Nerd Font weather glyph and the rounded temperature in °F,
  for example ` 54°`. A vertical bar stacks the glyph above the temperature.
- Hover for a one-line summary: condition, temperature, feels-like, wind,
  humidity, and today's high/low.
- Left-click sends a desktop notification with that summary, then the next
  12 hours of temperature and precipitation. Omarchy's toast shows two body
  lines until you hover or expand the card, and at most eight, so later
  hours may be clipped in the popup.
- Middle-click refreshes immediately.

The location is hardcoded to 37.7898, -122.3942. Units are °F and mph. The
widget fetches [Open-Meteo](https://open-meteo.com/) every 15 minutes, retries
a few times if a request fails, and keeps the last good reading. Until the
first successful fetch it shows a muted `—`.

Requests send the User-Agent `james-sf-weather/0.1`. Open-Meteo's forecast
endpoint currently returns HTTP 403 to curl's default User-Agent, which is
what broke the built-in Omarchy weather widget.

## Requirements

- Omarchy 4 with Quattro shell-plugin support.
- `curl`, already used by the built-in weather plugin.
- A Nerd Font in the bar so the weather glyphs render.

Tested on Omarchy 4.5.0-3.

If you publish this repository, pair the badge above with the GitHub topics
`omarchy` and `omarchy-plugin`.

## Installation

From this checkout, symlink it next to your other personal plugins, then add
it to the bar and restart the shell:

```bash
ln -s /home/james/Projects/omarchy-sf-weather ~/.config/omarchy/plugins/james.sf-weather
omarchy plugin enable james.sf-weather
# Place {"id": "james.sf-weather"} in ~/.config/omarchy/shell.json where you want it.
omarchy restart shell
```

For a generic git checkout you can instead run `omarchy plugin add "$(pwd)" --enable`.

## Validation and tests

```bash
./tests/run
omarchy plugin validate .
```

## Removal

```bash
omarchy plugin disable james.sf-weather
rm ~/.config/omarchy/plugins/james.sf-weather
```

Then remove the `james.sf-weather` entry from `~/.config/omarchy/shell.json` and
run `omarchy restart shell`. This plugin stores no data of its own.

## License

MIT © 2026 James (gitjim69)
