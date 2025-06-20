import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import RecipeList from './components/RecipeList';
import RecipeDetail from './components/RecipeDetail';
import { AuthForm } from './components/AuthForm';
import FavoritesList from './components/FavoritesList';

import {
  login as apiLogin,
  signup as apiSignup,
  logout as apiLogout,
  setToken,
  getToken,
  getCategories,
  getRecipes,
  getRecipe,
  getFavorites,
  addFavorite,
  removeFavorite,
} from './api';

function App() {
  // State: auth, navigation
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getToken()));
  const [authMode, setAuthMode] = useState('login'); // or 'signup'
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // UI/state
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  // Data
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Status/feedback
  const [uiMessage, setUiMessage] = useState('');
  const [uiError, setUiError] = useState('');

  // Fetch recipe categories on login & first mount
  useEffect(() => {
    if (!isAuthenticated) {
      setCategories([]);
      return;
    }
    getCategories()
      .then(cats => setCategories(cats))
      .catch(() => setCategories([]));
  }, [isAuthenticated]);

  // Fetch recipes when category/search changes OR after login
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingRecipes(true);
    getRecipes({ category, search: searchTerm })
      .then(rs => {
        setRecipes(rs);
        setLoadingRecipes(false);
        setUiError('');
      })
      .catch(err => {
        setUiError(err.message || 'Failed to load recipes');
        setLoadingRecipes(false);
      });
  }, [isAuthenticated, category, searchTerm]);

  // Fetch favorites on login or after favorite change
  useEffect(() => {
    if (!isAuthenticated) {
      setFavorites([]);
      return;
    }
    getFavorites()
      .then(favs => {
        setFavorites(favs);
      })
      .catch(() => setFavorites([]));
  }, [isAuthenticated]);

  // On logout: clear all user data/state
  const doLogout = () => {
    apiLogout();
    setIsAuthenticated(false);
    setShowFavorites(false);
    setSelectedRecipeId(null);
    setUiError('');
    setRecipes([]);
    setFavorites([]);
    setCategory(null);
    setSearchTerm('');
  };

  // Handlers: Auth
  const handleLogin = () => {
    // Just display login form
    setAuthError('');
    setAuthLoading(false);
    setAuthMode('login');
    setUiError('');
    setUiMessage('');
    doLogout();
  };
  const handleLogout = () => {
    doLogout();
  };
  const handleAuthSubmit = async ({ email, password }) => {
    setAuthLoading(true);
    setAuthError('');
    setUiError('');
    try {
      let data;
      if (authMode === 'login') {
        data = await apiLogin(email, password);
      } else {
        data = await apiSignup(email, password);
      }
      setToken(data.token);
      setIsAuthenticated(true);
      setAuthError('');
      setUiMessage('');
      setShowFavorites(false);
    } catch (e) {
      setAuthError(e.message || 'Authentication failed');
      setUiError('');
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };
  const toggleAuthMode = () =>
    setAuthMode(m => (m === 'login' ? 'signup' : 'login'));

  // Recipe details
  const selectedRecipe =
    selectedRecipeId != null
      ? recipes.find(r => r.id === selectedRecipeId)
      : null;

  // Favorites management
  const isFavorite = recipe =>
    favorites.some(fav => fav.id === recipe.id);
  const handleToggleFavorite = async recipe => {
    if (!recipe) return;
    try {
      if (isFavorite(recipe)) {
        await removeFavorite(recipe.id);
        setFavorites(favs => favs.filter(fav => fav.id !== recipe.id));
        setUiMessage('Removed from favorites');
      } else {
        await addFavorite(recipe.id);
        setFavorites(favs => [...favs, recipe]);
        setUiMessage('Added to favorites');
      }
      setUiError('');
    } catch (e) {
      setUiError(e.message || 'Error updating favorites');
      setUiMessage('');
    }
  };
  const handleSelectRecipeFromFavorites = id => {
    setShowFavorites(false);
    setSelectedRecipeId(id);
  };

  // Main content/conditional rendering
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
        recipes={recipes}
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
            categories={categories}
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
          {/* User feedback/errors */}
          {uiError && (
            <div style={{
              color: '#ff7b7b',
              background: '#2a1620',
              borderRadius: '6px',
              padding: '10px 14px', margin: '12px 0'
            }}>{uiError}</div>
          )}
          {uiMessage && (
            <div style={{
              color: '#1ebd7a',
              background: '#183c26',
              borderRadius: '6px',
              padding: '10px 14px', margin: '12px 0'
            }}>{uiMessage}</div>
          )}
          {loadingRecipes ? <div style={{
            padding: '25px 0', color: 'var(--text-secondary)', fontSize: '1.13rem'
          }}>Loading recipes...</div> : mainContent}
        </main>
      </div>
    </div>
  );
}

export default App;