import { type Db, MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
	throw new Error(
		"Please define the MONGODB_URI envir#onment variable inside .env",
	);
}
const client: MongoClient = await MongoClient.connect(MONGODB_URI);

const database: Db = client.db("dcs-dropzone-registry");

export const mods = database.collection("mods");

/**
 * Ping the database to check if the connection is alive.
 * @returns {Promise<boolean>} True if the ping was successful, false otherwise.
 */
async function ping(): Promise<boolean> {
	const result = await database.command({ ping: 1 }, { timeoutMS: 3000 });
	return result.ok === 1;
}

export const db = {
	mods,
	ping,
};
