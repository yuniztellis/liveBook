'use client'

import React from 'react'
import { ImageUp, Upload, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'


import LoadingOverlay from '@/components/LoadingOverlay'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {useAuth} from "@clerk/nextjs";
import { toast } from "sonner";
import {checkBookExists, createBook, saveBookSegments} from "@/lib/actions/book.actions";
import {useRouter} from "next/navigation";
import {parsePDFFile} from "@/lib/utils";
import {upload} from "@vercel/blob/client";

const MAX_PDF_BYTES = 50 * 1024 * 1024


const voiceGroups = {
  male: [
    { key: 'David', name: 'David', description: 'Masculina jovem, sotaque britanico-essex, casual e conversacional' },
    { key: 'Daniel', name: 'Daniel', description: 'Masculina de meia-idade, britanica, autoritaria mas calorosa' },
    { key: 'Cristovão', name: 'Cristovão', description: 'Masculina, casual e descontraida' },
  ],
  female: [
    { key: 'Joana', name: 'Joana', description: 'Feminina jovem, americana, calma e clara' },
    { key: 'Maria', name: 'Maria', description: 'Feminina jovem, americana, suave e acessivel' },
  ],
} as const

const allVoiceKeys = [...voiceGroups.male, ...voiceGroups.female].map((voice) => voice.key)

const formSchema = z.object({

  title: z.string().trim().min(2, 'O titulo e obrigatorio.'),
  author: z.string().trim().min(2, 'O nome do autor e obrigatorio.'),
  voice: z.enum(allVoiceKeys as [string, ...string[]], { message: 'Escolha uma voz para o assistente.' }),
  pdfFile: z .instanceof(File, { message: 'O ficheiro PDF e obrigatorio.' })
        .refine((file) => file.type === 'application/pdf', 'O ficheiro tem de estar em formato PDF.')
        .refine((file) => file.size <= MAX_PDF_BYTES, 'O PDF nao pode ultrapassar 50MB.'),
    coverImage: z .instanceof(File)
        .refine((file) => file.type.startsWith('image/'), 'A capa tem de ser um ficheiro de imagem.')
        .optional(),
})

type FormValues = z.infer<typeof formSchema>

const UploadForm = () => {
  const pdfInputRef = React.useRef<HTMLInputElement | null>(null)
  const coverInputRef = React.useRef<HTMLInputElement | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { userId } = useAuth();
  const router = useRouter();

  const form = useForm<FormValues>({
    defaultValues: {
      title: '',
      author: '',
      voice: '',
      pdfFile: undefined,
      coverImage: undefined,
    },
    resolver: async (values) => {
      const parsed = formSchema.safeParse(values)

      if (parsed.success) {
        return { values: parsed.data, errors: {} }
      }

      const fieldErrors = parsed.error.flatten().fieldErrors
      return {
        values: {},
        errors: Object.fromEntries(
          Object.entries(fieldErrors)
            .filter(([, messages]) => messages?.[0])
            .map(([field, messages]) => [
              field,
              {
                type: 'manual',
                message: messages?.[0] ?? 'Campo invalido.',
              },
            ])
        ),
      }
    },
  })

  const selectedPdf = form.watch('pdfFile')

  const onSubmit = async (data: FormValues) => {

      if(!userId){
        return toast.error('Por favor faça login pra poder fazer o upload do livro')
      }

      setIsSubmitting(true)

      //Track User

      try {
          const existsCheck = await checkBookExists(data.title)
        if(existsCheck.exists && existsCheck.book){
            toast.info('Um livro com esse titulo ja existe')
            form.reset()
            router.push(`/books/${existsCheck.book.slug}`)
            return;
        }

        const fileTitle = data.title.replace(/\s+/g, '-').toLowerCase()
        const pdfFile = data.pdfFile;

        const parsedPDF = await parsePDFFile(pdfFile);

        if(parsedPDF.content.length == 0){
            toast.error('Falha ao analisar o pdf. Por favor escolha outro Pdf')
            return
        }

        const uploadedPdfBlob = await upload(fileTitle, pdfFile, {
            access: 'public',
            handleUploadUrl: '/api/upload',
            contentType: 'application/pdf',
        })

          let coverUrl: string;
          let coverBlobKey: string;

          if(data.coverImage){
              const coverFile = data.coverImage;
              const uploadedCoverBlob = await upload(fileTitle, coverFile, {
                  access: 'public',
                  handleUploadUrl: '/api/upload',
                  contentType: coverFile.type,
              });
              coverUrl = uploadedCoverBlob.url
              coverBlobKey = uploadedCoverBlob.pathname
          } else {
              const response = await fetch(parsedPDF.cover)
              const blob = await response.blob()

              const uploadedCoverBlob = await upload(`${fileTitle}_cover.png`, blob, {
                  access: 'public',
                  handleUploadUrl: '/api/upload',
                  contentType: blob.type || 'image/png',
              });
              coverUrl = uploadedCoverBlob.url;
              coverBlobKey = uploadedCoverBlob.pathname;
          }

          const book = await createBook({
              clerkId: userId,
              title: data.title,
              author: data.author,
              persona: data.voice,
              fileURL: uploadedPdfBlob.url,
              fileBlobKey: uploadedPdfBlob.pathname,
              coverURL: coverUrl,
              coverBlobKey,
              fileSize: pdfFile.size,
          })

          if(!book?.success) throw new Error('Falha ao criar o livro')

          if(book.alreadyExists){
              toast.info('Um livro com esse titulo ja existe')
              form.reset()
              router.push(`/books/${book.data.slug}`)
              return;
          }

          const segments = await saveBookSegments(book.data._id, userId, parsedPDF.content);

          if(!segments.success){
              toast.error('Falha ao salvar o segmento')
              throw new Error('Falha ao salvar o segmento')
          }
          form.reset()
          router.push('/')
      }catch (e) {
        console.error(e)

        toast.error('Falha ao fazer o upload do livro. Tente novamente.')
      }finally {
          setIsSubmitting(false)
      }
  }

  return (
    <div className="new-book-wrapper">
      {isSubmitting ? <LoadingOverlay title="A iniciar a sintese..." /> : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="pdfFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Ficheiro PDF</FormLabel>
                <FormControl>
                  <>
                    <div
                      className={`upload-dropzone border-2 border-dashed border-[#d8c6ad] ${field.value ? 'upload-dropzone-uploaded' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => pdfInputRef.current?.click()}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          pdfInputRef.current?.click()
                        }
                      }}
                    >
                      {field.value ? (
                        <div className="flex items-center gap-2 px-4">
                          <p className="upload-dropzone-text truncate">{field.value.name}</p>
                          <button
                            type="button"
                            className="upload-dropzone-remove"
                            aria-label="Remover ficheiro PDF"
                            onClick={(event) => {
                              event.stopPropagation()
                              field.onChange(undefined)
                              if (pdfInputRef.current) {
                                pdfInputRef.current.value = ''
                              }
                            }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="upload-dropzone-icon" />
                          <p className="upload-dropzone-text">Clique para carregar o PDF</p>
                          <p className="upload-dropzone-hint">Ficheiro PDF (max 50MB)</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        field.onChange(file)
                        form.trigger('pdfFile')
                      }}
                    />
                  </>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coverImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Imagem da Capa</FormLabel>
                <FormControl>
                  <>
                    <div
                      className={`upload-dropzone border-2 border-dashed border-[#d8c6ad] ${field.value ? 'upload-dropzone-uploaded' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => coverInputRef.current?.click()}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          coverInputRef.current?.click()
                        }
                      }}
                    >
                      {field.value ? (
                        <div className="flex items-center gap-2 px-4">
                          <p className="upload-dropzone-text truncate">{field.value.name}</p>
                          <button
                            type="button"
                            className="upload-dropzone-remove"
                            aria-label="Remover imagem da capa"
                            onClick={(event) => {
                              event.stopPropagation()
                              field.onChange(undefined)
                              if (coverInputRef.current) {
                                coverInputRef.current.value = ''
                              }
                            }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <ImageUp className="upload-dropzone-icon" />
                          <p className="upload-dropzone-text">Clique para carregar a imagem da capa</p>
                          <p className="upload-dropzone-hint">Deixe vazio para gerar automaticamente a partir do PDF</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        field.onChange(file)
                        form.trigger('coverImage')
                      }}
                    />
                  </>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Titulo</FormLabel>
                <FormControl>
                  <Input {...field} className="form-input" placeholder="ex: Pai Rico Pai Pobre" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Nome do Autor</FormLabel>
                <FormControl>
                  <Input {...field} className="form-input" placeholder="ex: Robert Kiyosaki" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="voice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Escolha a Voz do Assistente</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-[#3d485e] mb-2">Vozes Masculinas</p>
                      <div className="voice-selector-options">
                        {voiceGroups.male.map((voice) => {
                          const selected = field.value === voice.key
                          return (
                            <label
                              key={voice.key}
                              className={`voice-selector-option ${selected ? 'voice-selector-option-selected' : 'voice-selector-option-default'}`}
                            >
                              <input
                                type="radio"
                                name={field.name}
                                value={voice.key}
                                checked={selected}
                                className="sr-only"
                                onChange={() => field.onChange(voice.key)}
                              />
                              <span className={`h-4 w-4 rounded-full border ${selected ? 'border-[#663820] bg-[#663820]' : 'border-[#b9a58f] bg-white'}`} />
                              <div className="flex flex-col text-left">
                                <span className="font-semibold text-[#212a3b]">{voice.name}</span>
                                <span className="text-xs text-[#3d485e] leading-4">{voice.description}</span>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-[#3d485e] mb-2">Vozes Femininas</p>
                      <div className="voice-selector-options">
                        {voiceGroups.female.map((voice) => {
                          const selected = field.value === voice.key
                          return (
                            <label
                              key={voice.key}
                              className={`voice-selector-option ${selected ? 'voice-selector-option-selected' : 'voice-selector-option-default'}`}
                            >
                              <input
                                type="radio"
                                name={field.name}
                                value={voice.key}
                                checked={selected}
                                className="sr-only"
                                onChange={() => field.onChange(voice.key)}
                              />
                              <span className={`h-4 w-4 rounded-full border ${selected ? 'border-[#663820] bg-[#663820]' : 'border-[#b9a58f] bg-white'}`} />
                              <div className="flex flex-col text-left">
                                <span className="font-semibold text-[#212a3b]">{voice.name}</span>
                                <span className="text-xs text-[#3d485e] leading-4">{voice.description}</span>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="form-btn" disabled={isSubmitting || !selectedPdf}>
            Iniciar Sintese
          </Button>
        </form>
      </Form>
    </div>
  )
}

export default UploadForm

