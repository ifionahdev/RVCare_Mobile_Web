import { ChevronDown } from "lucide-react";
import { useState } from "react";

const FilterSort = ({ activeTab, onFilterChange, onSortChange, currentFilters, currentSort, hideRecordTypeFilter = false }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleFilterChange = (filterKey, value) => {
    onFilterChange(filterKey, value);
    setOpenDropdown(null);
  };

  const handleSortChange = (value) => {
    onSortChange(value);
    setOpenDropdown(null);
  };

  // Pet Owners: Sort only
  if (activeTab === "Pet Owners") {
    return (
      <div className="flex flex-wrap items-center gap-4 w-full">
        {/* Date Sort */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-fit">Date</span>
          <div className="relative">
            <button
              onClick={() => toggleDropdown("dateSort")}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-[#1B1B1B] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-[#252525] transition flex items-center gap-2"
            >
              {currentSort?.sort === "desc" ? "Newest First" : "Oldest First"}
              <ChevronDown size={14} className={`transition-transform ${openDropdown === "dateSort" ? "rotate-180" : ""}`} />
            </button>
            
            {openDropdown === "dateSort" && (
              <div className="absolute top-full mt-1 left-0 bg-white dark:bg-[#1C1C1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-[180px]">
                <button
                  onClick={() => handleSortChange("desc")}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    currentSort?.sort === "desc"
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  Newest First
                </button>
                <button
                  onClick={() => handleSortChange("asc")}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    currentSort?.sort === "asc"
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  Oldest First
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Name Sort */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-fit">Name</span>
          <div className="relative">
            <button
              onClick={() => toggleDropdown("nameSort")}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-[#1B1B1B] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-[#252525] transition flex items-center gap-2"
            >
              {currentSort?.nameSort === "name-asc" ? "A-Z" : currentSort?.nameSort === "name-desc" ? "Z-A" : "Name"}
              <ChevronDown size={14} className={`transition-transform ${openDropdown === "nameSort" ? "rotate-180" : ""}`} />
            </button>
            
            {openDropdown === "nameSort" && (
              <div className="absolute top-full mt-1 left-0 bg-white dark:bg-[#1C1C1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-[150px]">
                <button
                  onClick={() => handleSortChange("name-asc")}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    currentSort?.nameSort === "name-asc"
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  A-Z
                </button>
                <button
                  onClick={() => handleSortChange("name-desc")}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    currentSort?.nameSort === "name-desc"
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  Z-A
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Pets: Species filter + Sort
  if (activeTab === "Pets") {
    return (
      <div className="flex items-center flex-wrap gap-4 w-full">
        {/* Species Filter */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-fit">Species</span>
          <div className="relative">
            <button
              onClick={() => toggleDropdown("species")}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-[#1B1B1B] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-[#252525] transition flex items-center gap-2"
            >
              {currentFilters.species ? (currentFilters.species === "Dog" ? "Dogs" : "Cats") : "All Species"}
              <ChevronDown size={14} className={`transition-transform ${openDropdown === "species" ? "rotate-180" : ""}`} />
            </button>
            
            {openDropdown === "species" && (
              <div className="absolute top-full mt-1 left-0 bg-white dark:bg-[#1C1C1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-[150px]">
                <button
                  onClick={() => handleFilterChange("species", null)}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    !currentFilters.species
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  All Species
                </button>
                <button
                  onClick={() => handleFilterChange("species", "Dog")}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    currentFilters.species === "Dog"
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  Dogs
                </button>
                <button
                  onClick={() => handleFilterChange("species", "Cat")}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    currentFilters.species === "Cat"
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  Cats
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Name Sort */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-fit">Name</span>
          <div className="relative">
            <button
              onClick={() => toggleDropdown("nameSort")}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-[#1B1B1B] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-[#252525] transition flex items-center gap-2"
            >
              {currentSort?.nameSort === "desc" ? "Z-A" : "A-Z"}
              <ChevronDown size={14} className={`transition-transform ${openDropdown === "nameSort" ? "rotate-180" : ""}`} />
            </button>
            
            {openDropdown === "nameSort" && (
              <div className="absolute top-full mt-1 left-0 bg-white dark:bg-[#1C1C1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-[150px]">
                <button
                  onClick={() => handleSortChange("pet-name-asc")}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    currentSort?.nameSort === "pet-name-asc"
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  A-Z
                </button>
                <button
                  onClick={() => handleSortChange("pet-name-desc")}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    currentSort?.nameSort === "pet-name-desc"
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  Z-A
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Date Sort */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-fit">Date</span>
          <div className="relative">
            <button
              onClick={() => toggleDropdown("dateSort")}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-[#1B1B1B] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-[#252525] transition flex items-center gap-2"
            >
              {currentSort?.dateSort === "desc" ? "Newest First" : "Oldest First"}
              <ChevronDown size={14} className={`transition-transform ${openDropdown === "dateSort" ? "rotate-180" : ""}`} />
            </button>
            
            {openDropdown === "dateSort" && (
              <div className="absolute top-full mt-1 left-0 bg-white dark:bg-[#1C1C1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-[180px]">
                <button
                  onClick={() => handleSortChange("pet-date-asc")}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    currentSort?.dateSort === "asc"
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  Oldest First
                </button>
                <button
                  onClick={() => handleSortChange("pet-date-desc")}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    currentSort?.dateSort === "desc"
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  Newest First
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Lab/Medical Records: Type filter + Status filter
  if (activeTab === "Lab/Medical Records") {
    return (
      <div className="flex flex-wrap items-center gap-4 w-full">
        {/* Record Type Filter */}
        {!hideRecordTypeFilter && <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-fit">Type</span>
          <div className="relative">
            <button
              onClick={() => toggleDropdown("type")}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-[#1B1B1B] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-[#252525] transition flex items-center gap-2"
            >
              {currentFilters.type ? (currentFilters.type === "Lab" ? "Lab Record" : "Medical Record") : "All Types"}
              <ChevronDown size={14} className={`transition-transform ${openDropdown === "type" ? "rotate-180" : ""}`} />
            </button>
            
            {openDropdown === "type" && (
              <div className="absolute top-full mt-1 left-0 bg-white dark:bg-[#1C1C1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-[150px]">
                <button
                  onClick={() => handleFilterChange("type", null)}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    !currentFilters.type
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => handleFilterChange("type", "Lab")}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    currentFilters.type === "Lab"
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  Lab Record
                </button>
                <button
                  onClick={() => handleFilterChange("type", "Medical")}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    currentFilters.type === "Medical"
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  Medical Record
                </button>
              </div>
            )}
          </div>
        </div>}

        {/* Upload Status Filter */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-fit">Status</span>
          <div className="relative">
            <button
              onClick={() => toggleDropdown("status")}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-[#1B1B1B] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-[#252525] transition flex items-center gap-2"
            >
              {currentFilters.status 
                ? (currentFilters.status === "uploaded" ? "Uploaded" : "Draft") 
                : "All Status"}
              <ChevronDown size={14} className={`transition-transform ${openDropdown === "status" ? "rotate-180" : ""}`} />
            </button>
            
            {openDropdown === "status" && (
              <div className="absolute top-full mt-1 left-0 bg-white dark:bg-[#1C1C1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-[150px]">
                <button
                  onClick={() => handleFilterChange("status", null)}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    !currentFilters.status
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  All Status
                </button>
                <button
                  onClick={() => handleFilterChange("status", "drafted")}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    currentFilters.status === "drafted"
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  Draft
                </button>
                <button
                  onClick={() => handleFilterChange("status", "uploaded")}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    currentFilters.status === "uploaded"
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  Uploaded
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Date Sort */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-fit">Date</span>
          <div className="relative">
            <button
              onClick={() => toggleDropdown("dateSort")}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-[#1B1B1B] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-[#252525] transition flex items-center gap-2"
            >
              {currentFilters.dateSort === "desc" ? "Newest First" : "Oldest First"}
              <ChevronDown size={14} className={`transition-transform ${openDropdown === "dateSort" ? "rotate-180" : ""}`} />
            </button>
            
            {openDropdown === "dateSort" && (
              <div className="absolute top-full mt-1 left-0 bg-white dark:bg-[#1C1C1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-[180px]">
                <button
                  onClick={() => handleSortChange("record-date-asc")}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    currentFilters.dateSort === "asc"
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  Oldest First
                </button>
                <button
                  onClick={() => handleSortChange("record-date-desc")}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    currentFilters.dateSort === "desc"
                      ? "bg-[#5EE6FE]/20 text-[#5EE6FE]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                  }`}
                >
                  Newest First
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default FilterSort;
