import type { Category, CrowdLevel } from '@shared/schema';

interface MapFiltersProps {
  selectedCategories: Category[];
  selectedCrowdLevels: CrowdLevel[];
  onCategoryChange: (categories: Category[]) => void;
  onCrowdLevelChange: (crowdLevels: CrowdLevel[]) => void;
}

/**
 * MapFilters Component
 * 
 * Provides filter controls for the tourist map display.
 * Features:
 * - Category filter checkboxes (museum, beach, monument, park, religious_site, market, viewpoint)
 * - Crowd level filter checkboxes (low, medium, high)
 * - Emits filter change events to parent component
 * 
 * Requirements: 5.5
 */
export default function MapFilters({
  selectedCategories,
  selectedCrowdLevels,
  onCategoryChange,
  onCrowdLevelChange,
}: MapFiltersProps) {
  const categories: { value: Category; label: string }[] = [
    { value: 'museum', label: 'Museums' },
    { value: 'beach', label: 'Beaches' },
    { value: 'monument', label: 'Monuments' },
    { value: 'park', label: 'Parks' },
    { value: 'religious_site', label: 'Religious Sites' },
    { value: 'market', label: 'Markets' },
    { value: 'viewpoint', label: 'Viewpoints' },
  ];

  const crowdLevels: { value: CrowdLevel; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-red-600' },
  ];

  const handleCategoryToggle = (category: Category) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    onCategoryChange(newCategories);
  };

  const handleCrowdLevelToggle = (crowdLevel: CrowdLevel) => {
    const newCrowdLevels = selectedCrowdLevels.includes(crowdLevel)
      ? selectedCrowdLevels.filter((cl) => cl !== crowdLevel)
      : [...selectedCrowdLevels, crowdLevel];
    onCrowdLevelChange(newCrowdLevels);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 space-y-4 sm:space-y-6">
      {/* Category Filters */}
      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
          Categories
        </h3>
        <div className="space-y-1.5 sm:space-y-2">
          {categories.map((category) => (
            <label
              key={category.value}
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1.5 sm:p-2 rounded transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.value)}
                onChange={() => handleCategoryToggle(category.value)}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 flex-shrink-0"
              />
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                {category.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Crowd Level Filters */}
      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
          Crowd Levels
        </h3>
        <div className="space-y-1.5 sm:space-y-2">
          {crowdLevels.map((crowdLevel) => (
            <label
              key={crowdLevel.value}
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1.5 sm:p-2 rounded transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedCrowdLevels.includes(crowdLevel.value)}
                onChange={() => handleCrowdLevelToggle(crowdLevel.value)}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 flex-shrink-0"
              />
              <span className={`text-xs sm:text-sm font-medium ${crowdLevel.color}`}>
                {crowdLevel.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear All Filters Button */}
      {(selectedCategories.length > 0 || selectedCrowdLevels.length > 0) && (
        <button
          onClick={() => {
            onCategoryChange([]);
            onCrowdLevelChange([]);
          }}
          className="w-full text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium py-1.5 sm:py-2 px-3 sm:px-4 border border-blue-600 dark:border-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}
