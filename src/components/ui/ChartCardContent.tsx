interface ChartCardContentProps {
  children: React.ReactNode;
}

export function ChartCardContent({ children }: ChartCardContentProps) {
  return (
    <div className="px-6 pb-6">
      {children}
    </div>
  );
}
