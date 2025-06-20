//
// Central API service for backend interactions (auth, recipes, favorites)
// Handles JWT token, base URL, fetch logic, and error processing.
//

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

// LocalStorage key for JWT:
const TOKEN_KEY = 'recipe_jwt';

// PUBLIC_INTERFACE
/**
 * Save JWT token to localStorage
 */
export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// PUBLIC_INTERFACE
/**
 * Get JWT token from localStorage
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Internal
function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Handle API response: parse JSON, throw on error status
 */
async function handleResponse(res) {
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message =
      (data && (data.detail || data.error || JSON.stringify(data))) ||
      `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return data;
}

// PUBLIC_INTERFACE
/**
 * Login - returns { token }
 */
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

// PUBLIC_INTERFACE
/**
 * Signup/register - returns { token }
 */
export async function signup(email, password) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

// PUBLIC_INTERFACE
/**
 * Logout (client-side only)
 */
export function logout() {
  setToken(null);
}

/**
 * Get all recipe categories
 */
export async function getCategories() {
  // Assume `/categories` returns list of categories (e.g., ["Breakfast",...])
  const res = await fetch(`${API_BASE}/categories`, {
    headers: { ...authHeader() },
  });
  return handleResponse(res);
}

// PUBLIC_INTERFACE
/**
 * Get filtered & searched recipes (optionally by category or search term)
 */
export async function getRecipes({ category, search }) {
  const url = new URL(`${API_BASE}/recipes`);
  if (category) url.searchParams.append('category', category);
  if (search) url.searchParams.append('search', search);
  const res = await fetch(url.toString(), {
    headers: { ...authHeader() },
  });
  return handleResponse(res);
}

// PUBLIC_INTERFACE
/**
 * Get single recipe by ID
 */
export async function getRecipe(id) {
  const res = await fetch(`${API_BASE}/recipes/${id}`, {
    headers: { ...authHeader() },
  });
  return handleResponse(res);
}

// PUBLIC_INTERFACE
/**
 * Create a recipe. Requires auth. Returns new recipe.
 */
export async function createRecipe(recipe) {
  const res = await fetch(`${API_BASE}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(recipe),
  });
  return handleResponse(res);
}

// PUBLIC_INTERFACE
/**
 * Update a recipe by ID.
 */
export async function updateRecipe(id, recipe) {
  const res = await fetch(`${API_BASE}/recipes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(recipe),
  });
  return handleResponse(res);
}

// PUBLIC_INTERFACE
/**
 * Delete a recipe by ID.
 */
export async function deleteRecipe(id) {
  const res = await fetch(`${API_BASE}/recipes/${id}`, {
    method: 'DELETE',
    headers: { ...authHeader() },
  });
  return handleResponse(res);
}

// PUBLIC_INTERFACE
/**
 * Get current user's favorite recipes (list)
 */
export async function getFavorites() {
  const res = await fetch(`${API_BASE}/favorites`, {
    headers: { ...authHeader() },
  });
  return handleResponse(res);
}

// PUBLIC_INTERFACE
/**
 * Add recipe to favorites (by recipe ID)
 */
export async function addFavorite(recipeId) {
  const res = await fetch(`${API_BASE}/favorites/${recipeId}`, {
    method: 'POST',
    headers: { ...authHeader() },
  });
  return handleResponse(res);
}

// PUBLIC_INTERFACE
/**
 * Remove recipe from favorites (by recipe ID)
 */
export async function removeFavorite(recipeId) {
  const res = await fetch(`${API_BASE}/favorites/${recipeId}`, {
    method: 'DELETE',
    headers: { ...authHeader() },
  });
  return handleResponse(res);
}
