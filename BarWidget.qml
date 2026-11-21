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

  // Shape contract for shell.summon/hide/toggle: Bar.findPanelWidget
  // requires open/close/opened on the bar-widget root.
  readonly property bool opened: panelLoader.item ? panelLoader.item.opened === true : false

  function open() {
    if (panelLoader.item) panelLoader.item.open()
  }

  function close() {
    if (panelLoader.item) panelLoader.item.close()
  }

  function togglePanel() {
    if (panelLoader.item) panelLoader.item.toggle()
  }

  readonly property bool popoutSwitchClosing: panelLoader.item ? panelLoader.item.popoutSwitchClosing === true : false

  function closeForPopoutSwitch() {
    if (panelLoader.item) panelLoader.item.closeForPopoutSwitch()
  }

  function injectPanel() {
    var target = panelLoader.item
    if (!target) return
    if ("bar" in target) target.bar = root.bar
    if ("settings" in target) target.settings = root.settings
    if ("anchorItem" in target) target.anchorItem = button
    if ("hostWidget" in target) target.hostWidget = root
    if ("snapshot" in target) target.snapshot = root.snapshot
  }

  function refresh() {
    fetchRetries = 0
    startFetch()
  }

  function startFetch() {
    if (fetchProc.running) return
    fetchProc.running = true
  }

  // Three quick retries, then, only while there is no data yet, keep
  // backing off (30s, 60s, 2m, 4m, capped at 5m) instead of waiting for the
  // 15-minute tick. Covers boot/resume before the network is up.
  function scheduleRetry() {
    var delay = Model.retryDelayMs(fetchRetries, root.snapshot !== null)
    if (delay <= 0) return
    fetchRetries++
    retryTimer.interval = delay
    retryTimer.restart()
  }

  onBarChanged: injectPanel()
  onSettingsChanged: injectPanel()
  onSnapshotChanged: injectPanel()

  Loader {
    id: panelLoader
    active: true
    source: Qt.resolvedUrl("Panel.qml")
    visible: false
    onLoaded: {
      root.injectPanel()
      Qt.callLater(root.injectPanel)
    }
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
    repeat: false
    onTriggered: root.startFetch()
  }

  ShellIpc {
    target: "james.sf-weather"

    function open(): void { root.open() }
    function close(): void { root.close() }
    function show(): void { root.open() }
    function hide(): void { root.close() }
    function toggle(): void { root.togglePanel() }
    function refresh(): void { root.refresh() }
  }

  WidgetButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: root.label
    tooltipText: root.detail + " Left-click for the hourly forecast. Middle-click to refresh."
    dimmed: root.snapshot === null
    onPressed: function(mouseButton) {
      if (mouseButton === Qt.MiddleButton) root.refresh()
      else if (mouseButton === Qt.LeftButton) root.togglePanel()
    }
  }
}
