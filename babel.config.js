// babel.config.js
export default {
    presets: [
        ['@babel/preset-env', {
            targets: {
                node: 'current',
            },
        }],
        ['@babel/preset-react', {
            runtime: 'automatic',
        }],
    ],
    plugins: [
        // NEW: Transform import.meta into something compatible with Node.js/Jest.
        // This plugin typically converts import.meta.env.MODE to process.env.NODE_ENV.
        'babel-plugin-transform-import-meta',
    ],
};