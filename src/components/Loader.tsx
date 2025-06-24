export default function Loader({
  size = 8,
  className = "",
}: {
  size?: 4 | 6 | 8 | 10 | 12;
  className?: string;
}) {
  const s = `h-${size} w-${size}`;      // safe – finite union, so Tailwind can tree-shake
  return (
    <div className={`flex justify-center py-8 ${className}`}>
      <div
        className={`${s} animate-spin rounded-full border-4 border-primary border-t-transparent`}
      />
    </div>
  );
}
