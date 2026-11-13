import { Search } from "lucide-react";

export default function AuditLogFilters({
  search,
  setSearch,
  user,
  setUser,
  module,
  setModule,
  dateRange,
  setDateRange,
  users,
  modules,
  hasUnknownActor,
  onFilterChange,
}) {
  const updateFilter = (setter) => (event) => {
    setter(event.target.value);
    onFilterChange();
  };

  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1.4fr)_minmax(120px,.8fr)_minmax(120px,.8fr)_minmax(150px,1fr)]">
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={updateFilter(setSearch)}
          placeholder="Search actor, table, or record ID"
          aria-label="Search audit log"
          className="w-full rounded-lg border border-gray-100 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-[#38c7e5]"
        />
      </label>
      <select
        value={user}
        onChange={updateFilter(setUser)}
        aria-label="Filter by user"
        className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#38c7e5]"
      >
        <option value="all">All users</option>
        {users.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        {hasUnknownActor && <option value="unknown">Unknown / deleted account</option>}
      </select>
      <select
        value={module}
        onChange={updateFilter(setModule)}
        aria-label="Filter by module"
        className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#38c7e5]"
      >
        <option value="all">All modules</option>
        {modules.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <select
        value={dateRange}
        onChange={updateFilter(setDateRange)}
        aria-label="Filter by date range"
        className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#38c7e5]"
      >
        <option value="last7">Last 7 days</option>
        <option value="last30">Last 30 days</option>
        <option value="all">All dates</option>
      </select>
    </div>
  );
}
