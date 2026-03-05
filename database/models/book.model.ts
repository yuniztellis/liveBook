import {model, Schema, models} from 'mongoose';
import {IBook} from "@/type";

const bookSchema = new Schema<IBook>({

    clerkId: { type: String, required: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true,trim: true },
    persona: { type: String, required: true },
    fileURL: { type: String, required: true },
    fileBlobKey: { type: String, required: true },
    coverURL: { type: String },
    coverBlobKey: { type: String, required: true },
    fileSize: { type: Number, required: true },
    totalSegments: { type: Number, default: 0},
    }, {timestamps: true})

const Book = models.Book || model<IBook>('Book', bookSchema);

export default Book;