import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui
import "Model.js" as Model

BarWidget {
  id: root
  moduleName: "james.sf-weather"

  property var snapshot: null
  property int fetchRetries: 0

  readonly property string label: Model.barLabel(snapshot, root.vertical)
  readonly property string detail: Model.detailLine(snapshot)

  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  function refresh() {
    fetchRetries = 0
    startFetch()
  }

  function startFetch() {
    if (fetchProc.running) return
    fetchProc.running = true
  }

  function scheduleRetry() {
    if (fetchRetries >= 3) return
    fetchRetries++
    retryTimer.restart()
  }

  function notify() {
    if (notifyProc.running) notifyProc.running = false
    var glyph = snapshot && snapshot.icon ? snapshot.icon : ""
    var args = ["omarchy-notification-send", "--app-name", "SF Weather"]
    if (glyph) args = args.concat(["-g", glyph])
    args = args.concat(["SF Weather", Model.notificationBody(snapshot)])
    notifyProc.command = args
    notifyProc.running = true
  }

  Process {
    id: fetchProc
    command: Model.forecastCommand()
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: {
        var parsed = Model.parseForecast(text)
        if (parsed) {
          root.snapshot = parsed
          root.fetchRetries = 0
        } else {
          root.scheduleRetry()
        }
      }
    }
  }

  Process {
    id: notifyProc
  }

  Timer {
    interval: 15 * 60 * 1000
    running: true
    repeat: true
    triggeredOnStart: true
    onTriggered: root.refresh()
  }

  Timer {
    id: retryTimer
    interval: 2500
    onTriggered: root.startFetch()
  }

  WidgetButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: root.label
    tooltipText: root.detail + " Middle-click to refresh."
    dimmed: root.snapshot === null
    onPressed: function(mouseButton) {
      if (mouseButton === Qt.MiddleButton) root.refresh()
      else if (mouseButton === Qt.LeftButton) root.notify()
    }
  }
}
