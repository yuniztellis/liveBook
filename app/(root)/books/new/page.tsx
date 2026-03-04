import React from 'react'
import UploadForm from '@/components/UploadForm'

const Page = () => {
  return (
    <main className="wrapper container">
      <div className="mx-auto max-w-180 space-y-10">
        <section className="flex flex-col gap-5">
          <h1 className="page-title-xl">Adicionar Livro</h1>
          <p className="subtitle">Carregue um ficheiro PDF para conversar com o seu conteudo.</p>
        </section>

        <UploadForm />
      </div>
    </main>
  )
}

export default Page
