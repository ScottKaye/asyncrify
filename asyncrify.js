class Asyncrify {
	constructor(options) {
		// Cannot create on server: TODO child processes
		if (typeof window === "undefined") {
			if (!options.quiet) {
				console.info("Asyncrify is a no-op server-side.");
			}
			return;
		}

		// Promise resolves to call when transmissions are received
		this.resolves = {
			exec: null,
			close: null
		};

		// Get paths
		this.localPath = window.location.href;
		try { throw new Error(); }
		catch(e) {
			this.executingPath = e.stack.split("\n")
				.map(s => s.match(/(https?:\/\/(.+?))\/asyncrify.js/))
				.filter(Boolean)[0][1];
		}

		this.worker = new SharedWorker(this.executingPath + "/asyncrify.worker.js");
		this.worker.port.start();

		// Events
		this.worker.port.addEventListener("message", e => {
			// Take action
			if (e.data.action) {
				switch (e.data.action) {
					case "console":
						// Handle console proxy forwards
						console[e.data.property].apply(console, e.data.args);
						break;
					case "exec":
						// Resolve exec promise
						if (typeof this.resolves.exec === "function") {
							this.resolves.exec(e.data.result);
							this.resolves.exec = null;
						}
						break;
					case "close":
						// Resolve stopWhenDone promise
						if (typeof this.resolves.close === "function") {
							this.resolves.close(e.data);
							this.resolves.close = null;
						}
						break;
				}
			}
		});
	};

	require(file) {
		this.worker.port.postMessage({ action: "require", file: `${ this.localPath }/${ file }` });
	};

	exec(fn) {
		return new Promise(resolve => {
			this.resolves.exec = resolve;
			this.worker.port.postMessage({ action: "exec", fn: fn.toString() });
		});
	};

	stopWhenDone(delay) {
		return new Promise(resolve => {
			if (delay) {
				setTimeout(() => {
					this.resolves.close = resolve;
					this.worker.port.postMessage({ action: "close" });
				}, delay)
			}
			else {
				this.resolves.close = resolve;
				this.worker.port.postMessage({ action: "close" });
			}
		})
	};

	kill(delay) {
		if (delay) {
			setTimeout(() => {
				this.worker.port.close();
			}, delay);
		}
		else {
			// Don't push to the bottom of the call stack with setTimeout, even with a zero-y value
			this.worker.port.close();
		}
	};
};

if (typeof module !== "undefined" && module.exports) module.exports = Asyncrify;