const AUTH_STORAGE_KEY = 'maya_auth';

export const isAuthenticated = () =>
  sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';

export const setAuthenticated = () => {
  sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
};

export const clearAuthentication = () => {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
};
