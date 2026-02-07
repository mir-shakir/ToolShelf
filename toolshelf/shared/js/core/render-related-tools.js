
export const RELATED_TOOLS = {
    "json-formatter": ["base64-encoder", "hash-generator", "jwt-decoder"],
    "base64-encoder": ["json-formatter", "hash-generator", "jwt-decoder"],
    "text-transformer": ["json-formatter", "base64-encoder", "qr-generator"],
    "qr-generator": ["json-formatter", "base64-encoder", "text-transformer"],
    "hash-generator": ["json-formatter", "base64-encoder", "jwt-decoder"],
    "jwt-decoder": ["hash-generator", "base64-encoder", "uuid-v7-generator"],
    "uuid-v7-generator": ["hash-generator", "jwt-decoder", "json-formatter"],
};

export const TOOL_LABELS = {
    "json-formatter": "JSON Formatter",
    "base64-encoder": "Base64 Encoder",
    "text-transformer": "Text Transformer",
    "qr-generator": "QR Generator",
    "hash-generator": "Hash Generator",
    "jwt-decoder": "JWT Decoder",
    "uuid-v7-generator": "UUID v7 Generator",
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