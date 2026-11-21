import QtQuick
import qs.Commons
import qs.Commons as Commons
import qs.Ui
import "Model.js" as Model

Panel {
  id: root
  moduleName: "james.sf-weather"
  ipcTarget: "james.sf-weather"
  manageIpc: false

  property var anchorItem: null
  property var hostWidget: null
  property var snapshot: null
  property var asOf: new Date()

  readonly property var barIdentity: hostWidget || root
  readonly property color contentForeground: bar ? bar.foreground : Commons.Color.foreground
  readonly property color mutedForeground: Commons.Color.muted
  readonly property string contentFontFamily: bar ? bar.fontFamily : Style.font.family

  readonly property var hourlyRows: Model.hourlyTableRows(snapshot, asOf)
  readonly property string heroText: Model.heroLine(snapshot)
  readonly property string metaText: Model.metaLine(snapshot)
  readonly property string rangeText: Model.rangeLine(snapshot)
  readonly property string iconText: snapshot && snapshot.icon ? snapshot.icon : ""
  readonly property string tempText: snapshot && snapshot.temp ? snapshot.temp + "°" : "—"
  readonly property string conditionText: snapshot && snapshot.condition ? snapshot.condition : (snapshot ? "" : "No data yet")

  // contentWidth on KeyboardPanel is the full card width, including padding
  // and border. fittedContentWidth() does not add those insets (height does),
  // so the inner table must be padded out or it will overflow the right edge.
  readonly property int horizontalContentInset: panel.padding * 2
    + Border.left(panel.borderSpec) + Border.right(panel.borderSpec)
  readonly property int columnGap: Style.space(16)

  FontMetrics {
    id: bodyMetrics
    font.family: root.contentFontFamily
    font.pixelSize: Style.font.body
  }
  FontMetrics {
    id: captionMetrics
    font.family: root.contentFontFamily
    font.pixelSize: Style.font.caption
  }

  function textWidth(metrics, value) {
    return Math.ceil(metrics.advanceWidth(String(value || "")))
  }

  readonly property int hourColWidth: Math.max(textWidth(captionMetrics, "Hour"), textWidth(bodyMetrics, "12 PM")) + Style.space(4)
  readonly property int tempColWidth: Math.max(textWidth(captionMetrics, "Temp"), textWidth(bodyMetrics, "100°"))
  readonly property int rainColWidth: Math.max(textWidth(captionMetrics, "Rain %"), textWidth(bodyMetrics, "100%"))
  readonly property int inchColWidth: Math.max(textWidth(captionMetrics, "Inches"), textWidth(bodyMetrics, "10.00\""))
  readonly property int tableWidth: hourColWidth + tempColWidth + rainColWidth + inchColWidth + columnGap * 3

  function open() {
    asOf = new Date()
    root.controller.show()
    Qt.callLater(function() {
      if (root.opened) setCenterHoverRevealSuppressed(true)
    })
  }

  function close() {
    setCenterHoverRevealSuppressed(false)
    root.controller.hide()
  }

  function toggle() {
    if (root.opened) root.close()
    else root.open()
  }

  function switchPanel(direction) {
    if (root.bar && typeof root.bar.switchPanelFrom === "function")
      return root.bar.switchPanelFrom(root.barIdentity, direction)
    return false
  }

  function setCenterHoverRevealSuppressed(value) {
    if (root.bar && typeof root.bar.setCenterHoverRevealSuppressed === "function")
      root.bar.setCenterHoverRevealSuppressed(value)
    else if (root.bar && "centerHoverRevealSuppressed" in root.bar)
      root.bar.centerHoverRevealSuppressed = value
  }

  KeyboardPanel {
    id: panel
    anchorItem: root.anchorItem
    owner: root.barIdentity
    bar: root.bar
    open: root.opened
    centerOnBar: false
    focusTarget: panel.loadedContent
    contentWidth: panel.fittedContentWidth(root.tableWidth + root.horizontalContentInset)
    contentHeight: panel.fittedContentHeight(panel.loadedContentHeight)

    content: PanelKeyCatcher {
      id: keyCatcher
      implicitWidth: body.implicitWidth
      implicitHeight: body.implicitHeight
      onCloseRequested: root.close()
      onTabRequested: function(direction) { root.switchPanel(direction) }

      Column {
        id: body
        width: root.tableWidth
        spacing: Style.space(10)

        Row {
          id: heroRow
          spacing: Style.space(10)
          width: parent.width

          Text {
            text: root.iconText
            color: root.contentForeground
            font.family: root.contentFontFamily
            font.pixelSize: Style.font.heading
            verticalAlignment: Text.AlignVCenter
            height: Math.max(implicitHeight, tempLabel.implicitHeight)
          }

          Text {
            id: tempLabel
            text: root.tempText
            color: root.contentForeground
            font.family: root.contentFontFamily
            font.pixelSize: Style.font.heading
            verticalAlignment: Text.AlignVCenter
          }

          Text {
            id: conditionLabel
            text: root.conditionText
            width: Math.max(0, heroRow.width - x)
            elide: Text.ElideRight
            color: root.contentForeground
            font.family: root.contentFontFamily
            font.pixelSize: Style.font.title
            verticalAlignment: Text.AlignVCenter
            height: tempLabel.implicitHeight
          }
        }

        Column {
          width: parent.width
          spacing: Style.space(2)

          Text {
            width: parent.width
            text: root.metaText
            color: root.mutedForeground
            font.family: root.contentFontFamily
            font.pixelSize: Style.font.bodySmall
            wrapMode: Text.WordWrap
          }

          Text {
            width: parent.width
            visible: root.rangeText !== ""
            text: root.rangeText
            color: root.mutedForeground
            font.family: root.contentFontFamily
            font.pixelSize: Style.font.bodySmall
            wrapMode: Text.NoWrap
          }
        }

        Column {
          id: table
          width: parent.width
          spacing: Style.space(4)
          visible: root.hourlyRows.length > 0

          Row {
            id: headerRow
            spacing: Style.space(16)
            width: parent.width

            Text {
              width: root.hourColWidth
              text: "Hour"
              color: root.mutedForeground
              font.family: root.contentFontFamily
              font.pixelSize: Style.font.caption
            }
            Text {
              width: root.tempColWidth
              text: "Temp"
              color: root.mutedForeground
              font.family: root.contentFontFamily
              font.pixelSize: Style.font.caption
              horizontalAlignment: Text.AlignRight
            }
            Text {
              width: root.rainColWidth
              text: "Rain %"
              color: root.mutedForeground
              font.family: root.contentFontFamily
              font.pixelSize: Style.font.caption
              horizontalAlignment: Text.AlignRight
            }
            Text {
              width: root.inchColWidth
              text: "Inches"
              color: root.mutedForeground
              font.family: root.contentFontFamily
              font.pixelSize: Style.font.caption
              horizontalAlignment: Text.AlignRight
            }
          }

          Repeater {
            model: root.hourlyRows

            Row {
              required property var modelData
              spacing: Style.space(16)
              width: table.width

              Text {
                width: root.hourColWidth
                text: modelData.hour
                color: root.contentForeground
                font.family: root.contentFontFamily
                font.pixelSize: Style.font.body
              }
              Text {
                width: root.tempColWidth
                text: modelData.temp
                color: root.contentForeground
                font.family: root.contentFontFamily
                font.pixelSize: Style.font.body
                horizontalAlignment: Text.AlignRight
              }
              Text {
                width: root.rainColWidth
                text: modelData.chance
                color: root.contentForeground
                font.family: root.contentFontFamily
                font.pixelSize: Style.font.body
                horizontalAlignment: Text.AlignRight
              }
              Text {
                width: root.inchColWidth
                text: modelData.precip
                color: root.contentForeground
                font.family: root.contentFontFamily
                font.pixelSize: Style.font.body
                horizontalAlignment: Text.AlignRight
              }
            }
          }
        }
      }
    }
  }
}
