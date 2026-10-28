import { ReactNode } from "react";

interface DashboardLayoutProps {
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function DashboardLayout({ header, children, footer }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen py-2 sm:py-4 px-3 sm:px-6">
      {/* Header */}
      <header className="shrink-0">
        {header}
      </header>

      {/* Main Content */}
      <main className="grow">
        {children}
      </main>

      {/* Footer */}
      {footer && (
        <footer className="shrink-0">
          {footer}
        </footer>
      )}
    </div>
  );
}
