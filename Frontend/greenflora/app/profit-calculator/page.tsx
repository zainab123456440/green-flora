"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import AuthGuard from "@/components/auth/AuthGuard";

const CROPS = [
  "Wheat",
  "Rice",
  "Maize",
  "Cotton",
  "Sugarcane",
  "Potato",
  "Tomato",
  "Mango",
];

const formatPKR = (value: number) =>
  `Rs. ${Math.round(value).toLocaleString("en-PK")}`;

export default function ProfitCalculatorPage() {
  const [crop, setCrop] = useState("Wheat");

  const [area, setArea] = useState("");
  const [yieldPerAcre, setYieldPerAcre] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  const [seed, setSeed] = useState("");
  const [fertilizer, setFertilizer] = useState("");
  const [pesticide, setPesticide] = useState("");
  const [labor, setLabor] = useState("");
  const [irrigation, setIrrigation] = useState("");
  const [other, setOther] = useState("");

  /*
   * All calculations are performed from these values only.
   * No API, database, or AI is required.
   */
  const calculations = useMemo(() => {
    const farmArea = Math.max(0, Number(area) || 0);
    const yieldAmount = Math.max(0, Number(yieldPerAcre) || 0);
    const price = Math.max(0, Number(sellingPrice) || 0);

    const seedCost = Math.max(0, Number(seed) || 0);
    const fertilizerCost = Math.max(0, Number(fertilizer) || 0);
    const pesticideCost = Math.max(0, Number(pesticide) || 0);
    const laborCost = Math.max(0, Number(labor) || 0);
    const irrigationCost = Math.max(0, Number(irrigation) || 0);
    const otherCost = Math.max(0, Number(other) || 0);

    // Total crop production
    const totalProduction = farmArea * yieldAmount;

    // Revenue = production × selling price
    const revenue = totalProduction * price;

    // Total farming expenses
    const totalCost =
      seedCost +
      fertilizerCost +
      pesticideCost +
      laborCost +
      irrigationCost +
      otherCost;

    // Profit = revenue - total cost
    const profit = revenue - totalCost;

    // Additional useful figures
    const profitPerAcre = farmArea > 0 ? profit / farmArea : 0;

    const profitMargin =
      revenue > 0 ? (profit / revenue) * 100 : 0;

    const breakEvenPrice =
      totalProduction > 0 ? totalCost / totalProduction : 0;

    return {
      farmArea,
      yieldAmount,
      price,
      totalProduction,
      revenue,
      totalCost,
      profit,
      profitPerAcre,
      profitMargin,
      breakEvenPrice,
    };
  }, [
    area,
    yieldPerAcre,
    sellingPrice,
    seed,
    fertilizer,
    pesticide,
    labor,
    irrigation,
    other,
  ]);

  const inputClass =
    "mt-1 w-full rounded-xl border border-border-light bg-surface-primary px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary-600 focus:ring-2 focus:ring-primary-100";

  const expenseFields = [
    {
      label: "Seed Cost",
      value: seed,
      setValue: setSeed,
    },
    {
      label: "Fertilizer Cost",
      value: fertilizer,
      setValue: setFertilizer,
    },
    {
      label: "Pesticide Cost",
      value: pesticide,
      setValue: setPesticide,
    },
    {
      label: "Labor Cost",
      value: labor,
      setValue: setLabor,
    },
    {
      label: "Irrigation Cost",
      value: irrigation,
      setValue: setIrrigation,
    },
    {
      label: "Other Expenses",
      value: other,
      setValue: setOther,
    },
  ];

  return (
    <AuthGuard>
      <AppShell title="Profit Calculator">
        <div className="animate-gf-fade-in space-y-5">

          {/* Header */}
          <div>
            <p className="text-sm font-medium text-primary-700">
              Farm Decision Support
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Profit Calculator
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
              Estimate your expected revenue, farming costs, and profit
              before making your crop production decisions.
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">

            {/* LEFT SIDE */}
            <div className="space-y-5">

              {/* Crop & Farm */}
              <section className="rounded-2xl border border-border-light bg-surface-card p-5 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-text-primary">
                    Crop & Farm Details
                  </h2>

                  <p className="mt-1 text-sm text-text-secondary">
                    Enter the basic information about your farm and crop.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">

                  {/* Crop */}
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-text-primary">
                      Crop
                    </label>

                    <select
                      value={crop}
                      onChange={(e) => setCrop(e.target.value)}
                      className={inputClass}
                    >
                      {CROPS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Area */}
                  <div>
                    <label className="text-sm font-medium text-text-primary">
                      Farm Area
                    </label>

                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="e.g. 5"
                        className={`${inputClass} pr-16`}
                      />

                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                        acres
                      </span>
                    </div>
                  </div>

                  {/* Yield */}
                  <div>
                    <label className="text-sm font-medium text-text-primary">
                      Expected Yield (per acre)
                    </label>

                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={yieldPerAcre}
                        onChange={(e) =>
                          setYieldPerAcre(e.target.value)
                        }
                        placeholder="e.g. 30"
                        className={`${inputClass} pr-24`}
                      />

                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                        units/acre
                      </span>
                    </div>
                  </div>

                  {/* Selling Price */}
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-text-primary">
                      Expected Selling Price
                    </label>

                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={sellingPrice}
                        onChange={(e) =>
                          setSellingPrice(e.target.value)
                        }
                        placeholder="e.g. 2500"
                        className={`${inputClass} pr-20`}
                      />

                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                        Rs./unit
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-text-muted">
                      Enter the price you expect to receive when selling
                      your crop.
                    </p>
                  </div>
                </div>
              </section>

              {/* Expenses */}
              <section className="rounded-2xl border border-border-light bg-surface-card p-5 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-text-primary">
                    Farming Expenses
                  </h2>

                  <p className="mt-1 text-sm text-text-secondary">
                    Enter the estimated total cost for each expense.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {expenseFields.map((field) => (
                    <div key={field.label}>
                      <label className="text-sm font-medium text-text-primary">
                        {field.label}
                      </label>

                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={field.value}
                          onChange={(e) =>
                            field.setValue(e.target.value)
                          }
                          placeholder="0"
                          className={`${inputClass} pr-16`}
                        />

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                          PKR
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* RIGHT SIDE */}
            <div className="space-y-5">

              {/* Profit Hero */}
              <section className="overflow-hidden rounded-2xl border border-primary-700 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 p-6 text-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/75">
                      Estimated Profit
                    </p>

                    <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                      {formatPKR(calculations.profit)}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl">
                    🌱
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-black/10 p-4">
                  <p className="text-xs text-white/65">
                    Calculation
                  </p>

                  <p className="mt-1 text-sm font-medium text-white">
                    {formatPKR(calculations.revenue)} −{" "}
                    {formatPKR(calculations.totalCost)}
                  </p>

                  <p className="mt-1 text-xs text-white/65">
                    Revenue − Total Cost
                  </p>
                </div>

                {calculations.profit < 0 && (
                  <div className="mt-4 rounded-xl bg-red-500/15 p-3 text-xs text-white">
                    Your estimated costs are higher than your expected
                    revenue.
                  </div>
                )}
              </section>

              {/* Revenue */}
              <section className="rounded-2xl border border-border-light bg-surface-card p-5 shadow-sm">
                <p className="text-sm font-medium text-text-secondary">
                  Expected Revenue
                </p>

                <p className="mt-2 text-2xl font-bold text-primary-700">
                  {formatPKR(calculations.revenue)}
                </p>

                <p className="mt-2 text-xs text-text-muted">
                  {calculations.totalProduction.toLocaleString("en-PK")}{" "}
                  units × {formatPKR(calculations.price)} per unit
                </p>
              </section>

              {/* Cost */}
              <section className="rounded-2xl border border-border-light bg-surface-card p-5 shadow-sm">
                <p className="text-sm font-medium text-text-secondary">
                  Total Investment
                </p>

                <p className="mt-2 text-2xl font-bold text-text-primary">
                  {formatPKR(calculations.totalCost)}
                </p>

                <p className="mt-2 text-xs text-text-muted">
                  Total estimated farming expenses
                </p>
              </section>

              {/* Additional Results */}
              <div className="grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl border border-border-light bg-surface-card p-5 shadow-sm">
                  <p className="text-xs font-medium text-text-secondary">
                    Profit / Acre
                  </p>

                  <p className="mt-2 text-lg font-bold text-primary-700">
                    {formatPKR(calculations.profitPerAcre)}
                  </p>
                </div>

                <div className="rounded-2xl border border-border-light bg-surface-card p-5 shadow-sm">
                  <p className="text-xs font-medium text-text-secondary">
                    Profit Margin
                  </p>

                  <p className="mt-2 text-lg font-bold text-primary-700">
                    {calculations.profitMargin.toFixed(1)}%
                  </p>
                </div>

                <div className="rounded-2xl border border-border-light bg-surface-card p-5 shadow-sm">
                  <p className="text-xs font-medium text-text-secondary">
                    Break-even Price
                  </p>

                  <p className="mt-2 text-lg font-bold text-text-primary">
                    {formatPKR(calculations.breakEvenPrice)}
                  </p>

                  <p className="mt-1 text-[11px] text-text-muted">
                    Minimum price per unit
                  </p>
                </div>

                <div className="rounded-2xl border border-border-light bg-surface-card p-5 shadow-sm">
                  <p className="text-xs font-medium text-text-secondary">
                    Total Production
                  </p>

                  <p className="mt-2 text-lg font-bold text-text-primary">
                    {calculations.totalProduction.toLocaleString("en-PK")}
                  </p>

                  <p className="mt-1 text-[11px] text-text-muted">
                    {crop} production
                  </p>
                </div>
              </div>

              {/* Formula Explanation */}
              <section className="rounded-2xl border border-primary-100 bg-primary-50 p-5">
                <h3 className="text-sm font-semibold text-primary-800">
                  How your profit is calculated
                </h3>

                <div className="mt-3 space-y-2 text-xs leading-5 text-primary-800">
                  <p>
                    <strong>Revenue</strong> = Farm Area × Expected Yield (per acre) ×
                    Selling Price
                  </p>

                  <p>
                    <strong>Total Cost</strong> = Seed + Fertilizer +
                    Pesticide + Labor + Irrigation + Other Expenses
                  </p>

                  <p>
                    <strong>Profit</strong> = Revenue − Total Cost
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}