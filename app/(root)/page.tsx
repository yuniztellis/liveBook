import Image from "next/image";
import Link from "next/link";
import HeroSection from "@/components/HeroSection";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Plus } from "lucide-react";
import {sampleBooks} from "@/lib/constants";
import BookCard from "@/components/BookCard";

export default function Page() {
  return (
    <main className="wrapper container">
      <HeroSection />
      <div className="library-books-grid">
        {sampleBooks.map((book) => (
            <BookCard key={book._id} title={book.title} author={book.author} coverURL={book.coverURL} slug={book.slug}  />
        ))}
      </div>
    </main>
  );
}
