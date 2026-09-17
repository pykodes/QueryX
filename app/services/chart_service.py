from typing import Any


class ChartService:
    """
    Analyzes query result rows and recommends appropriate Chart.js visualization configurations.
    """

    COLOR_PALETTE = [
        "rgba(59, 130, 246, 0.8)",   # Blue
        "rgba(16, 185, 129, 0.8)",  # Green
        "rgba(245, 158, 11, 0.8)",  # Amber
        "rgba(239, 68, 68, 0.8)",   # Red
        "rgba(139, 92, 246, 0.8)",  # Purple
        "rgba(236, 72, 153, 0.8)",  # Pink
        "rgba(14, 165, 233, 0.8)",  # Sky Blue
        "rgba(20, 184, 166, 0.8)",  # Teal
        "rgba(249, 115, 22, 0.8)",  # Orange
        "rgba(168, 85, 247, 0.8)",  # Violet
    ]

    BORDER_PALETTE = [
        "rgba(59, 130, 246, 1)",
        "rgba(16, 185, 129, 1)",
        "rgba(245, 158, 11, 1)",
        "rgba(239, 68, 68, 1)",
        "rgba(139, 92, 246, 1)",
        "rgba(236, 72, 153, 1)",
        "rgba(14, 165, 233, 1)",
        "rgba(20, 184, 166, 1)",
        "rgba(249, 115, 22, 1)",
        "rgba(168, 85, 247, 1)",
    ]

    def generate_chart_config(self, rows: list[dict[str, Any]], title: str = "") -> dict[str, Any] | None:
        """
        Determines whether the dataset is suitable for charting and returns a Chart.js config.
        """
        if not rows or len(rows) < 2 or len(rows) > 30:
            return None

        first_row = rows[0]
        keys = list(first_row.keys())

        # Discard employee_id or ID columns from being chart labels/metrics if other columns exist
        id_keys = {k for k in keys if "id" in k.lower()}
        candidate_keys = [k for k in keys if k not in id_keys] or keys

        # Detect numeric vs categorical columns
        numeric_cols: list[str] = []
        categorical_cols: list[str] = []

        for col in candidate_keys:
            # Check values in first few rows
            is_num = True
            for r in rows[:5]:
                val = r.get(col)
                if val is not None and not isinstance(val, (int, float)):
                    is_num = False
                    break
            if is_num:
                numeric_cols.append(col)
            else:
                categorical_cols.append(col)

        # We need at least one numeric metric to plot a chart
        if not numeric_cols:
            return None

        # Choose label column
        label_col = categorical_cols[0] if categorical_cols else candidate_keys[0]

        # Extract labels
        labels = [str(r.get(label_col, f"Row {i+1}")) for i, r in enumerate(rows)]

        # Choose primary numeric metric
        primary_metric = numeric_cols[0]

        # Check for time/date column for line chart
        is_temporal = any(
            t in label_col.lower() for t in ["date", "year", "month", "day", "time"]
        )

        # Decide chart type
        chart_type = "bar"
        if is_temporal:
            chart_type = "line"
        elif len(rows) <= 8 and any(term in primary_metric.lower() for term in ["count", "percentage", "share", "ratio"]):
            chart_type = "doughnut"

        # Build datasets
        datasets = []
        for idx, num_col in enumerate(numeric_cols[:2]):  # Plot at most 2 metrics to keep chart readable
            data_values = [r.get(num_col, 0) for r in rows]
            label_name = num_col.replace("_", " ").title()

            if chart_type in ["pie", "doughnut"]:
                bg_colors = self.COLOR_PALETTE[: len(labels)]
                border_colors = self.BORDER_PALETTE[: len(labels)]
            else:
                color_idx = idx % len(self.COLOR_PALETTE)
                bg_colors = self.COLOR_PALETTE[color_idx]
                border_colors = self.BORDER_PALETTE[color_idx]

            datasets.append(
                {
                    "label": label_name,
                    "data": data_values,
                    "backgroundColor": bg_colors,
                    "borderColor": border_colors,
                    "borderWidth": 1.5,
                }
            )

        clean_title = title or f"{primary_metric.replace('_', ' ').title()} by {label_col.replace('_', ' ').title()}"

        return {
            "type": chart_type,
            "title": clean_title,
            "labels": labels,
            "datasets": datasets,
        }
