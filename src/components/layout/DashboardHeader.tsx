import { UserMenu } from "@/components/navigation/UserMenu";
import { DashboardTitle } from "./DashboardTitle";
import { DashboardDescription } from "./DashboardDescription";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  user?: {
    id: string;
    email: string;
    company_name?: string;
    client_id?: string;
  };
  onLogout?: () => void;
}

export function DashboardHeader({
  title,
  description,
  user,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <DashboardTitle title={title} />
      
      <div className="flex flex-col items-end gap-2">
        <UserMenu user={user} onLogout={onLogout} />
        {description && <DashboardDescription description={description} />}
      </div>
    </div>
  );
}
