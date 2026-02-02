import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Jika error 401 dan bukan dari request login/refresh itu sendiri
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        // Coba refresh token
        await axiosInstance.post("/auth/refresh");

        // Jika berhasil, ulangi request asli
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Jika refresh gagal (token expired/invalid), redirect ke login atau biarkan error
        // Kita bisa trigger event logout atau biarkan user di-handle oleh auth guard
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error.response?.data || error);
  },
);
