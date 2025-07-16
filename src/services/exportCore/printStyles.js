/**
 * Print-specific styles for dashboard export
 */

export const printStyles = `
  @media print {
    /* Page setup */
    @page {
      size: A4 landscape;
      margin: 15mm;
    }

    /* Ensure colors print */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    /* Hide non-printable elements */
    .no-print,
    button:not(.period-filter button),
    .sidebar,
    [data-export-ignore] {
      display: none !important;
    }

    /* Layout adjustments */
    body {
      margin: 0;
      padding: 0;
      background: white !important;
    }

    /* Ensure proper spacing */
    .space-y-6 > * + * {
      margin-top: 1rem !important;
    }

    /* Grid adjustments for print */
    .grid {
      display: grid !important;
    }

    /* Prevent page breaks inside elements */
    .dashboard-card,
    .metric-card,
    .section,
    table,
    .recharts-wrapper {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Ensure charts are visible */
    svg {
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
    }

    /* Fix shadows and borders for print */
    .shadow-md,
    .shadow-lg {
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) !important;
    }

    /* Ensure text is readable */
    .text-neutral-mid {
      color: #555 !important;
    }

    /* Header styling */
    h1, h2, h3 {
      color: #424046 !important;
      page-break-after: avoid !important;
    }

    /* Table styling */
    table {
      width: 100% !important;
      border-collapse: collapse !important;
    }

    th, td {
      border: 1px solid #e2e1e6 !important;
      padding: 8px !important;
    }

    /* Metric cards */
    .bg-white {
      background-color: white !important;
      border: 1px solid #e2e1e6 !important;
    }

    /* Business unit items */
    .bg-secondary-pale {
      background-color: #f5f5f5 !important;
      border: 1px solid #e2e1e6 !important;
    }

    /* Hide scrollbars */
    ::-webkit-scrollbar {
      display: none !important;
    }

    /* Ensure full width */
    .container,
    .mx-auto {
      max-width: 100% !important;
      width: 100% !important;
    }

    /* Fix positioning */
    .fixed,
    .sticky {
      position: relative !important;
    }

    /* Period filter styling */
    .period-filter {
      border: 1px solid #e2e1e6 !important;
      margin-bottom: 1rem !important;
    }

    /* Logo adjustments */
    img {
      max-width: 150px !important;
      height: auto !important;
    }
  }

  /* Non-print styles to prepare for export */
  .print-preview {
    background: white;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .print-preview .dashboard-card {
    margin-bottom: 20px;
    border: 1px solid #e2e1e6;
  }
`;

/**
 * Apply print styles to document
 */
export function applyPrintStyles() {
  // Check if print styles already exist
  if (document.getElementById('dashboard-print-styles')) {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = 'dashboard-print-styles';
  styleElement.textContent = printStyles;
  document.head.appendChild(styleElement);
}

/**
 * Remove print styles from document
 */
export function removePrintStyles() {
  const styleElement = document.getElementById('dashboard-print-styles');
  if (styleElement) {
    styleElement.remove();
  }
}

/**
 * Prepare dashboard for printing
 */
export function prepareDashboardForPrint() {
  // Apply print styles
  applyPrintStyles();

  // Add print-specific classes
  document.body.classList.add('print-mode');

  // Ensure all lazy-loaded content is visible
  const lazyElements = document.querySelectorAll('[data-lazy], .lazy-load');
  lazyElements.forEach(el => {
    el.classList.remove('lazy-load');
    el.classList.add('loaded');
  });

  // Expand any collapsed sections
  const collapsedSections = document.querySelectorAll('[data-collapsed="true"]');
  collapsedSections.forEach(section => {
    section.setAttribute('data-collapsed', 'false');
  });
}

/**
 * Restore dashboard after printing
 */
export function restoreDashboardAfterPrint() {
  document.body.classList.remove('print-mode');
}