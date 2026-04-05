module.exports = {
	webapp: {
		output: {
			target: "src/webapp/api.ts",
			client: "react-query",
			override: {
				mutator: {
					path: "./src/webapp/client.ts",
					name: "fetch",
				},
			},
		},
		input: {
			target: "../../apps/webapp/openapi.schema.json",
		},
	},
	daemon: {
		output: {
			target: "src/daemon/api.ts",
			client: "react-query",
			override: {
				mutator: {
					path: "./src/daemon/client.ts",
					name: "fetch",
				},
			},
		},
		input: {
			target: "../../apps/daemon/openapi.schema.json",
		},
	},
};
