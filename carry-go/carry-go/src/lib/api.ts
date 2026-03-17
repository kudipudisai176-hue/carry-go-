import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const user = localStorage.getItem('carrygo_user');
    if (user) {
        const { token } = JSON.parse(user);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default api;
