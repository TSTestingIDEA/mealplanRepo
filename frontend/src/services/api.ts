import { auth } from '../config/firebase'; // adjust path if needed

// Use relative URL on Vercel (same domain), or EXPO_PUBLIC_BACKEND_URL for development
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "https://mealplanrepo.onrender.com";

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request(path: string, options: RequestInit = {}) {
    const url = `${BACKEND_URL}/api${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || `API error ${res.status}`);
    }
    return res.json();
  }

  // Auth
  async verifyAuth() {
    return this.request('/auth/verify', { method: 'POST' });
  }

  // Recipes
  async getRecipes() {
    return this.request('/recipes');
  }

  async createRecipe(data: { url: string; title: string; tags?: string[]; ingredients?: string[]; notes?: string; thumbnail?: string }) {
    return this.request('/recipes', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateRecipe(id: string, data: any) {
    return this.request(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteRecipe(id: string) {
    return this.request(`/recipes/${id}`, { method: 'DELETE' });
  }

  async searchRecipes(q?: string, tag?: string) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tag) params.set('tag', tag);
    return this.request(`/recipes/search?${params.toString()}`);
  }

  // Meal Plans
  async getMealPlan(weekStart: string) {
    return this.request(`/meal-plans/${weekStart}`);
  }

  async updateMealPlan(data: { week_start: string; days: any }) {
    return this.request('/meal-plans', { method: 'PUT', body: JSON.stringify(data) });
  }

  // Grocery Lists
  // async getGroceryList(weekStart: string) {
  //   return this.request(`/grocery-lists/${weekStart}`);
  // }

  async getGroceryList(weekStart: string) {
  const headers = await getAuthHeaders();

  const res = await fetch(`${BASE_URL}/api/grocery-lists/${weekStart}`, {
    method: "GET",
    headers,
  });

  return res.json();
}

  async updateGroceryList(data: { week_start: string; items: any[] }) {
    return this.request('/grocery-lists', { method: 'PUT', body: JSON.stringify(data) });
  }

 // async addGroceryItem(weekStart: string, item: { name: string; quantity?: string; category?: string }) {
 //    return this.request(`/grocery-lists/${weekStart}/items`, { method: 'POST', body: JSON.stringify(item) });
 //  }

async addGroceryItem(weekStart: string, item: { name: string; quantity?: string; category?: string }) {
  const headers = await getAuthHeaders();

  const res = await fetch(`${BASE_URL}/api/grocery-lists/${weekStart}/items`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`Failed: ${res.status}`);
  }

  return res.json();
}

  // async toggleGroceryItem(weekStart: string, itemId: string) {
  //   return this.request(`/grocery-lists/${weekStart}/items/${itemId}/toggle`, { method: 'PUT' });
  // }

 async toggleGroceryItem(weekStart: string, itemId: string) {
  const headers = await getAuthHeaders();

  const res = await fetch(`${BASE_URL}/api/grocery-lists/${weekStart}/items/${itemId}/toggle`, {
    method: "PUT",
    headers,
  });

  return res.json();
}

  // async deleteGroceryItem(weekStart: string, itemId: string) {
  //   return this.request(`/grocery-lists/${weekStart}/items/${itemId}`, { method: 'DELETE' });
  // }

 async deleteGroceryItem(weekStart: string, itemId: string) {
  const headers = await getAuthHeaders();

  const res = await fetch(`${BASE_URL}/api/grocery-lists/${weekStart}/items/${itemId}`, {
    method: "DELETE",
    headers,
  });

  return res.json();
}

  // Tags
  async getTags() {
    return this.request('/tags');
  }
}

export const api = new ApiService();
