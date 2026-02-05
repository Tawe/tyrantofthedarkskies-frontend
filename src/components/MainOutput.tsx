import { useEffect, useRef, useCallback } from 'react';

type Segment = { type: 'text'; content: string } | { type: 'command'; content: string };

/** Direction words that the server expects as "go <direction>" */
const MOVEMENT_DIRECTIONS = new Set([
  'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw', 'u', 'd',
  'north', 'south', 'east', 'west',
  'northeast', 'northwest', 'southeast', 'southwest',
  'up', 'down', 'in', 'out',
]);

/** Check if a message contains exit directions (indicates a room description) */
function hasExitDirections(message: string): boolean {
  const regex = /\[([^\]]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(message)) !== null) {
    const command = match[1].trim().toLowerCase();
    if (MOVEMENT_DIRECTIONS.has(command)) {
      return true;
    }
  }
  return false;
}

function parseMessageSegments(message: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(message)) !== null) {
    segments.push({ type: 'text', content: message.slice(lastIndex, match.index) });
    segments.push({ type: 'command', content: match[1] });
    lastIndex = match.index + match[0].length;
  }
  segments.push({ type: 'text', content: message.slice(lastIndex) });
  return segments;
}

function toServerCommand(clickedText: string): string {
  const normalized = clickedText.trim().toLowerCase();
  if (!normalized) return '';
  if (MOVEMENT_DIRECTIONS.has(normalized)) {
    return `go ${normalized}`;
  }
  return normalized;
}

interface MainOutputProps {
  messages: string[];
  onCommandClick?: (command: string) => void;
}

export function MainOutput({ messages, onCommandClick }: MainOutputProps) {
  const outputRef = useRef<HTMLDivElement>(null);

  const handleCommandClick = useCallback(
    (command: string) => {
      const serverCommand = toServerCommand(command);
      if (serverCommand && onCommandClick) {
        onCommandClick(serverCommand);
      }
    },
    [onCommandClick]
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="main-output" ref={outputRef}>
      {messages.map((message, lineIndex) => {
        const segments = parseMessageSegments(message);
        const hasCommands = segments.some((s) => s.type === 'command');
        const isRoomDescription = hasExitDirections(message);

        const content = !hasCommands ? (
          <div
            key={lineIndex}
            className="output-line"
            dangerouslySetInnerHTML={{ __html: message }}
          />
        ) : (
          <div key={lineIndex} className="output-line">
            {segments.map((seg, segIndex) =>
              seg.type === 'text' ? (
                <span
                  key={segIndex}
                  dangerouslySetInnerHTML={{ __html: seg.content || '\u00A0' }}
                />
              ) : (
                <span
                  key={segIndex}
                  className="output-command"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCommandClick(seg.content)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCommandClick(seg.content);
                    }
                  }}
                >
                  [{seg.content}]
                </span>
              )
            )}
          </div>
        );

        if (isRoomDescription && lineIndex > 0) {
          return (
            <div key={`room-${lineIndex}`}>
              <div className="room-divider" />
              {content}
            </div>
          );
        }

        return content;
      })}
    </div>
  );
}
