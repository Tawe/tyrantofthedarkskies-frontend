interface StatusBarProps {
  connected: boolean;
  connecting: boolean;
}

export function StatusBar({ connected, connecting }: StatusBarProps) {
  const getStatusText = () => {
    if (connecting) return 'Connecting...';
    if (connected) return 'Connected';
    return 'Disconnected';
  };

  const getStatusClass = () => {
    if (connecting) return 'status connecting';
    if (connected) return 'status connected';
    return 'status disconnected';
  };

  return <div className={getStatusClass()}>{getStatusText()}</div>;
}
