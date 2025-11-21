import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'
import { format, parseISO } from 'date-fns'
import { Project, TimeEntry } from '../lib/types'
import { calculateTotalHours, groupEntriesByProject } from '../lib/utils.helpers'

interface ExportOptions {
  entries: TimeEntry[]
  projects: Project[]
  title?: string
  dateRange?: {
    start: string
    end: string
  }
}

export async function exportToWord(options: ExportOptions): Promise<void> {
  const { entries, projects, title = 'Timesheet Report', dateRange } = options

  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  
  // Calculate statistics
  const totalHours = calculateTotalHours(sortedEntries)
  const groupedByProject = groupEntriesByProject(sortedEntries)

  // Create document sections
  const sections: Paragraph[] = []

  // Title
  sections.push(
    new Paragraph({
      text: title,
      heading: 'Heading1',
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    })
  )

  // Date range (if provided)
  if (dateRange) {
    sections.push(
      new Paragraph({
        text: `Period: ${format(parseISO(dateRange.start), 'MMM d, yyyy')} - ${format(parseISO(dateRange.end), 'MMM d, yyyy')}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    )
  }

  // Summary section
  sections.push(
    new Paragraph({
      text: 'Summary',
      heading: 'Heading2',
      spacing: { before: 300, after: 200 }
    })
  )

  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Total Hours: ', bold: true }),
        new TextRun({ text: `${totalHours.toFixed(2)} hours` })
      ],
      spacing: { after: 100 }
    })
  )

  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Total Entries: ', bold: true }),
        new TextRun({ text: `${sortedEntries.length}` })
      ],
      spacing: { after: 100 }
    })
  )

  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Projects: ', bold: true }),
        new TextRun({ text: `${Object.keys(groupedByProject).length}` })
      ],
      spacing: { after: 300 }
    })
  )

  // Project breakdown
  sections.push(
    new Paragraph({
      text: 'Time by Project',
      heading: 'Heading2',
      spacing: { before: 300, after: 200 }
    })
  )

  Object.entries(groupedByProject).forEach(([projectId, projectEntries]) => {
    const project = projects.find(p => p.id === projectId)
    const projectHours = calculateTotalHours(projectEntries)
    const percentage = (projectHours / totalHours) * 100

    if (project) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${project.name}: `, bold: true }),
            new TextRun({ text: `${projectHours.toFixed(2)}h (${percentage.toFixed(1)}%)` })
          ],
          spacing: { after: 100 }
        })
      )
    }
  })

  // Detailed entries table
  sections.push(
    new Paragraph({
      text: 'Detailed Time Entries',
      heading: 'Heading2',
      spacing: { before: 400, after: 200 }
    })
  )

  // Create table
  const tableRows: TableRow[] = []

  // Header row
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Date', bold: true })] })],
          width: { size: 20, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Project', bold: true })] })],
          width: { size: 25, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Task', bold: true })] })],
          width: { size: 40, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: 'Hours', bold: true })],
            alignment: AlignmentType.RIGHT 
          })],
          width: { size: 15, type: WidthType.PERCENTAGE }
        })
      ]
    })
  )

  // Data rows
  sortedEntries.forEach(entry => {
    const project = projects.find(p => p.id === entry.projectId)
    
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: format(parseISO(entry.date), 'MMM d, yyyy') })]
          }),
          new TableCell({
            children: [new Paragraph({ text: project?.name || 'Unknown' })]
          }),
          new TableCell({
            children: [new Paragraph({ text: entry.task || '-' })]
          }),
          new TableCell({
            children: [new Paragraph({ text: `${entry.hours.toFixed(2)}`, alignment: AlignmentType.RIGHT })]
          })
        ]
      })
    )
  })

  // Total row
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: '' })],
          columnSpan: 3
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: `${totalHours.toFixed(2)}h`, bold: true })],
            alignment: AlignmentType.RIGHT 
          })]
        })
      ]
    })
  )

  const table = new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 }
    }
  })

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [...sections, table]
      }
    ]
  })

  // Generate and download
  try {
    const blob = await Packer.toBlob(doc)
    const fileName = `timesheet_${format(new Date(), 'yyyy-MM-dd')}.docx`
    saveAs(blob, fileName)
  } catch (error) {
    console.error('Error generating Word document:', error)
    throw new Error('Failed to generate Word document')
  }
}

// Export weekly timesheet
export async function exportWeeklyTimesheet(
  entries: TimeEntry[],
  projects: Project[],
  weekStart: Date,
  weekEnd: Date
): Promise<void> {
  await exportToWord({
    entries,
    projects,
    title: 'Weekly Timesheet',
    dateRange: {
      start: format(weekStart, 'yyyy-MM-dd'),
      end: format(weekEnd, 'yyyy-MM-dd')
    }
  })
}

// Export all time entries
export async function exportAllEntries(
  entries: TimeEntry[],
  projects: Project[]
): Promise<void> {
  await exportToWord({
    entries,
    projects,
    title: 'Complete Timesheet Report'
  })
}
