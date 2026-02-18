/**
 * Container — max-width wrapper with optional asymmetric padding.
 *
 * Follows DESIGN.md "Do" rule:
 *  - Asymmetrical margins (e.g., 80px left, 120px right) in hero sections to
 *    create a custom, editorial feel.
 *  - The `asymmetric` prop opts in to this layout. Standard layouts stay
 *    symmetric (responsive `px-4 sm:px-6 lg:px-8`).
 *
 * @param {object} props
 * @param {'sm'|'md'|'lg'|'xl'|'7xl'|'full'} [props.size='7xl'] - max-width
 * @param {boolean} [props.asymmetric] - uses larger right-side padding
 * @param {boolean} [props.flush] - removes default vertical padding
 * @param {string} [props.as='div']
 */
export default function Container({
  size = '7xl',
  asymmetric = false,
  flush = false,
  as: Tag = 'div',
  className = '',
  children,
  ...rest
}) {
  const maxW = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-none',
  }[size];

  // Asymmetric: editorial-feel padding (heavier right side, lighter left).
  // Standard: symmetric responsive padding.
  const padding = asymmetric
    ? 'pl-6 pr-12 sm:pl-10 sm:pr-16 lg:pl-20 lg:pr-32'
    : 'px-4 sm:px-6 lg:px-8';

  const vertical = flush ? '' : 'py-8';

  return (
    <Tag className={`${maxW} mx-auto ${padding} ${vertical} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
