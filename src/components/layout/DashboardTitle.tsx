interface DashboardTitleProps {
  title: string;
}

export function DashboardTitle({ title }: DashboardTitleProps) {
  return (
    <h1
      className="text-2xl font-bold"
      style={{ fontFamily: "'Space Grotesk', sans-serif", color: "black" }}
    >
      {title}
    </h1>
  );
}
