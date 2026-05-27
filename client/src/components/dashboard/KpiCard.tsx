import React from 'react';
import { Card } from '@/components/ui/card';

type KpiCardProps = {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  iconClassName: string;
  valueClassName: string;
  subtext?: string;
  onClick?: () => void;
  pulse?: boolean;
};

const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  icon,
  iconClassName,
  valueClassName,
  subtext,
  onClick,
  pulse = false,
}) => {
  const isClickable = !!onClick;

  return (
    <Card
      onClick={onClick}
      className={`p-5 rounded-xl border-white/[0.06] bg-[#111118] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/20 ${
        isClickable ? 'cursor-pointer hover:border-blue-500/30' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold text-slate-400">{label}</span>
        <div className={`w-9 h-9 border rounded-lg flex items-center justify-center relative ${iconClassName}`}>
          {icon}
          {pulse && <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />}
        </div>
      </div>
      <div className={`text-2xl font-bold tracking-tight ${valueClassName}`}>{value}</div>
      {subtext && <div className="text-xs text-slate-500 mt-1 leading-relaxed">{subtext}</div>}
    </Card>
  );
};

export default KpiCard;
