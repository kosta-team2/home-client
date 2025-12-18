let token = null;
const listeners = new Set();

export const tokenStore = {
  get() {
    return token;
  },
  set(nextToken) {
    token = nextToken;
    listeners.forEach((fn) => fn(token));
  },
  clear() {
    token = null;
    listeners.forEach((fn) => fn(token));
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
