const si = require("systeminformation");


/**
 *
 */
async function getCpu () {
	try {
		const data = await si.cpu();
		console.log("CPU Information:");

		return data;
	} catch (e) {
		console.log(e);
	}
}

/**
 *
 */
async function getCpuSpeed () {
	try {
		const data = await si.cpuCurrentSpeed();
		console.log("CPU speed:");
		return data;
	} catch (e) {
		console.log(e);
	}
}

/**
 *
 */
async function getSystem () {
	try {
		const data = await si.system();
		console.log("getSystem :");
		return data;
	} catch (e) {
		console.log(e);
	}
}

/**
 *
 */
async function getTotalSystemInformation () {
	try {
		let valueObject = {
			cpu: "cores",
			cpuCurrentSpeed: "avg",
			cpuTemperature: "*",
			currentLoad: "currentLoad",
			mem: "available,used, free,total",
			osInfo: "platform,  hostname",
			versions: "node npm",
			// system: 'model, manufacturer',
			fsSize: "*",
			system: "*",
			time: "uptime"
		};
		const data = await si.get(valueObject);
		return { result: "success", data: data };
	} catch (e) {
		console.log(e);
		return { result: "failure", error: e.message };
	}
}


// si.cpuCurrentSpeed().then(data => console.log(data));

// --------------------------------------------------

module.exports = {
	getCpu,
	getCpuSpeed,
	getSystem,
	getTotalSystemInformation
};
