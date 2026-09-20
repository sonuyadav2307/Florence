export function FlowerPlaceholder({
  name,
  hex,
}: {
  name: string;
  hex: string;
}) {
  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 bg-[#efece6] px-3 text-center">
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="20" r="10" fill={hex} />
        <path d="M24 28c0 8-6 14-6 14h12s-6-6-6-14z" fill="#71816A" />
      </svg>
      <p className="text-sm text-ink">{name}</p>
      <span
        className="h-4 w-10 rounded-full border border-border"
        style={{ background: hex }}
        aria-hidden="true"
      />
    </div>
  );
}
