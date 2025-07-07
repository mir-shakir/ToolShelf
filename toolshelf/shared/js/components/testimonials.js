const testimonialsData = [
    {
        quote: "Finally — tools that just work, without clutter or ads. ToolShelf is now my go-to.",
        name: "Andre",
        role: "Backend Engineer",
        avatar: "🛠️"
    },
    {
        quote: "I use the text transformer every morning before I publish. Super clean UI.",
        name: "Lena",
        role: "Content Writer",
        avatar: "✍️"
    },
    {
        quote: "The JSON formatter is a life-saver during API debugging. Works offline, which is a huge plus.",
        name: "Dev Patel",
        role: "Full Stack Developer",
        avatar: "🧑‍💻"
    },
    {
        quote: "Fast, no login, and private. ToolShelf replaced 3 extensions I used to depend on.",
        name: "Toby",
        role: "Security Analyst",
        avatar: "🔒"
    },
    {
        quote: "Perfect for live demos and workshops — no network lag or data concerns.",
        name: "Rina",
        role: "Educator",
        avatar: "🎓"
    }
];
  

function renderTestimonials() {
    const container = document.getElementById('testimonials-carousel');
    const nav = document.getElementById('testimonials-nav');
    if (!container) return;

    // Responsive: 1 on mobile, 2 on tablet, 3-4 on desktop
    const getCardsToShow = () => {
        if (window.innerWidth <= 600) return 1;
        if (window.innerWidth <= 900) return 2;
        if (window.innerWidth <= 1200) return 3;
        return 4;
    };

    let currentIndex = 0;
    let cardsToShow = getCardsToShow();

    function updateCarousel() {
        cardsToShow = getCardsToShow();
        container.innerHTML = '';
        // Show cardsToShow cards, highlight the 'active' one for animation
        for (let i = 0; i < cardsToShow; i++) {
            const tIndex = (currentIndex + i) % testimonialsData.length;
            const t = testimonialsData[tIndex];
            const card = document.createElement('div');
            card.className = 'testimonial-card';
            card.setAttribute('data-active', i === 0 ? 'true' : 'false');
            card.innerHTML = `
          <div class="testimonial-avatar">${t.avatar}</div>
          <blockquote class="testimonial-quote">${t.quote}</blockquote>
          <div class="testimonial-user">
            <span class="testimonial-name">${t.name}</span>
            <span class="testimonial-role">${t.role}</span>
          </div>
        `;
            container.appendChild(card);
        }

        // Render nav dots
        if (nav) {
            nav.innerHTML = '';
            for (let i = 0; i < testimonialsData.length; i++) {
                const dot = document.createElement('div');
                dot.className = 'testimonials-dot' + (i === currentIndex % testimonialsData.length ? ' active' : '');
                dot.addEventListener('click', () => {
                    currentIndex = i;
                    updateCarousel();
                });
                nav.appendChild(dot);
            }
        }
    }

    updateCarousel();

    // Auto-rotate with animation
    let interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % testimonialsData.length;
        updateCarousel();
    }, 3200);

    // Pause on hover/focus
    container.addEventListener('mouseenter', () => clearInterval(interval));
    container.addEventListener('mouseleave', () => {
        clearInterval(interval);
        interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % testimonialsData.length;
            updateCarousel();
        }, 3200);
    });

    // Re-render on resize
    window.addEventListener('resize', () => {
        updateCarousel();
    });

    // Swipe gestures for mobile
    let startX = null;
    container.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });
    container.addEventListener('touchend', (e) => {
        if (startX === null) return;
        const diff = e.changedTouches[0].clientX - startX;
        if (Math.abs(diff) > 30) {
            if (diff < 0) {
                currentIndex = (currentIndex + 1) % testimonialsData.length;
            } else {
                currentIndex = (currentIndex - 1 + testimonialsData.length) % testimonialsData.length;
            }
            updateCarousel();
        }
        startX = null;
    });
}

document.addEventListener('DOMContentLoaded', renderTestimonials);