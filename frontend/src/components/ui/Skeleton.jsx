/**
 * Skeleton loader primitives.
 *
 * All variants use the shimmer keyframe from `styles/index.css` and the
 * surface hierarchy tokens (`bg-surface-container-low`) so they blend
 * correctly with the Kinetic Curator design system.
 */

export function Skeleton({ className = '', ...rest }) {
    return (
        <div
            className={`animate-shimmer bg-surface-container-low rounded-lg ${className}`}
            aria-hidden="true"
            {...rest}
        />
    );
}

export function VenueCardSkeleton() {
    return (
        <div className="bg-surface-container-lowest rounded-xl p-4 space-y-3">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 pt-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
            </div>
        </div>
    );
}

export function VenueListSkeleton({ count = 6 }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <VenueCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function BookingStepSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <div className="flex gap-3">
                <Skeleton className="h-11 w-28 rounded-full" />
                <Skeleton className="h-11 w-28 rounded-full" />
            </div>
        </div>
    );
}

export default Skeleton;
