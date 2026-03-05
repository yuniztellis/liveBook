'use server';

import { CreateBook, TextSegment } from '@/type';
import { connectToDatabase } from '@/database/mongoose';
import { generateSlug, serializeData } from '@/lib/utils';
import Book from '@/database/models/book.model';
import BookSegment from '@/database/models/bookSegment.model';

  export const getAllBooks = async () =>{

      try{
        await connectToDatabase();

        const books = await Book.find().sort({ createdAt: -1 }).lean();

        return{
          success: true,
          data: serializeData(books),
        }
      }catch (e) {
        console.error('Erro na conxão de Base de Dados',e);
        return{
          success: false,
          error: e
        }
      }
  }

export const checkBookExists = async (title: string) => {
  try {
    await connectToDatabase();
    const slug = generateSlug(title);

    const existingBook = await Book.findOne({ slug }).lean();

    if (existingBook) {
      return {
        exists: true,
        book: serializeData(existingBook),
      };
    }

    return {
      exists: false,
    };
  } catch (e) {
    console.error('Erro verificando o livro', e);
    return {
      exists: false,
      errorMessage: e instanceof Error ? e.message : 'Erro ao verificar livro',
    };
  }
};

export const createBook = async (data: CreateBook) => {
  try {
    await connectToDatabase();

    const slug = generateSlug(data.title);

    const existingBook = await Book.findOne({ slug }).lean();

    if (existingBook) {
      return {
        success: true,
        data: serializeData(existingBook),
        alreadyExists: true,
      };
    }

    const book = await Book.create({ ...data, slug, totalSegments: 0 });

    return {
      success: true,
      data: serializeData(book),
      alreadyExists: false,
    };
  } catch (e) {
    console.error('Erro criando o livro', e);

    return {
      success: false,
      errorMessage: e instanceof Error ? e.message : 'Erro ao criar livro',
    };
  }
};

export const saveBookSegments = async (bookId: string, clerkId: string, segments: TextSegment[]) => {
  try {
    await connectToDatabase();

    const segmentsToInsert = segments.map(({ text, segmentIndex, pageNumber, wordCount }) => ({
      clerkId,
      bookId,
      content: text,
      segmentIndex,
      pageNumber,
      wordCount,
    }));

    await BookSegment.insertMany(segmentsToInsert);
    await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length });

    return {
      success: true,
      data: { segmentsCreated: segments.length },
    };
  } catch (e) {
    console.error('Erro salvando os segmentos do livro', e);

    await BookSegment.deleteMany({ bookId });
    await Book.findByIdAndDelete(bookId);

    return {
      success: false,
      errorMessage: e instanceof Error ? e.message : 'Erro ao salvar segmentos',
    };
  }
};
