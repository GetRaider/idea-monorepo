import type { ReactNode } from "react";

function formatInlineBold(text: string): ReactNode {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-zinc-200">
          {segment.slice(2, -2)}
        </strong>
      );
    }
    return segment;
  });
}

function renderBulletList(
  items: string[],
  blockIndex: number,
  listIndex: number,
): ReactNode {
  return (
    <ul
      key={`${blockIndex}-ul-${listIndex}`}
      className="mt-3 list-none space-y-2 pl-0 text-sm leading-relaxed text-zinc-400"
    >
      {items.map((line, lineIndex) => (
        <li key={lineIndex} className="flex gap-2">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-400/70" />
          <span>{formatInlineBold(line.slice(2).trim())}</span>
        </li>
      ))}
    </ul>
  );
}

function renderMixedBlock(block: string, blockIndex: number): ReactNode {
  const rawLines = block.split("\n");
  const lines = rawLines.map((line) => line.trimEnd().trim());

  const nodes: ReactNode[] = [];
  let paragraphBuffer: string[] = [];
  let bulletBuffer: string[] = [];
  let listCounter = 0;

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    const text = paragraphBuffer.join(" ").trim();
    if (text.length > 0) {
      nodes.push(
        <p
          key={`${blockIndex}-p-${nodes.length}`}
          className="mt-3 text-sm leading-relaxed text-zinc-400 first:mt-0"
        >
          {formatInlineBold(text)}
        </p>,
      );
    }
    paragraphBuffer = [];
  };

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    nodes.push(renderBulletList(bulletBuffer, blockIndex, listCounter++));
    bulletBuffer = [];
  };

  for (const line of lines) {
    if (line.length === 0) {
      flushParagraph();
      flushBullets();
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      bulletBuffer.push(line);
    } else {
      flushBullets();
      paragraphBuffer.push(line);
    }
  }

  flushParagraph();
  flushBullets();

  return (
    <div key={blockIndex} className="space-y-1">
      {nodes}
    </div>
  );
}

type SectionRichTextProps = {
  body: string;
  preformatted?: boolean;
};

export function SectionRichText({ body, preformatted }: SectionRichTextProps) {
  if (preformatted) {
    return (
      <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-400">
        {body}
      </pre>
    );
  }

  const blocks = body.split(/\n\n+/).filter((block) => block.trim().length > 0);
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => renderMixedBlock(block, index))}
    </div>
  );
}
