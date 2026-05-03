import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams: Record<string, string | string[] | undefined>;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();

    // Handle all search params including arrays
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key === "page") return; // Skip current page param

      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else if (value !== undefined && value !== null) {
        params.set(key, value.toString());
      }
    });

    params.set("page", pageNumber.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  // Generate page numbers
  const renderPageNumbers = () => {
    const pages = [];
    const _maxVisible = 5;

    // Always show first, last, and window around current
    // Pattern: 1 2 ... 112 (if on 1)
    // Pattern: 1 ... 5 6 7 ... 112 (if on 6)

    let rangeStart = Math.max(2, currentPage - 1);
    let rangeEnd = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      rangeStart = 2;
      rangeEnd = Math.min(totalPages - 1, 4);
    }

    if (currentPage >= totalPages - 2) {
      rangeStart = Math.max(2, totalPages - 3);
      rangeEnd = totalPages - 1;
    }

    // Page 1
    pages.push(
      currentPage === 1 ? (
        <span key={1} className="cursor-default font-bold text-gray-900">
          1
        </span>
      ) : (
        <Link
          key={1}
          href={createPageUrl(1)}
          className="text-idealo-blue hover:underline"
        >
          1
        </Link>
      ),
    );

    // Initial Ellipsis
    if (rangeStart > 2) {
      pages.push(
        <span key="start-ellipsis" className="text-gray-400">
          ...
        </span>,
      );
    }

    // Middle Range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      if (i === 1 || i === totalPages) continue; // formatting safety
      pages.push(
        i === currentPage ? (
          <span key={i} className="cursor-default font-bold text-gray-900">
            {i}
          </span>
        ) : (
          <Link
            key={i}
            href={createPageUrl(i)}
            className="text-idealo-blue hover:underline"
          >
            {i}
          </Link>
        ),
      );
    }

    // End Ellipsis
    if (rangeEnd < totalPages - 1) {
      pages.push(
        <span key="end-ellipsis" className="text-gray-400">
          ...
        </span>,
      );
    }

    // Last Page
    if (totalPages > 1) {
      pages.push(
        currentPage === totalPages ? (
          <span
            key={totalPages}
            className="cursor-default font-bold text-gray-900"
          >
            {totalPages}
          </span>
        ) : (
          <Link
            key={totalPages}
            href={createPageUrl(totalPages)}
            className="text-idealo-blue hover:underline"
          >
            {totalPages}
          </Link>
        ),
      );
    }

    return pages;
  };

  return (
    <div className="border-idealo-border flex h-[80px] w-full items-stretch justify-end border border-t-0 bg-white shadow-sm">
      {/* Pagination Group (Prev + Numbers) */}
      <div className="flex items-center gap-6 pr-6">
        {/* Previous Button (Icon only) */}
        {currentPage > 1 && (
          <Link
            href={createPageUrl(currentPage - 1)}
            className="text-idealo-blue hover:text-idealo-blue-hover flex items-center justify-center"
            aria-label="Vorherige Seite"
          >
            <ChevronLeft className="h-8 w-8" strokeWidth={1.5} />
          </Link>
        )}

        {/* Page Numbers */}
        <div className="flex items-center gap-6 text-[18px]">
          {renderPageNumbers()}
        </div>
      </div>

      {/* Next Button - Large Blue Block */}
      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="bg-idealo-blue hover:bg-idealo-blue-hover flex w-[80px] items-center justify-center text-white transition-colors"
          aria-label="Nächste Seite"
        >
          <ChevronRight className="h-10 w-10" strokeWidth={2} />
        </Link>
      ) : (
        /* Placeholder to keep alignment if needed (visual balance) */
        <div className="w-[80px]" />
      )}
    </div>
  );
}
