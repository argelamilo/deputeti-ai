interface BreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
  }>;
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <span className="mx-1 sm:mx-2 text-gray-400">/</span>
          )}
          {item.href ? (
            <a
              href={item.href}
              className="text-gray-600 hover:text-black transition-colors truncate max-w-[120px] sm:max-w-none"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {item.label}
            </a>
          ) : (
            <span
              className="text-black font-medium truncate max-w-[150px] sm:max-w-none"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
