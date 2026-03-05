import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if(!MONGODB_URI) {
    throw new Error("MongoDB URI Falhando");
}

declare global {
    var mongooseCashe:{
        conn: typeof mongoose | null
        promise: Promise<typeof mongoose> | null
    }
}

let cached = global.mongooseCashe || (global.mongooseCashe = { conn: null, promise: null });

export const connectToDatabase = async () => {
    if (cached.conn) return cached.conn;

    if (!cached.promise){
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
        } catch (e){
        cached.promise = null;
        console.error('MongoDb falhou na conexao. Tenha a certeza que ele esta a correr' + e);
        throw e;
    }

    console.info('Mongo DB conectado')
    return cached.conn;
}