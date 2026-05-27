import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

type StatusBannerProps = {
  variant: 'error' | 'success';
  message: string;
};

const StatusBanner: React.FC<StatusBannerProps> = ({ variant, message }) => {
  const isError = variant === 'error';
  return (
    <div
      role={isError ? undefined : 'status'}
      aria-live={isError ? undefined : 'polite'}
      className={`px-4 py-3 rounded-lg flex items-center gap-2 text-sm ${
        isError
          ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          : 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
      }`}
    >
      {isError ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
      {message}
    </div>
  );
};

export default StatusBanner;
