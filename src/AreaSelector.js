import React, { useMemo } from 'react';

// Temporary map for icons/emojis. You can expand this or replace it with an image component later.
const AREA_ICONS = {
  'Back Room': '📦',
  'Front Line': '⚡',
  'Kitchen': '🔪',
  'Walkin Cooler': '🧊',
  'Walkin Freezer': '🥶',
  'Dry Storage': '🧺',
  'Prep Area': '🥗',
  'Bar': '🍹',
};

/**
 * AreaSelector Component
 * Shows storage area buttons, handles selection, and wraps them across
 * two rows if necessary (max 6 per row) with a completion progress bar.
 *
 * @param {Array<Object>} areas - List of { id, name, completionPercentage }
 * @param {string} selectedAreaId - The ID of the currently active area
 * @param {function} onSelectArea - Callback function when an area is clicked: (areaId) => void
 */
export default function AreaSelector({ areas, selectedAreaId, onSelectArea }) {
  const ROW_SIZE = 6;
  
  // Logic to split areas into rows with a maximum of 6 per row
  const rows = useMemo(() => {
    if (!areas || areas.length === 0) return [];
    const r = [];
    for (let i = 0; i < areas.length; i += ROW_SIZE) {
      r.push(areas.slice(i, i + ROW_SIZE));
    }
    return r;
  }, [areas]);

  if (!areas || areas.length === 0) return null;

  return (
    <div className="area-selector-container">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="area-selector-row">
          {row.map((area) => {
            const isSelected = area.id === selectedAreaId;
            const completion = area.completionPercentage || 0;
            const icon = AREA_ICONS[area.name] || '📍';
            
            return (
              <button
                key={area.id}
                onClick={() => onSelectArea(area.id)}
                className={`area-button ${isSelected ? 'selected' : ''}`}
                // Inline style for progress bar positioning, using CSS class for button appearance
                style={{ position: 'relative' }} 
              >
                <div className="area-icon">{icon}</div>
                <div className="area-name">{area.name}</div>
                
                {/* Progress Bar and Text */}
                <div className="progress-bar-track">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${completion}%` }} // Dynamic inline style for fill
                  />
                </div>
                <div className="progress-text">{completion.toFixed(0)}%</div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}