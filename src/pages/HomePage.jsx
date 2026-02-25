import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../StoreContext';
import './HomePage.css';

const API = import.meta.env.VITE_API_URL ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, '')}/api` : '/api';
const CAROUSEL_INTERVAL_MS = 2000;

export default function HomePage() {
  const { categories } = useStore();
  const [carouselSlides, setCarouselSlides] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    fetch(`${API}/carousel`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setCarouselSlides)
      .catch(() => setCarouselSlides([]));
  }, []);

  useEffect(() => {
    if (carouselSlides.length <= 1) return;
    const t = setInterval(() => {
      setCarouselIndex((i) => (i + 1) % carouselSlides.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [carouselSlides.length]);

  return (
    <div className="home-page">
      {/* Top announcement strip */}
      <div className="home-announce">
        <span className="home-announce-dot" />
        <span>משלוח חינם מעל 279 שח בהתאם לאיזורי השילוח ולתקנון האתר.</span>
      </div>

      {/* Hero */}
      <header className="home-hero">
        <div className="home-hero-bg" aria-hidden />
        {carouselSlides.length > 0 && (
          <div className="home-hero-carousel" aria-hidden>
            {carouselSlides.map((slide, i) => (
              <div
                key={slide.id}
                className="home-hero-carousel-slide"
                data-active={i === carouselIndex}
              >
                <img
                  src={slide.image_url}
                  alt=""
                  className="home-hero-carousel-img"
                />
              </div>
            ))}
          </div>
        )}
        <a href="https://whatsapp.com/channel/0029Vb7HETR2ZjCs5Fd01c0N" target="_blank" rel="noopener noreferrer" className="home-hero-deals-btn">
          לערוץ המבצעים החמים 24/7
        </a>
      </header>

      {/* Category grid */}
      <main className="home-categories-wrap">
        <div className="categories-grid">
          {categories.map((cat, index) => (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                className="category-tile"
                style={{ '--delay': `${index * 0.05}s` }}
              >
                <span className="category-tile-icon-wrap">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt="" className="category-tile-image" />
                  ) : cat.icon ? (
                    <span className="category-tile-icon" aria-hidden>{cat.icon}</span>
                  ) : null}
                </span>
                <h2 className="category-tile-name">{cat.name_he}</h2>
                <span className="category-tile-arrow">←</span>
              </Link>
            ))}
        </div>
      </main>
    </div>
  );
}
