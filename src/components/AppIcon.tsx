import React from 'react';
import appIcon from '../app-icon.png';

interface AppIconProps {
  size?: number;
  className?: string;
}

const AppIcon: React.FC<AppIconProps> = ({ size = 16, className = '' }) => {
  return (
    <img 
      src={appIcon}
      alt="Compres App Icon"
      width={size}
      height={size}
      className={className}
      style={{ 
        objectFit: 'contain',
        width: size,
        height: size
      }}
    />
  );
};

export default AppIcon;
