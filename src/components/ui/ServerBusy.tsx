interface ServerBusyProps {
  title?: string;
  message?: string;
}

/**
 * Reusable component for "High Load" or "Database Busy" fallback states.
 * Used during thundering herd scenarios (crawler/warmer bursts) to prevent HTTP 500s.
 */
export function ServerBusy({
  title = "Server unter hoher Last",
  message = "Wir verarbeiten gerade viele Anfragen. Bitte laden Sie die Seite in einigen Sekunden erneut.",
}: ServerBusyProps) {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-10 w-10"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-md">{message}</p>
    </div>
  );
}
