// ============================================================
// QueryX Frontend Application Logic
// ============================================================

let currentChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("query-form");
  const input = document.getElementById("question-input");
  const clearBtn = document.getElementById("btn-clear");
  const submitBtn = document.getElementById("btn-submit");
  const submitSpinner = document.getElementById("submit-spinner");
  const btnText = submitBtn.querySelector(".btn-text");
  const providerSelect = document.getElementById("provider-select");

  const resultsSection = document.getElementById("results-section");
  const answerText = document.getElementById("ai-answer-text");
  const metricTime = document.getElementById("metric-time");
  const metricRows = document.getElementById("metric-rows");
  const sqlCode = document.getElementById("generated-sql-code");
  const copyBtn = document.getElementById("btn-copy-sql");
  const copyText = document.getElementById("copy-text");
  const tableContainer = document.getElementById("table-container");
  const tableHead = document.getElementById("table-head");
  const tableBody = document.getElementById("table-body");
  const tableRecordCount = document.getElementById("table-record-count");
  const chartPanel = document.getElementById("chart-panel");
  const chartCanvas = document.getElementById("results-chart");

  const errorBanner = document.getElementById("error-banner");
  const errorMessage = document.getElementById("error-message");
  const btnCloseError = document.getElementById("btn-close-error");

  const btnSchemaModal = document.getElementById("btn-schema-modal");
  const schemaModal = document.getElementById("schema-modal");
  const btnCloseSchema = document.getElementById("btn-close-schema");
  const schemaContent = document.getElementById("schema-content");

  // Show/Hide clear button
  input.addEventListener("input", () => {
    clearBtn.style.display = input.value.trim() ? "block" : "none";
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    clearBtn.style.display = "none";
    input.focus();
  });

  // Close error banner
  btnCloseError.addEventListener("click", () => {
    errorBanner.style.display = "none";
  });

  // Copy SQL
  copyBtn.addEventListener("click", async () => {
    const textToCopy = sqlCode.textContent;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      copyText.textContent = "Copied!";
      setTimeout(() => {
        copyText.textContent = "Copy";
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  });

  // Fetch Health & Sample Questions
  checkHealth();
  loadSampleQuestions();

  // Handle Form Submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    const provider = providerSelect.value;
    await executeQuery(query, provider);
  });

  // Execute Query Pipeline
  async function executeQuery(question, provider) {
    setLoading(true);
    hideError();

    try {
      const response = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, provider }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        showError(data.error || `HTTP error ${response.status}`);
        if (data.generated_sql) {
          // Display the failed SQL query if available for debugging
          sqlCode.textContent = data.generated_sql;
          resultsSection.style.display = "grid";
        }
        return;
      }

      renderResults(data);
    } catch (err) {
      showError(`Network connection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Render Results
  function renderResults(data) {
    resultsSection.style.display = "grid";

    // Metrics
    metricTime.textContent = `${data.execution_time_ms} ms`;
    metricRows.textContent = `${data.row_count} row${data.row_count === 1 ? "" : "s"}`;

    // AI Natural Language Answer
    answerText.textContent = data.answer || "Query completed successfully.";

    // Generated SQL
    sqlCode.textContent = data.generated_sql || "-- No SQL generated";

    // Table Rendering
    renderTable(data.rows);

    // Chart Rendering
    if (data.chart) {
      chartPanel.style.display = "flex";
      renderChart(data.chart);
    } else {
      chartPanel.style.display = "none";
      if (currentChartInstance) {
        currentChartInstance.destroy();
        currentChartInstance = null;
      }
    }

    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Render Table
  function renderTable(rows) {
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    if (!rows || rows.length === 0) {
      tableRecordCount.textContent = "0 records";
      tableBody.innerHTML = `<tr><td colspan="100" style="text-align: center; padding: 24px; color: var(--text-muted);">No records found matching criteria.</td></tr>`;
      return;
    }

    tableRecordCount.textContent = `${rows.length} records returned`;

    const headers = Object.keys(rows[0]);
    const headerRow = document.createElement("tr");
    headers.forEach((h) => {
      const th = document.createElement("th");
      th.textContent = h.replace(/_/g, " ");
      headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);

    rows.forEach((row) => {
      const tr = document.createElement("tr");
      headers.forEach((h) => {
        const td = document.createElement("td");
        const val = row[h];
        if (typeof val === "number") {
          td.textContent = Number.isInteger(val) ? val.toLocaleString() : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          td.style.fontFamily = "var(--font-mono)";
        } else {
          td.textContent = val !== null && val !== undefined ? String(val) : "—";
        }
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
  }

  // Render Chart
  function renderChart(config) {
    if (currentChartInstance) {
      currentChartInstance.destroy();
    }

    const ctx = chartCanvas.getContext("2d");
    const heading = document.getElementById("chart-heading");
    if (config.title) {
      heading.textContent = config.title;
    }

    const isDonut = config.type === "doughnut" || config.type === "pie";

    currentChartInstance = new Chart(ctx, {
      type: config.type,
      data: {
        labels: config.labels,
        datasets: config.datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: isDonut,
            position: "bottom",
            labels: {
              color: "#94a3b8",
              font: { family: "'Outfit', sans-serif", size: 12 },
              padding: 12,
            },
          },
          tooltip: {
            backgroundColor: "#1e293b",
            titleColor: "#f8fafc",
            bodyColor: "#93c5fd",
            borderColor: "#334155",
            borderWidth: 1,
            padding: 10,
          },
        },
        scales: isDonut
          ? {}
          : {
              x: {
                grid: { color: "rgba(255, 255, 255, 0.04)" },
                ticks: { color: "#94a3b8", font: { family: "'Outfit', sans-serif" } },
              },
              y: {
                grid: { color: "rgba(255, 255, 255, 0.04)" },
                ticks: { color: "#94a3b8", font: { family: "'JetBrains Mono', monospace" } },
              },
            },
      },
    });
  }

  // Load Sample Questions
  async function loadSampleQuestions() {
    const chipsContainer = document.getElementById("sample-chips");
    chipsContainer.innerHTML = "";

    try {
      const res = await fetch("/api/sample-questions");
      const data = await res.json();
      const questions = data.questions || [];

      questions.forEach((q) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip";
        chip.textContent = q;
        chip.addEventListener("click", () => {
          input.value = q;
          clearBtn.style.display = "block";
          executeQuery(q, providerSelect.value);
        });
        chipsContainer.appendChild(chip);
      });
    } catch (e) {
      console.warn("Could not load sample questions:", e);
    }
  }

  // Check Backend Status
  async function checkHealth() {
    const statusPill = document.getElementById("system-status");
    const statusDot = statusPill.querySelector(".status-dot");
    const statusText = document.getElementById("status-text");

    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      if (data.status === "healthy") {
        statusDot.className = "status-dot online";
        statusText.textContent = "Backend Connected";
      } else {
        statusDot.className = "status-dot offline";
        statusText.textContent = "Service Warning";
      }
    } catch (e) {
      statusDot.className = "status-dot offline";
      statusText.textContent = "Backend Offline";
    }
  }

  // Schema Modal
  btnSchemaModal.addEventListener("click", async () => {
    schemaModal.style.display = "flex";
    schemaContent.innerHTML = `<div style="display:flex; justify-content:center; padding:32px;"><div class="spinner"></div></div>`;

    try {
      const res = await fetch("/api/schema");
      const data = await res.json();
      renderSchema(data.schema);
    } catch (e) {
      schemaContent.innerHTML = `<p style="color: var(--accent-rose)">Failed to load schema: ${e.message}</p>`;
    }
  });

  btnCloseSchema.addEventListener("click", () => {
    schemaModal.style.display = "none";
  });

  schemaModal.addEventListener("click", (e) => {
    if (e.target === schemaModal) {
      schemaModal.style.display = "none";
    }
  });

  function renderSchema(schema) {
    schemaContent.innerHTML = "";
    if (!schema) return;

    for (const [table, columns] of Object.entries(schema)) {
      const box = document.createElement("div");
      box.className = "schema-table-box";

      const title = document.createElement("div");
      title.className = "schema-table-title";
      title.textContent = `Table: ${table} (${columns.length} columns)`;
      box.appendChild(title);

      const grid = document.createElement("div");
      grid.className = "schema-cols-grid";

      columns.forEach((col) => {
        const item = document.createElement("div");
        item.className = "schema-col-item";
        item.innerHTML = `
          <span class="schema-col-name">${col.name} ${col.pk ? "🔑" : ""}</span>
          <span class="schema-col-type">${col.type || "ANY"}</span>
        `;
        grid.appendChild(item);
      });

      box.appendChild(grid);
      schemaContent.appendChild(box);
    }
  }

  function setLoading(isLoading) {
    submitSpinner.style.display = isLoading ? "block" : "none";
    btnText.style.display = isLoading ? "none" : "block";
    submitBtn.disabled = isLoading;
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorBanner.style.display = "flex";
    errorBanner.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function hideError() {
    errorBanner.style.display = "none";
  }
});
