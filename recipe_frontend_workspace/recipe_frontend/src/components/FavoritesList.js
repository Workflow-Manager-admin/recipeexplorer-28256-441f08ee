import React from 'react';
import './FavoritesList.css';

// PUBLIC_INTERFACE
/**
 * Displays list/grid of favorite recipes.
 */
export default function FavoritesList({ favorites, onSelect }) {
  return (
    <div className="favorites-section">
      <h2>My Favorites</h2>
      <div className="favorites-list-grid">
        {favorites.length === 0 ? (
          <div className="favorites-empty">No favorite recipes yet.</div>
        ) : (
          favorites.map(recipe => (
            <div
              className="favorite-card"
              key={recipe.id}
              onClick={() => onSelect(recipe.id)}
              title={recipe.title}
            >
              {recipe.image && (
                <div className="favorite-image" style={{
                  backgroundImage: `url(${recipe.image})`
                }}/>
              )}
              <div className="favorite-info">
                <h4>{recipe.title}</h4>
                <div className="favorite-category">{recipe.category}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
