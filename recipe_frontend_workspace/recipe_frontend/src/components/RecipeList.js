import React from 'react';
import './RecipeList.css';

// PUBLIC_INTERFACE
/**
 * Displays a searchable, filterable list/grid of recipes.
 */
export default function RecipeList({ recipes, onSelect, searchTerm, setSearchTerm }) {
  return (
    <div className="recipes-main">
      <div className="recipes-header">
        <input
          type="text"
          className="search-input"
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="recipes-grid">
        {recipes.length === 0 ? (
          <div className="recipes-empty">No recipes found.</div>
        ) : (
          recipes.map(recipe => (
            <div
              className="recipe-card"
              key={recipe.id}
              onClick={() => onSelect(recipe.id)}
            >
              <div className="recipe-image" style={{
                backgroundImage: recipe.image ? `url(${recipe.image})` : undefined
              }} />
              <div className="recipe-card-info">
                <h3>{recipe.title}</h3>
                <div className="recipe-meta">{recipe.category}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
