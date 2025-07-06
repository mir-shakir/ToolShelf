// import { trackEvent } from './analytics.js';

function createFeedbackModal(tool) {
    // Remove any existing modal to avoid duplicates
    const old = document.getElementById('feedback-modal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = "feedback-modal";
    modal.style = `
    position:fixed;right:20px;bottom:90px;max-width:96vw;width:340px;z-index:99999;
    background:var(--surface-color,#fff);border:1px solid var(--border-color,#e5e7eb);
    border-radius:var(--radius-xl,0.75rem);box-shadow:var(--shadow-lg,0 10px 15px -3px rgb(0 0 0 / 0.1));
    padding:var(--space-5,20px) var(--space-5,20px) var(--space-4,16px) var(--space-5,20px);
    display:none;font-family:var(--font-family-primary,'Inter',sans-serif);
  `;
    modal.innerHTML = `
    <h4 style="margin:0 0 0.5em 0;font-size:1.1rem;color:var(--text-primary,#111827);">
      <i class="fas fa-star" aria-hidden="true" style="color:var(--accent-color,#10b981);margin-right:0.5em;"></i>
      Feedback
    </h4>
    <div style="margin:0.8em 0;">
      <label for="feedback-rating" style="font-weight:500;">Rating:</label>
      <select id="feedback-rating" style="margin-left:1em;border-radius:var(--radius-md,6px);border:1px solid var(--border-color,#e5e7eb);background:var(--background-secondary,#f9fafb);">
        <option value="">—</option>
        <option value="1">&#9733; 1</option>
        <option value="2">&#9733;&#9733; 2</option>
        <option value="3">&#9733;&#9733;&#9733; 3</option>
        <option value="4">&#9733;&#9733;&#9733;&#9733; 4</option>
        <option value="5">&#9733;&#9733;&#9733;&#9733;&#9733; 5</option>
      </select>
    </div>
    <div style="margin-bottom:1em;">
      <label for="feedback-comment" style="font-weight:500;">Comment (optional):</label>
      <textarea id="feedback-comment" rows="3" placeholder="What can we improve?" style="width:100%;margin-top:0.5em;padding:0.5em;font-size:1em;background:var(--background-secondary,#f9fafb);color:var(--text-primary,#111827);border:1px solid var(--border-color,#e5e7eb);border-radius:var(--radius-md,6px);resize:vertical;"></textarea>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:0.5em;">
      <button id="feedback-cancel" style="background:var(--background-secondary,#f9fafb);color:var(--text-secondary,#6b7280);border:1px solid var(--border-color,#e5e7eb);border-radius:var(--radius-md,6px);padding:0.45em 1.1em;cursor:pointer;">Cancel</button>
      <button id="feedback-submit" style="background:var(--accent-color,#10b981);color:var(--text-white,#fff);border:none;border-radius:var(--radius-md,6px);padding:0.45em 1.1em;cursor:pointer;font-weight:500;">Submit</button>
    </div>
    <div id="feedback-success" style="display:none;margin-top:1em;color:var(--success-color,#10b981);text-align:center;font-weight:500;">Thank you for your feedback!</div>
  `;
    document.body.appendChild(modal);

    modal.querySelector('#feedback-cancel').onclick = () => { modal.style.display = "none"; };
    modal.querySelector('#feedback-submit').onclick = () => {
        const rating = modal.querySelector('#feedback-rating').value;
        const comment = modal.querySelector('#feedback-comment').value.trim();
        if (!rating) {
            modal.querySelector('#feedback-rating').focus();
            return;
        }
        ToolShelf.Analytics.trackEvent('feedback_submit', { rating, comment, tool });
        // Show thanks and reset
        modal.querySelector('#feedback-success').style.display = "";
        setTimeout(() => {
            modal.style.display = "none";
            modal.querySelector('#feedback-success').style.display = "none";
            modal.querySelector('#feedback-rating').value = "";
            modal.querySelector('#feedback-comment').value = "";
        }, 1300);
    };
    return modal;
}

export function initFeedbackWidget(tool) {
    // Only one button, ever
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
    };

    document.body.appendChild(btn);
}