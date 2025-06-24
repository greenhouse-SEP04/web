import type { HTMLAttributes } from "react";

/** Tiny spinner shown while data is loading */
export default function Loader(
  {
    size = 8,
    className = "",
    ...rest                    // forward any extra DOM props (e.g. data-testids)
  }: HTMLAttributes<HTMLDivElement> & {
    size?: 4 | 6 | 8 | 10 | 12;
    className?: string;
  },
) {
  const s = `h-${size} w-${size}`; // finite union so Tailwind can tree-shake
  return (
    <div
      data-testid="loader"      /* sensible default for tests */
      className={`flex justify-center py-8 ${className}`}
      {...rest}
    >
      <div
        className={`${s} animate-spin rounded-full border-4 border-primary border-t-transparent`}
      />
    </div>
  );
}
