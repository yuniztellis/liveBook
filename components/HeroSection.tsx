import React from 'react'

import Image from "next/image";
import Link from "next/link";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Plus } from "lucide-react";

const HeroSection = () => {

    const sample=
        [

        ]

    return (
        <section className="library-hero-card mt-6 w-full mb-10 md:mb:16">
            <div className="library-hero-content lg:items-center lg:text-left">
                <div className="library-hero-text lg:max-w-[360px] lg:items-start">
                    <h1 className="font-serif text-5xl font-semibold leading-[1.08] tracking-[-0.03em] text-black">
                        A tua biblioteca
                    </h1>
                    <p className="library-hero-description text-lg leading-8 text-[#3b4760]">
                        Converte os teus livros em conversas com Inteligencia Artificial.
                        <br />
                        Ouve, aprende e debate as com os teus livros favoritos.
                    </p>

                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="library-cta-primary mt-1 rounded-xl px-7 py-3.5 text-lg font-semibold">
                                <Plus className="mr-0.5 h-5 w-5" />
                                Adicionar novo livro
                            </button>
                        </SignInButton>
                    </SignedOut>

                    <SignedIn>
                        <Link href="/books/new" className="library-cta-primary mt-1 rounded-xl px-7 py-3.5 text-lg font-semibold">
                            <Plus className="mr-0.5 h-5 w-5" />
                            Adicionar novo livro
                        </Link>
                    </SignedIn>
                </div>

                <div className="library-hero-illustration-desktop max-w-[430px] shrink-0 lg:flex">
                    <Image
                        src="/assets/hero-illustration.png"
                        alt="Ilustração com livros antigos, globo e candeeiro"
                        width={503}
                        height={315}
                        className="h-auto w-full max-w-[430px]"
                        priority
                    />
                </div>

                <div className="library-hero-illustration w-full lg:hidden">
                    <Image
                        src="/assets/hero-illustration.png"
                        alt="Ilustração com livros antigos, globo e candeeiro"
                        width={503}
                        height={315}
                        className="h-auto w-full max-w-[360px]"
                        priority
                    />
                </div>

                <aside className="library-steps-card w-full max-w-[230px] space-y-6 rounded-2xl px-4 py-5 shadow-soft-sm">
                    <div className="library-step-item">
                        <span className="library-step-number border-[#2d3a56] bg-transparent">1</span>
                        <div>
                            <p className="library-step-title text-base">Carregar PDF</p>
                            <p className="library-step-description text-sm">Adiciona o teu ficheiro de livro</p>
                        </div>
                    </div>
                    <div className="library-step-item">
                        <span className="library-step-number border-[#2d3a56] bg-transparent">2</span>
                        <div>
                            <p className="library-step-title text-base">Processar livro</p>
                            <p className="library-step-description text-sm">Analisamos o conteúdo</p>
                        </div>
                    </div>
                    <div className="library-step-item">
                        <span className="library-step-number border-[#2d3a56] bg-transparent">3</span>
                        <div>
                            <p className="library-step-title text-base">Conversa por voz</p>
                            <p className="library-step-description text-sm">Conversa com a IA</p>
                        </div>
                    </div>
                </aside>
            </div>

        </section>
    )
}
export default HeroSection
