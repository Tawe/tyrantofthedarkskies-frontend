import { useEffect, useRef } from 'react';

interface MainOutputProps {
  messages: string[];
}

export function MainOutput({ messages }: MainOutputProps) {
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="main-output" ref={outputRef}>
      {messages.map((message, index) => (
        <div
          key={index}
          className="output-line"
          dangerouslySetInnerHTML={{ __html: message }}
        />
      ))}
    </div>
  );
}
