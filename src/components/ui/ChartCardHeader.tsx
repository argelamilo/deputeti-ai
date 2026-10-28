interface ChartCardHeaderProps {
  title: string;
  subtitle?: string | any;
  icon?: React.ReactNode;
  iconBgColor?: string;
}

export function ChartCardHeader({ title, subtitle, icon, iconBgColor = "#ecfdf5" }: ChartCardHeaderProps) {
  return (
    <div className="pb-3 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm font-medium text-black">
            {icon && (
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: iconBgColor }}
              >
                {icon}
              </span>
            )}
            {title}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 ml-8">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
