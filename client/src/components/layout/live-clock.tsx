import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { format } from "date-fns";

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 text-primary bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10 shadow-sm animate-pulse-subtle">
      <Clock className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium font-mono tabular-nums">
        {format(time, "HH:mm:ss")}
      </span>
      <span className="text-[10px] text-muted-foreground ml-1 hidden sm:inline uppercase tracking-wider">
        {format(time, "EEE, dd MMM")}
      </span>
    </div>
  );
}
