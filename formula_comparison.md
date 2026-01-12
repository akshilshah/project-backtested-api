# Formula Comparison: Excel vs JavaScript Code

## Summary

The `calculateDerivedFields` function in [trade.controller.js:175-191](src/services/trade/trade.controller.js#L175-L191) **does NOT match** the Excel formulas in columns C-Q. There are significant differences in calculations.

---

## Detailed Comparison

### ✅ **1. Direction (Column F)**

**Excel Formula (Row 2):**
```excel
=IF(COUNTA(H2)=1,IF(COUNTA(I2)=1,IF(H2>I2,"Long",IF(I2>H2,"Short","")),""),"")
```
- Logic: If AvgEntry > StopLoss → "Long", If StopLoss > AvgEntry → "Short"

**JavaScript Code (Line 179):**
```javascript
const direction = avgEntry < stopLoss ? 'Short' : 'Long'
```

**Status:** ✅ **MATCHES** - Both produce the same result (Short when entry < stopLoss, Long otherwise)

---

### ❌ **2. Trade Value (Column M)**

**Excel Formula (Row 2):**
```excel
=((J2/(IF(F2="Short", (H2-I2), IF(F2="Long", (I2-H2), "0"))*-1))*H2)
```
- Uses risk-based calculation involving:
  - Expected Loss (J2 = 1.8% of Amount)
  - Direction-dependent risk (Entry - StopLoss difference)
  - Average Entry price
- This is a **position sizing formula based on risk management**

**JavaScript Code (Line 182):**
```javascript
const tradeValue = quantity * avgEntry
```

**Status:** ❌ **COMPLETELY DIFFERENT**
- Excel: Risk-based position sizing calculation
- Code: Simple multiplication of quantity × entry price
- **The code does NOT implement the Excel's risk management logic**

---

### ❌ **3. Commission (Column Q)**

**Excel Formula (Row 2):**
```excel
=IF(G2="Limit", 0.0002*M2, 0.0005*M2) + 0.0005*O2*L2 + M2*R2
```
- Entry commission: 0.02% for Limit orders, 0.05% for Market orders
- Exit commission: 0.05% on (AvgExit × PositionSize)
- Funding: Trade Value × Funding Rate (Column R)

**JavaScript Code (Lines 186-188):**
```javascript
if (avgExit !== null) {
  commission = quantity * (avgEntry + avgExit) * 0.00035
}
```

**Status:** ❌ **DIFFERENT**
- Excel: Differentiates order types, includes funding costs
- Code: Uses fixed 0.035% rate on both entry and exit, no order type logic, no funding
- **The code uses a simplified commission model**

---

### ⚠️ **4. Missing Calculations**

The following Excel columns have formulas that are **NOT calculated** in the JavaScript code:

#### **Position Size (Column L)**
**Excel Formula:**
```excel
=M2/H2
```
(Trade Value ÷ Average Entry)

**Code:** Not calculated

---

#### **Expected Loss (Column J)**
**Excel Formula:**
```excel
=K2*1.8%
```
(1.8% of Amount)

**Code:** Not calculated

---

#### **Leverage (Column N)**
**Excel Formula:**
```excel
=M2/K2
```
(Trade Value ÷ Amount)

**Code:** Not calculated

---

#### **Realised Profit/Loss (Column P)**
**Excel Formula:**
```excel
=(IF(F2="Short", (H2-O2)*L2, IF(F2="Long", (O2-H2)*L2, "0"))
```
- Short: (Entry - Exit) × Position Size
- Long: (Exit - Entry) × Position Size

**Code:** This IS calculated in the `exitTrade` function (lines 384-389):
```javascript
const profitLoss = (body.avgExit - existingTrade.avgEntry) * existingTrade.quantity
```

**Status:** ⚠️ **SLIGHTLY DIFFERENT**
- Excel: Uses **Position Size** (calculated from Trade Value)
- Code: Uses **quantity** (direct input)
- These may differ if the Excel's risk-based Trade Value calculation is used

---

## Key Issues

1. **Trade Value Calculation is Fundamentally Different**
   - Excel uses risk management-based position sizing
   - Code uses simple quantity × price
   - This affects Position Size and P&L calculations

2. **Commission Model is Simplified**
   - Excel accounts for order types and funding costs
   - Code uses a flat 0.035% rate

3. **Several Derived Fields are Not Calculated**
   - Expected Loss, Position Size, and Leverage are missing from the derived fields

---

## Recommendations

1. **Decide on the calculation model:**
   - Should the API use the Excel's risk-based position sizing?
   - Or should the Excel be updated to match the simpler API model?

2. **Add missing derived fields** if they're needed:
   - Position Size (if using risk-based model)
   - Expected Loss
   - Leverage

3. **Align commission calculations** between Excel and API

4. **Update either the Excel formulas or the JavaScript code** to ensure consistency
