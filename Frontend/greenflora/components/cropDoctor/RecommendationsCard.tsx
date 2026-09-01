"use client";

import Link from "next/link";
import {
  Package,
  Wallet,
  AlertCircle,
  Sprout,
  BadgeDollarSign,
  FlaskConical,
} from "lucide-react";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type {
  ProductRecommendation,
  BudgetContext,
  LowCostAction,
} from "@/types/cropDoctor";

interface RecommendationsCardProps {
  products: ProductRecommendation[];
  budget: BudgetContext;
  lowCostActions: LowCostAction[];
}

function ProductCard({ product }: { product: ProductRecommendation }) {
  const priceDisplay = product.min_price_pkr && product.max_price_pkr
    ? `PKR ${product.min_price_pkr.toLocaleString()} – ${product.max_price_pkr.toLocaleString()}`
    : product.approx_price_pkr
      ? `~PKR ${product.approx_price_pkr.toLocaleString()}`
      : "Price on request";

  return (
    <div className="rounded-card border border-neutral-200 bg-surface-card p-4 transition hover:shadow-card">
      {/* Brand + budget badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
            <Package className="h-4 w-4 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-800">
              {product.best_local_brand}
            </p>
            {product.company && (
              <p className="text-xs text-neutral-400">{product.company}</p>
            )}
          </div>
        </div>
        <Badge variant={product.fits_budget ? "success" : "warning"}>
          {product.fits_budget ? "Within budget" : "Above budget"}
        </Badge>
      </div>

      {/* Details */}
      <div className="space-y-2 text-xs text-neutral-600">
        {product.scientific_target_action && (
          <div className="flex items-start gap-2">
            <FlaskConical className="h-3.5 w-3.5 text-neutral-400 shrink-0 mt-0.5" />
            <span>{product.scientific_target_action}</span>
          </div>
        )}
        {product.local_problem_target && (
          <div className="flex items-start gap-2">
            <Sprout className="h-3.5 w-3.5 text-neutral-400 shrink-0 mt-0.5" />
            <span>Targets: {product.local_problem_target}</span>
          </div>
        )}
        {product.dosage_per_acre && (
          <div className="flex items-start gap-2">
            <BadgeDollarSign className="h-3.5 w-3.5 text-neutral-400 shrink-0 mt-0.5" />
            <span>Dosage: {product.dosage_per_acre}</span>
          </div>
        )}
        <div className="flex items-start gap-2">
          <Wallet className="h-3.5 w-3.5 text-neutral-400 shrink-0 mt-0.5" />
          <span className="font-medium">{priceDisplay}</span>
        </div>
      </div>

      {/* Category badge */}
      <div className="mt-3 pt-2 border-t border-neutral-100">
        <Badge variant="neutral">{product.category}</Badge>
      </div>
    </div>
  );
}

export default function RecommendationsCard({
  products,
  budget,
  lowCostActions,
}: RecommendationsCardProps) {
  const hasBudget = budget.budget_pkr > 0;
  const hasProducts = products.length > 0;
  const hasBudgetProducts = products.some((p) => p.fits_budget);

  return (
    <div className="space-y-4 animate-gf-fade-in">
      {/* Budget info */}
      <Card variant="outlined" padding="sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
            <Wallet className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-neutral-400">Your treatment budget</p>
            <p className="text-sm font-semibold text-neutral-800">
              {hasBudget
                ? `PKR ${budget.budget_pkr.toLocaleString()}`
                : "PKR 0 (not set)"}
            </p>
          </div>
          {!hasBudget && (
            <Link href="/profile" className="ml-auto">
              <Button variant="ghost" size="sm">
                Set budget
              </Button>
            </Link>
          )}
        </div>
      </Card>

      {/* No budget — show low-cost actions only */}
      {!hasBudget && !hasProducts && (
        <Card variant="outlined" padding="md">
          <div className="flex items-start gap-2.5 mb-3">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-neutral-700">
                No paid treatment recommended
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Your treatment budget is PKR 0. Paid product options are not being shown.
                Set a budget in your profile to see matching products from our database.
              </p>
            </div>
          </div>
          <Link href="/profile">
            <Button variant="secondary" size="sm">
              Update treatment budget
            </Button>
          </Link>
        </Card>
      )}

      {/* Products exist but none fit the budget */}
      {hasProducts && !hasBudgetProducts && hasBudget && (
        <Card variant="outlined" padding="md">
          <div className="flex items-start gap-2.5 mb-2">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-neutral-700">
                No matching product within your budget
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                We found relevant products, but none fit within your
                PKR {budget.budget_pkr.toLocaleString()} budget. Consider
                increasing your treatment budget, or try the low-cost actions below.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Product list */}
      {hasProducts && (
        <div>
          <h4 className="text-sm font-semibold text-neutral-700 mb-3">
            Recommended options from our database
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Low-cost actions */}
      {lowCostActions.length > 0 && (
        <Card variant="outlined" padding="md">
          <h4 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
            <Sprout className="h-4 w-4 text-primary-600" />
            Low-cost actions you can try
          </h4>
          <ul className="space-y-2.5">
            {lowCostActions.map((action, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[10px] font-bold text-primary-700 mt-0.5">
                  {i + 1}
                </span>
                {action.action}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
