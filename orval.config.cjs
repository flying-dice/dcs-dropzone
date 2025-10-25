module.exports = {
    petstore: {
        output: {
            target: 'src/client/_autogen/api.ts',
            client: 'react-query',
        },
        input: {
            target: 'http://localhost:3000/v3/api-docs',
        },
    },
};