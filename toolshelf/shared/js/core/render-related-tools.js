
export const RELATED_TOOLS = {
    "json-formatter": ["text-diff", "base64-encoder", "hash-generator"],
    "base64-encoder": ["json-formatter", "hash-generator", "jwt-decoder"],
    "text-transformer": ["text-diff", "json-formatter", "base64-encoder"],
    "qr-generator": ["json-formatter", "base64-encoder", "text-transformer"],
    "hash-generator": ["json-formatter", "base64-encoder", "jwt-decoder"],
    "jwt-decoder": ["epoch-converter", "hash-generator", "base64-encoder"],
    "uuid-v7-generator": ["epoch-converter", "hash-generator", "jwt-decoder"],
    "mock-data-generator": ["json-formatter", "uuid-v7-generator", "text-diff"],
    "epoch-converter": ["jwt-decoder", "uuid-v7-generator", "json-formatter"],
    "text-diff": ["json-formatter", "text-transformer", "base64-encoder"],
};

export const TOOL_LABELS = {
    "json-formatter": "JSON Formatter",
    "base64-encoder": "Base64 Encoder",
    "text-transformer": "Text Transformer",
    "qr-generator": "QR Generator",
    "hash-generator": "Hash Generator",
    "jwt-decoder": "JWT Decoder",
    "uuid-v7-generator": "UUID v7 Generator",
    "mock-data-generator": "Mock Data Generator",
    "epoch-converter": "Unix Timestamp Converter",
    "text-diff": "Text Diff Checker",
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
