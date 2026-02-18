import { useState, useId } from 'react';

/**
 * Input — borderless, surface-elevated input field.
 *
 * Follows DESIGN.md "High-End Styling" rule:
 *  - No box border. Background uses `bg-surface-container-low` at rest.
 *  - On focus → background lifts to `bg-surface-container-lowest` + 1px ghost border (primary).
 *  - Floating label variant (`floating` prop) elevates the label on focus or filled state.
 *
 * @param {object} props
 * @param {string} [props.label] - field label
 * @param {boolean} [props.floating] - use floating-label variant
 * @param {string} [props.error] - error message
 * @param {string} [props.hint] - helper text
 * @param {React.ComponentType} [props.icon] - left-side lucide icon
 * @param {React.ComponentType} [props.iconRight] - right-side lucide icon
 * @param {boolean} [props.required]
 * @param {string} [props.type='text']
 * @param {string} [props.value]
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} [props.onChange]
 */
export default function Input({
  label,
  floating = false,
  error,
  hint,
  icon: Icon,
  iconRight: IconRight,
  required = false,
  type = 'text',
  value,
  onChange,
  className = '',
  id: idProp,
  ...rest
}) {
  const reactId = useId();
  const id = idProp || reactId;
  const [focused, setFocused] = useState(false);
  const filled = value !== undefined && value !== '';
  const lifted = focused || filled;

  const baseField =
    'w-full rounded-xl text-sm text-on-surface placeholder:text-outline ' +
    'transition-all duration-200 focus:outline-none ' +
    'bg-surface-container-low focus:bg-surface-container-lowest ' +
    'ring-1 ring-transparent focus:ring-primary/40 ' + // ghost border on focus
    (error ? 'ring-error/40 focus:ring-error/60 ' : '');

  const padding = `${Icon ? 'pl-11' : 'pl-4'} ${IconRight ? 'pr-11' : 'pr-4'}`;
  const verticalPadding = floating ? 'pt-6 pb-2' : 'py-3';

  if (floating) {
    return (
      <div className={`relative ${className}`}>
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
        )}
        <input
          id={id}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`${baseField} ${padding} ${verticalPadding}`}
          placeholder=" "
          {...rest}
        />
        {label && (
          <label
            htmlFor={id}
            className={[
              'absolute pointer-events-none transition-all duration-200',
              Icon ? 'left-11' : 'left-4',
              lifted
                ? 'top-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant'
                : 'top-1/2 -translate-y-1/2 text-sm text-outline',
            ].join(' ')}
          >
            {label}{required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}
        {IconRight && (
          <IconRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
        )}
        {(error || hint) && (
          <p className={`mt-1.5 text-xs ${error ? 'text-error' : 'text-on-surface-variant'}`}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }

  // Standard variant — small uppercase label sits above the field.
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1"
        >
          {label}{required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
        )}
        <input
          id={id}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`${baseField} ${padding} ${verticalPadding}`}
          {...rest}
        />
        {IconRight && (
          <IconRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
        )}
      </div>
      {(error || hint) && (
        <p className={`text-xs px-1 ${error ? 'text-error' : 'text-on-surface-variant'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
