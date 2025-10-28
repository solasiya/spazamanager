import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <img
        src="https://iili.io/K2Ukuyv.png"
        alt="App Logo"
        style={{
          width: "180px",
          height: "180px",
          background: "none",
          maxWidth: "none",
          maxHeight: "none",
        }}
      />
    </div>
  );
}
