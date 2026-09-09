export function EventCardSkeleton() {
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="h-56 animate-pulse bg-gray-200" />
            <div className="space-y-3 p-5">
                <div className="h-4 w-20 animate-pulse rounded-full bg-gray-200" />
                <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
        </div>
    );
}
