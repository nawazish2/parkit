import React from 'react';

type FilterBarProps = {
  left: React.ReactNode;
  right?: React.ReactNode;
};

const FilterBar: React.FC<FilterBarProps> = ({ left, right }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>{left}</div>
      {right ? <div>{right}</div> : null}
    </div>
  );
};

export default FilterBar;
