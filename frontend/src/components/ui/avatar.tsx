import { fullUploadUrl } from "@/lib/api/uploads";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  xs: "h-8 w-8 text-xs",
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
} as const;

type AvatarSize = keyof typeof SIZE_CLASSES;

interface AvatarProps {
  src?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fallback?: string;
  size?: AvatarSize;
  gradient?: "blue-yellow" | "yellow-orange" | "purple-pink";
  className?: string;
}

const GRADIENTS = {
  "blue-yellow": "from-blue-500 to-yellow-400",
  "yellow-orange": "from-yellow-400 to-orange-500",
  "purple-pink": "from-purple-500 to-pink-500",
} as const;

export function Avatar({
  src,
  firstName,
  lastName,
  fallback,
  size = "md",
  gradient = "blue-yellow",
  className,
}: AvatarProps) {
  const initial = (firstName?.[0] ?? lastName?.[0] ?? fallback ?? "U").toUpperCase();
  const sizeCls = SIZE_CLASSES[size];
  const url = fullUploadUrl(src) ?? src ?? undefined;

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", sizeCls, className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white",
        GRADIENTS[gradient],
        sizeCls,
        className,
      )}
    >
      {initial}
    </span>
  );
}
