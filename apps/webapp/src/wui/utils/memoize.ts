/**
 * A type representing a value that can either be a promise or a direct value.
 */
type MaybePromise<T> = T | Promise<T>;

/**
 * Options for configuring the Memoize class.
 * @template A - The type of the arguments for the memoized function.
 * @property {(...args: A) => string} keyResolver - Function to generate a cache key from arguments.
 * @property {number} [ttlMs] - Time-to-live for cache entries in milliseconds (default: Infinity).
 * @property {boolean} [dedupeInFlight] - Whether to deduplicate in-flight calls (default: true).
 * @property {boolean} [cacheRejections] - Whether to cache rejected promises (default: false).
 * @property {() => number} [now] - Function to get the current time (default: Date.now).
 */
export interface MemoizeOptions<A extends any[]> {
	keyResolver: (...args: A) => string;
	ttlMs?: number;
	dedupeInFlight?: boolean;
	cacheRejections?: boolean;
	now?: () => number;
}

/**
 * Represents a cache entry for the Memoize class.
 * @template T - The type of the cached value.
 * @property {MaybePromise<T>} value - The cached value, which can be a promise or a direct value.
 * @property {number} expiresAt - The expiration time of the cache entry.
 * @property {boolean} inFlight - Whether the value is currently being resolved.
 */
type CacheEntry<T> = {
	value: MaybePromise<T>;
	expiresAt: number;
	inFlight: boolean;
};

/**
 * Checks if a value is promise-like (i.e., has a `then` method).
 * @param {any} v - The value to check.
 * @returns {boolean} True if the value is promise-like, false otherwise.
 */
function isPromiseLike(v: any): v is PromiseLike<any> {
	return v != null && typeof v.then === "function";
}

/**
 * A class for memoizing function calls with configurable caching behavior.
 * @template F - The type of the function to be memoized.
 */
export class Memoize<F extends (...args: any[]) => any> {
	private cache = new Map<string, CacheEntry<Awaited<ReturnType<F>>>>();

	/**
	 * Creates an instance of Memoize.
	 * @param {F} fnImpl - The function to be memoized.
	 * @param {MemoizeOptions<Parameters<F>>} options - Configuration options for memoization.
	 */
	constructor(
		private readonly fnImpl: F,
		private readonly options: MemoizeOptions<Parameters<F>>,
	) {}

	/**
	 * Gets the current time, using the `now` option if provided.
	 * @returns {number} The current time in milliseconds.
	 */
	private now(): number {
		return this.options.now?.() ?? Date.now();
	}

	/**
	 * Gets the time-to-live for cache entries.
	 * @returns {number} The TTL in milliseconds.
	 */
	private ttl(): number {
		return this.options.ttlMs ?? Infinity;
	}

	/**
	 * Retrieves a fresh cache entry if it exists and is not expired.
	 * @param {string} key - The cache key.
	 * @param {number} t - The current time.
	 * @returns {CacheEntry<Awaited<ReturnType<F>>> | undefined} The cache entry, or undefined if not found or expired.
	 */
	private getFresh(key: string, t: number): CacheEntry<Awaited<ReturnType<F>>> | undefined {
		const entry = this.cache.get(key);
		if (!entry) return undefined;
		if (entry.expiresAt <= t) {
			this.cache.delete(key);
			return undefined;
		}
		return entry;
	}

	/**
	 * Calls the memoized function, using the cache if possible.
	 * @param {...Parameters<F>} args - The arguments to pass to the function.
	 * @returns {ReturnType<F>} The result of the function call.
	 */
	call(...args: Parameters<F>): ReturnType<F> {
		const { keyResolver, dedupeInFlight = true, cacheRejections = false } = this.options;

		const ttl = this.ttl();
		if (ttl <= 0) return this.fnImpl(...args);

		const t = this.now();
		const key = keyResolver(...args);

		const cached = this.getFresh(key, t);
		if (cached) {
			if (cached.inFlight && dedupeInFlight) return cached.value as ReturnType<F>;
			return cached.value as ReturnType<F>;
		}

		const expiresAt = ttl === Infinity ? Infinity : t + ttl;

		let result: ReturnType<F>;
		try {
			result = this.fnImpl(...args);
		} catch (err) {
			this.cache.delete(key);
			throw err;
		}

		const entry: CacheEntry<Awaited<ReturnType<F>>> = {
			value: result as any,
			expiresAt,
			inFlight: isPromiseLike(result),
		};

		this.cache.set(key, entry);

		if (entry.inFlight) {
			const shared = Promise.resolve(result as any)
				.then((value) => {
					const latest = this.cache.get(key);
					if (latest) {
						latest.value = value;
						latest.inFlight = false;
					}
					return value;
				})
				.catch((err) => {
					const latest = this.cache.get(key);
					if (latest) latest.inFlight = false;
					if (!cacheRejections) this.cache.delete(key);
					throw err;
				});

			entry.value = (dedupeInFlight ? shared : result) as any;
			this.cache.set(key, entry);
			return entry.value as ReturnType<F>;
		}

		return result;
	}

	/**
	 * Clears all cache entries.
	 */
	clear() {
		this.cache.clear();
	}

	/**
	 * Deletes a specific cache entry based on the function arguments.
	 * @param {...Parameters<F>} args - The arguments used to generate the cache key.
	 * @returns {boolean} True if the entry was deleted, false otherwise.
	 */
	delete(...args: Parameters<F>): boolean {
		const key = this.options.keyResolver(...args);
		return this.cache.delete(key);
	}

	/**
	 * Checks if a cache entry exists and is fresh for the given arguments.
	 * @param {...Parameters<F>} args - The arguments used to generate the cache key.
	 * @returns {boolean} True if a fresh cache entry exists, false otherwise.
	 */
	has(...args: Parameters<F>): boolean {
		const key = this.options.keyResolver(...args);
		return !!this.getFresh(key, this.now());
	}

	/**
	 * Retrieves the cached value for the given arguments without updating the cache.
	 * @param {...Parameters<F>} args - The arguments used to generate the cache key.
	 * @returns {ReturnType<F> | undefined} The cached value, or undefined if not found.
	 */
	peek(...args: Parameters<F>): ReturnType<F> | undefined {
		const key = this.options.keyResolver(...args);
		return this.getFresh(key, this.now())?.value as ReturnType<F> | undefined;
	}

	/**
	 * Gets the number of fresh cache entries.
	 * @returns {number} The number of fresh cache entries.
	 */
	size(): number {
		const t = this.now();
		for (const [k, v] of this.cache) {
			if (v.expiresAt <= t) this.cache.delete(k);
		}
		return this.cache.size;
	}

	/**
	 * Creates a new Memoize instance for the given function and options.
	 * @template F - The type of the function to be memoized.
	 * @param {F} fn - The function to be memoized.
	 * @param {MemoizeOptions<Parameters<F>>} options - Configuration options for memoization.
	 * @returns {Memoize<F>} A new Memoize instance.
	 */
	static fn<F extends (...args: any[]) => any>(fn: F, options: MemoizeOptions<Parameters<F>>): Memoize<F> {
		return new Memoize(fn, options);
	}
}
