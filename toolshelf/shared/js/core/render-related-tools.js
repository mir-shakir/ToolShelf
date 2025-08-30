
export const RELATED_TOOLS = {
    "json-formatter": ["base64-encoder", "regex-tester", "jwt-decoder"],
    "base64-encoder": ["json-formatter", "hash-generator", "jwt-decoder"],
    "text-transformer": ["regex-tester", "json-formatter", "qr-generator"],
    "qr-generator": ["color-converter", "base64-encoder", "text-transformer"],
    "hash-generator": ["jwt-decoder", "base64-encoder", "regex-tester"],
    "jwt-decoder": ["hash-generator", "base64-encoder", "json-formatter"],
    "color-converter": ["qr-generator", "json-formatter", "regex-tester"],
    "regex-tester": ["text-transformer", "json-formatter", "jwt-decoder"],
};

export const TOOL_LABELS = {
    "json-formatter": "JSON Formatter",
    "base64-encoder": "Base64 Encoder",
    "text-transformer": "Text Transformer",
    "qr-generator": "QR Generator",
    "hash-generator": "Hash Generator",
    "jwt-decoder": "JWT Decoder",
    "color-converter": "Advanced Color Converter",
    "regex-tester": "Regex Tester",
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