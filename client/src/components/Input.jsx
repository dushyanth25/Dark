import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Input — Batman-themed dark input with focus glow
 * Props:
 *   id          — html id (required for label association)
 *   label       — field label text
 *   type        — input type (default 'text')
 *   value       — controlled value
 *   onChange    — change handler
 *   placeholder — placeholder text
 *   error       — error message string
 *   icon        — optional Lucide icon component
 *   required    — html required attribute
 *   autoComplete— html autocomplete hint
 *   disabled    — disabled state
 */
const Input = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  icon: Icon,
  required = false,
  autoComplete,
  disabled = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-widest text-batman-yellow/80"
        >
          {label}
          {required && <span className="text-batman-yellow ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Leading icon */}
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-batman-muted pointer-events-none">
            <Icon size={16} />
          </span>
        )}

        <input
          id={id}
          name={id}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`
            input-batman
            w-full rounded-xl bg-batman-card/80 border
            ${error ? 'border-red-500' : 'border-batman-border'}
            text-batman-text placeholder-batman-muted
            py-3 text-sm
            ${Icon ? 'pl-9' : 'pl-4'}
            ${isPassword ? 'pr-11' : 'pr-4'}
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />

        {/* Show/hide password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-batman-muted hover:text-batman-yellow transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-400 text-xs mt-0.5 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
};

export default Input;
