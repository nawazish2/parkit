import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

type EmptyStateCardProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

const EmptyStateCard: React.FC<EmptyStateCardProps> = ({ icon, title, description, action, className = '' }) => {
  return (
    <Card className={`p-10 text-center space-y-3 border-white/[0.06] bg-[#111118] rounded-xl ${className}`}>
      <CardContent className="p-0 space-y-3">
        {icon ? <div className="mx-auto">{icon}</div> : null}
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description ? <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">{description}</p> : null}
        {action ? <div className="pt-1">{action}</div> : null}
      </CardContent>
    </Card>
  );
};

export default EmptyStateCard;
