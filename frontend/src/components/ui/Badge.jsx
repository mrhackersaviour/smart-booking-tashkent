/**
 * Badge — label-style metadata tag.
 *
 * Follows DESIGN.md typography rule for labels:
 *  - All-caps, `tracking-wider` (+0.05em), small font.
 *  - Pill or square corners depending on `shape`.
 *  - Uses surface-container tones (no flat hard colors except `accent` variant).
 *
 * @param {object} props
 * @param {'neutral'|'primary'|'accent'|'success'|'warning'|'error'} [props.variant='neutral']
 * @param {'sm'|'md'} [props.size='md']
 * @param {'pill'|'square'} [props.shape='pill']
 * @param {React.ComponentType} [props.icon]
 */
export default function Badge({
  variant = 'neutral',
  size = 'md',
  shape = 'pill',
  icon: Icon,
  className = '',
  children,
  ...rest
}) {
  const variants = {
    neutral: 'bg-surface-container text-on-surface-variant',
    primary: 'bg-secondary-container text-primary',
    accent: 'bg-primary text-white',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-error',
  }[variant];

  const sizes = {
    sm: 'px-2 py-0.5 text-[9px] gap-1',
    md: 'px-2.5 py-1 text-[10px] gap-1.5',
  }[size];

  const radius = shape === 'pill' ? 'rounded-full' : 'rounded';
  const iconSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';

  return (
    <span
      className={[
        'inline-flex items-center font-bold uppercase tracking-wider whitespace-nowrap',
        sizes,
        variants,
        radius,
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {Icon && <Icon className={iconSize} />}
      {children}
    </span>
  );
}
