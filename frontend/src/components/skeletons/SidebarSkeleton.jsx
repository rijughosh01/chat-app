import { Users } from "lucide-react";

const SidebarSkeleton = () => {
  const skeletonContacts = Array(8).fill(null);

  return (
    <aside className="h-full w-full border-r border-base-300 flex flex-col bg-base-100/60 select-none">
      <div className="border-b border-base-300/80 w-full p-3.5 space-y-2.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="skeleton h-6 w-20 rounded-md" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
        <div className="skeleton h-8 w-full rounded-lg" />
        <div className="flex gap-1.5 pt-0.5">
          <div className="skeleton h-6 w-12 rounded-full" />
          <div className="skeleton h-6 w-16 rounded-full" />
          <div className="skeleton h-6 w-14 rounded-full" />
        </div>
      </div>

      <div className="overflow-y-auto w-full py-1 divide-y divide-base-300/40 flex-1">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="w-full p-3 flex items-center gap-3">
            <div className="skeleton size-12 rounded-full flex-shrink-0" />

            <div className="text-left min-w-0 flex-1">
              <div className="skeleton h-4 w-32 mb-2 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SidebarSkeleton;
