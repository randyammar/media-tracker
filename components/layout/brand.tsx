import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface BrandProps {
  href?: string;
  className?: string;
  compact?: boolean;
}

export function Brand({ href = "/", className, compact = false }: BrandProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image src="/collectify-logo.svg" alt={`${APP_NAME} logo`} width={compact ? 26 : 32} height={compact ? 26 : 32} />
      <span className={cn("font-semibold tracking-tight", compact ? "text-sm" : "text-base md:text-lg")}>
        {APP_NAME}
      </span>
    </span>
  );

  return (
    <Link href={href} className="inline-flex items-center">
      {content}
    </Link>
  );
}

