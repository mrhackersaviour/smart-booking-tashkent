import { useState } from 'react';

/**
 * Avatar — circular user image with initials fallback.
 *
 * Follows DESIGN.md:
 *  - Always rounded-full.
 *  - Fallback uses gradient background (no flat fills).
 *  - Optional ring uses ghost-border opacity, never hard 1px.
 *
 * @param {object} props
 * @param {string} [props.src]
 * @param {string} [props.alt]
 * @param {string} [props.name] - used to derive initials when src missing/errors
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} [props.size='md']
 * @param {boolean} [props.ring] - subtle white ring (for avatars on imagery)
 */
export default function Avatar({
  src,
  alt,
  name = '',
  size = 'md',
  ring = false,
  className = '',
  ...rest
}) {
  const [errored, setErrored] = useState(false);
  const showImg = src && !errored;

  const sizes = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-2xl',
  }[size];

  const initials = name
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <div
      className={[
        'relative rounded-full overflow-hidden flex items-center justify-center font-bold',
        sizes,
        ring ? 'ring-2 ring-white/80' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {showImg ? (
        <img
          src={src}
          alt={alt || name}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white">
          {initials}
        </div>
      )}
    </div>
  );
}
