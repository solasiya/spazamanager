import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-secondary">{title}</h1>
        {description && <p className="text-gray-600">{description}</p>}
      </div>
      {actions && (
        <div className="mt-4 md:mt-0">
          {actions}
        </div>
      )}
    </div>
  );
}
