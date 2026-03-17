"use client";

import { useRef, useState } from "react";
import { HiPhotograph, HiX, HiUpload } from "react-icons/hi";

interface ImageUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export default function ImageUpload({
  files,
  onChange,
  maxFiles = 5,
  maxSizeMB = 10,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const validate = (incoming: File[]): File[] => {
    setError("");
    const valid: File[] = [];
    for (const file of incoming) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        continue;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Each image must be under ${maxSizeMB} MB.`);
        continue;
      }
      valid.push(file);
    }
    return valid;
  };

  const addFiles = (incoming: File[]) => {
    const valid = validate(incoming);
    const combined = [...files, ...valid];
    if (combined.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed.`);
      onChange(combined.slice(0, maxFiles));
    } else {
      onChange(combined);
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => files.length < maxFiles && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragOver
            ? "border-orange-400 bg-orange-50"
            : files.length >= maxFiles
            ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
            : "border-gray-300 hover:border-orange-300 hover:bg-orange-50/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleFileInput}
          disabled={files.length >= maxFiles}
        />
        <HiPhotograph size={40} className="mx-auto mb-3 text-gray-300" />
        {files.length >= maxFiles ? (
          <p className="text-sm font-medium text-gray-500">
            Maximum {maxFiles} images reached
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-600">
              <span className="text-orange-500">Click to upload</span> or drag & drop
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG, WEBP up to {maxSizeMB} MB each — max {maxFiles} images
            </p>
          </>
        )}
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <HiUpload size={14} className="text-gray-400" />
          <span className="text-xs text-gray-400">{files.length}/{maxFiles} selected</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Thumbnails */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {files.map((file, idx) => (
            <div key={idx} className="relative group aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-full h-full object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <HiX size={10} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 rounded-b-lg px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-[10px] truncate">{file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
