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
			target: "http://localhost:3000/v3/api-docs",
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
			target: "http://localhost:3001/v3/api-docs",
		},
	},
};
