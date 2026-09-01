"use client";

import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
  Leaf,
} from "lucide-react";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import type { Diagnosis, Severity } from "@/types/cropDoctor";

interface DiagnosisCardProps {
  diagnosis: Diagnosis;
  disclaimer: string;
}

function severityVariant(severity: Severity): "danger" | "warning" | "success" | "neutral" {
  switch (severity) {
    case "High":
      return "danger";
    case "Moderate":
      return "warning";
    case "Low":
      return "success";
    default:
      return "neutral";
  }
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 80) return "High confidence";
  if (confidence >= 50) return "Moderate confidence";
  if (confidence >= 30) return "Low confidence";
  return "Very uncertain";
}

function confidenceColor(confidence: number): string {
  if (confidence >= 80) return "text-success-600";
  if (confidence >= 50) return "text-amber-600";
  return "text-danger-600";
}

function problemTypeIcon(problemType: string) {
  switch (problemType) {
    case "Disease":
      return <AlertTriangle className="h-4 w-4 text-danger-500" />;
    case "Pest/Insect":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case "Nutrient Deficiency":
      return <Leaf className="h-4 w-4 text-amber-600" />;
    case "Weed":
      return <Info className="h-4 w-4 text-neutral-500" />;
    case "Environmental/Physical Stress":
      return <Info className="h-4 w-4 text-info-600" />;
    default:
      return <HelpCircle className="h-4 w-4 text-neutral-400" />;
  }
}

export default function DiagnosisCard({ diagnosis, disclaimer }: DiagnosisCardProps) {
  const isLowConfidence = diagnosis.confidence < 30;

  return (
    <Card variant="elevated" padding="none" className="overflow-hidden animate-gf-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
            <CheckCircle2 className="h-4.5 w-4.5 text-primary-100" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary-50">
              Analysis Complete
            </h3>
            <p className="text-xs text-primary-200">
              AI-powered crop assessment
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Crop and Problem */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-neutral-400 mb-1">Detected Crop</p>
            <p className="text-sm font-semibold text-neutral-800">
              {diagnosis.crop}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-400 mb-1">Possible Problem</p>
            <div className="flex items-center gap-1.5">
              {problemTypeIcon(diagnosis.problem_type)}
              <p className="text-sm font-semibold text-neutral-800">
                {diagnosis.problem}
              </p>
            </div>
          </div>
        </div>

        {/* Confidence and Severity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-neutral-400 mb-1">Confidence</p>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${confidenceColor(diagnosis.confidence)}`}>
                {Math.round(diagnosis.confidence)}%
              </span>
              <Badge
                variant={
                  diagnosis.confidence >= 80
                    ? "success"
                    : diagnosis.confidence >= 50
                      ? "warning"
                      : "danger"
                }
              >
                {confidenceLabel(diagnosis.confidence)}
              </Badge>
            </div>
            <ProgressBar
              value={diagnosis.confidence}
              showPercentage={false}
              label=""
              className="mt-2"
            />
          </div>
          <div>
            <p className="text-xs text-neutral-400 mb-1">Severity</p>
            <Badge variant={severityVariant(diagnosis.severity)}>
              {diagnosis.severity}
            </Badge>
          </div>
        </div>

        {/* Low confidence warning */}
        {isLowConfidence && (
          <div className="flex items-start gap-2.5 rounded-card border border-amber-100 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-700">
                Low confidence result
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                The image may be unclear. Please upload a well-lit, close-up photo of the
                affected part for a more accurate diagnosis.
              </p>
            </div>
          </div>
        )}

        {/* Symptoms */}
        <div>
          <p className="text-xs font-medium text-neutral-600 mb-1.5">
            What we noticed
          </p>
          <p className="text-sm text-neutral-700 leading-relaxed">
            {diagnosis.symptoms}
          </p>
        </div>

        {/* Explanation */}
        <div>
          <p className="text-xs font-medium text-neutral-600 mb-1.5">
            Possible cause
          </p>
          <p className="text-sm text-neutral-700 leading-relaxed">
            {diagnosis.explanation}
          </p>
        </div>

        {/* Problem type badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Category:</span>
          <Badge variant="neutral">{diagnosis.problem_type}</Badge>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-neutral-100 pt-3">
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            {disclaimer}
          </p>
        </div>
      </div>
    </Card>
  );
}
