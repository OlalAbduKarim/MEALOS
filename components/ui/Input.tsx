
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  step?: string | number; // Added to support 'any' for decimals in number inputs
}

const Input: React.FC<InputProps> = ({ label, id, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`mt-1 block w-full px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm ${className} ${error ? 'border-red-500' : ''}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
