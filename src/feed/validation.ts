const BARE_LF_PATTERN = /(^|[^\r])\n/;
const BARE_CR_PATTERN = /\r(?!\n)/;

export function normalizeIcsLineEndings(ics: string): string {
  const normalized = ics.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n');
  return normalized.endsWith('\r\n') ? normalized : `${normalized}\r\n`;
}

export function validateIcsContentLines(ics: string): void {
  if (BARE_LF_PATTERN.test(ics) || BARE_CR_PATTERN.test(ics)) {
    throw new Error('Invalid iCalendar output: content lines must be delimited by CRLF sequences.');
  }

  const rawLines = ics.split('\r\n');

  if (rawLines.at(-1) !== '') {
    throw new Error('Invalid iCalendar output: expected the file to end with a trailing CRLF sequence.');
  }

  let currentLineNumber = 0;
  let pendingLine: string | undefined;

  const flushPendingLine = (): void => {
    if (pendingLine === undefined) {
      return;
    }

    if (pendingLine.indexOf(':') <= 0) {
      throw new Error(`Invalid iCalendar output: missing colon separator in content line ${currentLineNumber}.`);
    }

    pendingLine = undefined;
  };

  for (const rawLine of rawLines.slice(0, -1)) {
    currentLineNumber += 1;

    if (rawLine.startsWith(' ') || rawLine.startsWith('\t')) {
      if (pendingLine === undefined) {
        throw new Error(
          `Invalid iCalendar output: encountered a folded continuation without a preceding content line at line ${currentLineNumber}.`,
        );
      }

      pendingLine += rawLine.slice(1);
      continue;
    }

    flushPendingLine();
    pendingLine = rawLine;
  }

  flushPendingLine();
}
