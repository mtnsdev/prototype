"use client";


type Props = {
  text: string;
};

/**
 * Prototype rich text: preserves paragraphs; production will use a real editor / markdown pipeline.
 */
export function RichTextSection({ text }: Props) {
  const blocks = text.split(/\n\n+/).filter(Boolean);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground">
      {blocks.map((para, i) => (
        <p key={i}>
          {para}
        </p>
      ))}
    </div>
  );
}
