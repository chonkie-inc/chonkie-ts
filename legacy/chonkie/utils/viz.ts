import * as fs from 'fs';
import * as path from 'path';

// Define types
export interface Chunk {
    text: string;
    start_index: number;
    end_index: number;
    token_count?: number;
}

// Light themes
const LIGHT_THEMES: Record<string, string[]> = {
    // Pastel colored rainbow theme
    "pastel": [
        "#FFADAD",
        "#FFD6A5",  
        "#FDFFB6",
        "#CAFFBF",
        "#9BF6FF",
        "#A0C4FF",
        "#BDB2FF",
        "#FFC6FF",
    ],
    // Tiktokenizer theme
    "tiktokenizer": [
        "#bae6fc",
        "#fde68a",
        "#bbf7d0",
        "#fed7aa",
        "#a5f3fc",
        "#e5e7eb",
        "#eee2fd",
        "#e4f9c0",
        "#fecdd3",
    ]
};

// Dark themes
const DARK_THEMES: Record<string, string[]> = {
    // Tiktokenizer but with darker colors
    "tiktokenizer_dark": [
        "#2A4E66",
        "#80662A", 
        "#2A6648", 
        "#66422A", 
        "#2A4A66", 
        "#3A3D40", 
        "#55386E", 
        "#3A6640", 
        "#66353B", 
    ],
    // Pastel but with darker colors
    "pastel_dark": [
        "#5C2E2E", 
        "#5C492E",  
        "#4F5C2E",  
        "#2E5C4F",  
        "#2E3F5C",  
        "#3A3A3A",  
        "#4F2E5C",  
        "#2E5C3F"   
    ]
};

// Light mode colors
const BODY_BACKGROUND_COLOR_LIGHT = "#F0F2F5";
const CONTENT_BACKGROUND_COLOR_LIGHT = "#FFFFFF";    
const TEXT_COLOR_LIGHT = "#333333";

// Dark mode colors
const BODY_BACKGROUND_COLOR_DARK = "#121212";
const CONTENT_BACKGROUND_COLOR_DARK = "#1E1E1E";
const TEXT_COLOR_DARK = "#FFFFFF";

// HTML templates
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    {favicon_link_tag}
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; line-height: 1.6; padding: 0; margin: 0; background-color: {body_bg_color}; color: {text_color}; display: flex; flex-direction: column; min-height: 100vh; }
        .content-box { max-width: 900px; width: 100%; margin: 30px auto; padding: 30px 20px 20px 20px; background-color: {content_bg_color}; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); box-sizing: border-box; }
        .text-display { white-space: pre-wrap; word-wrap: break-word; font-family: "Consolas", "Monaco", "Courier New", monospace; font-size: 0.95em; padding: 0; }
        .text-display span[style*="background-color"] { border-radius: 3px; padding: 0.1em 0; cursor: help; }
        .text-display br { display: block; content: ""; margin-top: 0.6em; }
        footer { text-align: center; margin-top: auto; padding: 15px 0; font-size: 0.8em; color: #888; border-top: 1px solid #eee; background-color: #f0f2f5; width: 100%; }
        footer a { color: #666; text-decoration: none; }
        footer a:hover { text-decoration: underline; }
        footer .heart { color: #d63384; display: inline-block; }
    </style>
</head>
<body>
    {main_content}
    {footer_content}
</body>
</html>
`;

const MAIN_TEMPLATE = `
<div class="content-box">
    <div class="text-display">{html_parts}</div>
</div>
`;

const FOOTER_TEMPLATE = `
<footer>
    Made with <span class="heart">🤎</span> by <a href="https://github.com/chonkie-inc/chonkie" target="_blank" rel="noopener noreferrer">🦛 Chonkie</a>
</footer>
`;

/**
 * Visualizer class for Chonkie.
 * 
 * This class can take in Chonkie Chunks and visualize them on the terminal 
 * or save them as a standalone HTML file.
 */
export class Visualizer {
    private static readonly HIPPO_SVG_CONTENT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><text x="50" y="55" font-size="90" text-anchor="middle" dominant-baseline="middle">🦛</text></svg>`;

    private readonly theme: string[];
    private readonly textColor: string;
    private readonly themeName: string;

    constructor(theme: string | string[] = "pastel") {
        if (typeof theme === 'string') {
            const [themeColors, textColor] = this.getTheme(theme);
            this.theme = themeColors;
            this.textColor = textColor;
            this.themeName = theme;
        } else {
            this.theme = theme;
            this.textColor = "";
            this.themeName = "custom";
        }
    }

    /**
     * Get the theme from the theme name.
     */
    private getTheme(theme: string): [string[], string] {
        if (theme in DARK_THEMES) {
            return [DARK_THEMES[theme], TEXT_COLOR_DARK];
        } else if (theme in LIGHT_THEMES) {
            return [LIGHT_THEMES[theme], TEXT_COLOR_LIGHT];
        } else {
            throw new Error(`Invalid theme: ${theme}`);
        }
    }

    /**
     * Get a color from the theme based on index.
     */
    private getColor(index: number): string {
        return this.theme[index % this.theme.length];
    }

    /**
     * Darken a hex color by a multiplier (0 to 1).
     */
    private darkenColor(hexColor: string, amount: number = 0.7): string {
        try {
            hexColor = hexColor.replace('#', '');
            if (hexColor.length !== 6) {
                if (hexColor.length === 3) {
                    hexColor = hexColor.split('').map(c => c + c).join('');
                } else {
                    throw new Error("Invalid hex color format");
                }
            }
            const rgb = [
                parseInt(hexColor.slice(0, 2), 16),
                parseInt(hexColor.slice(2, 4), 16),
                parseInt(hexColor.slice(4, 6), 16)
            ];
            const darkerRgb = rgb.map(c => Math.max(0, Math.floor(c * amount)));
            return `#${darkerRgb.map(c => c.toString(16).padStart(2, '0')).join('')}`;
        } catch (error) {
            console.warn(`Warning: Could not darken color ${hexColor}: ${error}`);
            return "#808080";
        }
    }

    /**
     * Print the chunks to the terminal.
     */
    public print(chunks: Chunk[], fullText?: string): void {
        if (!chunks.length) {
            console.log("No chunks to visualize.");
            return;
        }

        if (!fullText) {
            try {
                fullText = chunks.map(chunk => chunk.text).join('');
            } catch (error) {
                throw new Error("Error: Chunks must have 'text', 'start_index', and 'end_index' attributes for automatic text reconstruction.");
            }
        }

        const textLength = fullText.length;
        const spans: Array<{id: number; start: number; end: number}> = [];

        for (let i = 0; i < chunks.length; i++) {
            try {
                spans.push({
                    id: i,
                    start: Math.floor(chunks[i].start_index),
                    end: Math.floor(chunks[i].end_index)
                });
            } catch (error) {
                console.warn(`Warning: Skipping chunk with invalid start/end index: ${chunks[i]}`);
                continue;
            }
        }

        // Apply styles to text segments
        let result = '';
        let lastIndex = 0;

        for (const span of spans) {
            const { start, end, id } = span;
            if (start < end && start < textLength) {
                const effectiveEnd = Math.min(end, textLength);
                const color = this.getColor(id);
                const style = `${this.textColor} on ${color}`;
                
                // Add text before the span
                if (start > lastIndex) {
                    result += fullText.slice(lastIndex, start);
                }
                
                // Add styled span
                result += `\x1b[${style}m${fullText.slice(start, effectiveEnd)}\x1b[0m`;
                lastIndex = effectiveEnd;
            }
        }

        // Add remaining text
        if (lastIndex < textLength) {
            result += fullText.slice(lastIndex);
        }

        console.log(result);
    }

    /**
     * Save the chunk visualization as a standalone HTML file.
     */
    public save(
        filename: string,
        chunks: Chunk[],
        fullText?: string,
        title: string = "Chunk Visualization"
    ): void {
        if (!chunks.length) {
            console.log("No chunks to visualize. HTML file not saved.");
            return;
        }

        if (!fullText) {
            try {
                fullText = chunks.map(chunk => chunk.text).join('');
            } catch (error) {
                throw new Error("Error: Chunks must have 'text', 'start_index', and 'end_index' attributes for automatic text reconstruction. HTML not saved.");
            }
        }

        if (!filename.endsWith(".html")) {
            filename = `${filename}.html`;
        }

        // Validate spans and prepare data
        const validatedSpans: Array<{
            id: number;
            start: number;
            end: number;
            tokens?: number;
        }> = [];

        const textLength = fullText.length;
        for (let i = 0; i < chunks.length; i++) {
            try {
                const start = Math.max(0, Math.floor(chunks[i].start_index));
                const end = Math.max(0, Math.floor(chunks[i].end_index));
                if (start < end && start < textLength) {
                    const effectiveEnd = Math.min(end, textLength);
                    validatedSpans.push({
                        id: i,
                        start,
                        end: effectiveEnd,
                        tokens: chunks[i].token_count
                    });
                }
            } catch (error) {
                console.warn(`Warning: Skipping chunk with invalid start/end index: ${chunks[i]}`);
                continue;
            }
        }

        // Generate HTML parts
        const htmlParts: string[] = [];
        let lastProcessedIdx = 0;
        const events: Array<[number, number, number]> = [];

        // Create events for each span
        for (const span of validatedSpans) {
            events.push([span.start, 1, span.id]);
            events.push([span.end, -1, span.id]);
        }
        events.sort((a, b) => a[0] - b[0]);

        // Initialize active chunk IDs set
        const activeChunkIds = new Set<number>();

        // Process events
        for (let i = 0; i < events.length; i++) {
            const [eventIdx, eventType, chunkId] = events[i];
            const numActive = activeChunkIds.size;
            let currentBgColor = "transparent";
            let hoverTitle = "";

            if (numActive > 0) {
                const minActiveChunkId = Math.min(...Array.from(activeChunkIds));
                const primaryChunkData = validatedSpans.find(s => s.id === minActiveChunkId);
                if (primaryChunkData) {
                    const baseColor = this.getColor(primaryChunkData.id);
                    currentBgColor = numActive === 1 ? baseColor : this.darkenColor(baseColor, 0.65);
                    hoverTitle = `Chunk ${primaryChunkData.id} | Start: ${primaryChunkData.start} | End: ${primaryChunkData.end} | Tokens: ${primaryChunkData.tokens}${numActive > 1 ? ' (Overlap)' : ''}`;
                }
            }

            const textSegment = fullText.slice(lastProcessedIdx, eventIdx);
            if (textSegment) {
                const escapedSegment = textSegment
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;')
                    .replace(/\n/g, '<br>');

                if (currentBgColor !== "transparent") {
                    const titleAttr = hoverTitle ? ` title="${hoverTitle.replace(/"/g, '&quot;')}"` : '';
                    htmlParts.push(`<span style="background-color: ${currentBgColor};"${titleAttr}>`);
                    htmlParts.push(escapedSegment);
                    htmlParts.push('</span>');
                } else {
                    htmlParts.push(escapedSegment);
                }
            }

            lastProcessedIdx = eventIdx;
            if (eventType === 1) {
                activeChunkIds.add(chunkId);
            } else {
                activeChunkIds.delete(chunkId);
            }
        }

        // Process final segment
        if (lastProcessedIdx < textLength) {
            const textSegment = fullText.slice(lastProcessedIdx);
            const escapedSegment = textSegment
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
                .replace(/\n/g, '<br>');

            const numActive = activeChunkIds.size;
            let currentBgColor = "transparent";
            let hoverTitle = "";

            if (numActive > 0) {
                const minActiveChunkId = Math.min(...Array.from(activeChunkIds));
                const primaryChunkData = validatedSpans.find(s => s.id === minActiveChunkId);
                if (primaryChunkData) {
                    const baseColor = this.getColor(primaryChunkData.id);
                    currentBgColor = numActive === 1 ? baseColor : this.darkenColor(baseColor, 0.65);
                    hoverTitle = `Chunk ${primaryChunkData.id} | Start: ${primaryChunkData.start} | End: ${primaryChunkData.end} | Tokens: ${primaryChunkData.tokens}${numActive > 1 ? ' (Overlap)' : ''}`;
                }
            }

            if (currentBgColor !== "transparent") {
                const titleAttr = hoverTitle ? ` title="${hoverTitle.replace(/"/g, '&quot;')}"` : '';
                htmlParts.push(`<span style="background-color: ${currentBgColor};"${titleAttr}>`);
                htmlParts.push(escapedSegment);
                htmlParts.push('</span>');
            } else {
                htmlParts.push(escapedSegment);
            }
        }

        // Generate favicon
        let faviconLinkTag = "";
        try {
            const encodedSvg = Buffer.from(Visualizer.HIPPO_SVG_CONTENT).toString('base64');
            const faviconDataUri = `data:image/svg+xml;base64,${encodedSvg}`;
            faviconLinkTag = `<link rel="icon" type="image/svg+xml" href="${faviconDataUri}">`;
        } catch (error) {
            console.warn(`Warning: Could not encode embedded hippo favicon: ${error}`);
        }

        // Set colors based on theme
        const [bodyBgColor, contentBgColor, textColor] = 
            (this.themeName !== "custom" && this.themeName in DARK_THEMES)
                ? [BODY_BACKGROUND_COLOR_DARK, CONTENT_BACKGROUND_COLOR_DARK, TEXT_COLOR_DARK]
                : [BODY_BACKGROUND_COLOR_LIGHT, CONTENT_BACKGROUND_COLOR_LIGHT, TEXT_COLOR_LIGHT];

        // Assemble HTML
        const htmlContent = HTML_TEMPLATE
            .replace('{title}', title.replace(/"/g, '&quot;'))
            .replace('{favicon_link_tag}', faviconLinkTag)
            .replace('{body_bg_color}', bodyBgColor)
            .replace('{content_bg_color}', contentBgColor)
            .replace('{text_color}', textColor)
            .replace('{main_content}', MAIN_TEMPLATE.replace('{html_parts}', htmlParts.join('')))
            .replace('{footer_content}', FOOTER_TEMPLATE);

        // Write to file
        try {
            const filepath = path.resolve(filename);
            fs.writeFileSync(filepath, htmlContent, 'utf-8');
            console.log(`HTML visualization saved to: file://${filepath}`);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error: Could not write file '${filename}': ${error.message}`);
            }
            throw new Error(`An unexpected error occurred during file saving: ${error}`);
        }
    }

    /**
     * Return the string representation of the Visualizer.
     */
    public toString(): string {
        return `Visualizer(theme=${this.theme})`;
    }
}
