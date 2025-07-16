import React, { useState, useEffect } from "react";
import {
  addMinutes,
  differenceInMinutes,
  format,
  getHours,
  addDays,
} from "date-fns";

export interface ShiftCalculatorProps {
  sundays: string[];
  holidays: string[];
}

interface Breakdown {
  RDO: number;
  RNO: number;
  RDDF: number;
  RNDF: number;
  HEDO: number;
  HENO: number;
  HEDDF: number;
  HENDF: number;
}

interface Row {
  id?: number;
  entry: string;
  exit: string;
  breakdown: Breakdown | null;
  rate?: number;
}

const DEFAULT_RATE = 6189.13;

function calculateBreakdown(
  entry: Date,
  exit: Date,
  sundaySet: Set<string>,
  holidaySet: Set<string>
): Breakdown {
  const totalMinutes = differenceInMinutes(exit, entry);
  const breakdown: Breakdown = {
    RDO: 0,
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
      else breakdown.RDO++;
    }
  }

  for (const key of Object.keys(breakdown) as (keyof Breakdown)[]) {
    breakdown[key] = parseFloat((breakdown[key] / 60).toFixed(2));
  }

  return breakdown;
}

function calculateTotalPay(bd: Breakdown, rate: number): number {
  return (
    bd.RDO * rate +
    bd.RNO * rate * 1.35 +
    bd.RDDF * rate * 1.75 +
    bd.RNDF * rate * 2.1 +
    bd.HEDO * rate * 1.25 +
    bd.HENO * rate * 1.75 +
    bd.HEDDF * rate * 2.0 +
    bd.HENDF * rate * 2.5
  );
}

export function ShiftCalculator({ sundays, holidays }: ShiftCalculatorProps) {
  const [rows, setRows] = useState<Row[]>([
    { entry: "", exit: "", breakdown: null },
  ]);
  const [rate, setRate] = useState<number>(DEFAULT_RATE);

  useEffect(() => {
    fetch('/api/shifts')
      .then((res) => res.json())
      .then((data: Row[]) => {
        if (Array.isArray(data) && data.length) {
          setRows(data);
        }
      })
      .catch(() => {});
  }, []);

  const sundaySet = new Set(sundays);
  const holidaySet = new Set(holidays);

  const updateRow = (
    idx: number,
    field: keyof Row,
    value: string
  ) => {
    setRows((prev) => {
      const newRows = [...prev];
      const row = { ...newRows[idx], [field]: value } as Row;
      if (field === "entry") {
        const en = new Date(value);
        if (!isNaN(en.getTime())) {
          en.setMinutes(0, 0, 0);
          row.entry = format(en, "yyyy-MM-dd'T'HH:mm");
          const ex = addDays(en, 1);
          ex.setHours(5, 0, 0, 0);
          row.exit = format(ex, "yyyy-MM-dd'T'HH:mm");
        }
      }
      if (row.entry && row.exit) {
        const en = new Date(row.entry);
        const ex = new Date(row.exit);
        if (!isNaN(en.getTime()) && !isNaN(ex.getTime()) && ex > en) {
          row.breakdown = calculateBreakdown(en, ex, sundaySet, holidaySet);
        } else {
          row.breakdown = null;
        }
      } else {
        row.breakdown = null;
      }
      newRows[idx] = row;
      return newRows;
    });
  };

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      { entry: "", exit: "", breakdown: null },
    ]);

  const saveRow = (idx: number) => {
    const row = rows[idx];
    if (!row.breakdown) return;
    const method = row.id ? 'PUT' : 'POST';
    const url = row.id ? `/api/shifts/${row.id}` : '/api/shifts';
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...row, rate }),
    })
      .then((res) => res.json())
      .then((data: Row) => {
        setRows((prev) => {
          const newRows = [...prev];
          newRows[idx] = data;
          return newRows;
        });
      })
      .catch(() => {});
  };

  const deleteRow = (idx: number) => {
    const row = rows[idx];
    if (row.id) {
      fetch(`/api/shifts/${row.id}`, { method: 'DELETE' })
        .catch(() => {});
    }
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mr-2">Valor Hora:</label>
        <input
          type="number"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
          className="border p-1 w-24"
          step="0.01"
        />
      </div>
      <table className="min-w-full text-left border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Fecha/Hora Entrada</th>
            <th className="border px-2 py-1">Fecha/Hora Salida</th>
            <th className="border px-2 py-1">RDO</th>
            <th className="border px-2 py-1">RNO</th>
            <th className="border px-2 py-1">RDDF</th>
            <th className="border px-2 py-1">RNDF</th>
            <th className="border px-2 py-1">HEDO</th>
            <th className="border px-2 py-1">HENO</th>
            <th className="border px-2 py-1">HEDDF</th>
            <th className="border px-2 py-1">HENDF</th>
            <th className="border px-2 py-1">Total a Pagar</th>
            <th className="border px-2 py-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1">
                <input
                  type="datetime-local"
                  value={row.entry}
                  onChange={(e) => updateRow(idx, "entry", e.target.value)}
                  className="border p-1"
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="datetime-local"
                  value={row.exit}
                  onChange={(e) => updateRow(idx, "exit", e.target.value)}
                  className="border p-1"
                />
              </td>
              <td className="border px-2 py-1">
                {row.breakdown ? row.breakdown.RDO.toFixed(2) : "-"}
              </td>
              <td className="border px-2 py-1">
                {row.breakdown ? row.breakdown.RNO.toFixed(2) : "-"}
              </td>
              <td className="border px-2 py-1">
                {row.breakdown ? row.breakdown.RDDF.toFixed(2) : "-"}
              </td>
              <td className="border px-2 py-1">
                {row.breakdown ? row.breakdown.RNDF.toFixed(2) : "-"}
              </td>
              <td className="border px-2 py-1">
                {row.breakdown ? row.breakdown.HEDO.toFixed(2) : "-"}
              </td>
              <td className="border px-2 py-1">
                {row.breakdown ? row.breakdown.HENO.toFixed(2) : "-"}
              </td>
              <td className="border px-2 py-1">
                {row.breakdown ? row.breakdown.HEDDF.toFixed(2) : "-"}
              </td>
              <td className="border px-2 py-1">
                {row.breakdown ? row.breakdown.HENDF.toFixed(2) : "-"}
              </td>
              <td className="border px-2 py-1">
                {row.breakdown
                  ? calculateTotalPay(row.breakdown, rate).toFixed(2)
                  : "-"}
              </td>
              <td className="border px-2 py-1 space-x-2">
                <button
                  type="button"
                  onClick={() => saveRow(idx)}
                  className="bg-green-500 text-white px-2 py-1 rounded"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => deleteRow(idx)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={addRow}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Añadir otro día de trabajo
      </button>
    </div>
  );
}

export default ShiftCalculator;
