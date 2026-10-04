'use client'

import { useActionState } from 'react'
import { deleteImage, setImageAlt, uploadImages, type UploadState } from './actions'
import { mediaBase } from '@/components/media/PieceImage'

type Img = { id: string; src: string; kind: string; index: number; alt: string }

export function ImageManager({ productId, sku, images }: { productId: string; sku: string; images: Img[] }) {
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadImages, null)
  return (
    <section aria-labelledby="img-h" className="space-y-6">
      <h2 id="img-h" className="font-display text-step-3">Photographs</h2>
      <p className="max-w-2xl text-step--1 text-ink-light-muted">
        Name files like <span className="num">{sku}-01.jpg</span>, <span className="num">{sku}-02.jpg</span> and they’ll go in that order. The first is the main photo.
        Turntable frames: <span className="num">{sku}-360-01.jpg</span> to <span className="num">-36</span>. A file with the same name replaces the old one.
      </p>
      <form action={action} className="flex flex-wrap items-center gap-4 border border-dashed border-rule-light p-6">
        <input type="hidden" name="productId" value={productId} />
        <label htmlFor="files" className="sr-only">Choose photographs</label>
        <input id="files" name="files" type="file" accept="image/jpeg,image/png,image/webp" multiple className="text-step--1" />
        <button className="btn btn-primary" disabled={pending}>{pending ? 'Uploading and preparing…' : 'Upload'}</button>
        {state && <p role="status" className={`basis-full text-step--1 ${state.ok ? '' : 'text-garnet'}`}>{state.message}</p>}
      </form>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {images.map((img) => (
          <li key={img.id} className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${mediaBase(img.src)}-480.webp`} alt={img.alt} className="aspect-square w-full bg-onyx object-cover" />
            <p className="num text-step--1 text-ink-light-muted">{img.kind === 'PHOTO' ? `Photo ${img.index}` : img.kind === 'TURNTABLE' ? `Turntable ${img.index}` : img.kind.toLowerCase()}</p>
            <form action={setImageAlt} className="flex gap-2">
              <input type="hidden" name="imageId" value={img.id} />
              <label htmlFor={`alt-${img.id}`} className="sr-only">Description for people who can’t see the photo</label>
              <input id={`alt-${img.id}`} name="alt" defaultValue={img.alt} className="field min-h-9 py-1 text-step--1" />
              <button className="link text-step--1">Save</button>
            </form>
            <form action={deleteImage}>
              <input type="hidden" name="imageId" value={img.id} />
              <button className="link text-step--1 text-garnet">Remove</button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  )
}
