
export const RELATED_TOOLS = {
    "json-formatter": ["base64-encoder", "text-transformer", "hash-generator"],
    "base64-encoder": ["json-formatter", "text-transformer", "hash-generator"],
    "text-transformer": ["json-formatter", "base64-encoder", "qr-generator"],
    "qr-generator": ["json-formatter", "base64-encoder", "text-transformer"],
    "hash-generator": ["json-formatter", "base64-encoder", "text-transformer"],
};

export const TOOL_LABELS = {
    "json-formatter": "JSON Formatter",
    "base64-encoder": "Base64 Encoder",
    "text-transformer": "Text Transformer",
    "qr-generator": "QR Generator",
    "hash-generator": "Hash Generator",
};

export function renderRelatedTools(currentTool, containerId = "related-tools") {
    const related = RELATED_TOOLS[currentTool];
    if (!related) return;
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
    <h3><i class="fas fa-link" aria-hidden="true"></i> Related Tools</h3>
    <ul>
      ${related.map(tool =>
        `<li><a href="../${tool}/index.html">${TOOL_LABELS[tool]}</a></li>`
    ).join('')}
    </ul>
  `;
}