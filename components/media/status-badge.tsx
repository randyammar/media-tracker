import { Badge } from "@/components/ui/badge";
import { MEDIA_STATUS_COLORS, MEDIA_STATUS_LABELS } from "@/lib/constants";
import { MediaStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: MediaStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", MEDIA_STATUS_COLORS[status])}>
      {MEDIA_STATUS_LABELS[status]}
    </Badge>
  );
}

