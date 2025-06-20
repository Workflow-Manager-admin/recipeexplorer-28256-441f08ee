from fastapi import (
    FastAPI, HTTPException, status, Depends, Response
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext


SECRET_KEY = "supersecret_recipe_api_key_12345"  # In production, load from env!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# --- Data Models ---


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=32)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=4)


class UserPublic(UserBase):
    id: int


class UserAuth(UserBase):
    id: int
    hashed_password: str
    favorites: List[int] = Field(default_factory=list)


class Token(BaseModel):
    access_token: str
    token_type: str


class RecipeBase(BaseModel):
    title: str
    description: str
    ingredients: List[str]
    instructions: str


class RecipeCreate(RecipeBase):
    pass


class RecipeUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    ingredients: Optional[List[str]]
    instructions: Optional[str]


class Recipe(RecipeBase):
    id: int
    owner_id: int


# --- In-memory storage ---


users_db: Dict[str, UserAuth] = {}
users_by_id: Dict[int, UserAuth] = {}
recipes_db: Dict[int, Recipe] = {}
next_user_id = 1
next_recipe_id = 1


# --- Security utility setup ---


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")


# --- FastAPI setup ---


app = FastAPI(
    title="Recipe Explorer Backend API",
    description="Handles recipe CRUD, user authentication, and favorites for Recipe Explorer App",
    version="1.0.0",
    openapi_tags=[
        {"name": "Recipes", "description": "Recipe CRUD operations"},
        {"name": "Users", "description": "User registration and management"},
        {"name": "Auth", "description": "Authentication endpoints"},
        {"name": "Favorites", "description": "User recipe favorites"},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In prod, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Helper Functions ---


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_user_by_username(username: str) -> Optional[UserAuth]:
    return users_db.get(username)


def get_user_by_id(user_id: int) -> Optional[UserAuth]:
    return users_by_id.get(user_id)


def get_current_user(token: str = Depends(oauth2_scheme)) -> UserAuth:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = decode_access_token(token)
        user_id: int = int(payload.get("sub"))
        user = get_user_by_id(user_id)
        if user is None:
            raise credentials_exception
        return user
    except Exception:
        raise credentials_exception


def ensure_owner(recipe_id: int, user: UserAuth) -> None:
    recipe = recipes_db.get(recipe_id)
    if not recipe or recipe.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this recipe.")


# --- PUBLIC INTERFACE Endpoints ---


@app.get("/", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {"message": "Healthy"}


# ---------- Auth & User Endpoints ----------


# PUBLIC_INTERFACE
@app.post(
    "/register",
    response_model=UserPublic,
    status_code=201,
    tags=["Users"],
    summary="Register new user",
    description="Create a new user account."
)
def register_user(user: UserCreate):
    """Registers a new user with username and email."""
    global next_user_id
    if user.username in users_db:
        raise HTTPException(status_code=400, detail="Username already registered.")
    for existing_user in users_db.values():
        if existing_user.email == user.email:
            raise HTTPException(status_code=400, detail="Email already registered.")
    hashed_pw = get_password_hash(user.password)
    user_obj = UserAuth(
        id=next_user_id,
        username=user.username,
        email=user.email,
        hashed_password=hashed_pw,
        favorites=[],
    )
    users_db[user.username] = user_obj
    users_by_id[next_user_id] = user_obj
    next_user_id += 1
    return UserPublic(id=user_obj.id, username=user_obj.username, email=user_obj.email)


# PUBLIC_INTERFACE
@app.post(
    "/token",
    response_model=Token,
    tags=["Auth"],
    summary="Log in user",
    description="Obtain JWT access token for a user"
)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """User login: returns access token upon valid authentication."""
    user = get_user_by_username(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


# PUBLIC_INTERFACE
@app.get(
    "/me",
    response_model=UserPublic,
    tags=["Users"],
    summary="Get current user"
)
def get_me(current_user: UserAuth = Depends(get_current_user)):
    """Get the currently authenticated user info."""
    return UserPublic(id=current_user.id, username=current_user.username, email=current_user.email)


# ---------- Recipe Endpoints ----------


# PUBLIC_INTERFACE
@app.get(
    "/recipes",
    response_model=List[Recipe],
    tags=["Recipes"],
    summary="List all recipes"
)
def list_recipes(skip: int = 0, limit: int = 100):
    """List all available recipes."""
    all_recipes = list(recipes_db.values())
    return all_recipes[skip: skip + limit]


# PUBLIC_INTERFACE
@app.get(
    "/recipes/{recipe_id}",
    response_model=Recipe,
    tags=["Recipes"],
    summary="Get recipe by ID"
)
def get_recipe(recipe_id: int):
    """Retrieve a recipe by ID."""
    recipe = recipes_db.get(recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe


# PUBLIC_INTERFACE
@app.post(
    "/recipes",
    response_model=Recipe,
    status_code=201,
    tags=["Recipes"],
    summary="Create a new recipe",
    description="Create a recipe (only for authenticated users)"
)
def create_recipe(recipe: RecipeCreate, current_user: UserAuth = Depends(get_current_user)):
    """Create a new recipe owned by the authenticated user."""
    global next_recipe_id
    recipe_obj = Recipe(
        id=next_recipe_id,
        owner_id=current_user.id,
        **recipe.dict()
    )
    recipes_db[next_recipe_id] = recipe_obj
    next_recipe_id += 1
    return recipe_obj


# PUBLIC_INTERFACE
@app.put(
    "/recipes/{recipe_id}",
    response_model=Recipe,
    tags=["Recipes"],
    summary="Update a recipe",
    description="Update an existing recipe (owners only)"
)
def update_recipe(
    recipe_id: int,
    update: RecipeUpdate,
    current_user: UserAuth = Depends(get_current_user)
):
    """Update a recipe (owners only)."""
    recipe = recipes_db.get(recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if recipe.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this recipe")
    for attr, value in update.dict(exclude_unset=True).items():
        setattr(recipe, attr, value)
    recipes_db[recipe_id] = recipe
    return recipe


# PUBLIC_INTERFACE
@app.delete(
    "/recipes/{recipe_id}",
    status_code=204,
    tags=["Recipes"],
    summary="Delete a recipe",
    description="Delete a recipe (owners only)"
)
def delete_recipe(recipe_id: int, current_user: UserAuth = Depends(get_current_user)):
    """Delete a recipe (owners only)."""
    recipe = recipes_db.get(recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if recipe.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this recipe")
    del recipes_db[recipe_id]
    # Remove from user's favorites (every user)
    for user in users_db.values():
        if recipe_id in user.favorites:
            user.favorites.remove(recipe_id)
    return Response(status_code=204)


# ---------- Favorites Endpoints ----------


# PUBLIC_INTERFACE
@app.post(
    "/favorites/{recipe_id}",
    status_code=201,
    tags=["Favorites"],
    summary="Add recipe to favorites"
)
def add_favorite(recipe_id: int, current_user: UserAuth = Depends(get_current_user)):
    """Add a recipe to the user's favorites."""
    if recipe_id not in recipes_db:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if recipe_id in current_user.favorites:
        raise HTTPException(status_code=400, detail="Recipe already favorited")
    current_user.favorites.append(recipe_id)
    return {"success": True, "favorite_count": len(current_user.favorites)}


# PUBLIC_INTERFACE
@app.delete(
    "/favorites/{recipe_id}",
    status_code=200,
    tags=["Favorites"],
    summary="Remove recipe from favorites"
)
def remove_favorite(recipe_id: int, current_user: UserAuth = Depends(get_current_user)):
    """Remove a recipe from user's favorites."""
    if recipe_id not in current_user.favorites:
        raise HTTPException(status_code=400, detail="Recipe not in favorites")
    current_user.favorites.remove(recipe_id)
    return {"success": True, "favorite_count": len(current_user.favorites)}


# PUBLIC_INTERFACE
@app.get(
    "/favorites",
    response_model=List[Recipe],
    tags=["Favorites"],
    summary="List my favorite recipes"
)
def list_favorites(current_user: UserAuth = Depends(get_current_user)):
    """List all recipes favorited by the user."""
    favs = [recipes_db[rid] for rid in current_user.favorites if rid in recipes_db]
    return favs
