"use client";

import { Button } from "@/components/ui/Button";
import { exportCSV, exportExcel } from "@/lib/utils/export";

type CellValue = string | number | null | undefined;

interface ExportButtonsProps {
  filename:  string;
  sheetName: string;
  headers:   string[];
  rows:      CellValue[][];
  disabled?: boolean;
}

export function ExportButtons({ filename, sheetName, headers, rows, disabled }: ExportButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || !rows.length}
        onClick={() => exportCSV(filename, headers, rows)}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || !rows.length}
        onClick={() => exportExcel(filename, sheetName, headers, rows)}
      >
        <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Excel
      </Button>
    </div>
  );
}
