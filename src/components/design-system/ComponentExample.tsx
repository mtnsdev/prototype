import type { ReactNode } from "react";
import { CodeBlock } from "./CodeBlock";

type Props = {
  title: string;
  description?: string;
  /** The live, rendered component. */
  preview: ReactNode;
  /** Optional JSX snippet shown below the preview. */
  snippet?: string;
};

export function ComponentExample({ title, description, preview, snippet }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="space-y-0.5">
        <h4 className="text-[13px] font-medium text-[color:var(--text-primary)]">{title}</h4>
        {description ? (
          <p className="text-[12px] text-[color:var(--text-tertiary)]">{description}</p>
        ) : null}
      </div>
      <div className="rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-5">
        <div className="flex flex-wrap items-center gap-3">{preview}</div>
      </div>
      {snippet ? <CodeBlock>{snippet}</CodeBlock> : null}
    </div>
  );
}
