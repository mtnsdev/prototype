type Props = {
  children: string;
  language?: "tsx" | "css" | "html" | "ts";
};

/**
 * Plain monospace code block, no syntax highlighting library to keep deps slim.
 * Used to show JSX usage under each component example.
 */
export function CodeBlock({ children, language = "tsx" }: Props) {
  return (
    <pre
      className="overflow-x-auto rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-sunken)] p-3 font-mono text-[12px] leading-[1.6] text-[color:var(--text-secondary)]"
      data-language={language}
    >
      <code>{children}</code>
    </pre>
  );
}
