"use client";

import { useMemo, useRef, useState } from "react";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { XCircle, CheckCircle2 } from "lucide-react";

export function ResultsTable({ data, schemaColumns, activeTab }: { data: any[], schemaColumns: { key: string, name: string }[], activeTab: string }) {

  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    const cols: ColumnDef<any, any>[] = [];
    
    if (activeTab === "all") {
      cols.push({
        id: "status",
        header: "",
        size: 40,
        cell: ({ row }: any) => {
          const isInvalid = !!row.original.errors;
          return isInvalid ? (
            <XCircle className="w-4 h-4 text-red-500 mx-auto" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
          );
        },
      });
    }

    cols.push({
      id: "index",
      header: "Row",
      size: 60,
      accessorFn: (row: any) => row._ixRowIndex,
      cell: (info: any) => {
        return <div className="text-right pr-2 text-foreground-muted font-medium">{info.getValue() as number}</div>;
      },
    });

    schemaColumns.forEach(c => {
      cols.push({
        id: c.key,
        accessorFn: (row: any) => row.data ? row.data[c.key] : row[c.key],
        header: c.name,
        size: c.key === "email" ? 250 : 150,
        cell: (info: any) => {
          const val = info.getValue();
          const row = info.row.original;
          const isInvalid = !!row.errors;
          const hasError = row.errors && row.errors[c.key];
          
          return (
            <div className="px-2 break-all" title={String(val ?? "")}>
              {val !== undefined && val !== null ? String(val) : <span className="opacity-40 italic">empty</span>}
            </div>
          );
        },
      });
    });

    cols.push({
      id: "_errors",
      header: "Errors",
      size: 350,
      cell: ({ row }: any) => {
        if (!row.original.errors) return null;
        const errors = row.original.errors;
        const errorEntries = Object.entries(errors);
        if (errorEntries.length === 0) return null;

        return (
          <div className="flex flex-col gap-1 py-1 px-2 whitespace-normal break-words w-full">
            {errorEntries.map(([field, fieldErrors]: [string, any]) => (
              fieldErrors.map((err: any, i: number) => (
                <div key={`${field}-${i}`} className="text-xs text-foreground-muted flex gap-1">
                  <span className="font-semibold flex-shrink-0">{field}:</span>
                  <span>{err.message}</span>
                </div>
              ))
            ))}
          </div>
        );
      },
    });

    return cols;
  }, [schemaColumns, activeTab]);

  const table = useReactTable({
    data,
    columns: columns as any,
    getCoreRowModel: getCoreRowModel(),
  });

  const parentRef = useRef<HTMLDivElement>(null);
  
  const { rows } = table.getRowModel();
  
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  if (data.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-t border-border">
        <p className="text-foreground font-medium mb-1">No rows to display</p>
        <p className="text-sm text-foreground-muted">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div 
      ref={parentRef} 
      className="flex-1 overflow-auto bg-background custom-scrollbar relative border-t border-border"
      style={{ height: '500px' }}
    >
      <div 
        className="sticky top-0 z-10 bg-foreground/5 border-b border-border font-medium text-xs text-foreground-muted uppercase tracking-wider flex"
        style={{ width: table.getTotalSize() || '100%', minWidth: '100%' }}
      >
        {table.getFlatHeaders().map((header) => (
          <div
            key={header.id}
            className="px-2 py-2 flex items-center"
            style={{ width: header.getSize() }}
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
          </div>
        ))}
      </div>

      <div 
        style={{ 
          height: `${rowVirtualizer.getTotalSize()}px`, 
          width: table.getTotalSize() || '100%',
          minWidth: '100%',
          position: 'relative' 
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={row.id}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              className={`absolute top-0 left-0 w-full flex flex-col border-b border-border/50 ${
                (row.original as any).errors ? 'bg-red-500/[0.02]' : 'hover:bg-foreground/5'
              }`}
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="flex w-full items-start min-h-[36px] py-1">
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className="px-2 text-sm flex items-start mt-1"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
