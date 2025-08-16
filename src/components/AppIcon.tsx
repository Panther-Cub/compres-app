import React from 'react';

interface AppIconProps {
  size?: number;
  className?: string;
}

const AppIcon: React.FC<AppIconProps> = ({ size = 16, className = '' }) => {
  // Use the actual app icon from the public folder
  return (
    <img 
      src="/app-icon.png"
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
