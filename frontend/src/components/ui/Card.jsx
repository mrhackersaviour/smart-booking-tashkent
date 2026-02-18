/**
 * Card — surface-elevated container.
 *
 * Follows DESIGN.md "Layering Principle":
 *  - Background: `bg-surface-container-lowest` (Layer 2 — sits on Layer 1 surface-low).
 *  - Border-radius: `rounded-2xl` (1rem) — friendly yet sophisticated.
 *  - NO shadow at rest. Tonal layering provides separation.
 *  - `interactive` prop adds the ambient (Double-Drop) shadow on hover only.
 *  - Never uses 1px solid borders.
 *
 * @param {object} props
 * @param {'lowest'|'low'|'high'|'highest'} [props.tier='lowest']
 * @param {'sm'|'md'|'lg'|'none'} [props.padding='md']
 * @param {boolean} [props.interactive] - hover ambient shadow + lift
 * @param {string} [props.as='div']
 */
export default function Card({
  tier = 'lowest',
  padding = 'md',
  interactive = false,
  as: Tag = 'div',
  className = '',
  children,
  ...rest
}) {
  const tierBg = {
    lowest: 'bg-surface-container-lowest',
    low: 'bg-surface-container-low',
    high: 'bg-surface-container-high',
    highest: 'bg-surface-container-highest',
  }[tier];

  const padStyle = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }[padding];

  return (
    <Tag
      className={[
        'rounded-2xl overflow-hidden',
        tierBg,
        padStyle,
        interactive
          ? 'transition-all duration-300 hover:shadow-ambient hover:-translate-y-0.5 cursor-pointer'
          : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  );
}
