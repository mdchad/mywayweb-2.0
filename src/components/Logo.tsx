import { cn } from "@/lib/utils";

export function Logomark({ width = 60, height = 60 }: { width?: number; height?: number }) {
  return (
    <img
      src="/logo.png"
      alt="Picture of the logo"
      className="bg-royal-blue px-2"
      width={width}
      height={height}
    />
  );
}

export function LogoBig({ width = 140, height = 69, className = "", priority = false }: { width?: number; height?: number, className?: string, priority?: boolean }) {
  return (
    <img
      src="/logo-horizontal-dark-background.jpg"
      alt="Picture of the logo"
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : "lazy"}
      className={cn(className, `bg-royal-blue px-2`)}
      width={width}
      height={height}
    />
  )
}
