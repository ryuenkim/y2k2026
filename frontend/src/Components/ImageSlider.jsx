import { useState } from 'react';

export default function ImageSlider({
    images,
    alt,
    className = '',
    imageClassName = '',
    activeIndex,
    onIndexChange
}) {
    const [internalIndex, setInternalIndex] = useState(0);
    const currentIndex = Math.min(activeIndex ?? internalIndex, images.length - 1);
    const selectImage = (index) => {
        const nextIndex = (index + images.length) % images.length;
        if (onIndexChange) onIndexChange(nextIndex);
        else setInternalIndex(nextIndex);
    };

    if (!images.length) return null;

    return <div className={`image-slider ${className}`} role="group" aria-label={`${alt} images`} aria-roledescription="carousel">
        <img
            className={imageClassName}
            src={images[currentIndex]}
            alt={alt}
            loading="lazy"
        />
        {images.length > 1 && <>
            <button
                className="image-slider-control image-slider-previous"
                type="button"
                aria-label={`Previous ${alt} image`}
                onClick={() => selectImage(currentIndex - 1)}
            >‹</button>
            <button
                className="image-slider-control image-slider-next"
                type="button"
                aria-label={`Next ${alt} image`}
                onClick={() => selectImage(currentIndex + 1)}
            >›</button>
            <span className="image-slider-count" aria-live="polite" aria-atomic="true">
                {currentIndex + 1} / {images.length}
            </span>
        </>}
    </div>;
}
