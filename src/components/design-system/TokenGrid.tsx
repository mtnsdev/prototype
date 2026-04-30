import type { Token } from "@/lib/designSystemTokens";
import { TokenSwatch } from "./TokenSwatch";

type Props = {
  title: string;
  description?: string;
  tokens: Token[];
  /** Grid columns. Default 3. */
  columns?: 2 | 3 | 4;
};

/**
 * Heading + grid of TokenSwatches. Use one per logical group on the
 * Foundations section.
 */
export function TokenGrid({ title, description, tokens, columns = 3 }: Props) {
  const colClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <h3 className="text-[14px] font-medium text-[color:var(--text-primary)]">{title}</h3>
        {description ? (
          <p className="text-[12px] text-[color:var(--text-tertiary)]">{description}</p>
        ) : null}
      </div>
      <div className={`grid grid-cols-1 gap-2 ${colClass}`}>
        {tokens.map((t) => (
          <TokenSwatch key={t.name} token={t} />
        ))}
      </div>
    </div>
  );
}
