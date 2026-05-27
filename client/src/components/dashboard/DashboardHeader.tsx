import React from 'react';
import { Badge } from '@/components/ui/badge';

type DashboardHeaderProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  statusText?: string;
  statusDotClassName?: string;
  badges?: { label: string; className?: string }[];
  actions?: React.ReactNode;
  meta?: React.ReactNode;
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  icon,
  title,
  description,
  statusText,
  statusDotClassName = 'bg-slate-500',
  badges = [],
  actions,
  meta,
}) => {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#111118]/90 p-5 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            {icon}
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
          </div>
          <p className="text-slate-400 text-sm ml-[52px] max-w-xl leading-relaxed">{description}</p>
          {statusText && (
            <div className="ml-[52px] mt-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
              <span className={`w-2 h-2 rounded-full ${statusDotClassName}`} />
              {statusText}
            </div>
          )}
          {badges.length > 0 && (
            <div className="ml-[52px] mt-2 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <Badge key={badge.label} className={badge.className}>
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
          {meta}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export default DashboardHeader;
