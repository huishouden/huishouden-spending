import React from 'react';

interface GoogleSignInButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  label?: string;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onClick,
  isLoading = false,
  label = 'Sign in with Google',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={`relative inline-flex items-center justify-center gap-3 px-5 py-3 text-sm font-medium text-white bg-forest-700 rounded-xl hover:bg-forest-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer ${className}`}
      style={{ minHeight: '44px' }}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      ) : (
        null
      )}
      <span className="font-semibold tracking-tight">
        {isLoading ? 'Connecting...' : label}
      </span>
    </button>
  );
};
