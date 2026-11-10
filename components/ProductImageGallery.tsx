
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type ProductImageGalleryProps = {
  images: string[];
  productName: string;
};

export default function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const galleryImages =
    images.filter(
      (image) => typeof image === 'string' && image.trim() !== ''
    ).length > 0
      ? images.filter(
          (image) => typeof image === 'string' && image.trim() !== ''
        )
      : ['/images/placeholder.svg'];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const touchStartX = useRef(0);

  const currentImage = galleryImages[selectedIndex] || galleryImages[0];

  const previousImage = useCallback(() => {
    setSelectedIndex((index) =>
      index === 0 ? galleryImages.length - 1 : index - 1
    );
    setIsZoomed(false);
  }, [galleryImages.length]);

  const nextImage = useCallback(() => {
    setSelectedIndex((index) =>
      index === galleryImages.length - 1 ? 0 : index + 1
    );
    setIsZoomed(false);
  }, [galleryImages.length]);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFullscreen(false);
      if (event.key === 'ArrowLeft') previousImage();
      if (event.key === 'ArrowRight') nextImage();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isFullscreen, previousImage, nextImage]);

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const difference = touchStartX.current - event.changedTouches[0].clientX;

    if (Math.abs(difference) > 50) {
      if (difference > 0) nextImage();
      else previousImage();
    }
  }

  function selectImage(index: number) {
    setSelectedIndex(index);
    setIsZoomed(false);
  }

  return (
    <>
      <div className="space-y-4">
        <div
          className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="block w-full cursor-zoom-in"
            aria-label="Open full screen product gallery"
          >
            <img
              src={currentImage}
              alt={productName}
              className="w-full aspect-square object-contain transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-md text-emerald-950 hover:bg-emerald-900 hover:text-white transition"
            aria-label="Zoom product image"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5M10.5 7v7M7 10.5h7" />
            </svg>
          </button>

          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={previousImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-md hover:bg-emerald-900 hover:text-white transition"
                aria-label="Previous image"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-md hover:bg-emerald-900 hover:text-white transition"
                aria-label="Next image"
              >
                ›
              </button>

              <span className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                {selectedIndex + 1} / {galleryImages.length}
              </span>
            </>
          )}
        </div>

        {galleryImages.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {galleryImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => selectImage(index)}
                className={`rounded-xl overflow-hidden border-2 transition ${
                  selectedIndex === index
                    ? 'border-emerald-800 shadow-md'
                    : 'border-gray-200 hover:border-emerald-400'
                }`}
                aria-label={`View product image ${index + 1}`}
                aria-pressed={selectedIndex === index}
              >
                <img
                  src={image}
                  alt={`${productName} image ${index + 1}`}
                  className="w-full aspect-square object-contain"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {isFullscreen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-5 right-5 z-20 text-white text-3xl w-11 h-11 rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Close gallery"
          >
            ×
          </button>

          <span className="absolute top-7 left-5 text-white/80 text-sm">
            {selectedIndex + 1} / {galleryImages.length}
          </span>

          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={previousImage}
              className="absolute left-3 sm:left-8 z-10 text-white text-5xl"
              aria-label="Previous image"
            >
              ‹
            </button>
          )}

          <div
            className="w-full h-[75vh] flex items-center justify-center overflow-hidden"
            onDoubleClick={() => setIsZoomed(!isZoomed)}
          >
            <img
              src={currentImage}
              alt={productName}
              onClick={() => setIsZoomed(!isZoomed)}
              className={`max-w-full max-h-full object-contain transition-transform duration-300 cursor-zoom-in ${
                isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100'
              }`}
            />
          </div>

          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-3 sm:right-8 z-10 text-white text-5xl"
              aria-label="Next image"
            >
              ›
            </button>
          )}

          <div className="absolute bottom-5 flex gap-2 overflow-x-auto max-w-full px-3">
            {galleryImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => selectImage(index)}
                className={`w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 ${
                  selectedIndex === index
                    ? 'border-white'
                    : 'border-white/30'
                }`}
                aria-label={`View image ${index + 1}`}
              >
                <img
                  src={image}
                  alt=""
                  className="w-full h-full object-contain"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
