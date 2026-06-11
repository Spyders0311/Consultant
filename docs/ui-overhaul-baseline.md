# UI Overhaul Baseline (Phase 0)

Captured 2026-06-11 on branch codex-worksheet-persistence-smoke at commit bd23042.

- npm run lint: clean (no warnings or errors)
- Payload parity reference below: each wizard's calculate payload construction, extracted verbatim. Run-row jsonb shapes (inputs saved via /runs POST) must keep these exact keys after migration.

components/AdvancedAnalystSheetWizard.js:289:      const payload = {
components/AdvancedAnalystSheetWizard.js-290-        sheetKey,
components/AdvancedAnalystSheetWizard.js-291-        inputs: normalizeInputs(config, inputs),
components/AdvancedAnalystSheetWizard.js-292-      };
components/AdvancedAnalystSheetWizard.js-293-      const calculationResponse = await fetch('/api/worksheets/advanced-analyst-sheet/calculate', {
components/AdvancedAnalystSheetWizard.js-294-        method: 'POST',
components/AdvancedAnalystSheetWizard.js-295-        headers: { 'Content-Type': 'application/json' },
components/AdvancedAnalystSheetWizard.js-296-        body: JSON.stringify(payload),
components/AdvancedAnalystSheetWizard.js-297-      });
components/AdvancedAnalystSheetWizard.js-298-      const calculationData = await calculationResponse.json();
components/AdvancedAnalystSheetWizard.js-299-      if (!calculationResponse.ok || !calculationData.ok) {
components/AdvancedAnalystSheetWizard.js-300-        throw new Error(calculationData.error || 'Advanced analyst sheet calculation failed.');
components/AdvancedAnalystSheetWizard.js-301-      }
components/AdvancedAnalystSheetWizard.js-302-
components/AdvancedAnalystSheetWizard.js-303-      setResult(calculationData.result);
components/AdvancedAnalystSheetWizard.js-304-
components/AdvancedAnalystSheetWizard.js-305-      const runResponse = await fetch('/api/worksheets/advanced-analyst-sheet/runs', {
components/AdvancedAnalystSheetWizard.js-306-        method: 'POST',
components/AdvancedAnalystSheetWizard.js-307-        headers: { 'Content-Type': 'application/json' },
components/AdvancedAnalystSheetWizard.js-308-        body: JSON.stringify({
components/AdvancedAnalystSheetWizard.js-309-          client_id: clientId,
components/AdvancedAnalystSheetWizard.js-310-          sheet_key: sheetKey,
components/AdvancedAnalystSheetWizard.js-311-          inputs: payload.inputs,
components/AdvancedAnalystSheetWizard.js-312-          outputs: calculationData.result,
components/AdvancedAnalystSheetWizard.js-313-        }),
components/AdvancedAnalystSheetWizard.js-314-      });
components/AdvancedAnalystSheetWizard.js-315-      const runData = await runResponse.json();
components/AdvancedAnalystSheetWizard.js-316-      if (!runResponse.ok || !runData.ok) {
components/AdvancedAnalystSheetWizard.js-317-        throw new Error(runData.error || 'Calculation succeeded but saving run failed.');
--
components/AnalystWizard.js:73:      const payload = {
components/AnalystWizard.js-74-        companyName: form.companyName.trim(),
components/AnalystWizard.js-75-        industry: form.industry.trim(),
components/AnalystWizard.js-76-        horizonYears: parseNumber(form.horizonYears),
components/AnalystWizard.js-77-        revenue: {
components/AnalystWizard.js-78-          currentAnnualRevenue: parseNumber(form.currentAnnualRevenue),
components/AnalystWizard.js-79-          cogsPercent: parseNumber(form.cogsPercent),
components/AnalystWizard.js-80-          revenueGrowthPercent: parseNumber(form.revenueGrowthPercent),
components/AnalystWizard.js-81-        },
components/AnalystWizard.js-82-        fixedExpenses: {
components/AnalystWizard.js-83-          payroll: parseNumber(form.fixedPayroll),
components/AnalystWizard.js-84-          rentUtilities: parseNumber(form.fixedRentUtilities),
components/AnalystWizard.js-85-          other: parseNumber(form.fixedOther),
components/AnalystWizard.js-86-          fixedExpenseGrowthPercent: parseNumber(form.fixedExpenseGrowthPercent),
components/AnalystWizard.js-87-        },
components/AnalystWizard.js-88-        marketAssumptions: {
components/AnalystWizard.js-89-          marketGrowthPercent: parseNumber(form.marketGrowthPercent),
components/AnalystWizard.js-90-          targetMarketSharePercent: parseNumber(form.targetMarketSharePercent),
components/AnalystWizard.js-91-          inflationPercent: parseNumber(form.inflationPercent),
components/AnalystWizard.js-92-          taxRatePercent: parseNumber(form.taxRatePercent),
components/AnalystWizard.js-93-          discountRatePercent: parseNumber(form.discountRatePercent),
components/AnalystWizard.js-94-        },
components/AnalystWizard.js-95-      };
components/AnalystWizard.js-96-
components/AnalystWizard.js-97-      const response = await fetch('/api/analyst-wizard/calculate', {
components/AnalystWizard.js-98-        method: 'POST',
components/AnalystWizard.js-99-        headers: { 'Content-Type': 'application/json' },
components/AnalystWizard.js-100-        body: JSON.stringify(payload),
components/AnalystWizard.js-101-      });
--
components/BalanceSheetComparisonsWizard.js:182:      const payload = {
components/BalanceSheetComparisonsWizard.js-183-        years: years.map((row) => ({
components/BalanceSheetComparisonsWizard.js-184-          year: parseNumber(row.year),
components/BalanceSheetComparisonsWizard.js-185-          cash: parseNumber(row.cash),
components/BalanceSheetComparisonsWizard.js-186-          ar: parseNumber(row.ar),
components/BalanceSheetComparisonsWizard.js-187-          inventory: parseNumber(row.inventory),
components/BalanceSheetComparisonsWizard.js-188-          otherCurrentAssets: parseNumber(row.otherCurrentAssets),
components/BalanceSheetComparisonsWizard.js-189-          fixedAssets: parseNumber(row.fixedAssets),
components/BalanceSheetComparisonsWizard.js-190-          otherAssets: parseNumber(row.otherAssets),
components/BalanceSheetComparisonsWizard.js-191-          ap: parseNumber(row.ap),
components/BalanceSheetComparisonsWizard.js-192-          otherCurrentLiabilities: parseNumber(row.otherCurrentLiabilities),
components/BalanceSheetComparisonsWizard.js-193-          longTermDebt: parseNumber(row.longTermDebt),
components/BalanceSheetComparisonsWizard.js-194-          otherLiabilities: parseNumber(row.otherLiabilities),
components/BalanceSheetComparisonsWizard.js-195-          equity: parseNumber(row.equity),
components/BalanceSheetComparisonsWizard.js-196-        })),
components/BalanceSheetComparisonsWizard.js-197-      };
components/BalanceSheetComparisonsWizard.js-198-
components/BalanceSheetComparisonsWizard.js-199-      const calculationResponse = await fetch('/api/worksheets/balance-sheet-comparisons/calculate', {
components/BalanceSheetComparisonsWizard.js-200-        method: 'POST',
components/BalanceSheetComparisonsWizard.js-201-        headers: { 'Content-Type': 'application/json' },
components/BalanceSheetComparisonsWizard.js-202-        body: JSON.stringify(payload),
components/BalanceSheetComparisonsWizard.js-203-      });
components/BalanceSheetComparisonsWizard.js-204-      const calculationData = await calculationResponse.json();
components/BalanceSheetComparisonsWizard.js-205-      if (!calculationResponse.ok || !calculationData.ok) {
components/BalanceSheetComparisonsWizard.js-206-        throw new Error(calculationData.error || 'Balance sheet comparison calculation failed.');
components/BalanceSheetComparisonsWizard.js-207-      }
components/BalanceSheetComparisonsWizard.js-208-
components/BalanceSheetComparisonsWizard.js-209-      setResult(calculationData.result);
components/BalanceSheetComparisonsWizard.js-210-
--
components/BasicClientInfoWizard.js:131:      const payload = {
components/BasicClientInfoWizard.js-132-        companyName: cleanText(form.companyName),
components/BasicClientInfoWizard.js-133-        industry: cleanText(form.industry),
components/BasicClientInfoWizard.js-134-        primaryContactName: cleanText(form.primaryContactName),
components/BasicClientInfoWizard.js-135-        primaryContactEmail: cleanText(form.primaryContactEmail),
components/BasicClientInfoWizard.js-136-        primaryContactPhone: cleanText(form.primaryContactPhone),
components/BasicClientInfoWizard.js-137-        locationCity: cleanText(form.locationCity),
components/BasicClientInfoWizard.js-138-        locationState: cleanText(form.locationState),
components/BasicClientInfoWizard.js-139-        notes: cleanText(form.notes),
components/BasicClientInfoWizard.js-140-      };
components/BasicClientInfoWizard.js-141-
components/BasicClientInfoWizard.js-142-      const calculationResponse = await fetch('/api/worksheets/basic-client-info/calculate', {
components/BasicClientInfoWizard.js-143-        method: 'POST',
components/BasicClientInfoWizard.js-144-        headers: { 'Content-Type': 'application/json' },
components/BasicClientInfoWizard.js-145-        body: JSON.stringify(payload),
components/BasicClientInfoWizard.js-146-      });
components/BasicClientInfoWizard.js-147-      const calculationData = await calculationResponse.json();
components/BasicClientInfoWizard.js-148-      if (!calculationResponse.ok || !calculationData.ok) {
components/BasicClientInfoWizard.js-149-        throw new Error(calculationData.error || 'Basic client info calculation failed.');
components/BasicClientInfoWizard.js-150-      }
components/BasicClientInfoWizard.js-151-
components/BasicClientInfoWizard.js-152-      setResult(calculationData.result);
components/BasicClientInfoWizard.js-153-
components/BasicClientInfoWizard.js-154-      const runResponse = await fetch('/api/worksheets/basic-client-info/runs', {
components/BasicClientInfoWizard.js-155-        method: 'POST',
components/BasicClientInfoWizard.js-156-        headers: { 'Content-Type': 'application/json' },
components/BasicClientInfoWizard.js-157-        body: JSON.stringify({ client_id: clientId, inputs: payload, outputs: calculationData.result }),
components/BasicClientInfoWizard.js-158-      });
components/BasicClientInfoWizard.js-159-      const runData = await runResponse.json();
--
components/BreakevenWizard.js:251:      const payload = {
components/BreakevenWizard.js-252-        annualRevenue: parseNumber(form.annualRevenue),
components/BreakevenWizard.js-253-        cogsAmount: parseNumber(form.cogsAmount),
components/BreakevenWizard.js-254-        profitAmount: parseOptionalNumber(form.profitAmount),
components/BreakevenWizard.js-255-        laborAmount: parseOptionalNumber(form.laborAmount),
components/BreakevenWizard.js-256-        fixedExpensesAmount: parseNumber(form.fixedExpensesAmount),
components/BreakevenWizard.js-257-        indirectCostsAmount: parseOptionalNumber(form.indirectCostsAmount),
components/BreakevenWizard.js-258-        generalAdministrativeCostsAmount: parseOptionalNumber(form.generalAdministrativeCostsAmount),
components/BreakevenWizard.js-259-        monthsInPeriod: parseOptionalNumber(form.monthsInPeriod),
components/BreakevenWizard.js-260-        workDaysPerYear: parseNumber(form.workDaysPerYear),
components/BreakevenWizard.js-261-        workHoursPerDay: parseNumber(form.workHoursPerDay),
components/BreakevenWizard.js-262-      };
components/BreakevenWizard.js-263-
components/BreakevenWizard.js-264-      const calculationResponse = await fetch('/api/worksheets/breakeven/calculate', {
components/BreakevenWizard.js-265-        method: 'POST',
components/BreakevenWizard.js-266-        headers: { 'Content-Type': 'application/json' },
components/BreakevenWizard.js-267-        body: JSON.stringify(payload),
components/BreakevenWizard.js-268-      });
components/BreakevenWizard.js-269-      const calculationData = await calculationResponse.json();
components/BreakevenWizard.js-270-      if (!calculationResponse.ok || !calculationData.ok) {
components/BreakevenWizard.js-271-        throw new Error(calculationData.error || 'Breakeven calculation failed.');
components/BreakevenWizard.js-272-      }
components/BreakevenWizard.js-273-
components/BreakevenWizard.js-274-      setResult(calculationData.result);
components/BreakevenWizard.js-275-
components/BreakevenWizard.js-276-      const runResponse = await fetch('/api/worksheets/breakeven/runs', {
components/BreakevenWizard.js-277-        method: 'POST',
components/BreakevenWizard.js-278-        headers: { 'Content-Type': 'application/json' },
components/BreakevenWizard.js-279-        body: JSON.stringify({ client_id: clientId, inputs: payload, outputs: calculationData.result }),
--
components/CurrentFinancialInformationWizard.js:160:      const payload = {
components/CurrentFinancialInformationWizard.js-161-        annualRevenue: parseNumber(form.annualRevenue),
components/CurrentFinancialInformationWizard.js-162-        annualCogs: parseNumber(form.annualCogs),
components/CurrentFinancialInformationWizard.js-163-        annualFixedExpenses: parseNumber(form.annualFixedExpenses),
components/CurrentFinancialInformationWizard.js-164-        daysSalesOutstanding: parseNumber(form.daysSalesOutstanding),
components/CurrentFinancialInformationWizard.js-165-        daysInventoryOnHand: parseNumber(form.daysInventoryOnHand),
components/CurrentFinancialInformationWizard.js-166-        daysPayablesOutstanding: parseNumber(form.daysPayablesOutstanding),
components/CurrentFinancialInformationWizard.js-167-        workDaysPerYear: parseNumber(form.workDaysPerYear),
components/CurrentFinancialInformationWizard.js-168-        workHoursPerDay: parseNumber(form.workHoursPerDay),
components/CurrentFinancialInformationWizard.js-169-        optionalNotes: String(form.optionalNotes || '').trim(),
components/CurrentFinancialInformationWizard.js-170-      };
components/CurrentFinancialInformationWizard.js-171-
components/CurrentFinancialInformationWizard.js-172-      const calculationResponse = await fetch('/api/worksheets/current-financial-information/calculate', {
components/CurrentFinancialInformationWizard.js-173-        method: 'POST',
components/CurrentFinancialInformationWizard.js-174-        headers: { 'Content-Type': 'application/json' },
components/CurrentFinancialInformationWizard.js-175-        body: JSON.stringify(payload),
components/CurrentFinancialInformationWizard.js-176-      });
components/CurrentFinancialInformationWizard.js-177-      const calculationData = await calculationResponse.json();
components/CurrentFinancialInformationWizard.js-178-      if (!calculationResponse.ok || !calculationData.ok) {
components/CurrentFinancialInformationWizard.js-179-        throw new Error(calculationData.error || 'Current financial information calculation failed.');
components/CurrentFinancialInformationWizard.js-180-      }
components/CurrentFinancialInformationWizard.js-181-
components/CurrentFinancialInformationWizard.js-182-      setResult(calculationData.result);
components/CurrentFinancialInformationWizard.js-183-
components/CurrentFinancialInformationWizard.js-184-      const runResponse = await fetch('/api/worksheets/current-financial-information/runs', {
components/CurrentFinancialInformationWizard.js-185-        method: 'POST',
components/CurrentFinancialInformationWizard.js-186-        headers: { 'Content-Type': 'application/json' },
components/CurrentFinancialInformationWizard.js-187-        body: JSON.stringify({ client_id: clientId, inputs: payload, outputs: calculationData.result }),
components/CurrentFinancialInformationWizard.js-188-      });
--
components/FiveYearProjectionsWizard.js:157:      const payload = {
components/FiveYearProjectionsWizard.js-158-        baseYear: parseNumber(form.baseYear),
components/FiveYearProjectionsWizard.js-159-        baseRevenue: parseNumber(form.baseRevenue),
components/FiveYearProjectionsWizard.js-160-        revenueGrowthPercent: parseNumber(form.revenueGrowthPercent),
components/FiveYearProjectionsWizard.js-161-        baseCogsPercent: parseNumber(form.baseCogsPercent),
components/FiveYearProjectionsWizard.js-162-        baseFixedExpenses: parseNumber(form.baseFixedExpenses),
components/FiveYearProjectionsWizard.js-163-        fixedExpenseGrowthPercent: parseNumber(form.fixedExpenseGrowthPercent),
components/FiveYearProjectionsWizard.js-164-        taxRatePercent: parseOptionalNumber(form.taxRatePercent),
components/FiveYearProjectionsWizard.js-165-      };
components/FiveYearProjectionsWizard.js-166-
components/FiveYearProjectionsWizard.js-167-      const calculationResponse = await fetch('/api/worksheets/five-year-projections/calculate', {
components/FiveYearProjectionsWizard.js-168-        method: 'POST',
components/FiveYearProjectionsWizard.js-169-        headers: { 'Content-Type': 'application/json' },
components/FiveYearProjectionsWizard.js-170-        body: JSON.stringify(payload),
components/FiveYearProjectionsWizard.js-171-      });
components/FiveYearProjectionsWizard.js-172-      const calculationData = await calculationResponse.json();
components/FiveYearProjectionsWizard.js-173-      if (!calculationResponse.ok || !calculationData.ok) {
components/FiveYearProjectionsWizard.js-174-        throw new Error(calculationData.error || 'Five year projection calculation failed.');
components/FiveYearProjectionsWizard.js-175-      }
components/FiveYearProjectionsWizard.js-176-
components/FiveYearProjectionsWizard.js-177-      setResult(calculationData.result);
components/FiveYearProjectionsWizard.js-178-
components/FiveYearProjectionsWizard.js-179-      const runResponse = await fetch('/api/worksheets/five-year-projections/runs', {
components/FiveYearProjectionsWizard.js-180-        method: 'POST',
components/FiveYearProjectionsWizard.js-181-        headers: { 'Content-Type': 'application/json' },
components/FiveYearProjectionsWizard.js-182-        body: JSON.stringify({ client_id: clientId, inputs: payload, outputs: calculationData.result }),
components/FiveYearProjectionsWizard.js-183-      });
components/FiveYearProjectionsWizard.js-184-      const runData = await runResponse.json();
components/FiveYearProjectionsWizard.js-185-      if (!runResponse.ok || !runData.ok) {
--
components/FlexibleBudgetVarianceWizard.js:118:      const payload = {
components/FlexibleBudgetVarianceWizard.js-119-        periodLabel: String(form.periodLabel || '').trim(),
components/FlexibleBudgetVarianceWizard.js-120-        budgetRevenue: parseNumber(form.budgetRevenue),
components/FlexibleBudgetVarianceWizard.js-121-        actualRevenue: parseNumber(form.actualRevenue),
components/FlexibleBudgetVarianceWizard.js-122-        budgetCogsPercent: parseNumber(form.budgetCogsPercent),
components/FlexibleBudgetVarianceWizard.js-123-        actualCogs: parseNumber(form.actualCogs),
components/FlexibleBudgetVarianceWizard.js-124-        budgetVariableExpensePercent: parseNumber(form.budgetVariableExpensePercent),
components/FlexibleBudgetVarianceWizard.js-125-        actualVariableExpenses: parseNumber(form.actualVariableExpenses),
components/FlexibleBudgetVarianceWizard.js-126-        budgetFixedExpenses: parseNumber(form.budgetFixedExpenses),
components/FlexibleBudgetVarianceWizard.js-127-        actualFixedExpenses: parseNumber(form.actualFixedExpenses),
components/FlexibleBudgetVarianceWizard.js-128-        notes: String(form.notes || '').trim(),
components/FlexibleBudgetVarianceWizard.js-129-      };
components/FlexibleBudgetVarianceWizard.js-130-
components/FlexibleBudgetVarianceWizard.js-131-      const calculationResponse = await fetch('/api/worksheets/flexible-budget-variance/calculate', {
components/FlexibleBudgetVarianceWizard.js-132-        method: 'POST',
components/FlexibleBudgetVarianceWizard.js-133-        headers: { 'Content-Type': 'application/json' },
components/FlexibleBudgetVarianceWizard.js-134-        body: JSON.stringify(payload),
components/FlexibleBudgetVarianceWizard.js-135-      });
components/FlexibleBudgetVarianceWizard.js-136-      const calculationData = await calculationResponse.json();
components/FlexibleBudgetVarianceWizard.js-137-      if (!calculationResponse.ok || !calculationData.ok) {
components/FlexibleBudgetVarianceWizard.js-138-        throw new Error(calculationData.error || 'Flexible budget variance calculation failed.');
components/FlexibleBudgetVarianceWizard.js-139-      }
components/FlexibleBudgetVarianceWizard.js-140-
components/FlexibleBudgetVarianceWizard.js-141-      setResult(calculationData.result);
components/FlexibleBudgetVarianceWizard.js-142-
components/FlexibleBudgetVarianceWizard.js-143-      const runResponse = await fetch('/api/worksheets/flexible-budget-variance/runs', {
components/FlexibleBudgetVarianceWizard.js-144-        method: 'POST',
components/FlexibleBudgetVarianceWizard.js-145-        headers: { 'Content-Type': 'application/json' },
components/FlexibleBudgetVarianceWizard.js-146-        body: JSON.stringify({ client_id: clientId, inputs: payload, outputs: calculationData.result }),
--
components/PLComparisonsWizard.js:146:      const payload = {
components/PLComparisonsWizard.js-147-        years: years.map((row) => ({
components/PLComparisonsWizard.js-148-          year: parseNumber(row.year),
components/PLComparisonsWizard.js-149-          revenue: parseNumber(row.revenue),
components/PLComparisonsWizard.js-150-          cogs: parseNumber(row.cogs),
components/PLComparisonsWizard.js-151-          operatingExpenses: parseNumber(row.operatingExpenses),
components/PLComparisonsWizard.js-152-          otherExpenses: parseNumber(row.otherExpenses),
components/PLComparisonsWizard.js-153-        })),
components/PLComparisonsWizard.js-154-      };
components/PLComparisonsWizard.js-155-
components/PLComparisonsWizard.js-156-      const calculationResponse = await fetch('/api/worksheets/pl-comparisons/calculate', {
components/PLComparisonsWizard.js-157-        method: 'POST',
components/PLComparisonsWizard.js-158-        headers: { 'Content-Type': 'application/json' },
components/PLComparisonsWizard.js-159-        body: JSON.stringify(payload),
components/PLComparisonsWizard.js-160-      });
components/PLComparisonsWizard.js-161-      const calculationData = await calculationResponse.json();
components/PLComparisonsWizard.js-162-      if (!calculationResponse.ok || !calculationData.ok) {
components/PLComparisonsWizard.js-163-        throw new Error(calculationData.error || 'P&L comparison calculation failed.');
components/PLComparisonsWizard.js-164-      }
components/PLComparisonsWizard.js-165-
components/PLComparisonsWizard.js-166-      setResult(calculationData.result);
components/PLComparisonsWizard.js-167-
components/PLComparisonsWizard.js-168-      const runResponse = await fetch('/api/worksheets/pl-comparisons/runs', {
components/PLComparisonsWizard.js-169-        method: 'POST',
components/PLComparisonsWizard.js-170-        headers: { 'Content-Type': 'application/json' },
components/PLComparisonsWizard.js-171-        body: JSON.stringify({ client_id: clientId, inputs: payload, outputs: calculationData.result }),
components/PLComparisonsWizard.js-172-      });
components/PLComparisonsWizard.js-173-      const runData = await runResponse.json();
components/PLComparisonsWizard.js-174-      if (!runResponse.ok || !runData.ok) {
--
components/WeeklyCashFlowWizard.js:152:      const payload = {
components/WeeklyCashFlowWizard.js-153-        beginningCash: parseNumber(form.beginningCash),
components/WeeklyCashFlowWizard.js-154-        lineOfCreditLimit: parseNumber(form.lineOfCreditLimit),
components/WeeklyCashFlowWizard.js-155-        beginningLineOfCreditBalance: parseNumber(form.beginningLineOfCreditBalance),
components/WeeklyCashFlowWizard.js-156-        minimumCashReserve: parseNumber(form.minimumCashReserve),
components/WeeklyCashFlowWizard.js-157-        notes: String(form.notes || '').trim(),
components/WeeklyCashFlowWizard.js-158-        weeks: form.weeks.map((week, index) => ({
components/WeeklyCashFlowWizard.js-159-          weekLabel: String(week.weekLabel || `Week ${index + 1}`).trim(),
components/WeeklyCashFlowWizard.js-160-          cashReceipts: parseNumber(week.cashReceipts),
components/WeeklyCashFlowWizard.js-161-          newSales: parseNumber(week.newSales),
components/WeeklyCashFlowWizard.js-162-          payroll: parseNumber(week.payroll),
components/WeeklyCashFlowWizard.js-163-          materials: parseNumber(week.materials),
components/WeeklyCashFlowWizard.js-164-          rentUtilities: parseNumber(week.rentUtilities),
components/WeeklyCashFlowWizard.js-165-          loanPayments: parseNumber(week.loanPayments),
components/WeeklyCashFlowWizard.js-166-          creditCardPayments: parseNumber(week.creditCardPayments),
components/WeeklyCashFlowWizard.js-167-          otherDisbursements: parseNumber(week.otherDisbursements),
components/WeeklyCashFlowWizard.js-168-        })),
components/WeeklyCashFlowWizard.js-169-      };
components/WeeklyCashFlowWizard.js-170-
components/WeeklyCashFlowWizard.js-171-      const calculationResponse = await fetch('/api/worksheets/weekly-cash-flow/calculate', {
components/WeeklyCashFlowWizard.js-172-        method: 'POST',
components/WeeklyCashFlowWizard.js-173-        headers: { 'Content-Type': 'application/json' },
components/WeeklyCashFlowWizard.js-174-        body: JSON.stringify(payload),
components/WeeklyCashFlowWizard.js-175-      });
components/WeeklyCashFlowWizard.js-176-      const calculationData = await calculationResponse.json();
components/WeeklyCashFlowWizard.js-177-      if (!calculationResponse.ok || !calculationData.ok) {
components/WeeklyCashFlowWizard.js-178-        throw new Error(calculationData.error || 'Weekly cash flow calculation failed.');
components/WeeklyCashFlowWizard.js-179-      }
components/WeeklyCashFlowWizard.js-180-
--
components/WorkbookPortWizard.js:447:  const payload = {};
components/WorkbookPortWizard.js-448-  for (const field of config.scalarFields || []) {
components/WorkbookPortWizard.js-449-    payload[field.name] = normalizeValue(field, form[field.name]);
components/WorkbookPortWizard.js-450-  }
components/WorkbookPortWizard.js-451-  for (const collection of config.collections || []) {
components/WorkbookPortWizard.js-452-    payload[collection.key] = (form[collection.key] || []).map((row, index) => {
components/WorkbookPortWizard.js-453-      const normalized = {};
components/WorkbookPortWizard.js-454-      for (const field of collection.fields) {
components/WorkbookPortWizard.js-455-        const fallback = field.name === 'period' || field.name === 'weekLabel' ? `${collection.rowLabel} ${index + 1}` : '';
components/WorkbookPortWizard.js-456-        normalized[field.name] = normalizeValue(field, row[field.name] ?? fallback);
components/WorkbookPortWizard.js-457-      }
components/WorkbookPortWizard.js-458-      return normalized;
components/WorkbookPortWizard.js-459-    });
components/WorkbookPortWizard.js-460-  }
components/WorkbookPortWizard.js-461-  return payload;
components/WorkbookPortWizard.js-462-}
components/WorkbookPortWizard.js-463-
components/WorkbookPortWizard.js-464-function mergeRunForm(config, inputs) {
components/WorkbookPortWizard.js-465-  const base = makeDefaultForm(config);
components/WorkbookPortWizard.js-466-  const merged = { ...base, ...(inputs || {}) };
components/WorkbookPortWizard.js-467-  for (const collection of config.collections || []) {
components/WorkbookPortWizard.js-468-    merged[collection.key] = Array.isArray(inputs?.[collection.key]) ? inputs[collection.key] : base[collection.key];
components/WorkbookPortWizard.js-469-  }
components/WorkbookPortWizard.js-470-  return merged;
components/WorkbookPortWizard.js-471-}
components/WorkbookPortWizard.js-472-
components/WorkbookPortWizard.js-473-function hasMeaningfulInput(form) {
components/WorkbookPortWizard.js-474-  return JSON.stringify(form).replace(/[\\s"{}[\\],:.-]/g, '').length > 0;
components/WorkbookPortWizard.js-475-}
--
components/WorkingCapitalWizard.js:330:      const payload = {
components/WorkingCapitalWizard.js-331-        annualRevenue: parseNumber(form.annualRevenue),
components/WorkingCapitalWizard.js-332-        annualCogs: parseNumber(form.annualCogs),
components/WorkingCapitalWizard.js-333-        daysSalesOutstanding: parseNumber(form.daysSalesOutstanding),
components/WorkingCapitalWizard.js-334-        daysInventoryOnHand: parseNumber(form.daysInventoryOnHand),
components/WorkingCapitalWizard.js-335-        daysPayablesOutstanding: parseNumber(form.daysPayablesOutstanding),
components/WorkingCapitalWizard.js-336-      };
components/WorkingCapitalWizard.js-337-
components/WorkingCapitalWizard.js-338-      const calculationResponse = await fetch('/api/worksheets/working-capital/calculate', {
components/WorkingCapitalWizard.js-339-        method: 'POST',
components/WorkingCapitalWizard.js-340-        headers: { 'Content-Type': 'application/json' },
components/WorkingCapitalWizard.js-341-        body: JSON.stringify(payload),
components/WorkingCapitalWizard.js-342-      });
components/WorkingCapitalWizard.js-343-      const calculationData = await calculationResponse.json();
components/WorkingCapitalWizard.js-344-      if (!calculationResponse.ok || !calculationData.ok) {
components/WorkingCapitalWizard.js-345-        throw new Error(calculationData.error || 'Working capital calculation failed.');
components/WorkingCapitalWizard.js-346-      }
components/WorkingCapitalWizard.js-347-
components/WorkingCapitalWizard.js-348-      setResult(calculationData.result);
components/WorkingCapitalWizard.js-349-
components/WorkingCapitalWizard.js-350-      const runResponse = await fetch('/api/worksheets/working-capital/runs', {
components/WorkingCapitalWizard.js-351-        method: 'POST',
components/WorkingCapitalWizard.js-352-        headers: { 'Content-Type': 'application/json' },
components/WorkingCapitalWizard.js-353-        body: JSON.stringify({ client_id: clientId, inputs: payload, outputs: calculationData.result }),
components/WorkingCapitalWizard.js-354-      });
components/WorkingCapitalWizard.js-355-      const runData = await runResponse.json();
components/WorkingCapitalWizard.js-356-      if (!runResponse.ok || !runData.ok) {
components/WorkingCapitalWizard.js-357-        throw new Error(runData.error || 'Calculation succeeded but saving run failed.');
components/WorkingCapitalWizard.js-358-      }
