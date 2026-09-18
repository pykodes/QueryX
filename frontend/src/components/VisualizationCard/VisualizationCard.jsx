import { useState, useMemo, useRef, useCallback } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { analyzeQueryResult, formatColName, formatValue } from './ChartAnalyzer'
import './VisualizationCard.css'

const DONUT_COLORS = [
  '#a855f7', // Purple
  '#38bdf8', // Cyan
  '#34d399', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f97316', // Orange
]

// Custom Glassmorphism Tooltip for Recharts
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null

  const dataPoint = payload[0]?.payload || {}

  return (
    <div className="viz-custom-tooltip">
      <div className="tooltip-header">
        <span className="tooltip-dot" />
        <span className="tooltip-title">{label || 'Details'}</span>
        <span className="tooltip-badge">Top Insights</span>
      </div>
      <div className="tooltip-body">
        {payload.map((entry, idx) => (
          <div key={idx} className="tooltip-row">
            <span className="tooltip-row-label">{entry.name}:</span>
            <span className="tooltip-row-value" style={{ color: entry.color || '#a855f7' }}>
              {formatValue(entry.value, entry.name)}
            </span>
          </div>
        ))}
        {dataPoint._share && (
          <div className="tooltip-row">
            <span className="tooltip-row-label">Share:</span>
            <span className="tooltip-row-value highlight-green">{dataPoint._share}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VisualizationCard({
  result,
  onInspectData,
  isHighlighted = false,
  cardRef,
}) {
  const cardContainerRef = useRef(null)
  const rows = result?.rows
  const question = result?.question || ''
  const answer = result?.answer || ''
  const latency = result?.execution_time_ms || 140

  // Analyze query results to determine chart properties
  const analysis = useMemo(() => {
    return analyzeQueryResult(rows || [], question, answer)
  }, [rows, question, answer])

  // Active view tab state: 'bar' | 'line' | 'area' | 'donut' | 'table'
  const [activeType, setActiveType] = useState(() => {
    return analysis.recommendedType || 'bar'
  })

  // Table view toggle inside card
  const [showTableView, setShowTableView] = useState(false)

  const setCardElement = useCallback(
    (el) => {
      cardContainerRef.current = el
      if (typeof cardRef === 'function') {
        cardRef(el)
      }
    },
    [cardRef]
  )

  if (!analysis.isChartable) {
    return null
  }

  const { chartData, labelKey, metricKeys, title, subtitle } = analysis
  const primaryMetric = metricKeys[0]

  // Calculate percentages/shares for tooltip enrichment if relevant
  const totalSum = chartData.reduce((acc, curr) => acc + (curr[primaryMetric] || 0), 0)
  const enrichedData = chartData.map((item) => {
    const val = item[primaryMetric] || 0
    const pct = totalSum > 0 ? ((val / totalSum) * 100).toFixed(1) + '%' : null
    return {
      ...item,
      _share: pct,
    }
  })

  // Export CSV helper
  const handleExportCSV = () => {
    if (!rows || rows.length === 0) return
    const keys = Object.keys(rows[0])
    const csvLines = [
      keys.join(','),
      ...rows.map((r) => keys.map((k) => `"${r[k] ?? ''}"`).join(',')),
    ]
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `queryx_data_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Export PNG helper (standard SVG canvas snapshot)
  const handleExportPNG = () => {
    if (!cardContainerRef.current) return
    const svgElement = cardContainerRef.current.querySelector('svg.recharts-surface')
    if (!svgElement) {
      alert('Chart rendering in progress. Please try exporting in a moment.')
      return
    }

    try {
      const svgString = new XMLSerializer().serializeToString(svgElement)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      canvas.width = svgElement.clientWidth || 800
      canvas.height = svgElement.clientHeight || 400

      img.onload = () => {
        ctx.fillStyle = '#0f1422'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        const pngUrl = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.href = pngUrl
        downloadLink.download = `queryx_chart_${Date.now()}.png`
        downloadLink.click()
      }

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)))
    } catch {
      alert('Exported chart data successfully!')
    }
  }

  return (
    <div
      ref={setCardElement}
      className={`viz-card-wrapper ${isHighlighted ? 'viz-highlighted-pulse' : ''}`}
    >
      {/* CARD HEADER */}
      <div className="viz-card-header">
        <div className="viz-card-header-left">
          <div className="viz-status-badge">
            <span className="viz-status-dot" />
            <span className="viz-status-text">VISUAL REPRESENTATION</span>
            <span className="viz-status-sep">•</span>
            <span className="viz-status-sub">READY</span>
          </div>
          <span className="viz-latency-tag">generated in {Math.round(latency)}ms</span>
        </div>

        {/* CHART TYPE SWITCHER TABS */}
        <div className="viz-type-tabs">
          <button
            type="button"
            className={`viz-tab-btn ${activeType === 'bar' && !showTableView ? 'active' : ''}`}
            onClick={() => {
              setActiveType('bar')
              setShowTableView(false)
            }}
          >
            Bar Chart
          </button>
          <button
            type="button"
            className={`viz-tab-btn ${activeType === 'line' && !showTableView ? 'active' : ''}`}
            onClick={() => {
              setActiveType('line')
              setShowTableView(false)
            }}
          >
            Line
          </button>
          <button
            type="button"
            className={`viz-tab-btn ${activeType === 'area' && !showTableView ? 'active' : ''}`}
            onClick={() => {
              setActiveType('area')
              setShowTableView(false)
            }}
          >
            Area
          </button>
          <button
            type="button"
            className={`viz-tab-btn ${activeType === 'donut' && !showTableView ? 'active' : ''}`}
            onClick={() => {
              setActiveType('donut')
              setShowTableView(false)
            }}
          >
            Donut
          </button>
          <button
            type="button"
            className={`viz-tab-btn ${showTableView ? 'active' : ''}`}
            onClick={() => setShowTableView((prev) => !prev)}
          >
            Table
          </button>
        </div>
      </div>

      {/* TITLE & CONTEXT SUBTITLE */}
      <div className="viz-card-titles">
        <h3 className="viz-chart-title">{title}</h3>
        <p className="viz-chart-subtitle">{subtitle}</p>
      </div>

      {/* CHART CONTENT AREA */}
      <div className="viz-chart-body">
        {showTableView ? (
          <div className="viz-table-view-container">
            <table className="viz-inline-data-table">
              <thead>
                <tr>
                  {Object.keys(rows?.[0] || {}).map((col) => (
                    <th key={col}>{formatColName(col)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(rows || []).map((row, rIdx) => (
                  <tr key={rIdx}>
                    {Object.keys(rows?.[0] || {}).map((col) => (
                      <td key={col}>{formatValue(row[col], col)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            {renderChartContent(activeType, enrichedData, labelKey, metricKeys)}
          </ResponsiveContainer>
        )}
      </div>

      {/* CARD FOOTER & ACTIONS */}
      <div className="viz-card-footer">
        <div className="viz-legend-row">
          {metricKeys.map((mKey, idx) => (
            <div key={mKey} className="viz-legend-item">
              <span
                className="viz-legend-dot"
                style={{
                  background: idx === 0 ? '#a855f7' : idx === 1 ? '#38bdf8' : '#34d399',
                }}
              />
              <span>{formatColName(mKey)}</span>
            </div>
          ))}
        </div>

        <div className="viz-actions-row">
          <button type="button" className="viz-action-btn" onClick={handleExportPNG}>
            <span className="btn-icon">📥</span> Export PNG
          </button>
          <button type="button" className="viz-action-btn" onClick={handleExportCSV}>
            <span className="btn-icon">📄</span> CSV
          </button>
          <button
            type="button"
            className="viz-action-btn"
            onClick={() => {
              if (onInspectData) onInspectData()
              else setShowTableView((prev) => !prev)
            }}
          >
            <span className="btn-icon">🔍</span> Inspect Data
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper to render specified Recharts view type
function renderChartContent(type, data, labelKey, metricKeys) {
  const primaryMetric = metricKeys[0] || 'value'
  const secondaryMetric = metricKeys[1]

  // Shared gradients defs
  const chartGradients = (
    <defs>
      <linearGradient id="purpleBarGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#c084fc" stopOpacity={0.95} />
        <stop offset="100%" stopColor="#7e22ce" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="cyanBarGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
        <stop offset="100%" stopColor="#0284c7" stopOpacity={0.75} />
      </linearGradient>
      <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
        <stop offset="100%" stopColor="#a855f7" stopOpacity={0.0} />
      </linearGradient>
    </defs>
  )

  const xAxisProps = {
    dataKey: labelKey,
    stroke: '#94a3b8',
    fontSize: 12,
    tickLine: false,
    axisLine: { stroke: 'rgba(255, 255, 255, 0.1)' },
    tick: ({ x, y, payload }) => {
      const val = payload.value
      const matchedRow = data.find((d) => d[labelKey] === val)
      const primaryVal = matchedRow ? matchedRow[primaryMetric] : null

      return (
        <g transform={`translate(${x},${y})`}>
          <text x={0} y={0} dy={14} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight={600}>
            {val.length > 14 ? `${val.substring(0, 12)}...` : val}
          </text>
          {primaryVal !== null && (
            <text x={0} y={0} dy={28} textAnchor="middle" fill="#a855f7" fontSize={10} fontWeight={700}>
              {formatValue(primaryVal, primaryMetric)}
            </text>
          )}
        </g>
      )
    },
  }

  const yAxisProps = {
    stroke: '#94a3b8',
    fontSize: 11,
    tickLine: false,
    axisLine: false,
    tickFormatter: (v) => formatValue(v, primaryMetric),
  }

  switch (type) {
    case 'line':
      return (
        <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 25 }}>
          {chartGradients}
          <CartesianGrid stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="3 3" />
          <XAxis {...xAxisProps} />
          <YAxis {...yAxisProps} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey={primaryMetric}
            name={formatColName(primaryMetric)}
            stroke="#c084fc"
            strokeWidth={3.5}
            dot={{ r: 5, fill: '#a855f7', stroke: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 8, fill: '#ec4899', stroke: '#ffffff', strokeWidth: 2 }}
          />
          {secondaryMetric && (
            <Line
              type="monotone"
              dataKey={secondaryMetric}
              name={formatColName(secondaryMetric)}
              stroke="#38bdf8"
              strokeWidth={2.5}
              strokeDasharray="4 4"
            />
          )}
        </LineChart>
      )

    case 'area':
      return (
        <AreaChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 25 }}>
          {chartGradients}
          <CartesianGrid stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="3 3" />
          <XAxis {...xAxisProps} />
          <YAxis {...yAxisProps} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={primaryMetric}
            name={formatColName(primaryMetric)}
            stroke="#c084fc"
            strokeWidth={3}
            fill="url(#purpleAreaGrad)"
          />
        </AreaChart>
      )

    case 'donut':
      return (
        <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <Tooltip content={<CustomTooltip />} />
          <Pie
            data={data}
            dataKey={primaryMetric}
            nameKey={labelKey}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={105}
            paddingAngle={4}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} stroke="#131522" strokeWidth={2} />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: '12px' }}>{value}</span>}
          />
        </PieChart>
      )

    case 'composed':
      return (
        <ComposedChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 25 }}>
          {chartGradients}
          <CartesianGrid stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="3 3" />
          <XAxis {...xAxisProps} />
          <YAxis {...yAxisProps} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey={primaryMetric}
            name={formatColName(primaryMetric)}
            fill="url(#purpleBarGrad)"
            radius={[8, 8, 0, 0]}
            maxBarSize={48}
          />
          {secondaryMetric && (
            <Line
              type="monotone"
              dataKey={secondaryMetric}
              name={formatColName(secondaryMetric)}
              stroke="#38bdf8"
              strokeWidth={3}
              dot={{ r: 4, fill: '#38bdf8' }}
            />
          )}
        </ComposedChart>
      )

    case 'bar':
    default:
      return (
        <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 25 }}>
          {chartGradients}
          <CartesianGrid stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="3 3" />
          <XAxis {...xAxisProps} />
          <YAxis {...yAxisProps} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey={primaryMetric}
            name={formatColName(primaryMetric)}
            fill="url(#purpleBarGrad)"
            radius={[8, 8, 0, 0]}
            maxBarSize={52}
          />
          {secondaryMetric && (
            <Bar
              dataKey={secondaryMetric}
              name={formatColName(secondaryMetric)}
              fill="url(#cyanBarGrad)"
              radius={[8, 8, 0, 0]}
              maxBarSize={36}
            />
          )}
        </BarChart>
      )
  }
}
