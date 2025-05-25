// jest.config.js
export default {
    // Test environment for browser-like global variables and DOM APIs.
    testEnvironment: 'jsdom',

    // Specify files Jest should consider as test files.
    // This pattern matches files ending with .test.js or .spec.js.
    testMatch: [
        "**/__tests__/**/*.js?(x)",
        "**/?(*.)+(spec|test).js?(x)"
    ],

    // Module file extensions for importing.
    moduleFileExtensions: ['js', 'jsx', 'json', 'node'],

    // Transformation for JavaScript/JSX files.
    // We'll use babel-jest to transpile our ES Modules and JSX.
    // babel-jest typically picks up your project's babel config (e.g., from vite/react plugin).
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest',
    },

    // Ensure Jest uses ES module syntax (import/export) correctly in Node.js environment.
    // This is a common requirement when working with modern JS in Jest.
};