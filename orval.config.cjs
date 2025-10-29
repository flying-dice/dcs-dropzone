module.exports = {
	api: {
		output: {
			target: "src/app/client/_autogen/api.ts",
			client: "react-query",
		},
		input: {
			target: "http://localhost:3000/v3/api-docs",
		},
	},
	legacy_api: {
		output: {
			target: "src/app/client/_autogen/legacy_api.ts",
			client: "react-query",
			baseUrl: "https://dcs-dropzone.app/",
		},
		input: {
			target: "https://dcs-dropzone.app/v3/api-docs",
		},
	},
};
