import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useCommandHistory } from '../hooks/useCommandHistory';

interface InputPanelProps {
  onSend: (command: string) => void;
  disabled: boolean;
}

export function InputPanel({ onSend, disabled }: InputPanelProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { addCommand, getPrevious, getNext, reset } = useCommandHistory();

  // Auto-focus input when enabled
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSend = () => {
    const command = input.trim();
    if (!command || disabled) return;

    addCommand(command);
    onSend(command);
    setInput('');
    reset();
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = getPrevious();
      if (prev) {
        setInput(prev);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = getNext();
      setInput(next);
    }
  };

  return (
    <div className="input-container">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Enter command..."
        disabled={disabled}
        autoComplete="off"
      />
      <button onClick={handleSend} disabled={disabled}>
        Send
      </button>
    </div>
  );
}
