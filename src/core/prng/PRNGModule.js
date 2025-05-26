// File: src/PRNGModule.js (Refactored to ES6 Modules)
// Description: Provides a cryptographically seeded pseudo-random number generator
// using the xoshiro256** algorithm. Output methods for unsigned 64-bit integers,
// floats in [0,1), and unbiased integers in a specific range [0, N).
// Uses ES6 module system.

// "use strict"; // Not strictly necessary in ES6 modules, as they are implicitly in strict mode.

const U64_MASK = (1n << 64n) - 1n;
let S_STATE = [0n, 0n, 0n, 0n];

function rotl64(x_bigint, k_int) {
    const k = BigInt(k_int);
    const val = x_bigint & U64_MASK;
    const left_part = (val << k) & U64_MASK;
    const right_part = val >> (64n - k);
    return left_part | right_part;
}

function _next_internal() {
    const term1_mult = (S_STATE[1] * 5n) & U64_MASK;
    const term1_rotl = rotl64(term1_mult, 7);
    const result_val = (term1_rotl * 9n) & U64_MASK;

    const t = (S_STATE[1] << 17n) & U64_MASK;

    S_STATE[2] = (S_STATE[2] ^ S_STATE[0]) & U64_MASK;
    S_STATE[3] = (S_STATE[3] ^ S_STATE[1]) & U64_MASK;
    S_STATE[1] = (S_STATE[1] ^ S_STATE[2]) & U64_MASK;
    S_STATE[0] = (S_STATE[0] ^ S_STATE[3]) & U64_MASK;

    S_STATE[2] = (S_STATE[2] ^ t) & U64_MASK;
    S_STATE[3] = rotl64(S_STATE[3], 45);

    return result_val;
}

const api = {};

api.seedPRNG = function() {
    if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
        console.warn("PRNGModule: crypto.getRandomValues not available. Using insecure fallback for seeding (Date.now based). THIS IS NOT FOR PRODUCTION USE REQUIRING SECURE RANDOMNESS.");
        const now = BigInt(Date.now());
        S_STATE[0] = (now ^ BigInt("0x123456789abcdef0")) & U64_MASK;
        S_STATE[1] = ((now << 10n) ^ BigInt("0xfedcba9876543210")) & U64_MASK;
        S_STATE[2] = ((now << 20n) ^ BigInt("0xdeadbeefcafebabe")) & U64_MASK;
        S_STATE[3] = ((now << 30n) ^ BigInt("0xabcdef0123456789")) & U64_MASK;

        if ((S_STATE[0] | S_STATE[1] | S_STATE[2] | S_STATE[3]) === 0n) {
            S_STATE[0] = BigInt("0x6a09e667f3bcc908");
            S_STATE[1] = BigInt("0xbb67ae8584caa73b");
            S_STATE[2] = BigInt("0x3c6ef372fe94f82b");
            S_STATE[3] = BigInt("0xa54ff53a5f1d36f1");
        }
        return;
    }

    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    const view = new DataView(buffer.buffer);

    let allZeroCheck = 0n;
    for (let i = 0; i < 4; i++) {
        S_STATE[i] = view.getBigUint64(i * 8, true); // Assuming little-endian for consistency, though PRNG state order matters more
        allZeroCheck |= S_STATE[i];
    }

    if (allZeroCheck === 0n) {
        console.warn("PRNGModule: crypto.getRandomValues returned all zeros. Using fixed fallback JUMP constants.");
        S_STATE[0] = BigInt("0x180ec6d33cfd0aba");
        S_STATE[1] = BigInt("0xd5a61266f0c9392c");
        S_STATE[2] = BigInt("0xa9582618e03fc9aa");
        S_STATE[3] = BigInt("0x39abdc4529b1661c");
    }
};

api.nextRandomU64 = function() {
    return _next_internal();
};

api.nextRandomFloat01 = function() {
    const u64_val = api.nextRandomU64(); // Internal call remains on 'api'
    const top53bits = u64_val >> 11n;
    return Number(top53bits) / Math.pow(2, 53);
};

api.nextRandomIntInRange = function(max_exclusive_bigint) {
    if (typeof max_exclusive_bigint !== 'bigint' || max_exclusive_bigint <= 0n) {
        throw new RangeError("max_exclusive_bigint must be a BigInt and positive.");
    }
    if (max_exclusive_bigint === 1n) {
        return 0n;
    }

    const remainder = U64_MASK % max_exclusive_bigint;
    const limit = U64_MASK - remainder;

    let rand_val;
    do {
        rand_val = api.nextRandomU64(); // Internal call remains on 'api'
    } while (rand_val >= limit);

    return rand_val % max_exclusive_bigint;
};

api.shuffleArray = function(array) {
    if (!Array.isArray(array)) {
        throw new TypeError("Input must be an array.");
    }
    for (let i = array.length - 1; i > 0; i--) {
        const j_bigint = api.nextRandomIntInRange(BigInt(i + 1)); // Internal call
        const j = Number(j_bigint);
        [array[i], array[j]] = [array[j], array[i]];
    }
};

// ***** NEW UTILITY *****
api.selectRandomItemFromArray = function(array) {
    if (!array || array.length === 0) {
        console.warn("PRNGModule.selectRandomItemFromArray: Called with empty or invalid array.");
        return null;
    }
    const randomIndexBigInt = api.nextRandomIntInRange(BigInt(array.length));
    return array[Number(randomIndexBigInt)];
};
// ***** END NEW UTILITY *****

// _setState_FOR_TESTING_ONLY is still a method on the 'api' object
api._setState_FOR_TESTING_ONLY = function(newState) {
    // Check for test environment (important for ES modules where 'process' might not be global by default)
    // For simplicity in a browser-focused module, this check might be relaxed or adapted.
    // Let's assume a global `process` might be polyfilled or available in test runners like Jest.
    if (import.meta.env.MODE !== 'test' && import.meta.env.MODE !== 'development') {
        console.error("PRNGModule._setState_FOR_TESTING_ONLY called outside test/dev environment. Operation aborted.");
        return;
    }

    if (!Array.isArray(newState) || newState.length !== 4 || !newState.every(n => typeof n === 'bigint')) {
        throw new Error("Invalid state for _setState_FOR_TESTING_ONLY: Must be an array of four BigInts.");
    }
    S_STATE = newState.map(n => n & U64_MASK);
};

api.U64_MASK_FOR_TESTING = U64_MASK;

// Initialize the PRNG with a crypto-random seed when the module is loaded.
api.seedPRNG();

// ES6 default export
export default api;