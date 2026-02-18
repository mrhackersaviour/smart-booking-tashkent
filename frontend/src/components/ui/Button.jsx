import { Loader2 } from 'lucide-react';

/**
 * Button — primary action component for "The Kinetic Curator" design system.
 *
 * Follows DESIGN.md rules:
 *  - Primary uses gradient `from-primary to-primary-container` (no flat fills).
 *  - No shadow at rest; ambient shadow on hover only.
 *  - Border-radius `rounded-xl` (0.75rem).
 *  - Tertiary is text-only with hover underline (no border, no background).
 *
 * @param {object} props
 * @param {'primary'|'secondary'|'tertiary'|'ghost'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.loading] - shows spinner and disables interaction
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.fullWidth]
 * @param {React.ComponentType} [props.icon] - lucide-react icon component (left)
 * @param {React.ComponentType} [props.iconRight] - lucide-react icon component (right)
 * @param {'button'|'submit'|'reset'} [props.type='button']
 * @param {React.ReactNode} props.children
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconRight: IconRight,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const sizeStyles = {
    sm: 'px-4 py-2 text-xs gap-1.5',
    md: 'px-6 py-3 text-sm gap-2',
    lg: 'px-8 py-4 text-base gap-2.5',
  }[size];

  const iconSize = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' }[size];

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-primary to-primary-container text-white ' +
      'hover:shadow-ambient focus-visible:ring-primary/30',
    secondary:
      'bg-secondary-container text-on-surface ' +
      'hover:bg-surface-container-high focus-visible:ring-primary/20',
    tertiary:
      'bg-transparent text-primary hover:underline underline-offset-4 ' +
      'decoration-primary/60 focus-visible:ring-primary/20',
    ghost:
      'bg-transparent text-on-surface hover:bg-surface-container-low ' +
      'focus-visible:ring-primary/15',
  }[variant];

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-semibold rounded-xl',
        'transition-all duration-200 transform active:scale-[0.98]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        sizeStyles,
        variantStyles,
        fullWidth ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {loading ? (
        <Loader2 className={`${iconSize} animate-spin`} />
      ) : (
        Icon && <Icon className={iconSize} />
      )}
      <span>{children}</span>
      {!loading && IconRight && <IconRight className={iconSize} />}
    </button>
  );
}
