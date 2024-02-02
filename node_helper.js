/* eslint-disable @stylistic/quotes */
// eslint-disable-next-line @stylistic/linebreak-style
const url = require("url");
const os = require("os");
const path = require("path");
const fs = require("fs");
const util = require("util");
const { spawn, exec } = require("child_process");
const xray = require("x-ray");
const tabletojson = require("tabletojson").Tabletojson;
const simpleGit = require("simple-git");
const NodeHelper = require("node_helper");
const express = require("express");
const { BrowserWindow } = require("electron");
const { underline } = require("colors");
const sysInfo = require("./system_info");

// const linter = new Linter();

module.exports = NodeHelper.create({
	start () {
		const self = this;
		console.log("MMM-Interface helper started...");
		this.mmVersion = undefined;
		this.waiting = [];

		this.needsRefresh = false;
		this.unsavedModuleList = undefined; // list of all modules including the unsaved one. It will be emptied when refreshed or reloaded.
		this.modulesList = {}; // list of modules for mm
		this.mmConfig = {}; // config
		this.loadConfigFromHd();

		this.expressApp.use(express.json());
		this.expressApp.use("/interface", express.static(path.join(__dirname, "/mmInterfaceApp"))); //alex !!!!!
		this.ipAddress = this.getIpAddresses()[0];

		this.readAngEnvFile(); // read angular environment file.

		this.configureEndpoints();

		this.thirdPartyJson = undefined;
		this.init3rdParty = true;
		this.loadThirdPartyList();

		this.installProgress = {};
		this.initInstallProgress();


		this.systemInformation = undefined;

	},
	getSystemInformation () {


		// this.systemInfoTimeout = setTimeout(() => {
		sysInfo.getTotalSystemInformation().then((data) => {
			this.systemInformation = { status: "active", sysInfo: data };
			// this.getSystemInformation();
		});
		//  } , 3000);
	},

	socketNotificationReceived (notification, payload) {
		// console.log("MMM-Interface socketNotificationReceived: ", notification);
		if (notification === "MMMInterfaceModuleArray") {
			this.modulesList = payload;
			console.log("MMMInterfaceModuleArray - Modules reload ");
			this.waiting.forEach((o) => {
				o.run();
			});
			this.waiting = [];

			if (this.init3rdParty && this.thirdPartyJson !== undefined) {
				this.updateThirdPartyList();
			}
		} else if (notification === "MMM-Interface-visibility-success") {
			// console.log("----> ", payload);
			this.waiting.forEach((o) => {
				o.run(payload);
			});
			this.waiting = [];
		} else if (notification === "MMMInterfacePositionAnswer" || notification === "MMM-INTERFACE-REMOVE-MODULE-CONFIRMED") {
			this.waiting.forEach((o) => {
				o.run();
			});
			this.waiting = [];
		} else if (notification === "MMM-INTERFACE-MMVERSION") {
			this.mmVersion = payload;
			// console.log("MMMMMMMMMMMm version, " , this.mmVersion);
		}
	},
	readAngEnvFile () {
		try {
			const data = fs.readFileSync(path.resolve(`${__dirname}/mmInterfaceApp/assets/env.json`), "utf8");
			// console.log(data);

			var envData = JSON.parse(data.toString());
			envData.host = this.ipAddress;
			// console.log("JSON.stringify(this.envData) : " , JSON.stringify(envData));

			fs.writeFileSync(path.resolve(`${__dirname}/mmInterfaceApp/assets/env.json`), JSON.stringify(envData));
		} catch (err) {
			console.error("AngEnvFile Error: ", err);
		}
	},
	getIpAddresses () {
		// module started, answer with current IP address
		var interfaces = os.networkInterfaces();
		var addresses = [];
		for (var k in interfaces) {
			for (var k2 in interfaces[k]) {
				var address = interfaces[k][k2];
				if (address.family === "IPv4" && !address.internal) {
					addresses.push(address.address);
				}
			}
		}
		return addresses;
	},
	configureEndpoints () {
		var self = this;

		this.expressApp.post("/handlePost", function (req, res) {
			var query = req.body;
			//console.log(req);
			self.handlePost(query, res);
		});

		this.expressApp.get("/configGet", function (req, res) {
			var query = url.parse(req.url, true).query;
			//console.log(req);
			self.answerConfigGet(query, res);
		});
		this.expressApp.get("/commandGet", function (req, res) {
			var query = url.parse(req.url, true).query;
			//console.log(req);
			self.executeCommand(query, res);
		});
	},
	handlePost (query, res) {
		// console.log("--> Query: ", query);

		if (query.data === "SAVE") {
			// console.log("SAVINGGGGGGGGGGGGGGG: ", query);
			try {
				this.saveConfigFileToDisk(query);

				this.sendResponse(res, undefined, {
					query: query.data,
					result: "success"
				});
			} catch (e) {
				console.log(e);
				this.sendResponse(res, undefined, {
					query: query.data,
					result: "failed",
					error: e
				});
			}
		} else if (query.data === "MOVE-POS") {
			// console.log("Move: ", query);
			// console.log("Result: " , query.position);
			this.callAfterUpdate(
				() => {
					this.sendResponse(res, undefined, {
						query: query.data,
						result: "success"
					});
				},
				3000,
				"MOVE-MODULE",
				query
			);
		} else if (query.data === "DELETE-MODULE") {
			// console.log("delete module, ", query);

			try {
				const modulePath = path.join(`${__dirname}/../../`, query.payload.modulePath);
				// console.log("Modulepath: ", modulePath);

				if (modulePath) {
					fs.accessSync(modulePath, fs.F_OK);
					// fs.rmSync(modulePath, { recursive: true });
					this.callAfterUpdate(
						() => {
							fs.rm(modulePath, { recursive: true }, (error) => {
								if (error) {
									console.log(error);
								} else {
									console.log("Recursive: Directories Deleted!");
								}
							});

							this.updateThirdPartyList(undefined, query.payload.moduleName);
							this.sendResponse(res, undefined, {
								query: query.data,
								result: "success"
							});
						},
						3000,
						"REMOVE-MODULE",
						query
					);
				}
			} catch (err) {
				console.log("Module delete error: ", err);
				this.sendResponse(res, undefined, {
					query: query.data,
					result: "failure",
					error: err.message
				});
			}

			// if (query.delModule)
		} else if (query.data === "INSTALL-MODULE") {
			// console.log("install app: ", query);
			var self = this;

			this.initInstallProgress();

			const url = query.moduleUrl;

			let cfgModule = {
				module: query.moduleName,
				position: query.moduleConfig.position,
				config: query.moduleConfig.config
			};

			this.installProgress.gitStatus = "Installing";

			const progress = ({ method, stage, progress }) => {
				this.installProgress.gitStage = stage;
				this.installProgress.gitProgress = progress;
				// console.log(`git.${method} ${stage} stage ${progress}% complete`);
			};

			simpleGit({ baseDir: path.resolve(`${__dirname}/..`), progress }).clone(url, path.basename(url), function (error, result) {
				try {
					if (error) {
						self.installProgress.gitStatus = "Error";
						self.installProgress.finished = true;
						console.error("INSTALL-MODULE - simpleGit error: ", error);
						self.sendResponse(res, undefined, {
							query: query.data,
							result: "failure",
							error: error.message
						});
					} else {
						self.installProgress.gitStatus = "Done";
						const workDir = path.resolve(`${__dirname}/../${path.basename(url)}`);
						const pkgJsonfile = path.resolve(`${workDir}/package.json`);

						//check if package.json exist. if exist , run the npm install
						if (fs.existsSync(workDir) && fs.existsSync(pkgJsonfile)) {
							self.installProgress.npmStatus = "Installing";

							var npmInstall = spawn("npm install", [], {
								shell: true,
								cwd: workDir
							});

							npmInstall.stdout.on("data", function (data) {
								// console.log("Installing data: ", data.toString());
								self.installProgress.npmMessage = self.installProgress.npmMessage.concat(`${data}<br/>`);
							});
							npmInstall.stderr.on("data", function (data) {
								// console.log("error data: ", data.toString());
								self.installProgress.npmMessage = self.installProgress.npmMessage.concat(`${data}<br/>`);
							});
							npmInstall.on("error", function (data) {
								// console.log("error from NPM install: ", data);
								self.installProgress.npmMessage = self.installProgress.npmMessage.concat(`${data}<br/>`);
								self.installProgress.npmStatus = "Error";
								self.installProgress.finished = true;
								self.sendResponse(res, undefined, {	query: query.data,	result: "failure",	error: data	});
							});
							npmInstall.on("close", function (code) {
								// console.log("code ", code.toString());
								self.installProgress.npmStatus = "Done";
								self.installProgress.finished = true;
								if (code === 0) {
									self.saveInstall(res, query, cfgModule);
								}

							});
						} else {
							//no package json so end here.
							self.installProgress.npmStatus = "Not run";
							self.installProgress.npmMessage = self.installProgress.npmMessage = "No package.json<br/>";
							self.installProgress.finished = true;

							self.saveInstall(res, query, cfgModule);
						}
					}
				} catch (e) {
					console.log("simpleGit error:  ", e);
					self.installProgress.gitStatus = "";
					self.installProgress.finished = true;
					self.sendResponse(res, undefined, {
						query: query.data,
						result: "failure",
						error: e.message
					});
				}
			});
		}
	},
	saveInstall (res, query, cfgModule) {
		var self = this;

		self.mmConfig.modules.push(cfgModule);
		if (self.mmConfig.modules) {
			let data = {
				file: "config.js",
				config: self.mmConfig
			};
			self.saveConfigFileToDisk(data);
			self.updateThirdPartyList(query.moduleName);
			self.sendResponse(res, undefined, {	query: query.data,	result: "success" });
		} else {
			self.sendResponse(res, undefined, { query: query.data, result: "failure" });
			console.log("error with modules: ", self.mmConfig.modules);
		}
	},

	answerConfigGet (query, res) {
		// console.log("answerConfigGet: ", query);

		if (query.data === "LOAD-CONFIG-FOLDER") {
			// list all the config or env files in the folder
			try {
				var configDir = path.resolve(`${__dirname}/../../config/`);

				fs.accessSync(configDir, fs.F_OK);

				let files = fs.readdirSync(configDir);
				let configFileList = [];
				files.forEach((file) => {
					if (file === "config.js" || file === "config.js.template" || path.extname(file) === ".env") {
						try {
							let stats = fs.statSync(`${configDir}/${file}`);

							let fileInfo = {
								name: file,
								dateModified: stats.mtimeMs
							};
							configFileList.push(fileInfo);
						} catch (e) {
							console.log(e);
							this.sendResponse(res, undefined, { query: query.data, result: "failed", error: "Error while fetching config folder" });
						}
					}
				});
				this.sendResponse(res, undefined, {
					query: query.data,
					result: "success",
					payload: configFileList
				});
			} catch (e) {
				console.log(e);
				this.sendResponse(res, undefined, {
					query: query.data,
					result: "failed",
					error: "Error while fetching config folder"
				});
			}
		} else if (query.data === "LOAD-CONFIG-BY-NAME") {
			//load the config to edit selected from the config folder
			var configFilename = path.resolve(`${__dirname}/../../config/${query.file}`);
			if (query.file === "config.js") {
				delete require.cache[configFilename];

				var cfg = require(configFilename);
				this.mmConfig = cfg;

				this.sendResponse(res, undefined, {
					query: query.data,
					result: "success",
					payload: this.mmConfig,
					file: query.file
				});
			} else {
				try {
					fs.accessSync(configFilename, fs.F_OK);
					const data = fs.readFileSync(configFilename, "utf8");
					this.sendResponse(res, undefined, {
						query: query.data,
						result: "success",
						payload: data,
						file: query.file
					});
				} catch (e) {
					console.log(e);
					this.sendResponse(res, undefined, {
						query: query.data,
						result: "failed",
						error: e
					});
				}
			}
		}
	},

	executeCommand (query, res) {
		// console.log("executeCommand: ", query);

		try {
			if (query.cmd === "SYSTEM-STATUS") {
				// this.systemInfoTimeout

				sysInfo.getTotalSystemInformation().then((data) => {
					// console.log(data);
					// this.systemInformation = { status: 'active', sysInfo: data};
					if (data.result === "success") {
						this.sendResponse(res, undefined, {	query: query.cmd, status: "success", system: data.data, mmVersion: this.mmVersion });
					} else {
						this.sendResponse(res, undefined, {	query: query.cmd, status: "failure", error: data.error });
					}
				},
				(reject) => {
					// console.log("Rejected: ", reject);
					this.sendResponse(res, undefined, {	query: query.cmd, status: "failure", raison: reject });
				});
			} else if (query.cmd === "INSTALL-STATUS") {
				// console.log("this.installProgress: ", this.installProgress);
				this.sendResponse(res, undefined, {
					query: query.cmd,
					status: this.installProgress
				});
			} else if (query.cmd === "LOAD-MODULE-LIST") {
				//load the list of modules that is loaded in the Memory
				if (this.unsavedModuleList !== undefined) {
					// console.log("this.unsavedModuleList ");
					this.sendResponse(res, undefined, {
						query: query.cmd,
						result: "success",
						payload: this.unsavedModuleList
					});
				} else {
					// console.log("this.modulesList- ");
					this.callAfterUpdate(
						() => {
							this.sendResponse(res, undefined, {
								query: query.cmd,
								result: "success",
								payload: this.modulesList
							});
						},
						3000,
						"MMM-INTERFACE-REFRESH-MODULES"
					);
				}
			} else if (query.cmd === "MODULE") {
				//fetch a single module for edit.
				let module = {};

				if (this.unsavedModuleList !== undefined) {
					// console.log("MODULE - this.unsavedModuleList: ", query.module);
					this.unsavedModuleList.forEach((mod) => {
						if (mod.identifier === query.module) {
							module = mod;
						}
					});
				} else {
					// console.log("MODULE - this.modulesList: ", query.module);
					this.modulesList.forEach((mod) => {
						if (mod.identifier === query.module) {
							module = mod;
						}
					});
				}
				this.sendResponse(res, undefined, {
					query: query.cmd,
					result: "success",
					payload: module
				});
			} else if (query.cmd === "SHOW" || query.cmd === "HIDE") {
				//show or hide component
				//load config file for update
				this.callAfterUpdate(
					(data) => {
						if (this.unsavedModuleList !== undefined && data !== undefined) {
							//loop through the data to update the list
							data.forEach((m) => {
								this.unsavedModuleList.every((uData) => {
									if (uData.identifier === m.id) {
										uData.hidden = m.status;
										return false;
									}
									return true;
								});
							});
						}
						this.sendResponse(res, undefined, {
							query: query.cmd,
							result: "success"
						});
					},
					3000,
					query.cmd,
					query
				);
			} else if (query.cmd === "TOGGLE-SCREEN") {
				// console.log("toggScreen");
				try {
					let electron = require("electron").BrowserWindow;
					// let electron = require("electron").BrowserWindow;
					if (!electron) {
						throw "Could not get Electron window instance.";
					}

					let win = electron.getAllWindows()[0];

					// // console.log("Win: " , win);
					// console.log("win.isMinimized() " , win.isMinimized());
					// console.log("win.isFullScreen() " , win.isFullScreen());
					// console.log("win.isMaximized() " , win.isMaximized());
					
					switch (query.cmd) {
						case "MINIMIZE":
							win.minimize();
							break;
						case "TOGGLE-SCREEN":
							// win.setFullScreen(!win.isFullScreen());
							if (win.isMinimized()) {
								// console.log("Maximise");
								// win.maximize();
								win.restore();
								// win.setFullScreen(flag)
							} else {
								win.minimize();
							}
							break;
						case "BROWSER-CONSOLE":
							if (win.webContents.isDevToolsOpened()) win.webContents.closeDevTools();
							else win.webContents.openDevTools();
							break;
						default:
					}
					this.sendResponse(res, undefined, {
						query: query.cmd,
						result: "success",
						isFullScreen: !win.isMinimized()
					});
				} catch (err) {
					this.sendResponse(res, err);
				}
			} else if (query.cmd === "REFRESH-MM") {
				var self = this;
				// this.sendSocketNotification(query.cmd);
				this.unsavedModuleList = undefined; //reset module list
				this.needsRefresh = false;
				this.callAfterUpdate(
					() => {
						setTimeout(() => {
							self.sendResponse(res, undefined, { query: query.cmd, result: "success" });
						}, 5000);
					},
					5000,
					query.cmd
				);
			} else if (query.cmd === "DISCARD-MODULE-SAVE-CHANGES") {
				// console.log("Discarding changes");
				this.sendResponse(res, undefined, { query: query.cmd, result: "success" });
				this.unsavedModuleList = undefined; //reset module list
			} else if (query.cmd === "UNREFRESHED-MODULE-CHANGES") {
				//verify if magic mirror has been refreshed
				// console.log("UNSAVED changes ", this.unsavedModuleList !== undefined ? this.unsavedModuleList.length : "null", this.needsRefresh);

				if (this.unsavedModuleList === undefined && !this.needsRefresh) {
					this.sendResponse(res, undefined, { query: query.cmd, result: "success", mmNeedsRefresh: false });
				} else {
					this.sendResponse(res, undefined, {
						query: query.cmd,
						result: "success",
						mmNeedsRefresh: true,
						unsavedModule: this.unsavedModuleList !== undefined ? true : false,
						configRefresh: this.needsRefresh
					});
				}
			} else if (query.cmd === "SHUTDOWN" || query.cmd === "REBOOT") {
				if (query.cmd === "SHUTDOWN") {
					exec("sudo shutdown -h now", "{ timeout: 15000 }", (error, stdout, stderr, res) => {
						this.checkForExecError(error, stdout, stderr, res);
					});
				}
				if (query.cmd === "REBOOT") {
					exec("sudo reboot", "{ timeout: 15000 }", (error, stdout, stderr, res) => {
						this.checkForExecError(error, stdout, stderr, res);
					});
				}
				return true;
			} else if (query.cmd === "SHOW_ALERT") {
				this.sendSocketNotification(query.cmd, {
					type: query.type,
					title: query.title,
					message: query.message,
					timer: query.timer * 1000
				});

				this.sendResponse(res, undefined, { query: query.cmd, result: "success" });
			} else if (query.cmd === "RESTART" || query.cmd === "STOP") {
				this.controlPm2(res, query);
			} else if (query.cmd === "MONITORON" || query.cmd === "MONITOROFF" || query.cmd === "MONITORSTATUS") {
				this.monitorControl(query.cmd, { timeout: 15000 }, res);
			} else if (query.cmd === "THRID-PARTY") {
				// console.log("third");
				if (this.init3rdParty && this.thirdPartyJson !== undefined) {
					this.updateThirdPartyList();
				}

				this.sendResponse(res, undefined, { query: query.cmd, result: "success", payload: this.thirdPartyJson });
			} else if (query.cmd === "UPDATE-MODULE") {
				// console.log("Update module: ", query);
				const self = this;
				//need path for module

				if (query.moduleName) {
					let modules = undefined;

					if (this.unsavedModuleList !== undefined) {
						modules = this.unsavedModuleList;
					} else {
						modules = this.modulesList;
					}
					// console.log("modules " , modules);
					let pathModuleToUpdate = undefined;

					let toUpdMod = modules.find((m) => m.name === query.moduleName);

					if (toUpdMod) {
						pathModuleToUpdate = path.join(`${__dirname}/../../`, toUpdMod.path);
					}

					if (pathModuleToUpdate) {
						const progress = ({ method, stage, progress }) => {
							// this.installProgress.gitStage = stage;
							// this.installProgress.gitProgress = progress;
							// console.log(`git.${method} ${stage} stage ${progress}% complete`);
						};

						var git = simpleGit({ baseDir: pathModuleToUpdate, progress });
						git.reset("hard").then(() => {
							git.pull((error, result) => {
								if (error) {
									Log.error(error);
									self.sendResponse(res, undefined, { query: query.cmd, result: "failure", error: error });
									// self.sendResponse(res, error);
									return;
								}
								if (result.summary.changes) {
									exec("npm install", { cwd: pathModuleToUpdate, timeout: 120000 }, (error, stdout, stderr) => {
										try {
											if (error) {
												Log.error(error);
												self.sendResponse(res, undefined, { query: query.cmd, result: "failure", error: error, stdout: stdout, stderr: stderr });
												// self.sendResponse(res, error, { stdout: stdout, stderr: stderr });
											} else {
												// success part, remove update from modules
												toUpdMod.update = undefined;

												fs.readdir(pathModuleToUpdate, function (err, files) {
													try {
														if (files.includes("CHANGELOG.md")) {
															var chlog = fs.readFileSync(`${pathModuleToUpdate}/CHANGELOG.md`, "utf-8");
															self.sendResponse(res, undefined, { query: query.cmd, result: "success", data: `${query.moduleName} updated.`, chlog: chlog });
															// self.sendResponse(res, undefined, { code: "restart", info: query.moduleName + " updated.", chlog: chlog });
														} else {
															self.sendResponse(res, undefined, { query: query.cmd, result: "success", data: `${query.moduleName} updated.` });
															// self.sendResponse(res, undefined, { code: "restart", info: query.moduleName + " updated." });
														}
													} catch (ef) {
														console.log("File system readdir error : ", ef);
														self.sendResponse(res, undefined, { query: query.cmd, result: "failure", error: ef.message });
													}
												});
												this.needsRefresh = true;
											}
										} catch (e) {
											console.log("npm install Error: ", e);
											self.sendResponse(res, undefined, { query: query.cmd, result: "failure", error: e.message });
										}
									});
								} else {
									self.sendResponse(res, undefined, { query: query.cmd, result: "success", data: `${query.moduleName} already up to date.` });
									// self.sendResponse(res, undefined, { code: "up-to-date", info: query.moduleName + " already up to date." });
								}
							});
						});
					}
				}
			}

			return true;
		} catch (err) {
			console.log("catch: ", err);
			this.sendResponse(res, undefined, { query: query.cmd, result: "error", error: err });
		}
	},
	// const win = new BrowserWindow()
	// win.webContents.openDevTools()
	sendResponse (res, error, data) {
		let response = {
			success: true
		};
		let status = 200;
		let result = true;
		if (error) {
			console.log(error);
			response = {
				success: false,
				status: "error",
				reason: "unknown",
				info: error
			};
			status = 400;
			result = false;
		}
		if (data) {
			response = Object.assign({}, response, data);
		}

		// setTimeout(() => { res.statud"s(status).json(response); }, 2000); //-----------------------------------------------------------------------!!!!!!!!!!!!!!!
		res.status(status).json(response);
		return result;
	},

	loadConfigFromHd () {
		//taken from the main loading logic in app.js

		// function copied from MichMich (MIT)
		// var defaults = require(`${__dirname}/../../js/defaults.js`);
		var configFilename = path.resolve(`${__dirname}/../../config/config.js`);
		if (typeof global.configuration_file !== "undefined") {
			configFilename = global.configuration_file;
		}
		// console.log("configFilename: ", configFilename);
		try {
			fs.accessSync(configFilename, fs.F_OK);

			var c = require(configFilename);
			// var config = Object.assign({}, defaults, c);
			// console.log("config", c);
			this.mmConfig = c;
		} catch (e) {
			if (e.code === "ENOENT") {
				console.error("MMM-Remote-Control WARNING! Could not find config file. Please create one. Starting with default configuration.");
				// this.mmConfig = defaults;
			} else if (e instanceof ReferenceError || e instanceof SyntaxError) {
				console.error("MMM-Remote-Control WARNING! Could not validate config file. Please correct syntax errors. Starting with default configuration.");
				// this.mmConfig = defaults;
			} else {
				console.error(`MMM-Remote-Control WARNING! Could not load config file. Starting with default configuration. Error found: ${e}`);
				// this.mmConfig = defaults;
			}
		}
	},
	callAfterUpdate (callback, timeout, command, payload) {
		if (timeout === undefined) {
			timeout = 3000;
		}

		var waitObject = {
			finished: false,
			run (data) {
				if (this.finished) {
					return;
				}
				this.finished = true;
				this.callback(data);
			},
			callback: callback
		};

		this.waiting.push(waitObject);
		if (command) {
			// console.log(command);
			// console.log(payload);
			this.sendSocketNotification(command, payload);
		}

		setTimeout(function () {
			waitObject.run();
		}, timeout);
	},

	controlPm2 (res, query) {
		try {
			require("pm2");
		} catch (err) {
			this.sendResponse(res, undefined, { query: query.cmd, result: "error", error: "PM2 not installed or unlinked" });
			return;
		}
		var pm2 = require("pm2");
		let processName = query.processName || "mm";

		pm2.connect((err) => {
			if (err) {
				this.sendResponse(res, undefined, { query: query.cmd, result: "error", error: err });
				return;
			}

			var actionName = query.cmd.toLowerCase();
			Log.log(`PM2 process: ${actionName} ${processName}`);

			switch (actionName) {
				case "restart":
					pm2.restart(processName, (err, apps) => {
						this.sendResponse(res, undefined, { query: query.cmd, result: "success", action: actionName, processName: processName });
						if (err) {
							this.sendResponse(res, undefined, { query: query.cmd, result: "error", error: err });
						}
					});
					break;
				case "stop":
					pm2.stop(processName, (err, apps) => {
						this.sendResponse(res, undefined, { query: query.cmd, result: "success", action: actionName, processName: processName });
						pm2.disconnect();
						if (err) {
							this.sendResponse(res, undefined, { query: query.cmd, result: "error", error: err });
						}
					});
					break;
			}
		});
	},
	monitorControl (action, opts, res) {
		let status = "unknown";
		let offArr = ["false", "TV is off", "standby", "display_power=0"];
		let monitorOnCommand = "vcgencmd display_power 1";
		let monitorOffCommand = "vcgencmd display_power 0";
		let monitorStatusCommand = "vcgencmd display_power -1";

		switch (action) {
			case "MONITORSTATUS":
				exec(monitorStatusCommand, opts, (error, stdout, stderr) => {
					status = offArr.indexOf(stdout.trim()) !== -1 ? "off" : "on";
					this.checkForExecError(error, stdout, stderr, res, { monitor: status });
				});

				break;
			case "MONITORTOGGLE":
				exec(monitorStatusCommand, opts, (error, stdout, stderr) => {
					status = offArr.indexOf(stdout.trim()) !== -1 ? "off" : "on";
					if (status === "on") this.monitorControl("MONITOROFF", opts, res);
					else this.monitorControl("MONITORON", opts, res);
				});
				break;
			case "MONITORON":
				exec(monitorOnCommand, opts, (error, stdout, stderr) => {
					this.checkForExecError(error, stdout, stderr, res, { monitor: "on" });
				});
				// this.sendSocketNotification("USER_PRESENCE", true);
				break;
			case "MONITOROFF":
				exec(monitorOffCommand, opts, (error, stdout, stderr) => {
					this.checkForExecError(error, stdout, stderr, res, { monitor: "off" });
				});
				// this.sendSocketNotification("USER_PRESENCE", false);
				break;
		}
	},
	checkForExecError (error, stdout, stderr, res, monitorStatus) {
		// console.log("error in check for exec: " , error);
		if (error) {
			// console.log("g: ", error);
			this.sendResponse(res, undefined, { result: "error", error: error.message });
		} else {
			this.sendResponse(res, undefined, { result: "success", data: monitorStatus });
		}
	},
	loadThirdPartyList () {
		try {
			const x = xray();
			x("https://github.com/MichMich/MagicMirror/wiki/3rd-Party-Modules", ["table@html"])((conversionError, tableHtmlList) => {
				if (conversionError) {
					console.log("loadThirdPartyList - conversionError: ", conversionError);
				} else {
					console.log("MMM-Interface :: Third party Library loaded");
					this.thirdPartyJson = tableHtmlList.map(function (table) {
						return tabletojson.convert(`<table>${table}</table>`, { stripHtmlFromCells: false })[0];
					});
				}
			});
		} catch (error) {
			console.log("loadThirdPartyList Error:  ", error);
		}
	},
	updateThirdPartyList (newModuleName, removeModuleName) {
		console.log("updateThirdPartyList: ", newModuleName);
		if (this.thirdPartyJson !== undefined) {
			this.init3rdParty = false;
			for (let table of this.thirdPartyJson) {
				let breakLoop = false;
				for (let mod of table) {

					let tblModuleName = String(mod.Title).replace(/<[^>]*>/g, "");
					// to add or remove a module  installed flag.
					if (newModuleName || removeModuleName) {
						// console.log("new module ", tblModuleName, newModuleName );
						if (tblModuleName === newModuleName ) { 
							// console.log("new module true");
							mod.installed = true;
							breakLoop = true;
							break;
						} else if (tblModuleName === removeModuleName) {
							// console.log("Remove module true");
							mod.installed = false;
							breakLoop = true;
							break;
						}


					} else {
						mod.installed = false;
						this.modulesList.forEach((instMod) => {
							if (tblModuleName === instMod.name) {
								mod.installed = true;
								// console.log("mod.installed ", tblModuleName);
							}
						});
					}


				}
				if (breakLoop) {
					break;
				}
			}


		} else {
			console.log("MMM-Interface :: Third Party not loaded yet.");
		}
		//check the one that are already installed
	},
	saveConfigFileToDisk (query) {

		var configFile = path.resolve(`${__dirname}/../../config/${query.file}`);

		if (query.file === "config.js") {
			var d = new Date();
			var dtTm = d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate()  + "-"  +
			d.getHours()  + d.getMinutes()+  d.getSeconds();

			var backupFile = path.resolve(`${__dirname}/../../config/config.js${dtTm}`);

			//backup config file 1st
			fs.copyFileSync(configFile, backupFile);

			const header = "/*************** AUTO GENERATED BY MMM Interface ***************/\n\nlet config = \n";
			let jsonBody = util.inspect(query.config, {
				showHidden: false,
				depth: null,
				maxArrayLength: null,
				compact: false
			});
			const footer = "\n\n/*************** DO NOT EDIT THE LINE BELOW ***************/\nif (typeof module !== 'undefined') {module.exports = config;}\n";
			const newConfig = query.config;
			fs.writeFileSync(configFile, header + jsonBody + footer);
			this.mmConfig = newConfig;

			if (query.module) {
				if (this.unsavedModuleList === undefined) {
					this.unsavedModuleList = JSON.parse(JSON.stringify(this.modulesList));
				}

				for (let i = 0; i < this.unsavedModuleList.length; i++) {
					let mod = this.unsavedModuleList[i];
					if (mod.identifier === query.module.identifier) {
						let unsavedMod = query.module;
						unsavedMod.unRefreshed = true;
						this.unsavedModuleList[i] = unsavedMod;
						break;
					}
				}
			}
			this.needsRefresh = true; // mm needs to be refresh flag.
		} else {
			fs.writeFileSync(configFile, query.config);
		}
	},
	initInstallProgress () {
		// console.log("Init installProgress");
		this.installProgress = {
			gitStatus: "",
			gitStage: "",
			gitProgress: "",
			npmStatus: "",
			npmMessage: "",
			finished: false
		};
	}
});
