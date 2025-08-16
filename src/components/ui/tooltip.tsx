import React from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { cn } from '../../lib/utils';

interface TooltipProps {
  id: string;
  content: string;
  children: React.ReactNode;
  className?: string;
  place?: 'top' | 'bottom' | 'left' | 'right';
  delayShow?: number;
  delayHide?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  id,
  content,
  children,
  className,
  place = 'top',
  delayShow = 500,
  delayHide = 100
}) => {
  return (
    <>
      <div data-tooltip-id={id} className={cn('inline-block', className)}>
        {children}
      </div>
      <ReactTooltip
        id={id}
        content={content}
        place={place}
        delayShow={delayShow}
        delayHide={delayHide}
        className="react-tooltip"
      />
    </>
  );
};

export default Tooltip;
