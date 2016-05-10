module.exports = class Something {
	constructor() {
		this.value = 50;
	};

	doThing() {
		return this.value;
	};

	doAsyncThing() {
		return new Promise(resolve => {
			setTimeout(() => {
				resolve("Some async stuff!");
			}, 1000);
		});
	};
};