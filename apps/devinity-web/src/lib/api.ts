import axios, { AxiosInstance } from "axios";

import { env } from "./env";

export const api: AxiosInstance = axios.create({
  baseURL: env.api.baseUrl,
  timeout: 10000,
  withCredentials: true, // Enable sending cookies with cross-origin requests
  headers: {
    "Content-Type": "application/json",
    // Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
  },
});

// TODO: Enable this when there's more usage of the API
// --- Request Interceptor
// api.interceptors.request.use(
//   (config) => {
//     // Example: Attach token from localStorage or cookies
//     const token =
//       typeof window !== 'undefined' ? localStorage.getItem('token') : null;

//     if (token && config.headers) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   },
// );

// // --- Response Interceptor
// api.interceptors.response.use(
//   (response: AxiosResponse) => response,
//   (error) => {
//     // Optional: Handle common API errors globally
//     if (error.response?.status === 401) {
//       console.warn('Unauthorized - maybe redirect to login');
//     }

//     return Promise.reject(error);
//   },
// );
