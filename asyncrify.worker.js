// Various environment polyfills
self.require = file => {
	self.importScripts(file);
};

self.module = {
	set exports(obj) {
		self[obj.name] = obj;
	}
};

const ports = [];

// Proxy console calls so developers don't need to open the worker devtools
// Since everything is serialized, logging functions still can't work properly
const workerConsole = console;

console = new Proxy(console, {
	get: function(target, property, receiver) {
		return new Proxy(target[property], {
			apply: function(target, thisArg, argumentsList) {
				workerConsole.info(
					`%cForwarded this console.%c${ property }%c to main thread:`,
					"background:#caecfc;padding:3px 0 3px 3px",
					"background:#caecfc;padding:3px 0;font-weight:700",
					"background:#caecfc;padding:3px 3px 3px 0"
				);
				workerConsole[property].apply(workerConsole, argumentsList);
				self.mainPort.postMessage({
					action: "console",
					property: property,
					args: argumentsList
				});
			}
		});
	}
});

self.addEventListener("connect", e=> {
	let port = e.ports[0];

	function safeClose() {
		port.postMessage({
			action: "close"
		});
		// These don't appear to do anything /shrug
		port.close();
		self.close();
		close();
	}

	port.addEventListener("message", e => {
		switch (e.data.action) {
			case "require":
				require(e.data.file);
				break;
			case "exec":
				if (self.closing) return safeClose();
				port.postMessage({
					action: "exec",
					result: eval(`(${ e.data.fn })()`)
				});
				if (self.closing) return safeClose();
				break;
			case "close":
				self.closing = true;
				safeClose();
				break;
		}
	});

	self.mainPort = port;
	port.start();
});