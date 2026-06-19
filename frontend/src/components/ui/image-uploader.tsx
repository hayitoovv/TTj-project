"use client";

import { Image as ImageIcon, Loader2, Star, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { extractApiError } from "@/lib/api/client";
import { fullUploadUrl, uploadsApi } from "@/lib/api/uploads";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  subdir?: string;
  maxFiles?: number;
}

export function ImageUploader({
  urls,
  onChange,
  subdir = "houses",
  maxFiles = 10,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = maxFiles - urls.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) {
      setError(`Maksimal ${maxFiles} ta rasm`);
      return;
    }

    setUploading(true);
    setProgress({ done: 0, total: toUpload.length });

    const uploaded: string[] = [];
    for (let i = 0; i < toUpload.length; i++) {
      try {
        const result = await uploadsApi.uploadImage(toUpload[i], subdir);
        uploaded.push(result.url);
        setProgress({ done: i + 1, total: toUpload.length });
      } catch (e) {
        setError(extractApiError(e));
        break;
      }
    }

    if (uploaded.length > 0) {
      onChange([...urls, ...uploaded]);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (i: number) => {
    onChange(urls.filter((_, idx) => idx !== i));
  };

  const setMain = (i: number) => {
    const updated = [urls[i], ...urls.filter((_, idx) => idx !== i)];
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (!uploading) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-8 text-center transition",
          "border-input bg-muted/30 hover:border-primary hover:bg-primary/5",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">
              Yuklanmoqda... ({progress.done}/{progress.total})
            </p>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">Rasmlarni shu yerga tashlang</p>
            <p className="text-xs text-muted-foreground">
              yoki bosib tanlang · JPG/PNG/WebP, max 10 MB
            </p>
            <p className="text-[11px] text-muted-foreground">
              {urls.length} / {maxFiles} ta rasm
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Previews */}
      {urls.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {urls.map((url, i) => (
            <div
              key={url + i}
              className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullUploadUrl(url)}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              {/* Fallback when image fails */}
              <ImageIcon className="absolute inset-0 m-auto h-8 w-8 text-muted-foreground/30" />

              {/* Main badge */}
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-md bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-foreground shadow-sm">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  ASOSIY
                </span>
              )}

              {/* Actions */}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMain(i);
                    }}
                    className="rounded-md bg-white/95 px-2 py-1 text-[10px] font-semibold text-foreground shadow hover:bg-white"
                  >
                    Asosiy
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(i);
                  }}
                  className="ml-auto flex h-7 w-7 items-center justify-center rounded-md bg-red-500/95 text-white shadow hover:bg-red-600"
                  aria-label="O'chirish"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
