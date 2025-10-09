"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2
} from "lucide-react";

export interface TableColumn<T = any> {
  key: string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
  width?: string;
}

export interface TableAction<T = any> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: T) => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  disabled?: (row: T) => boolean;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  loading?: boolean;
  error?: string | null;
  
  // Search & Filter
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  customFilters?: React.ReactNode;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string, order: 'asc' | 'desc') => void;
  
  // Pagination
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  onPageChange?: (page: number) => void;
  
  // Styling
  title?: string;
  description?: string;
  className?: string;
  emptyMessage?: string;
  
  // Row styling
  rowClassName?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T = any>({
  data,
  columns,
  actions,
  loading = false,
  error,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,
  customFilters,
  sortBy,
  sortOrder,
  onSort,
  pagination,
  onPageChange,
  title,
  description,
  className,
  emptyMessage = "No data found",
  rowClassName,
  onRowClick,
}: DataTableProps<T>) {
  
  const handleSort = (column: string) => {
    if (!onSort) return;
    
    if (sortBy === column) {
      onSort(column, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(column, 'asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const renderCell = (column: TableColumn<T>, row: T, index: number) => {
    if (column.render) {
      return column.render((row as any)[column.key], row, index);
    }
    return (row as any)[column.key];
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header */}
      {(title || description || showSearch || customFilters) && (
        <CardHeader className="space-y-4">
          {(title || description) && (
            <div>
              {title && <CardTitle className="text-xl">{title}</CardTitle>}
              {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
            </div>
          )}
          
          {/* Search and Filters */}
          {(showSearch || customFilters) && (
            <div className="flex flex-col sm:flex-row gap-4">
              {showSearch && onSearchChange && (
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
              {customFilters}
            </div>
          )}
        </CardHeader>
      )}

      <CardContent className="p-0">
        {/* Error State */}
        {error && (
          <div className="p-8 text-center">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && data.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "text-left p-4 font-medium text-muted-foreground",
                        column.className,
                        column.sortable && onSort && "cursor-pointer hover:text-foreground transition-colors"
                      )}
                      style={{ width: column.width }}
                      onClick={column.sortable && onSort ? () => handleSort(column.key) : undefined}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{column.title}</span>
                        {column.sortable && onSort && getSortIcon(column.key)}
                      </div>
                    </th>
                  ))}
                  {actions && actions.length > 0 && (
                    <th className="text-left p-4 font-medium text-muted-foreground w-32">Actions</th>
                  )}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {data.map((row, index) => {
                  // Use a unique identifier from the row data if available, otherwise fall back to index
                  const uniqueKey = (row as any)?.id || (row as any)?.key || `row-${index}`;
                  
                  return (
                    <tr
                      key={uniqueKey}
                      className={cn(
                        "border-b border-border transition-all duration-200 hover:bg-muted/50",
                        onRowClick && "cursor-pointer",
                        rowClassName?.(row, index)
                      )}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn("p-4", column.className)}
                        style={{ width: column.width }}
                      >
                        {renderCell(column, row, index)}
                      </td>
                    ))}
                    {actions && actions.length > 0 && (
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {actions.map((action, actionIndex) => {
                            const Icon = action.icon;
                            const isDisabled = action.disabled?.(row);
                            
                            return (
                              <Button
                                key={actionIndex}
                                variant={action.variant || "ghost"}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.onClick(row);
                                }}
                                disabled={isDisabled}
                                className={cn("h-8 w-8 p-0", action.className)}
                                title={action.label}
                              >
                                {Icon && <Icon className="h-4 w-4" />}
                              </Button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{" "}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{" "}
              {pagination.totalItems} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNumber;
                  if (pagination.totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNumber = pagination.totalPages - 4 + i;
                  } else {
                    pageNumber = pagination.currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === pagination.currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange?.(pageNumber)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 