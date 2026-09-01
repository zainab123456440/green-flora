"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Camera, X, ImageIcon } from "lucide-react";
import Button from "@/components/ui/Button";

interface ImageUploaderProps {
  onImageSelected: (file: File, preview: string) => void;
  onClear: () => void;
  selectedPreview: string | null;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ImageUploader({
  onImageSelected,
  onClear,
  selectedPreview,
  disabled = false,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Please upload a JPEG, PNG, or WebP image.");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(
          `Image is too large (${Math.round(file.size / (1024 * 1024))} MB). Maximum is 10 MB.`
        );
        return;
      }

      if (file.size === 0) {
        setError("The selected image is empty. Please choose another file.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        onImageSelected(file, reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelected]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
      e.target.value = "";
    },
    [validateAndSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  if (selectedPreview) {
    return (
      <div className="relative overflow-hidden rounded-card border border-neutral-200 bg-surface-card shadow-card">
        <img
          src={selectedPreview}
          alt="Uploaded crop"
          className="w-full max-h-72 object-contain bg-neutral-50"
        />
        <button
          onClick={onClear}
          disabled={disabled}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-md backdrop-blur-sm transition hover:bg-white hover:text-neutral-900 disabled:opacity-50"
          aria-label="Remove image"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-neutral-100 bg-neutral-50/50">
          <ImageIcon className="h-3.5 w-3.5 text-neutral-400" />
          <span className="text-xs text-neutral-500">Image ready for analysis</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed
          cursor-pointer transition-all duration-200 px-6 py-10
          ${
            dragOver
              ? "border-primary-500 bg-primary-50"
              : "border-neutral-200 bg-surface-card hover:border-primary-300 hover:bg-primary-50/30"
          }
          ${disabled ? "cursor-not-allowed opacity-60" : ""}
        `}
        role="button"
        tabIndex={0}
        aria-label="Upload crop image"
      >
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl transition
            ${dragOver ? "bg-primary-100" : "bg-neutral-100"}`}
        >
          <Upload className={`h-6 w-6 ${dragOver ? "text-primary-600" : "text-neutral-500"}`} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-700">
            Drop your crop photo here
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            or tap to browse — JPEG, PNG, or WebP (max 10 MB)
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-1"
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Choose File
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
          className="flex-1"
        >
          <Camera className="mr-1.5 h-3.5 w-3.5" />
          Take Photo
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {error && (
        <div className="flex items-start gap-2 rounded-card border border-danger-100 bg-danger-50 px-4 py-3">
          <span className="text-xs text-danger-600">{error}</span>
        </div>
      )}
    </div>
  );
}
