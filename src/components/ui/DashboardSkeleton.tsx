export default function DashboardSkeleton() {
  return (
    <div className="h-screen flex bg-[#F5F6FA] dark:bg-[#2B265E] p-3 gap-6 overflow-hidden">
      {/* === SKELETON SIDEBAR === */}
      <div className="w-64 bg-white dark:bg-[#3B3285] rounded-2xl flex flex-col py-5 px-5 shadow-md h-full animate-pulse">
        {/* Logo Area */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
          <div className="flex flex-col gap-2">
            <div className="w-24 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
        
        {/* Menu Items */}
        <div className="flex flex-col gap-4 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full h-10 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
          ))}
        </div>
      </div>

      {/* === SKELETON MAIN CONTENT === */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-6 h-14 w-full">
           <div className="w-1/3 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
           <div className="flex gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
           </div>
        </div>

        {/* Content Skeleton (Kotak-kotak dashboard) */}
        <div className="flex-1 grid grid-cols-3 gap-6 animate-pulse">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            <div className="col-span-2 h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl mt-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl mt-4"></div>
        </div>
      </div>
    </div>
  );
}