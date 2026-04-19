/**
 * ToolShelf Text Diff — LCS-based line diff engine.
 * Pure function module, no DOM, no globals beyond namespace attachment.
 */
window.ToolShelf = window.ToolShelf || {};

(function () {
    const MAX_PRODUCT = 10_000_000; // guardrail: leftLines * rightLines

    function normalizeLine(line, options) {
        let s = line;
        if (options.trim) s = s.trim();
        if (options.ignoreWhitespace) s = s.replace(/\s+/g, ' ').trim();
        if (options.ignoreCase) s = s.toLowerCase();
        return s;
    }

    function diff(leftText, rightText, options) {
        options = options || {};
        const leftLines = leftText === '' ? [] : leftText.split('\n');
        const rightLines = rightText === '' ? [] : rightText.split('\n');
        const n = leftLines.length;
        const m = rightLines.length;

        if (n * m > MAX_PRODUCT) {
            return { error: 'inputs-too-large' };
        }
        if (n === 0 && m === 0) return [];

        const leftKeys = leftLines.map(l => normalizeLine(l, options));
        const rightKeys = rightLines.map(l => normalizeLine(l, options));

        const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
        for (let i = 1; i <= n; i++) {
            for (let j = 1; j <= m; j++) {
                if (leftKeys[i - 1] === rightKeys[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = dp[i - 1][j] >= dp[i][j - 1] ? dp[i - 1][j] : dp[i][j - 1];
                }
            }
        }

        const script = [];
        let i = n, j = m;
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && leftKeys[i - 1] === rightKeys[j - 1]) {
                script.push({
                    type: 'equal',
                    leftLine: i,
                    rightLine: j,
                    text: leftLines[i - 1]
                });
                i--; j--;
            } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                script.push({
                    type: 'insert',
                    rightLine: j,
                    text: rightLines[j - 1]
                });
                j--;
            } else {
                script.push({
                    type: 'delete',
                    leftLine: i,
                    text: leftLines[i - 1]
                });
                i--;
            }
        }
        script.reverse();
        return script;
    }

    window.ToolShelf.DiffEngine = { diff, MAX_PRODUCT };
})();
