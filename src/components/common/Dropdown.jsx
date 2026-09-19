import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

const Dropdown = ({ options, value, onChange, icon: Icon, placeholder = "Select option" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || { label: placeholder, value: '' };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className={clsx(
          "flex items-center justify-between w-full py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:bg-theme-surface-elevated",
          isOpen ? "bg-theme-surface-elevated border-theme-border shadow-soft" : ""
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {Icon && <Icon className="w-4 h-4 text-theme-muted shrink-0" />}
          <span className="text-sm font-medium text-theme-primary truncate">{selectedOption.label}</span>
        </div>
        <ChevronDown className={clsx("w-4 h-4 text-theme-muted transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[160px] bg-theme-surface border border-theme-border rounded-xl shadow-float z-50 overflow-hidden py-1 backdrop-blur-md bg-opacity-95 transform origin-top animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={clsx(
                "px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors",
                value === opt.value 
                  ? "bg-theme-accent/10 text-theme-accent font-semibold" 
                  : "text-theme-text-secondary hover:bg-theme-surface-higher hover:text-theme-primary"
              )}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && <Check className="w-3.5 h-3.5" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
