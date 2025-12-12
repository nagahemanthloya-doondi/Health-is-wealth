import React from 'react';

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

export const NeoButton: React.FC<NeoButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "border-4 border-black font-bold px-6 py-3 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";
  
  let colorClass = "bg-[#FFDE59] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:-translate-x-[2px]";
  
  if (variant === 'secondary') {
    colorClass = "bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:-translate-x-[2px]";
  } else if (variant === 'danger') {
    colorClass = "bg-[#FF5757] text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:-translate-x-[2px]";
  } else if (variant === 'success') {
    colorClass = "bg-[#7ED957] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:-translate-x-[2px]";
  }

  return (
    <button 
      className={`${baseStyles} ${colorClass} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

interface NeoCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  color?: string;
}

export const NeoCard: React.FC<NeoCardProps> = ({ 
  children, 
  className = '', 
  title,
  color = 'bg-white' 
}) => {
  return (
    <div className={`border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${color} p-6 ${className}`}>
      {title && (
        <h2 className="text-2xl font-black border-b-4 border-black pb-2 mb-4 uppercase tracking-tighter">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

interface NeoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const NeoInput: React.FC<NeoInputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && <label className="block font-bold mb-2 uppercase text-sm">{label}</label>}
      <input 
        className={`w-full border-4 border-black p-3 font-mono focus:outline-none focus:ring-4 focus:ring-[#FFDE59] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${className}`}
        {...props}
      />
    </div>
  );
};