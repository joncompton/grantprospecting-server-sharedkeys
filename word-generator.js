// word-generator.js
// Creates professionally formatted Word documents from grant research results

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
        PageNumber, LevelFormat, HeadingLevel } = require('docx');
const fs = require('fs');

// CRITICAL: Follow docx skill guidelines
// - US Letter page size (12240 x 15840 DXA)
// - Arial font throughout
// - Use LevelFormat.BULLET for lists (never unicode bullets)
// - Set table widths at both table and cell level

async function generateGrantReportWord(data) {
    const { text, orgDescription, contextParameters, timestamp } = data;
    
    // Parse the research text into grants (basic parser - enhance based on actual format)
    const grants = parseGrantText(text);
    
    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: "Arial", size: 24 } // 12pt default
                }
            },
            paragraphStyles: [
                {
                    id: "Heading1",
                    name: "Heading 1",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: 32, bold: true, font: "Arial", color: "1e5f8c" },
                    paragraph: { 
                        spacing: { before: 240, after: 240 },
                        outlineLevel: 0 
                    }
                },
                {
                    id: "Heading2",
                    name: "Heading 2",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: 28, bold: true, font: "Arial", color: "2d8659" },
                    paragraph: { 
                        spacing: { before: 180, after: 180 },
                        outlineLevel: 1 
                    }
                },
                {
                    id: "Heading3",
                    name: "Heading 3",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: 26, bold: true, font: "Arial" },
                    paragraph: { 
                        spacing: { before: 120, after: 120 },
                        outlineLevel: 2 
                    }
                }
            ]
        },
        numbering: {
            config: [
                {
                    reference: "bullets",
                    levels: [
                        {
                            level: 0,
                            format: LevelFormat.BULLET,
                            text: "•",
                            alignment: AlignmentType.LEFT,
                            style: {
                                paragraph: {
                                    indent: { left: 720, hanging: 360 }
                                }
                            }
                        }
                    ]
                }
            ]
        },
        sections: [
            {
                properties: {
                    page: {
                        // CRITICAL: Use US Letter, not A4 default
                        size: {
                            width: 12240,  // 8.5 inches
                            height: 15840  // 11 inches
                        },
                        margin: {
                            top: 1440,    // 1 inch
                            right: 1440,
                            bottom: 1440,
                            left: 1440
                        }
                    }
                },
                headers: {
                    default: new Header({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [
                                    new TextRun({
                                        text: "Grant Prospecting Report",
                                        size: 20,
                                        color: "586069"
                                    })
                                ]
                            })
                        ]
                    })
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: "Page ",
                                        size: 20,
                                        color: "586069"
                                    }),
                                    new TextRun({
                                        children: [PageNumber.CURRENT],
                                        size: 20,
                                        color: "586069"
                                    })
                                ]
                            })
                        ]
                    })
                },
                children: [
                    // Title
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        children: [
                            new TextRun("Grant Prospecting Report")
                        ]
                    }),
                    
                    // Date
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Generated: ${new Date(timestamp).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}`,
                                size: 22,
                                color: "586069"
                            })
                        ],
                        spacing: { after: 240 }
                    }),

                    // Organization Context section
                    ...(orgDescription ? [
                        new Paragraph({
                            heading: HeadingLevel.HEADING_2,
                            children: [
                                new TextRun("Organization Profile")
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun(orgDescription)
                            ],
                            spacing: { after: 240 }
                        })
                    ] : []),

                    // Search Parameters section
                    ...(contextParameters && contextParameters.length > 0 ? [
                        new Paragraph({
                            heading: HeadingLevel.HEADING_2,
                            children: [
                                new TextRun("Search Parameters")
                            ]
                        }),
                        ...contextParameters.map(param => 
                            new Paragraph({
                                numbering: {
                                    reference: "bullets",
                                    level: 0
                                },
                                children: [
                                    new TextRun({
                                        text: `${param.label}: `,
                                        bold: true
                                    }),
                                    new TextRun(param.description)
                                ]
                            })
                        ),
                        new Paragraph({
                            children: [new TextRun("")],
                            spacing: { after: 240 }
                        })
                    ] : []),

                    // Grant Opportunities section
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [
                            new TextRun("Grant Opportunities")
                        ]
                    }),

                    // Add grants
                    ...createGrantSections(grants)
                ]
            }
        ]
    });

    return await Packer.toBuffer(doc);
}

// Parse grant text into structured data
function parseGrantText(text) {
    const grants = [];
    
    // Basic parser - splits by common grant delimiters
    // Enhance this based on actual Claude output format
    const sections = text.split(/\n\n(?=\d+\.|Grant|Foundation)/);
    
    for (const section of sections) {
        if (section.trim().length > 50) { // Minimum length for a grant entry
            const lines = section.split('\n').filter(l => l.trim());
            
            if (lines.length > 0) {
                grants.push({
                    raw: section,
                    title: extractTitle(lines[0]),
                    organization: extractOrganization(section),
                    amount: extractAmount(section),
                    deadline: extractDeadline(section),
                    description: section
                });
            }
        }
    }
    
    return grants;
}

function extractTitle(firstLine) {
    // Remove numbering and common prefixes
    return firstLine.replace(/^\d+\.\s*/, '')
                   .replace(/^Grant:\s*/i, '')
                   .replace(/^Foundation:\s*/i, '')
                   .trim();
}

function extractOrganization(text) {
    const match = text.match(/(?:Foundation|Organization|Funder):\s*([^\n]+)/i);
    return match ? match[1].trim() : null;
}

function extractAmount(text) {
    const match = text.match(/(?:Amount|Funding|Grant Size):\s*([^\n]+)/i);
    return match ? match[1].trim() : null;
}

function extractDeadline(text) {
    const match = text.match(/(?:Deadline|Due|Application Due):\s*([^\n]+)/i);
    return match ? match[1].trim() : null;
}

// Create formatted grant sections
function createGrantSections(grants) {
    const sections = [];
    
    grants.forEach((grant, index) => {
        // Grant title
        sections.push(
            new Paragraph({
                heading: HeadingLevel.HEADING_3,
                children: [
                    new TextRun(`${index + 1}. ${grant.title || 'Grant Opportunity'}`)
                ]
            })
        );

        // Grant details table if we have structured data
        if (grant.organization || grant.amount || grant.deadline) {
            const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
            const borders = { top: border, bottom: border, left: border, right: border };
            
            const rows = [];
            
            if (grant.organization) {
                rows.push(createTableRow("Organization", grant.organization, borders));
            }
            if (grant.amount) {
                rows.push(createTableRow("Amount", grant.amount, borders));
            }
            if (grant.deadline) {
                rows.push(createTableRow("Deadline", grant.deadline, borders));
            }
            
            sections.push(
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    columnWidths: [2800, 6560], // Label: 2800, Value: 6560 (total 9360 for content width)
                    rows: rows
                })
            );
        }

        // Grant description
        sections.push(
            new Paragraph({
                children: [
                    new TextRun(grant.description)
                ],
                spacing: { before: 180, after: 360 }
            })
        );
    });
    
    return sections;
}

// Helper function to create table rows
function createTableRow(label, value, borders) {
    return new TableRow({
        children: [
            new TableCell({
                borders,
                width: { size: 2800, type: WidthType.DXA },
                shading: { fill: "D5E8F0", type: ShadingType.CLEAR }, // CRITICAL: Use CLEAR not SOLID
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: label,
                                bold: true,
                                size: 22
                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                borders,
                width: { size: 6560, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: value,
                                size: 22
                            })
                        ]
                    })
                ]
            })
        ]
    });
}

module.exports = { generateGrantReportWord };
