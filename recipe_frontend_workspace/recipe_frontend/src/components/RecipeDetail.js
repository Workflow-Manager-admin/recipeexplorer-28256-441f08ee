import React from 'react';
import './RecipeDetail.css';

// PUBLIC_INTERFACE
/**
 * Displays details for a single recipe.
 */
export default function RecipeDetail({
  recipe,
  isFavorite,
  onToggleFavorite,
  onBack
}) {
  if (!recipe) {
    return <div className="recipe-detail-empty">Choose a recipe to view details.</div>;
  }
  return (
    <div className="recipe-detail">
      <button className="btn btn-back" onClick={onBack}>&larr; Back</button>
      <div className="recipe-detail-header">
        <h2>{recipe.title}</h2>
        <button
          className={`btn favorite-btn${isFavorite ? " favorited" : ""}`}
          title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          onClick={() => onToggleFavorite(recipe)}
        >
          {isFavorite ? "★" : "☆"}
        </button>
      </div>
      {recipe.image && (
        <div
          className="recipe-detail-image"
          style={{ backgroundImage: `url(${recipe.image})` }}
        />
      )}
      <div className="recipe-category">{recipe.category}</div>
      <div className="recipe-section">
        <h4>Ingredients</h4>
        <ul>
          {(recipe.ingredients || []).map((ing, i) => (
            <li key={i}>{ing}</li>
          ))}
        </ul>
      </div>
      <div className="recipe-section">
        <h4>Instructions</h4>
        <ol>
          {(recipe.instructions || []).map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
