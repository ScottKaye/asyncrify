# Asyncrify
> Yet another way to spawn Shared Workers to do things.

## Example
Another, more complete example is available on [the repo](https://github.com/ScottKaye/asyncrify/tree/master/example).

```js
let as = new Asyncrify();

// Require a dependency into the shared worker
// This dependency will be present every time exec is run
as.require("eratosthenes-sieve.js");

// Execute a function, which returns a promise
as.exec(() => {
	let sieve = new Sieve();
	let primes = sieve.generate(1e6);  // Massively time-consuming algorithm goes here

	// console.log is proxied to the main thread, but will still also appear in any worker inspectors such as those found in chrome://inspect
	console.log(primes.slice(0, 10));

	return primes;
}).then(primes => {
	// Now that we have a huge list of prime numbers, we can do things.
	primes.forEach(prime => {
		alert(prime);
	});
});
```