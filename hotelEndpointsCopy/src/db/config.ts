/**
 * The function establishes a connection to a MongoDB database using Mongoose in a TypeScript
 * environment.
 */
import mongoose from "mongoose";

export default async function connection() {
    try {
        await mongoose.connect("mongodb://localhost:27017/next-auth")
    } catch (err) {
        console.error(err, 'within');
    }
};
