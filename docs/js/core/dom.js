/* The one element the app draws into (null when imported from Node for tests). */
export const app = typeof document !== "undefined" ? document.getElementById("app") : null;
