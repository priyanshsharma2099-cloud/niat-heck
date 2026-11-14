import { jsPDF } from 'jspdf';
import { Store, Review, ActionTask, TrendAlert, DashboardMetrics } from '../types';

export function exportWeeklyExecutivePdfReport(
  store: Store,
  reviews: Review[],
  tasks: ActionTask[],
  alerts: TrendAlert[],
  metrics: DashboardMetrics
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header Dark Banner (#18181B Luminous Ink)
  doc.setFillColor(24, 24, 27);
  doc.roundedRect(14, y, pageWidth - 28, 30, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CLUEY CART | Weekly Executive Feedback Report', 20, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(190, 200, 230);
  doc.text(
    `Store: ${store.name} (${store.platform})  |  Category: ${store.category}  |  Generated: ${new Date().toLocaleDateString(
      'en-US',
      { dateStyle: 'medium' }
    )}`,
    20,
    y + 21
  );

  y += 38;

  // Section 1: Store Persona & Noise Filter Rules
  doc.setTextColor(24, 24, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Active Store Persona & Noise Rules', 14, y);
  y += 6;

  doc.setFillColor(248, 248, 245);
  doc.setDrawColor(220, 220, 215);
  doc.roundedRect(14, y, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 65);
  doc.text('Target Demographic:', 18, y + 6);
  doc.text('Brand Tone:', 18, y + 11);
  doc.text('Ignored Noise Patterns:', 18, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.text(store.target_demographic || 'Discerning boutique buyers', 55, y + 6);
  doc.text(store.brand_tone || 'Warm Boutique', 55, y + 11);
  doc.text((store.ignore_keywords || []).join(', ') || 'Courier delays, outer packaging damage', 55, y + 16);

  y += 27;

  // Section 2: Executive KPI Strip
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 24, 27);
  doc.text('2. Feedback Telemetry & Signal-to-Noise KPIs', 14, y);
  y += 6;

  const colWidth = (pageWidth - 28 - 9) / 4;
  const kpis = [
    { label: 'Signal Kept %', val: `${metrics.signalKeptPercent}%` },
    { label: 'Positive Sentiment %', val: `${metrics.positivePercent}%` },
    { label: 'Noise Filtered Out', val: `${metrics.noiseFilteredCount} reviews` },
    { label: 'Weekly Tasks Open', val: `${metrics.openTasksCount}` },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (colWidth + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 220, 215);
    doc.roundedRect(x, y, colWidth, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 115);
    doc.text(kpi.label, x + 3.5, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(24, 24, 27);
    doc.text(kpi.val, x + 3.5, y + 12.5);
  });

  y += 24;

  // Section 3: Smart Sentiment Trend Spike Alerts
  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  if (activeAlerts.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(190, 18, 60);
    doc.text('3. Smart Sentiment Trend Spike Alerts', 14, y);
    y += 6;

    activeAlerts.forEach((alt) => {
      doc.setFillColor(255, 241, 242);
      doc.setDrawColor(254, 205, 211);
      doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(190, 18, 60);
      doc.text(`[${alt.severity.toUpperCase()}] Spike on ${alt.topic} (+${alt.delta_percent}%)`, 18, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 20, 30);
      doc.text(doc.splitTextToSize(alt.summary, pageWidth - 36), 18, y + 11);

      y += 19;
    });
    y += 4;
  }

  // Section 4: Prioritized Action Checklist
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 24, 27);
  doc.text('4. Prioritized Weekly Action Checklist', 14, y);
  y += 6;

  if (tasks.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 125);
    doc.text('No action items currently pending. Ingest customer reviews to auto-generate weekly actions.', 18, y + 4);
    y += 12;
  } else {
    tasks.slice(0, 6).forEach((task) => {
      const statusIcon = task.completed ? '[DONE]' : '[TODO]';
      const isHigh = task.priority === 'high';

      if (task.completed) {
        doc.setFillColor(245, 245, 245);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.setDrawColor(220, 220, 215);
      doc.roundedRect(14, y, pageWidth - 28, 20, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      if (isHigh) {
        doc.setTextColor(190, 18, 60);
      } else {
        doc.setTextColor(24, 24, 27);
      }
      doc.text(`${statusIcon} [${task.priority.toUpperCase()}] ${task.title}`, 18, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(90, 90, 95);
      const descLines = doc.splitTextToSize(task.description || task.impact_estimate || '', pageWidth - 36);
      doc.text(descLines.slice(0, 2), 18, y + 10.5);

      if (task.evidence_quote) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(130, 130, 135);
        doc.text(`Evidence: "${task.evidence_quote.slice(0, 90)}..."`, 18, y + 17);
      }

      y += 23;
    });
  }

  // Footer Branding
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 145);
  doc.text('Generated by CLUEY CART: The Niche-Aware AI Feedback & Action Engine', 14, doc.internal.pageSize.getHeight() - 10);

  doc.save(`cluey-cart-weekly-report-${store.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`);
}

// Backwards-compatibility alias
export const generateWeeklyExecutiveReport = (
  persona: any,
  reviews: any[],
  actions: any[],
  alerts: any[],
  metrics: any
) => {
  return exportWeeklyExecutivePdfReport(persona, reviews, actions, alerts, metrics);
};
