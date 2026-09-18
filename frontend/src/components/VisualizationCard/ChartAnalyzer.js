/**
 * ChartAnalyzer.js
 * Intelligently analyzes SQL query results and selects the optimal Recharts configuration.
 */

export function analyzeQueryResult(rows = [], question = '') {
  if (!Array.isArray(rows) || rows.length < 2) {
    return { isChartable: false, reason: 'Dataset must contain at least 2 rows for comparative visualization' }
  }

  const keys = Object.keys(rows[0] || {})
  if (keys.length === 0) {
    return { isChartable: false, reason: 'Empty row structure' }
  }

  // Identify ID columns to avoid treating them as primary quantitative metrics
  const isIdCol = (k) => /^id$|_id$|^uuid$|^pk$|^row_num$|^index$/i.test(k)
  const candidateKeys = keys.filter((k) => !isIdCol(k))
  const workKeys = candidateKeys.length > 0 ? candidateKeys : keys

  // Classify columns into numeric vs categorical/temporal
  const numericCols = []
  const stringCols = []
  const temporalCols = []

  workKeys.forEach((col) => {
    let numericCount = 0
    let nonNullCount = 0

    rows.slice(0, 10).forEach((r) => {
      const val = r[col]
      if (val !== null && val !== undefined && val !== '') {
        nonNullCount++
        if (typeof val === 'number' || (!isNaN(val) && !isNaN(parseFloat(val)))) {
          numericCount++
        }
      }
    })

    const isNumeric = nonNullCount > 0 && numericCount / nonNullCount >= 0.8
    const isTemporal = /date|year|month|day|time|created|updated|quarter|period/i.test(col)

    if (isTemporal) {
      temporalCols.push(col)
    } else if (isNumeric) {
      numericCols.push(col)
    } else {
      stringCols.push(col)
    }
  })

  // Filter out ID columns from quantitative metrics
  const nonIdNumericCols = numericCols.filter((col) => !isIdCol(col))
  const activeNumericCols = nonIdNumericCols.length > 0 ? nonIdNumericCols : numericCols.filter((c) => !/^id$/i.test(c))

  // If no quantitative numeric metrics are present, dataset is NOT chartable
  if (activeNumericCols.length === 0) {
    return { isChartable: false, reason: 'No quantitative numeric metrics found for visualization' }
  }

  // Select label column (X-axis / Donut category)
  const labelKey = temporalCols[0] || stringCols[0] || keys.find((k) => !numericCols.includes(k)) || numericCols[0]

  // Select metric keys (Y-axis)
  const metricKeys = activeNumericCols.slice(0, 3)

  // Clean data for Recharts (convert string numbers to actual numbers)
  const chartData = rows.map((r, idx) => {
    const item = { ...r }
    item._label = r[labelKey] !== undefined && r[labelKey] !== null ? String(r[labelKey]) : `Row ${idx + 1}`

    metricKeys.forEach((mk) => {
      const val = r[mk]
      item[mk] = typeof val === 'number' ? val : parseFloat(val) || 0
    })
    return item
  })

  // Determine initial recommended chart type
  let recommendedType = 'bar'
  const isTemporal = temporalCols.length > 0 || /date|month|year|trend|over time/i.test(question)
  const isPercentage = metricKeys.some((m) => /pct|percent|ratio|share/i.test(m))
  const isDistribution = /distribution|breakdown|share|by location|by department/i.test(question)

  if (isTemporal) {
    recommendedType = 'line'
  } else if ((rows.length <= 8 && (isPercentage || isDistribution)) || /donut|pie/i.test(question)) {
    recommendedType = 'donut'
  } else if (metricKeys.length >= 2) {
    recommendedType = 'composed'
  } else if (rows.length > 15) {
    recommendedType = 'area'
  }

  // Format title & subtitle context
  const primaryMetricName = metricKeys[0] ? formatColName(metricKeys[0]) : 'Metric'
  const labelName = formatColName(labelKey)

  const title = `${primaryMetricName} by ${labelName}`

  // Compute context subtitle
  const totalCount = rows.length
  let totalMetricSum = 0
  if (metricKeys[0]) {
    totalMetricSum = chartData.reduce((acc, curr) => acc + (curr[metricKeys[0]] || 0), 0)
  }

  let subtitle = `Calculated across ${totalCount} records`
  if (/salary|pay|compensation|cost|budget|revenue|total/i.test(primaryMetricName) && totalMetricSum > 0) {
    subtitle += ` • Total volume: ${formatValue(totalMetricSum, primaryMetricName)}`
  } else if (totalCount > 1) {
    subtitle += ` • ${metricKeys.length} metric${metricKeys.length > 1 ? 's' : ''} tracked`
  }

  return {
    isChartable: true,
    labelKey: '_label',
    originalLabelKey: labelKey,
    metricKeys,
    chartData,
    recommendedType,
    title,
    subtitle,
    rowCount: rows.length,
  }
}

export function formatColName(col = '') {
  return col
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatValue(val, colName = '') {
  if (val === null || val === undefined) return '—'
  if (typeof val !== 'number') return String(val)

  const isCurrency = /salary|pay|compensation|cost|budget|revenue|amount|price|fee|paid/i.test(colName)
  const isPercent = /pct|percent|ratio|share|rate/i.test(colName)

  if (isCurrency) {
    if (Math.abs(val) >= 1_000_000) {
      return `$${(val / 1_000_000).toFixed(1)}M`
    }
    if (Math.abs(val) >= 1_000) {
      return `$${(val / 1_000).toFixed(1)}k`
    }
    return `$${val.toLocaleString()}`
  }

  if (isPercent) {
    return `${val.toFixed(1)}%`
  }

  if (Number.isInteger(val)) {
    return val.toLocaleString()
  }

  return val.toFixed(2)
}
