const apiUrl = import.meta.env.VITE_API_URL as string;

if (!apiUrl) {
  console.warn("VITE_API_URL is not defined");
}

export const ENV = {
  API_URL: apiUrl,
};