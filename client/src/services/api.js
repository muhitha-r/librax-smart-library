import axios from 'axios';

// Backend URL configured via Vite environment variable, falling back to local port 5000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: attach JWT token if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('librax_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle errors uniformly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (!url.includes('/api/auth/login')) {
        localStorage.removeItem('librax_token');
        localStorage.removeItem('librax_user');
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred while communicating with the server.';

    return Promise.reject({
      ...error,
      customMessage: message,
      status: error.response?.status,
    });
  }
);

// --- Health Check APIs ---
export const checkApiStatus = async () => {
  const response = await api.get('/');
  return response.data;
};

export const checkSystemHealth = async () => {
  const response = await api.get('/api/health');
  return response.data;
};

// --- Authentication APIs ---
export const registerUser = async (userData) => {
  const response = await api.post('/api/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/api/auth/login', credentials);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

// --- Book Management APIs ---
/**
 * Fetch paginated books with search and filter
 * @param {Object} params - { page, limit, search, category, available, sort }
 */
export const fetchBooks = async (params = {}) => {
  const response = await api.get('/api/books', { params });
  return response.data;
};

/**
 * Fetch distinct book categories
 */
export const fetchCategories = async () => {
  const response = await api.get('/api/books/categories');
  return response.data;
};

/**
 * Fetch single book details
 * @param {string} id - Book ObjectId
 */
export const fetchBookById = async (id) => {
  const response = await api.get(`/api/books/${id}`);
  return response.data;
};

/**
 * Create a new book (Admin & Librarian only)
 * @param {Object} bookData
 */
export const createBook = async (bookData) => {
  const response = await api.post('/api/books', bookData);
  return response.data;
};

/**
 * Update an existing book (Admin & Librarian only)
 * @param {string} id - Book ObjectId
 * @param {Object} bookData
 */
export const updateBook = async (id, bookData) => {
  const response = await api.put(`/api/books/${id}`, bookData);
  return response.data;
};

/**
 * Delete a book (Admin & Librarian only)
 * @param {string} id - Book ObjectId
 */
export const deleteBook = async (id) => {
  const response = await api.delete(`/api/books/${id}`);
  return response.data;
};

// --- User Management APIs (Admin only) ---
/**
 * Fetch paginated users with optional role or search filters
 * @param {Object} params - { page, limit, role, search }
 */
export const fetchUsers = async (params = {}) => {
  const response = await api.get('/api/users', { params });
  return response.data;
};

/**
 * Fetch system statistics (users per role, catalog totals)
 */
export const fetchSystemStats = async () => {
  const response = await api.get('/api/users/stats');
  return response.data;
};

/**
 * Create a new user with designated role (Admin only)
 * @param {Object} userData - { name, email, password, role }
 */
export const createUser = async (userData) => {
  const response = await api.post('/api/users', userData);
  return response.data;
};

/**
 * Update user role (Admin only)
 * @param {string} id - User ObjectId
 * @param {string} role - 'Admin' | 'Librarian' | 'Staff' | 'Student'
 */
export const updateUserRole = async (id, role) => {
  const response = await api.patch(`/api/users/${id}/role`, { role });
  return response.data;
};

/**
 * Delete a user (Admin only)
 * @param {string} id - User ObjectId
 */
export const deleteUser = async (id) => {
  const response = await api.delete(`/api/users/${id}`);
  return response.data;
};

// --- Borrowing, Return & Fine Management APIs ---
/**
 * Borrow a book or issue a book (All roles; Admin/Librarian can specify userId and custom dueDate)
 * @param {Object} borrowData - { bookId, userId?, dueDate?, remarks? }
 */
export const createBorrow = async (borrowData) => {
  const response = await api.post('/api/borrow', borrowData);
  return response.data;
};

/**
 * Fetch current user's borrowing history and active loans
 * @param {Object} params - { status, page, limit }
 */
export const fetchMyBorrowings = async (params = {}) => {
  const response = await api.get('/api/borrow/my', { params });
  return response.data;
};

/**
 * Fetch all borrowing records with filters (Admin & Librarian only)
 * @param {Object} params - { page, limit, status, role, search, sort }
 */
export const fetchAllBorrowings = async (params = {}) => {
  const response = await api.get('/api/borrow', { params });
  return response.data;
};

/**
 * Fetch all overdue borrowing records (Admin & Librarian only)
 * @param {Object} params - { page, limit }
 */
export const fetchOverdueBorrowings = async (params = {}) => {
  const response = await api.get('/api/borrow/overdue', { params });
  return response.data;
};

/**
 * Fetch a single borrowing record by ID
 * @param {string} id
 */
export const fetchBorrowRecordById = async (id) => {
  const response = await api.get(`/api/borrow/${id}`);
  return response.data;
};

/**
 * Return a borrowed book
 * @param {string} id - BorrowRecord ObjectId
 * @param {Object} returnData - { remarks? }
 */
export const returnBook = async (id, returnData = {}) => {
  const response = await api.patch(`/api/borrow/${id}/return`, returnData);
  return response.data;
};

/**
 * Record fine payment or waive fine (Admin & Librarian only)
 * @param {string} id - BorrowRecord ObjectId
 * @param {Object} fineData - { action: 'Pay' | 'Waive', remarks? }
 */
export const payOrWaiveFine = async (id, fineData) => {
  const response = await api.patch(`/api/borrow/${id}/pay-fine`, fineData);
  return response.data;
};

/**
 * Fetch borrowing rules and settings
 */
export const fetchBorrowSettings = async () => {
  const response = await api.get('/api/borrow/settings');
  return response.data;
};

/**
 * Update borrowing settings (Admin only)
 * @param {Object} settingsData
 */
export const updateBorrowSettings = async (settingsData) => {
  const response = await api.put('/api/borrow/settings', settingsData);
  return response.data;
};

// --- Book Reservation Management APIs ---
/**
 * Create a reservation for an unavailable book
 * @param {Object} data - { bookId, notes }
 */
export const createReservation = async (data) => {
  const response = await api.post('/api/reservations', data);
  return response.data;
};

/**
 * Fetch current user's reservations
 */
export const fetchMyReservations = async () => {
  const response = await api.get('/api/reservations/my');
  return response.data;
};

/**
 * Fetch all reservations with pagination & status filters (Admin & Librarian only)
 * @param {Object} params - { status, search, page, limit }
 */
export const fetchAllReservations = async (params = {}) => {
  const response = await api.get('/api/reservations', { params });
  return response.data;
};

/**
 * Cancel a reservation (Owner, Admin, or Librarian)
 * @param {string} id - Reservation ObjectId
 */
export const cancelReservation = async (id) => {
  const response = await api.patch(`/api/reservations/${id}/cancel`);
  return response.data;
};

/**
 * Fulfill a reservation (Admin & Librarian only)
 * @param {string} id - Reservation ObjectId
 */
export const fulfillReservation = async (id) => {
  const response = await api.patch(`/api/reservations/${id}/fulfill`);
  return response.data;
};

/**
 * Mark a reservation as available and send user notification (Admin & Librarian only)
 * @param {string} id - Reservation ObjectId
 */
export const notifyReservation = async (id) => {
  const response = await api.patch(`/api/reservations/${id}/notify`);
  return response.data;
};

// --- Wishlist Management APIs ---
/**
 * Fetch current user's wishlist
 */
export const fetchWishlist = async () => {
  const response = await api.get('/api/wishlist');
  return response.data;
};

/**
 * Add a book to user's wishlist
 * @param {string} bookId
 */
export const addToWishlist = async (bookId) => {
  const response = await api.post('/api/wishlist', { bookId });
  return response.data;
};

/**
 * Remove a book from user's wishlist
 * @param {string} bookId
 */
export const removeFromWishlist = async (bookId) => {
  const response = await api.delete(`/api/wishlist/${bookId}`);
  return response.data;
};

// --- In-App Notification Center APIs ---
/**
 * Fetch user notifications with unread counts
 * @param {Object} params - { page, limit, unreadOnly }
 */
export const fetchNotifications = async (params = {}) => {
  const response = await api.get('/api/notifications', { params });
  return response.data;
};

/**
 * Mark a single notification as read
 * @param {string} id - Notification ObjectId
 */
export const markNotificationAsRead = async (id) => {
  const response = await api.patch(`/api/notifications/${id}/read`);
  return response.data;
};

/**
 * Mark all notifications as read for current user
 */
export const markAllNotificationsAsRead = async () => {
  const response = await api.patch('/api/notifications/read-all');
  return response.data;
};

/**
 * Delete a notification
 * @param {string} id - Notification ObjectId
 */
export const deleteNotification = async (id) => {
  const response = await api.delete(`/api/notifications/${id}`);
  return response.data;
};

// --- Phase 5: Admin Analytics & Reports APIs ---
/**
 * Fetch complete real-time analytics for Admin Dashboard
 * (KPI summaries, monthly trends, top books, categories, status breakdown)
 */
export const fetchAdminAnalytics = async () => {
  const response = await api.get('/api/analytics/dashboard');
  return response.data;
};

/**
 * Fetch operational reports with date filters, pagination, and summary statistics
 * @param {Object} params - { type, startDate, endDate, status, search, page, limit }
 */
export const fetchReports = async (params = {}) => {
  const response = await api.get('/api/reports', { params });
  return response.data;
};

/**
 * Trigger browser file download of filtered report in CSV format
 * @param {Object} params - { type, startDate, endDate, status, search }
 */
export const downloadReportCSV = async (params = {}) => {
  const response = await api.get('/api/reports/export', {
    params,
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // Extract filename from header or construct fallback
  const contentDisposition = response.headers['content-disposition'];
  let filename = `librax-${params.type || 'borrowing'}-report-${new Date().toISOString().split('T')[0]}.csv`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) filename = match[1];
  }

  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default api;

