import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ size = 'md', withText = true, linkTo = '/' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-lg',
    md: 'h-10 w-10 text-xl',
    lg: 'h-12 w-12 text-2xl',
    xl: 'h-16 w-16 text-3xl'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const LogoIcon = () => (
    <div className={`relative ${sizeClasses[size]}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-black text-blue-600 ${sizeClasses[size]}`}>R</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center transform scale-x-[-1] opacity-30">
        <span className={`font-black text-blue-400 ${sizeClasses[size]}`}>R</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-black text-white drop-shadow-lg ${sizeClasses[size]}`} style={{ textShadow: '0 0 10px rgba(37,99,235,0.5)' }}>
          RR
        </span>
      </div>
      <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 blur-md"></div>
    </div>
  );

  const LogoText = () => (
    <div className="flex flex-col">
      <span className={`font-bold ${textSizeClasses[size]} text-gray-900`}>
        Roadside<span className="text-blue-600">Rescue</span>
      </span>
      <span className="text-xs text-gray-500">24/7 Emergency Assistance</span>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="flex items-center space-x-3 group">
        <div className="relative">
          <LogoIcon />
        </div>
        {withText && <LogoText />}
      </Link>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <LogoIcon />
      </div>
      {withText && <LogoText />}
    </div>
  );
};

export default Logo;