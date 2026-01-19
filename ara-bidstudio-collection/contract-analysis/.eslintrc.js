module.exports = {
  extends: [
    "next/core-web-vitals",
    "next/typescript",
    // Add oxlint for faster linting
    // Add biome rules when biome is installed
  ],
  rules: {
    // Project-specific linting rules can be added here
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
  },
  // Add ruler configuration for code quality enforcement
  // when ruler is installed
};