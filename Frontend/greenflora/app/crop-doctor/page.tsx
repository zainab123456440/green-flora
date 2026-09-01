"use client";

import { useState, useCallback } from "react";
import { Stethoscope, RotateCcw, Search, Leaf } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import AuthGuard from "@/components/auth/AuthGuard";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";

import ImageUploader from "@/components/cropDoctor/ImageUploader";
import DiagnosisCard from "@/components/cropDoctor/DiagnosisCard";
import RecommendationsCard from "@/components/cropDoctor/RecommendationsCard";

import { analyseCropImage, CropDoctorApiError } from "@/services/CropDoctorAPI";
import type { CropDoctorResponse } from "@/types/cropDoctor";

type AnalysisState =
  | { status: "idle" }
  | { status: "analyzing" }
  | { status: "success"; data: CropDoctorResponse }
  | { status: "error"; message: string };

export default function CropDoctorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<AnalysisState>({ status: "idle" });

  const handleImageSelected = useCallback((file: File, previewUrl: string) => {
    setSelectedFile(file);
    setPreview(previewUrl);
    setState({ status: "idle" });
  }, []);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setState({ status: "idle" });
  }, []);

  const handleAnalyse = useCallback(async () => {
    if (!selectedFile) return;

    setState({ status: "analyzing" });

    try {
      const result = await analyseCropImage(selectedFile);
      setState({ status: "success", data: result });
    } catch (err) {
      const message =
        err instanceof CropDoctorApiError
          ? err.message
          : "Something went wrong. Please try again.";
      setState({ status: "error", message });
    }
  }, [selectedFile]);

  const handleRetry = useCallback(() => {
    if (selectedFile) {
      handleAnalyse();
    } else {
      setState({ status: "idle" });
    }
  }, [selectedFile, handleAnalyse]);

  return (
    <AuthGuard>
      <AppShell title="Crop Doctor">
        <div className="max-w-3xl mx-auto space-y-6 animate-gf-fade-in">
          {/* Page header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
              <Stethoscope className="h-5 w-5 text-primary-700" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-neutral-900">Crop Doctor</h1>
              <p className="text-xs text-neutral-500">
                Upload a photo of your crop — we&apos;ll identify problems and suggest solutions
              </p>
            </div>
          </div>

          {/* Image upload */}
          <Card variant="default" padding="md">
            <ImageUploader
              onImageSelected={handleImageSelected}
              onClear={handleClear}
              selectedPreview={preview}
              disabled={state.status === "analyzing"}
            />

            {selectedFile && state.status !== "success" && (
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleAnalyse}
                  isLoading={state.status === "analyzing"}
                  className="w-full"
                >
                  {state.status === "analyzing" ? (
                    "Analysing your crop..."
                  ) : (
                    <>
                      <Search className="mr-1.5 h-4 w-4" />
                      Analyse Image
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>

          {/* Idle state */}
          {state.status === "idle" && !selectedFile && (
            <EmptyState
              icon={<Leaf className="h-5 w-5" />}
              title="Upload a crop photo to get started"
              description="Take a clear, close-up photo of the affected plant part. Good lighting and focus help us give you better results."
            />
          )}

          {/* Analyzing state */}
          {state.status === "analyzing" && (
            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-700" />
                <div>
                  <p className="text-sm font-medium text-neutral-700">
                    Analysing your crop image...
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Our AI is examining the photo. This may take a few seconds.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Error state */}
          {state.status === "error" && (
            <ErrorState message={state.message} onRetry={handleRetry} />
          )}

          {/* Success state */}
          {state.status === "success" && (
            <div className="space-y-5">
              <DiagnosisCard
                diagnosis={state.data.diagnosis}
                disclaimer={state.data.disclaimer}
              />

              <RecommendationsCard
                products={state.data.products}
                budget={state.data.budget}
                lowCostActions={state.data.low_cost_actions}
              />

              <div className="flex justify-center pt-2">
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Upload another image
                </Button>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
