Module.register("MMM-Interface", {

	start () {
		Log.log(`Starting module !!: ${this.name}`);

		this.modulesUpdateArray = undefined;

		this.sendSocketNotification("MMM-INTERFACE-MMVERSION", window.mmVersion);
	},

	notificationReceived (notification, payload, sender) {
		// Log.log(`${this.name} received a module notification: ${notification}`);
		// console.log("payload: ", payload, sender);
		if (notification === "DOM_OBJECTS_CREATED") {
			this.buildModuleArray();
		} else if (notification === "UPDATES") {
			this.modulesUpdateArray = payload;
		}
	},

	socketNotificationReceived (notification, payload) {
		// console.log("socketNotificationReceived: ", notification, payload);


		if (notification === "MMM-INTERFACE-REFRESH-MODULES") {
			this.buildModuleArray();
		} else if (notification === "HIDE" || notification === "SHOW") {
			// console.log("notification: ", notification, payload);
			let modules = [];
			if (payload.module !== "all") {
				let x = payload.module;
				modules = modules.concat(
					MM.getModules().filter((m) => {
						if (m && x.includes(m.identifier)) {
							if (typeof x === "object") x = x.filter((t) => t !== m.identifier);
							else x = "";
							return true;
						}
					}),
					MM.getModules().filter((m) => {
						if (m) {
							return x.includes(m.name);
						}
					})
				);
			} else {
				modules = MM.getModules();
			}
			if (!modules.length) {
				return;
			}

			let moduleStatus = [];
			modules.forEach((mod) => {
				if (notification === "HIDE" || (notification === "TOGGLE" && !mod.hidden)) {
					// console.log(mod);
					mod.hide(1000);
				} else if (notification === "SHOW" || (notification === "TOGGLE" && mod.hidden)) {
					mod.show(1000);
				}

				moduleStatus.push({ id: mod.identifier, status: mod.hidden });
			});
			this.sendSocketNotification("MMM-Interface-visibility-success", moduleStatus);
		} else if (notification === "MOVE-MODULE") {
			//also update modules on the server
			// console.log("Payload: ", payload);
			payload.payload.forEach((mod) => {
				if (mod.position !== "invisible") {
					if (mod.prevInvisible) {
						//unhide module before moving.

						MM.getModules().every((module) => {
							if (module.identifier === mod.moduleName) {
								module.position = mod.position;
								module.show(1000);
								// console.log("Prev invisible.. resume: " , module);
								return false;
							}
							return true;
						});
					} else {
						// console.log("SOCUMMENT: ", document.querySelectorAll(mod.region));

						let elementToMove = document.getElementById(mod.moduleName);
						let destinationElement = document.querySelectorAll(mod.region)[0].children[0];
						// console.log("child nodes destinationElement ", destinationElement, elementToMove);

						destinationElement.appendChild(elementToMove);

						destinationElement.style.display = "block";
					}
				} else if (mod.position === "invisible") {
					// console.log("Invisible hiding");
					MM.getModules().every((module) => {
						if (module.identifier === mod.moduleName) {
							module.hide(1000);
							return false;
						}
						return true;
					});
				}
				//update DOM
				MM.getModules().every((module) => {
					if (module.identifier === mod.moduleName) {
						if (mod.position === "invisible") {
							module.data.position = undefined;
						} else {
							module.data.position = mod.position;
						}
						return false;
					}

					return true;
				});
			});

			this.sendSocketNotification("MMMInterfacePositionAnswer"); //to node helper
		} else if (notification === "REFRESH-MM") {
			document.location.reload();
		} else if (notification === "REMOVE-MODULE") {
			// console.log("Remove module splice");
			MM.getModules().splice(payload.payload.index, 1);
			this.sendSocketNotification("MMM-INTERFACE-REMOVE-MODULE-CONFIRMED");
		} else if (notification === "SHOW_ALERT") {
			this.sendNotification(notification, payload);
		}
	},

	getStyles () {
		return ["MMM-Interface.css"];
	},

	buildModuleArray () {
		var self = this;

		// console.log("buildModuleArray");
		let modules = MM.getModules();
		let result = [];
		modules.enumerate(function (module) {
			// console.log("Module format: ", module);
			let modData = Object.assign({}, module.data);
			modData.hidden = module.hidden;
			modData.lockStrings = module.lockStrings;
			modData.config = module.config;

			//check if module needs an update:
			if (self.modulesUpdateArray) {
				// console.log("this.modulesUpdateArray : ", self.modulesUpdateArray);
				for (let modUpd of self.modulesUpdateArray) {
					if (modUpd.module === module.name) {
						modData.update = modUpd;
						break;
					}
				}
			}

			result.push(modData);
		});

		self.sendSocketNotification("MMMInterfaceModuleArray", result); //to node helper
	}
});
