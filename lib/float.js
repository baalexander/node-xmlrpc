var Float = module.exports = function (data) {
	if (data !== undefined) this.value = (typeof(data) == 'number') ? data : parseFloat(data);
};