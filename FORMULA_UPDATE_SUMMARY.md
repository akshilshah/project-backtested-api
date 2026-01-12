# Formula Update Summary

## ✅ Status: COMPLETED AND VERIFIED

The `calculateDerivedFields` function in [trade.controller.js:175-254](src/services/trade/trade.controller.js#L175-L254) has been **successfully updated** to match the Excel formulas from columns C-Q in "New 100 Tradess.xlsx".

---

## Changes Made

### 1. ✅ Direction (Column F) - Already Correct
No changes needed. Already matches Excel logic.

### 2. ✅ Expected Loss (Column J) - ADDED
```javascript
const expectedLoss = amount * (stopLossPercentage / 100)
```
Calculates the expected loss as a percentage of the account amount (default 1.8%).

### 3. ✅ Trade Value (Column M) - UPDATED
**Changed from:** Simple `quantity * avgEntry`
**Changed to:** Risk-based position sizing formula
```javascript
let riskPerUnit
if (direction === 'Short') {
  riskPerUnit = -(avgEntry - stopLoss)
} else {
  riskPerUnit = -(stopLoss - avgEntry)
}
const tradeValue = riskPerUnit !== 0 ? (expectedLoss / riskPerUnit) * avgEntry : 0
```

### 4. ✅ Position Size (Column L) - ADDED
```javascript
const positionSize = avgEntry !== 0 ? tradeValue / avgEntry : 0
```
Calculates the actual quantity of coins based on the risk-sized trade value.

### 5. ✅ Leverage (Column N) - ADDED
```javascript
const leverage = amount !== 0 ? tradeValue / amount : 0
```
Shows how much leverage is being used for the trade.

### 6. ✅ Commission (Column Q) - UPDATED
**Changed from:** Flat 0.035% rate
**Changed to:** Proper maker/taker fee structure
```javascript
const entryCommission = 0.0002 * tradeValue  // 0.02% for Limit orders
const exitCommission = 0.0005 * avgExit * positionSize  // 0.05% for taker
commission = entryCommission + exitCommission
```

### 7. ✅ Realised Profit/Loss (Column P) - UPDATED
**Changed from:** Using database `quantity` field
**Changed to:** Using calculated `positionSize` and subtracting commission
```javascript
let grossProfitLoss
if (direction === 'Short') {
  grossProfitLoss = (avgEntry - avgExit) * positionSize
} else {
  grossProfitLoss = (avgExit - avgEntry) * positionSize
}
realisedProfitLoss = grossProfitLoss - commission
```

---

## Test Results

All calculations verified against actual Excel data:

### ✅ Test 1: Row 3 (Short Trade)
```
Input: avgEntry=453.89, stopLoss=460, amount=600, avgExit=460.38
All 7 calculations match Excel exactly ✓
```

### ✅ Test 2: Row 9 (Long Trade)
```
Input: avgEntry=2.1335, stopLoss=2.123, amount=600, avgExit=2.121
All 7 calculations match Excel exactly ✓
```

---

## Function Return Value

The function now returns:
```javascript
{
  direction,           // "Short" | "Long"
  expectedLoss,        // Amount * stopLossPercentage / 100
  tradeValue,          // Risk-based position value
  positionSize,        // Calculated quantity from risk formula
  leverage,            // tradeValue / amount
  commission,          // Entry + exit commission
  realisedProfitLoss   // Gross P/L minus commission
}
```

---

## Important Notes

1. **Order Type Assumption:** Currently assumes "Limit" orders (0.02% maker fee). The database doesn't have an `entryOrder` field, so this is hardcoded.

2. **Funding Rate:** Set to 0 since there's no `fundingRate` field in the database (Excel Column R).

3. **Row 2 Inconsistency:** Row 2 in Excel has an older formula that doesn't subtract commission from P/L. All other rows (3+) correctly subtract it. The code follows the correct pattern used in 99% of rows.

4. **Quantity Field:** The database still stores a `quantity` field, but it's no longer used in calculations. Position size is now derived from the risk management formula instead.

---

## Future Enhancements

If needed, consider adding to the Trade model:
1. `entryOrder` field (Limit/Market) to properly calculate entry commission
2. `fundingRate` field to include funding costs in total commission
