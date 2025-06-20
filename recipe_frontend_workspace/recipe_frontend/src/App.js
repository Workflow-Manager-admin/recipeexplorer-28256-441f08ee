import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import RecipeList from './components/RecipeList';
import RecipeDetail from './components/RecipeDetail';
import { AuthForm } from './components/AuthForm';
import FavoritesList from './components/FavoritesList';

// Mock data, replace with API fetches in integration step
const mockCategories = [
  "Breakfast", "Lunch", "Dinner", "Snack", "Dessert"
];
const mockRecipes = [
  {
    id: 1,
    title: "Avocado Toast",
    image: '',
    category: "Breakfast",
    ingredients: ["2 slice sourdough", "1 ripe avocado", "Salt", "Pepper"],
    instructions: [
      "Toast the bread.",
      "Mash avocado onto toast.",
      "Season with salt and pepper."
    ]
  },
  {
    id: 2,
    title: "Spaghetti Carbonara",
    image: '',
    category: "Dinner",
    ingredients: [
      "100g spaghetti", "2 eggs", "50g pancetta", "Parmesan", "Black pepper"
    ],
    instructions: [
      "Cook pasta.",
      "Fry pancetta.",
      "Mix eggs and cheese, combine with pasta and pancetta.",
      "Serve hot."
    ]
  }
];

function App() {
  // State: auth, navigation
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // or 'signup'
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // UI state
  const [category, setCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);

  // Data simulation
  const [recipes, setRecipes] = useState(mockRecipes);
  // In real usage, favorites would come from user/account data
  const [favorites, setFavorites] = useState([]);

  // Handlers: Auth
  const handleLogin = () => {
    setAuthError('');
    setAuthLoading(false);
    setAuthMode('login');
    setIsAuthenticated(false);
    setShowFavorites(false);
    setSelectedRecipeId(null);
  };
  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowFavorites(false);
    setSelectedRecipeId(null);
  };
  const handleAuthSubmit = ({ email, password }) => {
    setAuthLoading(true);
    setTimeout(() => { // Replace with real API
      setAuthLoading(false);
      if (email === 'user@example.com' && password === 'test') {
        setIsAuthenticated(true);
        setAuthError('');
        setShowFavorites(false);
      } else if (authMode === 'signup') {
        setIsAuthenticated(true);
        setAuthError('');
        setShowFavorites(false);
      } else {
        setAuthError('Invalid credentials');
      }
    }, 800);
  };
  const toggleAuthMode = () =>
    setAuthMode(m => (m === 'login' ? 'signup' : 'login'));

  // Filtered recipes (mock local)
  const filteredRecipes = recipes.filter(r => {
    const term = searchTerm.trim().toLowerCase();
    const matchCat = !category || r.category === category;
    const matchTerm =
      !term ||
      r.title.toLowerCase().includes(term) ||
      (r.ingredients && r.ingredients.join(' ').toLowerCase().includes(term));
    return matchCat && matchTerm;
  });

  // Recipe details
  const selectedRecipe =
    selectedRecipeId != null
      ? recipes.find(r => r.id === selectedRecipeId)
      : null;

  // Favorites management
  const isFavorite = recipe =>
    favorites.some(fav => fav.id === recipe.id);
  const handleToggleFavorite = recipe => {
    if (isFavorite(recipe)) {
      setFavorites(favs => favs.filter(fav => fav.id !== recipe.id));
    } else {
      setFavorites(favs => [...favs, recipe]);
    }
  };
  const handleSelectRecipeFromFavorites = id => {
    setShowFavorites(false);
    setSelectedRecipeId(id);
  };

  // Layout navigation: Main / Favorites / Auth
  let mainContent;
  if (!isAuthenticated) {
    mainContent = (
      <AuthForm
        mode={authMode}
        onSubmit={handleAuthSubmit}
        toggleMode={toggleAuthMode}
        loading={authLoading}
        error={authError}
      />
    );
  } else if (showFavorites) {
    mainContent = (
      <FavoritesList
        favorites={favorites}
        onSelect={handleSelectRecipeFromFavorites}
      />
    );
  } else if (selectedRecipeId != null && selectedRecipe) {
    mainContent = (
      <RecipeDetail
        recipe={selectedRecipe}
        isFavorite={isFavorite(selectedRecipe)}
        onToggleFavorite={handleToggleFavorite}
        onBack={() => setSelectedRecipeId(null)}
      />
    );
  } else {
    mainContent = (
      <RecipeList
        recipes={filteredRecipes}
        onSelect={id => setSelectedRecipeId(id)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
    );
  }

  // Topbar links/auth
  const navProps = {
    isAuthenticated,
    onLogin: handleLogin,
    onLogout: handleLogout
  };

  return (
    <div className="app">
      <Navbar {...navProps} />
      <div className="layout-main">
        {isAuthenticated && (
          <Sidebar
            categories={mockCategories}
            selected={category}
            onSelectCategory={cat => {
              setCategory(cat);
              setSelectedRecipeId(null);
              setShowFavorites(false);
            }}
          />
        )}
        <main className="app-main">
          {isAuthenticated && (
            <div className="layout-top-buttons">
              <button
                className="btn"
                style={{
                  background: showFavorites ? 'var(--base-light)' : undefined
                }}
                onClick={() => {
                  setShowFavorites(f => !f);
                  setSelectedRecipeId(null);
                }}
              >
                {showFavorites ? "Browse Recipes" : "My Favorites"}
              </button>
            </div>
          )}
          {mainContent}
        </main>
      </div>
    </div>
  );
}

export default App;