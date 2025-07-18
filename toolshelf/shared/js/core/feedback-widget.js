function createFeedbackModal(tool) {
  // Remove any existing modal to avoid duplicates
  const old = document.getElementById('feedback-modal');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id = "feedback-modal";
  modal.tabIndex = -1;
  modal.style = `
    position:fixed;right:20px;bottom:90px;max-width:98vw;width:350px;z-index:99999;
    background:var(--surface-color,#fff);border:1px solid var(--border-color,#e5e7eb);
    border-radius:var(--radius-xl,0.75rem);box-shadow:var(--shadow-lg,0 10px 15px -3px rgb(0 0 0 / 0.1));
    padding:28px 26px 18px 26px;display:none;
    font-family:var(--font-family-primary,'Inter',sans-serif);
    animation:modal-in 0.2s cubic-bezier(.4,0,.2,1);
    box-sizing:border-box;
  `;
  modal.innerHTML = `
    <style>
      #feedback-modal * { box-sizing: border-box; }
      #feedback-modal .feedback-stars {
        display: flex; gap: 0.35em; margin: 0.7em 0 1.1em 0;
      }
      #feedback-modal .star {
        font-size: 1.7em; color: #e5e7eb; cursor: pointer; transition: color 0.17s;
        border: none; background: none; line-height: 1; padding: 0 0.07em;
      }
      #feedback-modal .star.selected,
      #feedback-modal .star:hover,
      #feedback-modal .star:focus-visible {
        color: var(--accent-color,#10b981);
        outline: none;
      }
      #feedback-modal .star:focus-visible {
        box-shadow: 0 0 0 2px var(--accent-color,#10b98150);
        border-radius: 50%;
      }
      #feedback-modal textarea {
        width:100%;margin-top:0.5em;padding:0.6em;font-size:1em;
        background:var(--background-secondary,#f9fafb);color:var(--text-primary,#111827);
        border:1px solid var(--border-color,#e5e7eb);border-radius:var(--radius-md,6px);
        resize:vertical; transition: border 0.14s;
      }
      #feedback-modal textarea:focus { border: 1.5px solid var(--accent-color,#10b981);}
      #feedback-modal .feedback-btns {
        display:flex;justify-content:flex-end;gap:0.5em;margin-top:1.2em;
      }
      #feedback-modal button {
        font-size: 1em;
      }
      #feedback-modal .fb-cancel {
        background:var(--background-secondary,#f9fafb);color:var(--text-secondary,#6b7280);
        border:1px solid var(--border-color,#e5e7eb);border-radius:var(--radius-md,6px);
        padding:0.5em 1.3em;cursor:pointer;transition:background 0.12s,color 0.12s;
      }
      #feedback-modal .fb-submit {
        background:var(--accent-color,#10b981);color:var(--text-white,#fff);
        border:none;border-radius:var(--radius-md,6px);padding:0.5em 1.3em;
        cursor:pointer;font-weight:600;transition:background 0.14s;
      }
      #feedback-modal .fb-submit:disabled {
        background: #cbd5e1; color: #fff; cursor: not-allowed;
      }
      #feedback-modal .fb-cancel:hover { background: #e5e7eb; }
      #feedback-modal .fb-submit:hover:not(:disabled) { background: #059669; }
      #feedback-modal .fb-success {
        display:none;margin-top:1.1em;color:var(--success-color,#10b981);
        text-align:center;font-weight:500; font-size:1.05em;
      }
      @media (max-width: 500px) {
        #feedback-modal { width:97vw; padding:16px 5vw 14px 5vw; }
      }
      @keyframes modal-in { from { opacity:0; transform:translateY(24px);} to { opacity:1; transform:translateY(0);}}
    </style>
    <h4 style="margin:0 0 0.6em 0;font-size:1.14rem;color:var(--text-primary,#111827);display:flex;align-items:center;">
      <i class="fas fa-star" aria-hidden="true" style="color:var(--accent-color,#10b981);margin-right:0.5em;"></i> Feedback
    </h4>
    <form id="feedback-form" autocomplete="off">
      <label for="feedback-stars" style="font-weight:500;display:block;">Rating:</label>
      <div class="feedback-stars" id="feedback-stars" role="radiogroup" aria-label="Rating (1 to 5 stars)">
        ${[1, 2, 3, 4, 5].map(i => `
          <button type="button" class="star" data-val="${i}" aria-label="${i} star${i > 1 ? 's' : ''}" tabindex="0">
            <i class="fas fa-star"></i>
          </button>
        `).join('')}
      </div>
      <input type="hidden" id="feedback-rating" name="rating" value="">
      <div style="margin-bottom:1em;">
        <label for="feedback-comment" style="font-weight:500;">Comment (optional):</label>
        <textarea id="feedback-comment" rows="3" maxlength="350" placeholder="What can we improve?"></textarea>
      </div>
      <div class="feedback-btns">
        <button type="button" class="fb-cancel">Cancel</button>
        <button type="submit" class="fb-submit" disabled>Submit</button>
      </div>
      <div class="fb-success" id="feedback-success">Thank you for your feedback!</div>
    </form>
  `;
  document.body.appendChild(modal);

  // Modal logic
  const cancelBtn = modal.querySelector('.fb-cancel');
  const submitBtn = modal.querySelector('.fb-submit');
  const form = modal.querySelector('#feedback-form');
  const ratingInput = modal.querySelector('#feedback-rating');
  const commentInput = modal.querySelector('#feedback-comment');
  const successBox = modal.querySelector('#feedback-success');
  const stars = modal.querySelectorAll('.star');

  let selected = 0;
  stars.forEach((star, idx) => {
    star.addEventListener('click', () => {
      selected = idx + 1;
      ratingInput.value = selected;
      stars.forEach((s, i) => s.classList.toggle('selected', i < selected));
      submitBtn.disabled = !selected;
      star.focus();
    });
    star.addEventListener('keydown', e => {
      if (e.key === "ArrowRight" && idx < 4) stars[idx + 1].focus();
      if (e.key === "ArrowLeft" && idx > 0) stars[idx - 1].focus();
      if (e.key === " " || e.key === "Enter") { star.click(); }
    });
  });

  cancelBtn.onclick = () => {
    modal.style.display = "none";
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    if (!ratingInput.value) {
      stars[0].focus();
      return;
    }
    const rating = ratingInput.value;
    const comment = commentInput.value.trim();
    ToolShelf.Analytics.trackEvent('feedback_submit', { rating, comment, tool });
    // Show thanks and reset
    successBox.style.display = "";
    submitBtn.disabled = true;
    setTimeout(() => {
      modal.style.display = "none";
      successBox.style.display = "none";
      ratingInput.value = "";
      commentInput.value = "";
      stars.forEach(s => s.classList.remove('selected'));
      selected = 0;
    }, 1300);
  };

  return modal;
}

export function initFeedbackWidget(tool) {
  if (document.getElementById('feedback-float-btn')) return;
  const btn = document.createElement('button');
  btn.id = "feedback-float-btn";
  btn.title = "Send feedback";
  btn.setAttribute("aria-label", "Send feedback");
  btn.innerHTML = `<i class="fas fa-comment-dots" aria-hidden="true" style="margin-right:0.5em;"></i>Feedback`;
  btn.style = `
    position:fixed;right:16px;bottom:16px;z-index:99999;padding:0.6em 1.4em;
    background:var(--background-card,#fff);color:var(--primary-dark,#2563eb);
    border:1.5px solid var(--border-color,#e5e7eb);border-radius:var(--radius-full,9999px);
    font-weight:500;font-size:1.05em;box-shadow:var(--shadow-sm,0 1px 3px 0 rgb(0 0 0 / 0.15));
    cursor:pointer;transition:box-shadow var(--transition-fast),background var(--transition-fast);
  `;
  btn.onmouseenter = () => btn.style.background = "var(--background-tertiary,#f3f4f6)";
  btn.onmouseleave = () => btn.style.background = "var(--background-card,#fff)";
  btn.onclick = () => {
    let modal = document.getElementById("feedback-modal");
    if (!modal) modal = createFeedbackModal(tool);
    modal.style.display = "block";
    setTimeout(() => { modal.focus(); }, 70);
  };
  document.body.appendChild(btn);
}