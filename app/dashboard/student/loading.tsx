export default function StudentLoading() {
  return (
    <div className="p-8 animate-pulse">
      {/* Page title skeleton */}
      <div className="h-7 w-36 bg-gray-200 rounded-xl mb-2" />
      <div className="h-4 w-56 bg-gray-100 rounded-lg mb-8" />
      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border p-5 space-y-3"
            style={{ borderColor: "#e5eaf5", background: "#fafbff" }}
          >
            <div className="h-4 w-16 bg-gray-200 rounded-full" />
            <div className="h-5 w-28 bg-gray-200 rounded-lg" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
            <div className="flex gap-4 pt-2">
              <div className="h-8 w-14 bg-gray-100 rounded-lg" />
              <div className="h-8 w-14 bg-gray-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
