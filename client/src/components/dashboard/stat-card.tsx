import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  borderColor: string;
  bgColor: string;
  iconColor: string;
};

export const StatCard = ({
  title,
  value,
  icon,
  trend,
  borderColor,
  bgColor,
  iconColor,
}: StatCardProps) => {
  return (
    <div className={cn("bg-white rounded-lg shadow-sm p-5 border-l-4", borderColor)}>
      <div className="flex justify-between">
        <div>
          <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
          <p className="text-2xl font-bold font-heading">{value}</p>
          {trend && (
            <p className={cn("text-sm flex items-center mt-1", trend.isPositive ? "text-success" : "text-danger")}>
              <span className="mr-1">
                {trend.isPositive ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 7a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0V9.414L6.707 13.707a1 1 0 0 1-1.414-1.414l5-5a1 1 0 0 1 1.414 0L15 10.586V8a1 1 0 0 1 1-1h-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 13a1 1 0 0 0 1-1V7a1 1 0 1 0-2 0v5.586l-4.293-4.293a1 1 0 0 0-1.414 1.414l5 5a1 1 0 0 0 1.414 0L15 11.414V14a1 1 0 0 0 1 1h-4z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
              {trend.value}
            </p>
          )}
        </div>
        <div className={cn("rounded-full w-12 h-12 flex items-center justify-center", bgColor)}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  );
};
