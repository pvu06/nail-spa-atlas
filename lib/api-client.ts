const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  message?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on client side
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || "Network error",
          code: "NETWORK_ERROR",
        },
      };
    }
  }

  // Auth endpoints
  async register(email: string, password: string, salonName?: string) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, salonName }),
    });
  }

  async login(email: string, password: string) {
    const response = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async getMe() {
    return this.request("/auth/me");
  }

  // Maps endpoints (public)
  async geocodeAddress(address: string) {
    return this.request<{
      lat: number;
      lng: number;
      formattedAddress: string;
      city?: string;
      state?: string;
      cached: boolean;
    }>("/maps/geocode", {
      method: "POST",
      body: JSON.stringify({ address }),
    });
  }

  // Places search (requires auth)
  async searchPlaces(params: {
    lat: number;
    lng: number;
    radiusMiles: number;
    keyword?: string;
    limit?: number;
  }) {
    return this.request<{
      places: Array<{
        placeId: string;
        name: string;
        address: string;
        location: { lat: number; lng: number };
        rating?: number;
        userRatingsTotal?: number;
        priceLevel?: number;
        distanceMiles?: number;
        photos?: string[];
        website?: string;
        phoneNumber?: string;
      }>;
      cached: boolean;
      count: number;
    }>("/maps/places", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // Place details (requires auth)
  async getPlaceDetails(placeId: string) {
    return this.request("/maps/place-details", {
      method: "POST",
      body: JSON.stringify({ placeId }),
    });
  }

  // Competitor search (requires auth)
  async searchCompetitors(params: {
    address: string;
    radius: number;
    competitorCount: number;
    lat?: number;
    lng?: number;
  }) {
    return this.request("/competitors/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // Saved searches
  async getSavedSearches(page: number = 1, limit: number = 10) {
    return this.request(`/searches?page=${page}&limit=${limit}`);
  }

  async saveSearch(data: {
    searchAddress: string;
    radiusMiles: number;
    competitorCount: number;
    results: any;
  }) {
    return this.request("/searches", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteSavedSearch(id: string) {
    return this.request(`/searches/${id}`, {
      method: "DELETE",
    });
  }

  // Export
  async exportCSV(competitors: any[]) {
    const response = await fetch(`${API_BASE}/export/csv`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: JSON.stringify({ competitors }),
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `competitors-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      return { success: true };
    }

    return { success: false, error: { message: "Export failed" } };
  }

  async exportPDF(competitors: any[], searchAddress?: string) {
    const response = await fetch(`${API_BASE}/export/pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: JSON.stringify({ competitors, searchAddress }),
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `competitors-${Date.now()}.html`;
      a.click();
      window.URL.revokeObjectURL(url);
      return { success: true };
    }

    return { success: false, error: { message: "Export failed" } };
  }
}

export const apiClient = new ApiClient();



