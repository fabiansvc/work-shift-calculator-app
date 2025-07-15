import React, { useState } from "react";
import {
  addMinutes,
  differenceInMinutes,
  format,
  getHours,
} from "date-fns";

const HOURLY_RATE = 6189.13;

export interface ShiftCalculatorProps {
  sundays: string[];
  holidays: string[];
}

interface Breakdown {
  base: number;
  RNO: number;
  RDDF: number;
  RNDF: number;
  HEDO: number;
  HENO: number;
  HEDDF: number;
  HENDF: number;
}

function calculateBreakdown(
  entry: Date,
  exit: Date,
  sundaySet: Set<string>,
  holidaySet: Set<string>
): Breakdown {
  const totalMinutes = differenceInMinutes(exit, entry);
  const breakdown: Breakdown = {
    base: 0,
    RNO: 0,
    RDDF: 0,
    RNDF: 0,
    HEDO: 0,
    HENO: 0,
    HEDDF: 0,
    HENDF: 0,
  };

  for (let i = 0; i < totalMinutes; i++) {
    const current = addMinutes(entry, i);
    const dateKey = format(current, "yyyy-MM-dd");
    const isHoliday = holidaySet.has(dateKey);
    const isSunday = sundaySet.has(dateKey);
    const special = isHoliday || isSunday;
    const hour = getHours(current);
    const night = hour >= 21 || hour < 6;
    const dayTime = !night;
    const overtime = i >= 8 * 60;

    if (overtime) {
      if (special && night) breakdown.HENDF++;
      else if (special && dayTime) breakdown.HEDDF++;
      else if (!special && night) breakdown.HENO++;
      else breakdown.HEDO++;
    } else {
      if (special && night) breakdown.RNDF++;
      else if (special && dayTime) breakdown.RDDF++;
      else if (!special && night) breakdown.RNO++;
      else breakdown.base++;
    }
  }

  for (const key of Object.keys(breakdown) as (keyof Breakdown)[]) {
    breakdown[key] = parseFloat((breakdown[key] / 60).toFixed(2));
  }

  return breakdown;
}

function calculateTotalPay(bd: Breakdown): number {
  return (
    bd.base * HOURLY_RATE +
    bd.RNO * HOURLY_RATE * 1.35 +
    bd.RDDF * HOURLY_RATE * 1.75 +
    bd.RNDF * HOURLY_RATE * 2.1 +
    bd.HEDO * HOURLY_RATE * 1.25 +
    bd.HENO * HOURLY_RATE * 1.75 +
    bd.HEDDF * HOURLY_RATE * 2.0 +
    bd.HENDF * HOURLY_RATE * 2.5
  );
}

export function ShiftCalculator({ sundays, holidays }: ShiftCalculatorProps) {
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [result, setResult] = useState<Breakdown | null>(null);

  const sundaySet = new Set(sundays);
  const holidaySet = new Set(holidays);

  const handleCalculate = () => {
    if (!entry || !exit) return;
    const entryDate = new Date(entry);
    const exitDate = new Date(exit);
    if (isNaN(entryDate.getTime()) || isNaN(exitDate.getTime())) return;
    if (exitDate <= entryDate) return;
    const res = calculateBreakdown(entryDate, exitDate, sundaySet, holidaySet);
    setResult(res);
  };

  const totalPay = result ? calculateTotalPay(result) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label>
          Entry
          <input
            type="datetime-local"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </label>
        <label>
          Exit
          <input
            type="datetime-local"
            value={exit}
            onChange={(e) => setExit(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </label>
        <button
          type="button"
          onClick={handleCalculate}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Calculate
        </button>
      </div>

      {result && (
        <table className="min-w-full text-left border mt-4">
          <thead>
            <tr>
              <th className="border px-2 py-1">Category</th>
              <th className="border px-2 py-1">Hours</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-1">Entry</td>
              <td className="border px-2 py-1">{format(new Date(entry), "yyyy-MM-dd HH:mm")}</td>
            </tr>
            <tr>
              <td className="border px-2 py-1">Exit</td>
              <td className="border px-2 py-1">{format(new Date(exit), "yyyy-MM-dd HH:mm")}</td>
            </tr>
            {Object.entries(result).map(([key, value]) => (
              <tr key={key}>
                <td className="border px-2 py-1">{key}</td>
                <td className="border px-2 py-1">{value.toFixed(2)}</td>
              </tr>
            ))}
            <tr>
              <td className="border px-2 py-1 font-bold">Total Pay</td>
              <td className="border px-2 py-1 font-bold">{totalPay.toFixed(2)} COP</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ShiftCalculator;
