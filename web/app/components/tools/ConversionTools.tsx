"use client";
import { useState, useRef } from "react";
import { usePathname } from "next/navigation";

interface ConversionState {
    mode: "csv-to-excel" | "excel-to-csv" | "image-resizer";
    content: string;
    file: File | null;
    loading: boolean;
    error: string | null;
    imagePreview: string | null;
    width: number;
    height: number;
    maintainAspectRatio: boolean;
}

export default function ConversionTools() {
    const pathname = usePathname();
    const tool = pathname.split("/").pop();
    const [state, setState] = useState<ConversionState>({
        mode: tool === "image-converter" ? "image-resizer" : "csv-to-excel",
        content: "",
        file: null,
        loading: false,
        error: null,
        imagePreview: null,
        width: 800,
        height: 600,
        maintainAspectRatio: true,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (state.mode === "image-resizer") {
            // Validate image file
            if (!file.type.startsWith("image/")) {
                setState((prev) => ({
                    ...prev,
                    error: "Please upload a valid image file",
                }));
                return;
            }

            // Create image preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setState((prev) => ({
                    ...prev,
                    file,
                    imagePreview: e.target?.result as string,
                    loading: false,
                }));
            };
            reader.readAsDataURL(file);
            return;
        }

        // Handle CSV/Excel files
        const validTypes = [
            "text/csv",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];
        if (!validTypes.includes(file.type)) {
            setState((prev) => ({
                ...prev,
                error: "Please upload a valid CSV or Excel file",
            }));
            return;
        }

        setState((prev) => ({ ...prev, loading: true, error: null }));

        try {
            // Read file content
            const text = await file.text();
            setState((prev) => ({
                ...prev,
                content: text,
                file,
                loading: false,
            }));
        } catch (error) {
            setState((prev) => ({
                ...prev,
                error: "Failed to read file",
                loading: false,
            }));
        }
    };

    const handleConvert = async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        try {
            const formData = new FormData();
            if (!state.file) throw new Error("No file selected");
            formData.append("file", state.file);

            if (state.mode === "image-resizer") {
                formData.append("width", state.width.toString());
                formData.append("height", state.height.toString());
                formData.append(
                    "maintainAspectRatio",
                    state.maintainAspectRatio.toString()
                );

                const response = await fetch(
                    "http://localhost:5000/api/resize-image",
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                if (!response.ok) throw new Error("Resizing failed");

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `resized_${state.file.name}`;
                a.click();
                return;
            }

            // Handle CSV/Excel conversion
            const endpoint =
                state.mode === "csv-to-excel"
                    ? "http://localhost:5000/api/csv-to-excel"
                    : "http://localhost:5000/api/excel-to-csv";

            const response = await fetch(endpoint, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Conversion failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download =
                state.mode === "csv-to-excel"
                    ? "converted.xlsx"
                    : "converted.csv";
            a.click();
        } catch (error) {
            setState((prev) => ({
                ...prev,
                error:
                    error instanceof Error ? error.message : "Operation failed",
            }));
        } finally {
            setState((prev) => ({ ...prev, loading: false }));
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                    {state.mode === "image-resizer"
                        ? "Image Resizer"
                        : "File Converter"}
                </h1>
                {state.mode !== "image-resizer" && (
                    <select
                        value={state.mode}
                        onChange={(e) =>
                            setState((prev) => ({
                                ...prev,
                                mode: e.target.value as ConversionState["mode"],
                                content: "",
                                file: null,
                            }))
                        }
                        className="px-3 py-2 border rounded"
                    >
                        <option value="csv-to-excel">CSV to Excel</option>
                        <option value="excel-to-csv">Excel to CSV</option>
                    </select>
                )}
            </div>

            {state.error && (
                <div className="p-4 bg-red-50 text-red-700 rounded">
                    {state.error}
                </div>
            )}

            {state.mode === "image-resizer" ? (
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-blue-500 hover:text-blue-700"
                        >
                            Choose an image file
                        </button>
                        {state.file && (
                            <p className="mt-2 text-sm text-gray-500">
                                Selected: {state.file.name}
                            </p>
                        )}
                    </div>

                    {state.imagePreview && (
                        <div className="space-y-4">
                            <div className="border rounded-lg p-4">
                                <img
                                    src={state.imagePreview}
                                    alt="Preview"
                                    className="max-w-full h-auto mx-auto"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Width (px)
                                    </label>
                                    <input
                                        type="number"
                                        value={state.width}
                                        onChange={(e) =>
                                            setState((prev) => ({
                                                ...prev,
                                                width:
                                                    parseInt(e.target.value) ||
                                                    0,
                                            }))
                                        }
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Height (px)
                                    </label>
                                    <input
                                        type="number"
                                        value={state.height}
                                        onChange={(e) =>
                                            setState((prev) => ({
                                                ...prev,
                                                height:
                                                    parseInt(e.target.value) ||
                                                    0,
                                            }))
                                        }
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="aspectRatio"
                                    checked={state.maintainAspectRatio}
                                    onChange={(e) =>
                                        setState((prev) => ({
                                            ...prev,
                                            maintainAspectRatio:
                                                e.target.checked,
                                        }))
                                    }
                                    className="mr-2"
                                />
                                <label
                                    htmlFor="aspectRatio"
                                    className="text-sm text-gray-600"
                                >
                                    Maintain aspect ratio
                                </label>
                            </div>

                            <button
                                onClick={handleConvert}
                                disabled={state.loading}
                                className="w-full px-4 py-2 bg-[#78A083] text-white rounded 
                                         hover:bg-[#6a8f74] disabled:opacity-50 
                                         disabled:cursor-not-allowed"
                            >
                                {state.loading ? "Resizing..." : "Resize Image"}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept={
                                state.mode === "csv-to-excel" ? ".csv" : ".xlsx"
                            }
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-blue-500 hover:text-blue-700"
                        >
                            Choose a{" "}
                            {state.mode === "csv-to-excel" ? "CSV" : "Excel"}{" "}
                            file
                        </button>
                        {state.file && (
                            <p className="mt-2 text-sm text-gray-500">
                                Selected: {state.file.name}
                            </p>
                        )}
                    </div>

                    {state.file && (
                        <button
                            onClick={handleConvert}
                            disabled={state.loading}
                            className="w-full px-4 py-2 bg-[#78A083] text-white rounded 
                                     hover:bg-[#6a8f74] disabled:opacity-50 
                                     disabled:cursor-not-allowed"
                        >
                            {state.loading ? "Converting..." : "Convert"}
                        </button>
                    )}

                    {state.content && (
                        <div className="border rounded-lg">
                            <div className="border-b bg-gray-50 p-2">
                                <span className="text-sm font-medium">
                                    File Preview
                                </span>
                            </div>
                            <pre className="p-4 overflow-auto max-h-[300px] text-sm">
                                {state.content.slice(0, 1000)}
                                {state.content.length > 1000 && "..."}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
