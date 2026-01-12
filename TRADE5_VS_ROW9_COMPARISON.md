# Trade #5 vs Excel Row 9 Comparison

## Summary

✅ **Trade #5 calculations are CORRECT** for its input values
⚠️ **Trade #5 and Excel Row 9 have different input values** (slightly different entry/exit prices)

---

## Input Values Comparison

| Field | Trade #5 (Database) | Excel Row 9 | Difference |
|-------|---------------------|-------------|------------|
| **avgEntry** | 2.13 | 2.1335 | -0.0035 |
| **stopLoss** | 2.12 | 2.123 | -0.003 |
| **avgExit** | 2.12 | 2.121 | -0.001 |
| **amount** | 600 | 600 | 0 |
| **stopLossPercentage** | 1.8% | 1.8% | 0 |

**Note:** These are different trades with slightly different entry/exit prices.

---

## Calculated Values for Trade #5

Using Trade #5's actual input values (2.13, 2.12, 2.12):

| Field | Calculated | Database | Status |
|-------|-----------|----------|--------|
| **Direction** | Long | - | ✓ |
| **Expected Loss** | 10.80 | - | ✓ |
| **Trade Value** | 2,300.40 | - | ✓ |
| **Position Size** | 1,080.00 | - | ✓ |
| **Leverage** | 3.83 | - | ✓ |
| **Commission** | 1.60 | - | ✓ |
| **Profit/Loss** | **-12.40** | **-12.40** | ✓ **MATCH** |
| **P/L %** | **-2.07%** | **-2.07%** | ✓ **MATCH** |

---

## Calculated Values for Excel Row 9

Using Excel Row 9's input values (2.1335, 2.123, 2.121):

| Field | Excel Row 9 | Formula Used |
|-------|-------------|--------------|
| **Direction** | Long | Entry > StopLoss |
| **Expected Loss** | 10.80 | 600 × 1.8% |
| **Trade Value** | 2,194.46 | Risk-based formula |
| **Position Size** | 1,028.57 | TradeValue / AvgEntry |
| **Leverage** | 3.66 | TradeValue / Amount |
| **Commission** | 1.53 | Entry + Exit fees |
| **Realised P/L** | -14.39 | Gross P/L - Commission |

---

## Why the Differences?

The calculations for **Trade #5** are **100% correct** based on its input values.

The difference between Trade #5 and Excel Row 9 is due to **different input prices**:

1. **Trade #5** entered at 2.13 and exited at 2.12
2. **Excel Row 9** entered at 2.1335 and exited at 2.121

This creates different:
- Position sizes (1,080 vs 1,028.57)
- Trade values (2,300.40 vs 2,194.46)
- Final P/L (-12.40 vs -14.39)

---

## Verification Formula

For Trade #5 (LONG trade):

```
Direction: Long (because 2.13 > 2.12)
Expected Loss: 600 × 1.8% = 10.80
Risk Per Unit: -(2.12 - 2.13) = 0.01
Trade Value: (10.80 / 0.01) × 2.13 = 2,300.40
Position Size: 2,300.40 / 2.13 = 1,080.00
Commission: (0.0002 × 2,300.40) + (0.0005 × 2.12 × 1,080) = 1.60
Gross P/L: (2.12 - 2.13) × 1,080 = -10.80
Net P/L: -10.80 - 1.60 = -12.40 ✓
P/L %: -12.40 / 600 = -2.07% ✓
```

---

## Conclusion

✅ **Trade #5 is calculated correctly**
✅ **All formulas match Excel formulas**
✅ **Database and derived values match**
⚠️ **Trade #5 ≠ Excel Row 9** (different trade data)

If you want Trade #5 to match Excel Row 9 exactly, you would need to update the trade's entry/exit prices to match Row 9's values.
