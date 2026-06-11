from __future__ import annotations

from datetime import date

from .helpers import date_from_value, date_text, num, pct, round_money, safe_ratio


def calculate_bms_marketing_forecast(inputs: dict[str, object]) -> dict:
    years = inputs.get("forecastYears")
    if not isinstance(years, list):
        years = []

    survey_fee = num(inputs.get("surveyFee"))
    cash_collect_per_sale = num(inputs.get("cashCollectPerSale"))
    average_hours_per_go = num(inputs.get("averageHoursPerGo"))
    average_rate_per_hour = num(inputs.get("averageRatePerHour"))
    commission_rate = num(inputs.get("commissionPercent")) / 100.0
    salary_per_head = num(inputs.get("salaryPerHead"))

    rows: list[dict] = []
    total_revenue = 0.0
    total_cost = 0.0
    total_operating_income = 0.0
    peak_headcount = 0.0

    for index, raw_year in enumerate(years[:5]):
        year = raw_year if isinstance(raw_year, dict) else {}
        sales_headcount = num(year.get("salesHeadcount"))
        survey_starts = num(year.get("surveyStarts"))
        cash_collect_jobs = num(year.get("cashCollectJobs"))
        marketing_spend = num(year.get("marketingSpend"))

        survey_fees = survey_starts * survey_fee
        cash_collections = cash_collect_jobs * cash_collect_per_sale
        revenue = survey_fees + cash_collections
        salary_cost = sales_headcount * salary_per_head
        commission = cash_collections * commission_rate
        delivery_cost = cash_collect_jobs * average_hours_per_go * average_rate_per_hour
        cost = salary_cost + commission + delivery_cost + marketing_spend
        operating_income = revenue - cost
        margin_pct = pct(operating_income, revenue)

        total_revenue += revenue
        total_cost += cost
        total_operating_income += operating_income
        peak_headcount = max(peak_headcount, sales_headcount)

        rows.append(
            {
                "period": str(year.get("period") or f"Year {index + 1}"),
                "salesHeadcount": sales_headcount,
                "surveyFees": round_money(survey_fees),
                "cashCollections": round_money(cash_collections),
                "totalRevenue": round_money(revenue),
                "salaryCost": round_money(salary_cost),
                "commission": round_money(commission),
                "deliveryCost": round_money(delivery_cost),
                "marketingSpend": round_money(marketing_spend),
                "totalCost": round_money(cost),
                "operatingIncome": round_money(operating_income),
                "marginPct": margin_pct,
            }
        )

    warnings: list[str] = []
    if not rows:
        warnings.append("No forecast years were provided.")
    if total_operating_income < 0:
        warnings.append("Total operating income is negative across the forecast.")

    return {
        "summary": {
            "totalRevenue": round_money(total_revenue),
            "totalCost": round_money(total_cost),
            "totalOperatingIncome": round_money(total_operating_income),
            "peakHeadcount": peak_headcount,
            "averageMarginPct": pct(total_operating_income, total_revenue),
        },
        "rows": rows,
        "warnings": warnings,
    }


def calculate_sales_pipeline_forecast(inputs: dict[str, object]) -> dict:
    products = inputs.get("products")
    if not isinstance(products, list):
        products = []

    default_revenue_increase_pct = num(inputs.get("defaultRevenueIncreasePct"))
    default_order_increase_pct = num(inputs.get("defaultOrderIncreasePct"))
    rows: list[dict] = []
    total_actual_revenue = 0.0
    total_forecast_revenue = 0.0
    total_actual_orders = 0.0
    total_forecast_orders = 0.0

    for index, raw_product in enumerate(products[:8]):
        product = raw_product if isinstance(raw_product, dict) else {}
        actual_revenue = num(product.get("actualRevenue"))
        actual_orders = num(product.get("actualOrders"))
        revenue_increase_pct = num(product.get("revenueIncreasePct"))
        order_increase_pct = num(product.get("orderIncreasePct"))
        if revenue_increase_pct == 0:
            revenue_increase_pct = default_revenue_increase_pct
        if order_increase_pct == 0:
            order_increase_pct = default_order_increase_pct

        forecast_revenue = actual_revenue * (1 + revenue_increase_pct / 100.0)
        forecast_orders = actual_orders * (1 + order_increase_pct / 100.0)
        revenue_lift = forecast_revenue - actual_revenue

        total_actual_revenue += actual_revenue
        total_forecast_revenue += forecast_revenue
        total_actual_orders += actual_orders
        total_forecast_orders += forecast_orders

        rows.append(
            {
                "productName": str(product.get("productName") or f"Product {index + 1}"),
                "actualRevenue": round_money(actual_revenue),
                "forecastRevenue": round_money(forecast_revenue),
                "revenueLift": round_money(revenue_lift),
                "actualOrders": actual_orders,
                "forecastOrders": round(forecast_orders, 1),
                "averageOrderValue": round_money(safe_ratio(forecast_revenue, forecast_orders) or 0),
            }
        )

    warnings: list[str] = []
    if not rows:
        warnings.append("No products were provided.")
    if total_forecast_revenue < total_actual_revenue:
        warnings.append("Forecast revenue is below actual revenue.")

    return {
        "summary": {
            "totalActualRevenue": round_money(total_actual_revenue),
            "totalForecastRevenue": round_money(total_forecast_revenue),
            "revenueLift": round_money(total_forecast_revenue - total_actual_revenue),
            "forecastOrders": round(total_forecast_orders, 1),
            "averageRevenueLiftPct": pct(total_forecast_revenue - total_actual_revenue, total_actual_revenue),
        },
        "rows": rows,
        "warnings": warnings,
    }


def calculate_dashboard_gantt_chart(inputs: dict[str, object]) -> dict:
    tasks = inputs.get("tasks")
    if not isinstance(tasks, list):
        tasks = []

    report_date = date_from_value(inputs.get("reportDate")) or date.today()
    rows: list[dict] = []
    weighted_progress = 0.0
    total_duration = 0.0
    completed_tasks = 0
    overdue_tasks = 0

    for index, raw_task in enumerate(tasks[:40]):
        task = raw_task if isinstance(raw_task, dict) else {}
        start_date = date_from_value(task.get("startDate"))
        end_date = date_from_value(task.get("endDate"))
        duration_days = 0
        if start_date and end_date:
            duration_days = max((end_date - start_date).days + 1, 1)
        percent_done = min(max(num(task.get("percentDone")), 0.0), 100.0)
        status = "Not Started"
        if percent_done >= 100:
            status = "Complete"
            completed_tasks += 1
        elif end_date and end_date < report_date:
            status = "Overdue"
            overdue_tasks += 1
        elif percent_done > 0:
            status = "In Progress"

        weighted_progress += percent_done * max(duration_days, 1)
        total_duration += max(duration_days, 1)

        rows.append(
            {
                "category": str(task.get("category") or "Unassigned"),
                "activity": str(task.get("activity") or f"Task {index + 1}"),
                "person": str(task.get("person") or ""),
                "startDate": date_text(start_date),
                "endDate": date_text(end_date),
                "durationDays": duration_days,
                "percentDone": percent_done,
                "status": status,
            }
        )

    open_issues = num(inputs.get("openIssues"))
    high_priority_issues = num(inputs.get("highPriorityIssues"))
    warnings: list[str] = []
    if overdue_tasks:
        warnings.append(f"{int(overdue_tasks)} task(s) are overdue as of the report date.")
    if high_priority_issues:
        warnings.append(f"{int(high_priority_issues)} high-priority issue(s) are open.")
    if not rows:
        warnings.append("No tasks were provided.")

    return {
        "summary": {
            "projectName": str(inputs.get("projectName") or ""),
            "totalTasks": len(rows),
            "completedTasks": completed_tasks,
            "averageProgressPct": safe_ratio(weighted_progress, total_duration) or 0,
            "overdueTasks": overdue_tasks,
            "openIssues": open_issues,
            "highPriorityIssues": high_priority_issues,
        },
        "rows": rows,
        "warnings": warnings,
    }


def calculate_flex_budget_worksheet(inputs: dict[str, object]) -> dict:
    budget_lines = inputs.get("budgetLines")
    if not isinstance(budget_lines, list):
        budget_lines = []

    months = min(max(int(num(inputs.get("monthsInBudget")) or 12), 1), 12)
    business_days = max(num(inputs.get("businessDaysInYear")) or 260, 1)
    income_tax_rate = num(inputs.get("incomeTaxRatePercent")) / 100.0
    rows: list[dict] = []
    total_revenue = 0.0
    total_variable_costs = 0.0
    total_fixed_costs = 0.0

    for index, raw_line in enumerate(budget_lines[:40]):
        line = raw_line if isinstance(raw_line, dict) else {}
        category = str(line.get("category") or "fixed-cost")
        current_annual = num(line.get("currentAnnual"))
        growth_pct = num(line.get("growthPct"))
        budgeted_annual = current_annual * (1 + growth_pct / 100.0)

        if category == "revenue":
            total_revenue += budgeted_annual
        elif category == "variable-cost":
            total_variable_costs += budgeted_annual
        else:
            total_fixed_costs += budgeted_annual

        rows.append(
            {
                "category": category.replace("-", " ").title(),
                "lineItem": str(line.get("lineItem") or f"Line {index + 1}"),
                "currentAnnual": round_money(current_annual),
                "growthPct": growth_pct,
                "budgetedAnnual": round_money(budgeted_annual),
                "monthlyAverage": round_money(budgeted_annual / months),
                "weeklyAverage": round_money(budgeted_annual / 52.0),
            }
        )

    contribution_margin = total_revenue - total_variable_costs
    contribution_margin_pct = pct(contribution_margin, total_revenue)
    operating_income = contribution_margin - total_fixed_costs
    income_tax = max(operating_income, 0.0) * income_tax_rate
    net_income = operating_income - income_tax
    contribution_ratio = safe_ratio(contribution_margin, total_revenue) or 0
    breakeven_sales = total_fixed_costs / contribution_ratio if contribution_ratio else None
    breakeven_days = (breakeven_sales / total_revenue * business_days) if breakeven_sales and total_revenue else None

    warnings: list[str] = []
    if operating_income < 0:
        warnings.append("Budgeted operating income is negative.")
    if contribution_ratio <= 0:
        warnings.append("Contribution margin is not positive, so breakeven sales cannot be calculated.")

    return {
        "summary": {
            "totalRevenue": round_money(total_revenue),
            "totalVariableCosts": round_money(total_variable_costs),
            "totalFixedCosts": round_money(total_fixed_costs),
            "contributionMarginPct": contribution_margin_pct,
            "breakevenSales": round_money(breakeven_sales),
            "breakevenDays": round(breakeven_days, 1) if breakeven_days is not None else None,
            "operatingIncome": round_money(operating_income),
            "incomeTax": round_money(income_tax),
            "netIncome": round_money(net_income),
        },
        "rows": rows,
        "warnings": warnings,
    }


def calculate_cash_flow_forecast_worksheet(inputs: dict[str, object]) -> dict:
    weeks = inputs.get("weeks")
    if not isinstance(weeks, list):
        weeks = []

    cash_balance = num(inputs.get("beginningCash"))
    minimum_cash_reserve = num(inputs.get("minimumCashReserve"))
    rows: list[dict] = []
    total_receipts = 0.0
    total_payments = 0.0
    lowest_cash_balance = cash_balance
    max_reserve_shortfall = 0.0

    for index, raw_week in enumerate(weeks[:26]):
        week = raw_week if isinstance(raw_week, dict) else {}
        beginning_cash = cash_balance
        receipts = num(week.get("arCollections")) + num(week.get("deposits"))
        payments = (
            num(week.get("apPayments"))
            + num(week.get("payroll"))
            + num(week.get("rent"))
            + num(week.get("utilities"))
            + num(week.get("otherPayments"))
        )
        cash_available = beginning_cash + receipts
        ending_cash = cash_available - payments
        reserve_shortfall = max(minimum_cash_reserve - ending_cash, 0.0)

        total_receipts += receipts
        total_payments += payments
        lowest_cash_balance = min(lowest_cash_balance, ending_cash)
        max_reserve_shortfall = max(max_reserve_shortfall, reserve_shortfall)
        cash_balance = ending_cash

        rows.append(
            {
                "weekLabel": str(week.get("weekLabel") or f"Week {index + 1}"),
                "beginningCash": round_money(beginning_cash),
                "totalCashAvailable": round_money(cash_available),
                "totalPayments": round_money(payments),
                "netCashFlow": round_money(receipts - payments),
                "endingCash": round_money(ending_cash),
                "reserveShortfall": round_money(reserve_shortfall),
            }
        )

    warnings: list[str] = []
    if max_reserve_shortfall > 0:
        warnings.append("One or more weeks fall below the minimum cash reserve.")
    if total_payments > total_receipts and cash_balance < 0:
        warnings.append("Projected payments exceed receipts and drive ending cash negative.")
    if not rows:
        warnings.append("No weeks were provided.")

    return {
        "summary": {
            "totalReceipts": round_money(total_receipts),
            "totalPayments": round_money(total_payments),
            "endingCash": round_money(cash_balance),
            "lowestCashBalance": round_money(lowest_cash_balance),
            "reserveShortfall": round_money(max_reserve_shortfall),
        },
        "rows": rows,
        "warnings": warnings,
    }
