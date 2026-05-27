import React from 'react';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

type DataSectionCardProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  bodyClassName?: string;
  gradient?: 'none' | 'top' | 'diagonal';
};

const DataSectionCard: React.FC<DataSectionCardProps> = ({
  title,
  description,
  icon,
  actions,
  children,
  className = '',
  headerClassName = '',
  titleClassName = '',
  bodyClassName = '',
  gradient = 'top',
}) => {
  const gradientClass =
    gradient === 'none'
      ? ''
      : gradient === 'diagonal'
        ? 'bg-gradient-to-br from-white/[0.03] to-transparent'
        : 'bg-gradient-to-b from-white/[0.03] to-transparent';

  return (
    <Card className={`p-6 border-white/[0.06] bg-[#111118] relative overflow-hidden rounded-xl ${className}`}>
      {gradient !== 'none' && <div className={`pointer-events-none absolute inset-0 ${gradientClass}`} />}
      <div className={`relative z-10 ${headerClassName}`}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <CardTitle className={`text-lg font-bold text-white flex items-center gap-2 ${titleClassName}`}>
              {icon}
              {title}
            </CardTitle>
            {description ? <CardDescription className="text-xs text-slate-400 mt-0.5">{description}</CardDescription> : null}
          </div>
          {actions}
        </div>
        <div className={bodyClassName}>{children}</div>
      </div>
    </Card>
  );
};

export default DataSectionCard;
