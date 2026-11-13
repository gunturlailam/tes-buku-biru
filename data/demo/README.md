# Demo Data - ProfitAI

**⚠️ IMPORTANT: This is SYNTHETIC data for demonstration purposes only.**

These datasets are fictional and do not represent any real business or individuals.

## Datasets

### 1. `transactions_healthy_business.csv`
**Scenario:** Healthy UMKM F&B business (catering)
- **Period:** January - March 2024 (50 transactions)
- **Characteristics:**
  - ✅ Revenue growing ~12-15% month-over-month
  - ✅ Positive cash flow consistently
  - ✅ Good expense management
  - ✅ Mix of cash, transfer, and QRIS payments
  - ✅ Regular operational expenses well-managed
  - ✅ Low risk signals

**Expected Insights:**
- Gross Margin: ~60-65% (typical for catering)
- Net Margin: ~18-22% (healthy)
- Cash Flow: Positive all months
- Risk Signals: None or low
- Recommendations: "Optimize inventory turnover", "Consider scaling operations"

**Use Case:** Demo standard healthy business flow

---

### 2. `transactions_cash_problem.csv`
**Scenario:** Growing business with cash flow problem
- **Period:** January - March 2024 (30 transactions)
- **Characteristics:**
  - 📈 Revenue growing (high value sales)
  - 📉 Cash flow NEGATIVE (receivables issue)
  - ⚠️ 60% of sales are credit (receivable)
  - ⚠️ All expenses paid in cash
  - ⚠️ Receivable aging: 30-60 days
  - ⚠️ Only 2 receivable payments collected (out of 8)

**Expected Insights:**
- Revenue: High and growing
- Cash Flow: NEGATIVE despite revenue
- Receivable Days: High (45-60 days average)
- Cash Runway: Low (15-25 days)
- Risk Signals: HIGH - "Cash runway critical", "Receivable aging high"
- Recommendations: "URGENT: Accelerate collections", "Negotiate supplier payment terms", "Offer early payment discounts"

**Use Case:** Demo cash vs profit disconnect, receivable management importance

---

### 3. `transactions_mixed_signals.csv`
**Scenario:** Fast-growing business with inventory management issue
- **Period:** January - March 2024 (30 transactions)
- **Characteristics:**
  - 📈 Revenue growing 10-15% monthly (excellent)
  - 📉 Cash decreasing despite revenue growth
  - ⚠️ Over-ordering inventory (tying up cash)
  - ⚠️ High COGS relative to sales
  - ⚠️ Aggressive expansion spending
  - ⚠️ Inventory buildup visible

**Expected Insights:**
- Revenue: Strong growth
- Cash Flow: Declining
- Inventory Turnover: Low (slow-moving)
- Working Capital: Decreasing
- Risk Signals: MEDIUM - "Cash declining despite revenue growth", "Inventory turnover below target"
- Recommendations: "Review pricing strategy", "Optimize inventory levels", "Slow inventory purchasing", "Reduce expansion pace until cash improves"

**Use Case:** Demo complex analysis - growth with operational inefficiency

---

## Column Definitions

| Column | Type | Description | Example |
|---|---|---|---|
| `transaction_id` | string | Unique identifier | TRX-2024-001 |
| `transaction_date` | date | YYYY-MM-DD format | 2024-01-05 |
| `description` | string | Transaction description in Indonesian | Penjualan Menu Paket A |
| `amount` | decimal | Amount in IDR with 2 decimals | 750000.00 |
| `type` | enum | income or expense | income |
| `category` | enum | revenue, cogs, operational, marketing, capital, tax, finance | revenue |
| `payment_method` | enum | cash, transfer, qris, receivable | cash |
| `notes` | string | Additional notes | Penjualan reguler |

## Category Mapping

### Income Types:
- **revenue**: Sales revenue (main business activity)

### Expense Types:
- **cogs**: Cost of Goods Sold (direct production costs)
- **operational**: Operating expenses (salaries, rent, utilities)
- **marketing**: Marketing and advertising expenses
- **capital**: Capital expenditure (equipment, software)
- **tax**: Tax payments
- **finance**: Interest and finance charges

## Usage Instructions

### For Testing Import:
1. Use `transactions_healthy_business.csv` first to test successful import
2. Verify all 50 rows imported correctly
3. Check calculations match expected values

### For Testing Risk Signals:
1. Import `transactions_cash_problem.csv`
2. System should detect:
   - Low cash runway
   - High receivable days
   - Negative cash flow trend

### For Testing Complex Analysis:
1. Import `transactions_mixed_signals.csv`
2. System should detect:
   - Revenue growth but cash decline
   - Inventory management issue
   - Need for operational efficiency

### For Demo Presentation:
1. Start with healthy_business (show good state)
2. Switch to cash_problem (show risk detection)
3. Explain recommendations with evidence
4. Show how ProfitAI helps decision-making

## Validation Checklist

Before using these datasets in demo, verify:
- [ ] All dates are valid (YYYY-MM-DD format)
- [ ] All amounts are positive decimal values
- [ ] All transactions have unique IDs
- [ ] Categories match system taxonomy
- [ ] CSV encoding is UTF-8
- [ ] No special characters that break parsing
- [ ] Row count matches expected (50, 30, 30)

## Expected Calculation Results (Healthy Business)

**January 2024:**
- Total Revenue: Rp 12,640,000
- Total Expenses: Rp 6,230,000
- Net Profit: Rp 6,410,000
- Gross Margin: ~49.3%
- Net Margin: ~50.7%

**February 2024:**
- Total Revenue: Rp 20,210,000
- Total Expenses: Rp 10,590,000
- Net Profit: Rp 9,620,000
- Revenue Growth: +59.9% vs January (strong!)

**March 2024 (partial):**
- Total Revenue: Rp 6,720,000 (first 6 days only)
- Shows consistent momentum

## License & Attribution

These datasets are released under CC0 1.0 Universal (Public Domain).
Created for ProfitAI demonstration and testing purposes.

**Created by:** Risfiatul (Product Lead)  
**Date:** 2024-11-14  
**Version:** 1.0

