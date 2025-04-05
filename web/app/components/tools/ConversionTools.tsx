"use client";
import { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import MonacoEditor from "@monaco-editor/react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface ConversionState {
    mode: "csv-to-excel" | "excel-to-csv";
    content: string;
    file: File | null;
    preview: any;
    loading: boolean;
    error: string | null;
    gridData: any[];
    gridColumns: any[];
}

export default function ConversionTools() {
    const pathname = usePathname();
    const tool = pathname.split("/").pop();
    const [state, setState] = useState<ConversionState>({
        mode: "csv-to-excel",
        content: "",
        file: null,
        preview: null,
        loading: false,
        error: null,
        gridData: [],
        gridColumns: [],
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [gridApi, setGridApi] = useState<any>(null);
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    const defaultColDef = {
        editable: true,
        resizable: true,
        sortable: true,
        filter: true,
        flex: 1,
        autoHeight: true,
    };

    const onGridReady = (params: any) => {
        setGridApi(params.api);
        params.api.sizeColumnsToFit();
    };

    const handleAddRow = () => {
        const newRow = state.gridColumns.reduce((acc, col) => {
            acc[col.field] = "";
            return acc;
        }, {});
        setState((prev) => ({
            ...prev,
            gridData: [...prev.gridData, newRow],
        }));
    };

    const handleAddColumn = () => {
        const colName = `Column ${state.gridColumns.length + 1}`;
        setState((prev) => ({
            ...prev,
            gridColumns: [
                ...prev.gridColumns,
                { field: colName, headerName: colName },
            ],
            gridData: prev.gridData.map((row) => ({ ...row, [colName]: "" })),
        }));
    };

    const convertGridToCSV = () => {
        if (!gridApi) return "";
        const csvData: string[] = [];
        const headers = state.gridColumns.map((col) => col.field);
        csvData.push(headers.join(","));

        state.gridData.forEach((row) => {
            const rowData = headers.map((header) => row[header] || "");
            csvData.push(rowData.join(","));
        });

        return csvData.join("\n");
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            setState((prev) => ({
                ...prev,
                error: "File size exceeds 20MB limit",
            }));
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const endpoint = tool === "image-converter" 
                ? "http://localhost:5000/api/convert-image"
                : "http://localhost:5000/api/excel-to-csv";
                
            const response = await fetch(endpoint, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                setState((prev) => ({
                    ...prev,
                    gridColumns: data.columns || [],
                    gridData: data.rows || [],
                    file,
                    content: data.csv || "",
                }));
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            setState((prev) => ({ 
                ...prev, 
                error: "Failed to process file" 
            }));
        } finally {
            setState((prev) => ({ ...prev, loading: false }));
        }
    };

    const handleConvert = async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            if (state.mode === "csv-to-excel") {
                const response = await fetch(
                    "http://localhost:5000/convert/csv-to-excel",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                        body: `csv=${encodeURIComponent(state.content)}`,
                    }
                );

                if (!response.ok) throw new Error("Conversion failed");

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "converted.xlsx";
                a.click();
            }
        } catch (error) {
            setState((prev) => ({ ...prev, error: "Conversion failed" }));
        } finally {
            setState((prev) => ({ ...prev, loading: false }));
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">CSV/Excel Converter</h1>
                <div className="flex items-center gap-4">
                    <select
                        value={state.mode}
                        onChange={(e) =>
                            setState((prev) => ({
                                ...prev,
                                mode: e.target.value as ConversionState["mode"],
                                content: "",
                                file: null,
                                preview: null,
                            }))
                        }
                        className="px-3 py-2 border rounded"
                    >
                        <option value="csv-to-excel">CSV to Excel</option>
                        <option value="excel-to-csv">Excel to CSV</option>
                    </select>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleConvert}
                        disabled={state.loading || !state.content}
                        className="px-4 py-2 bg-[#78A083] text-white rounded hover:bg-[#6a8f74] 
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {state.loading ? "Converting..." : "Convert"}
                    </motion.button>
                </div>
            </div>

            {state.error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 text-red-700 rounded"
                >
                    {state.error}
                </motion.div>
            )}

            <div className="grid gap-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="space-x-2">
                            <button
                                onClick={handleAddRow}
                                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                            >
                                Add Row
                            </button>
                            <button
                                onClick={handleAddColumn}
                                className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                            >
                                Add Column
                            </button>
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-sm text-blue-500 hover:underline"
                        >
                            Import File
                        </button>
                    </div>

                    <div
                        className="ag-theme-alpine"
                        style={{ height: "500px", width: "100%" }}
                    >
                        <AgGridReact
                            rowData={state.gridData}
                            columnDefs={state.gridColumns}
                            defaultColDef={defaultColDef}
                            onGridReady={onGridReady}
                            enableRangeSelection={true}
                            copyHeadersToClipboard={true}
                            undoRedoCellEditing={true}
                            undoRedoCellEditingLimit={20}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
