/**
 * Wrapper pour gérer les erreurs async/await dans les controllers
 * Évite d'avoir à écrire try/catch partout
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
