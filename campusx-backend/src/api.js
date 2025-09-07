// API service for frontend integration
class CampusXAPI {
  constructor(baseURL = null) {
    // Auto-detect base URL for production/development
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    this.baseURL = baseURL || (isProduction ? '/v1' : 'http://localhost:4000/v1');
    this.token = localStorage.getItem('campusx_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('campusx_token', token);
    } else {
      localStorage.removeItem('campusx_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(email, password, displayName) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName })
    });
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(data.token);
    return data;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Listing endpoints
  async getListings(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    
    const queryString = params.toString();
    const endpoint = queryString ? `/listings?${queryString}` : '/listings';
    return this.request(endpoint);
  }

  async getListing(id) {
    return this.request(`/listings/${id}`);
  }

  async createListing(listingData) {
    const formData = new FormData();
    
    // Add text fields
    Object.entries(listingData).forEach(([key, value]) => {
      if (key !== 'images' && value !== undefined) {
        formData.append(key, value);
      }
    });

    // Add images
    if (listingData.images && listingData.images.length > 0) {
      listingData.images.forEach((file, index) => {
        formData.append('images', file);
      });
    }

    return this.request('/listings', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData
    });
  }

  async updateListing(id, listingData) {
    const formData = new FormData();
    
    Object.entries(listingData).forEach(([key, value]) => {
      if (key !== 'images' && value !== undefined) {
        formData.append(key, value);
      }
    });

    if (listingData.images && listingData.images.length > 0) {
      listingData.images.forEach((file, index) => {
        formData.append('images', file);
      });
    }

    return this.request(`/listings/${id}`, {
      method: 'PUT',
      headers: {},
      body: formData
    });
  }

  async deleteListing(id) {
    return this.request(`/listings/${id}`, {
      method: 'DELETE'
    });
  }

  async reportListing(id, reason) {
    return this.request(`/listings/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  // Chat endpoints (placeholder - implement when chat routes are ready)
  async getChats() {
    return this.request('/chats');
  }

  async getChatMessages(chatId) {
    return this.request(`/chats/${chatId}/messages`);
  }

  async sendMessage(chatId, message) {
    return this.request(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  // Upload endpoints
  async uploadFile(file, type = 'listings') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request('/uploads', {
      method: 'POST',
      headers: {},
      body: formData
    });
  }
}

// Create global API instance
window.api = new CampusXAPI();
