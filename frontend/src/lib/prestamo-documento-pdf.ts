import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  numeroALetras,
  DirectivaCargoPDFData,
  EmpresaPDFData,
} from "./certificados-pdf";
import { formatFecha } from "./utils";
import { extraerDatosPersonalesDeNotas } from "./socios-datos-personales";

export interface PrestamoPDFData {
  id: string;
  numero: number;
  socioId?: string | null;
  socioCodigo?: number | null;
  socioNombreCompleto: string;
  socioDocumento: string;
  montoPrincipal: number;
  tasaMensual: number;
  nroCuotas: number;
  metodoAmortizacion: string;
  fechaDesembolso: string;
  fechaPrimeraCuota: string;
  estado: string;
  proposito?: string | null;
  capitalPagado?: number;
  saldoCapital?: number;
  interesPagado?: number;
  cuotasPagadas?: number;
  cuotasVencidas?: number;
  createdAt?: string;
}

export interface CuotaPDFData {
  id?: string;
  nroCuota: number;
  fechaVencimiento: string;
  capitalProgramado: number;
  interesProgramado: number;
  cuotaProgramada: number;
  capitalPagado: number;
  interesPagado: number;
  moraPagada?: number;
  saldoCapital: number;
  estado: "PENDIENTE" | "PARCIAL" | "PAGADA" | "VENCIDA" | string;
  fechaPago?: string | null;
}

export interface SocioFichaPDFData {
  id?: string;
  codigo?: number | null;
  nombres?: string;
  apellidos?: string;
  nombreCompleto?: string;
  documentoNumero?: string | null;
  numeroDocumento?: string | null;
  documentoEnmascarado?: string | null;
  documentoTipo?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  notas?: string | null;
  ocupacion?: string;
  edad?: string;
  sexo?: string;
  estadoCivil?: string;
  personasEnCasa?: string;
  adjuntaDni?: boolean;
  adjuntaRecibo?: boolean;
  adjuntaOtros?: string;
  observaciones?: string;
}

function formatearFechaFormal(fechaIso?: string | null): string {
  if (!fechaIso) return new Date().toLocaleDateString("es-PE");
  try {
    const [y, m, d] = fechaIso.split("T")[0].split("-");
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre"
    ];
    const mesIndex = parseInt(m, 10) - 1;
    if (mesIndex >= 0 && mesIndex < 12) {
      return `${parseInt(d, 10)} de ${meses[mesIndex]} de ${y}`;
    }
    return fechaIso;
  } catch {
    return fechaIso;
  }
}

function limpiarNombreArchivo(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function formatearMetodo(metodo: string): string {
  switch (metodo) {
    case "CAPITAL_FIJO_INTERES_SOBRE_SALDO":
      return "Capital Fijo + Interés sobre Saldo (Rebatir)";
    case "CUOTA_FIJA":
      return "Cuota Fija (Método Francés)";
    case "AL_VENCIMIENTO":
      return "Al Vencimiento (Pago Único)";
    default:
      return metodo ? metodo.replace(/_/g, " ") : "Cuota Fija";
  }
}

/**
 * Genera el documento completo de crédito, cronograma de amortización,
 * pagaré notarial y bloque de firmas institucionales en PDF.
 */
export function generarDocumentoPrestamoPDF(params: {
  prestamo: PrestamoPDFData;
  cronograma: CuotaPDFData[];
  socio?: SocioFichaPDFData | null;
  directiva?: DirectivaCargoPDFData[];
  empresa?: EmpresaPDFData | null;
}): jsPDF {
  const { prestamo, cronograma, socio, directiva = [], empresa } = params;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  // Extracción de datos institucionales
  const nombreEmpresa = (empresa?.nombre || "CAJA COMUNAL EMPRENDE CHAMBALA").toUpperCase();
  const nombreComercial = (empresa?.nombreComercial || "UNIÓN DE CRÉDITO Y AHORRO (UNICA)").toUpperCase();
  const rucEmpresa = empresa?.ruc || "20608945123";
  const ciudadLugar = empresa?.distrito || empresa?.provincia || "Concepción";
  const deptoLugar = empresa?.departamento || "Junín";
  const paisLugar = empresa?.pais || "Perú";
  const ubicacionStr = `${ciudadLugar} — ${deptoLugar}, ${paisLugar}`;

  // Datos del socio enriquecidos
  const fichaNotas = extraerDatosPersonalesDeNotas(socio?.notas);
  const nombreSocio =
    socio?.nombreCompleto ||
    (socio?.apellidos && socio?.nombres ? `${socio.apellidos} ${socio.nombres}` : prestamo.socioNombreCompleto);
  const dniSocio =
    socio?.documentoNumero ||
    socio?.numeroDocumento ||
    fichaNotas?.dni ||
    socio?.documentoEnmascarado ||
    (prestamo.socioDocumento && prestamo.socioDocumento.length >= 8 ? prestamo.socioDocumento : "—");
  const docTipoSocio = socio?.documentoTipo || "DNI";
  const codigoSocio = socio?.codigo || prestamo.socioCodigo;
  const direccionSocio = socio?.direccion || fichaNotas?.direccion || "Comunidad de Chambala";
  const telefonoSocio = socio?.telefono || fichaNotas?.telefono || "—";
  const emailSocio = socio?.email || fichaNotas?.email || "—";
  const ocupacionSocio = fichaNotas?.ocupacion || socio?.ocupacion || "Agricultor / Emprendedor";
  const estadoCivilSocio = fichaNotas?.estadoCivil || socio?.estadoCivil || "—";
  const edadSocio = fichaNotas?.edad || socio?.edad || "—";

  // Identificación de cargos de la directiva (igual que certificados)
  const pres = directiva.find((d) => d.cargo && d.cargo.toUpperCase().includes("PRESIDENTE")) || {
    nombreCompleto: "HUAMAN MORAN CIRILO ENRIQUE",
    cargoTitulo: "Presidente",
    numeroDocumento: "09812345",
    tipoDocumento: "DNI",
  };

  const tes = directiva.find((d) => d.cargo && d.cargo.toUpperCase().includes("TESORERO")) || {
    nombreCompleto: "LAIME CCACCRO ALICIA",
    cargoTitulo: "Tesorero(a)",
    numeroDocumento: "10876543",
    tipoDocumento: "DNI",
  };

  const sec = directiva.find((d) => d.cargo && d.cargo.toUpperCase().includes("SECRETARIO")) || {
    nombreCompleto: "LAIME CCACCRO DORIS HAYDEE",
    cargoTitulo: "Secretario(a)",
    numeroDocumento: "41765432",
    tipoDocumento: "DNI",
  };

  // Función para dibujar marco institucional en cualquier página
  const dibujarMarcoPagina = (numPag: number, totalPags: number) => {
    // Marco exterior azul marino
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.8);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

    // Marco interior fino dorado
    doc.setDrawColor(180, 130, 40);
    doc.setLineWidth(0.3);
    doc.rect(9.5, 9.5, pageWidth - 19, pageHeight - 19);

    // Pie de página
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${nombreComercial} • Documento Oficial de Crédito #${prestamo.numero} • ${ubicacionStr}`,
      marginX,
      pageHeight - 11
    );
    doc.text(`Página ${numPag} de ${totalPags}`, pageWidth - marginX, pageHeight - 11, { align: "right" });
  };

  // =========================================================================
  // PÁGINA 1: EXPEDIENTE DE CRÉDITO Y CRONOGRAMA DE AMORTIZACIÓN
  // =========================================================================

  // Encabezado institucional
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text(nombreComercial, marginX, 17);

  doc.setFont("times", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(55, 65, 81);
  doc.text(nombreEmpresa, marginX, 21.5);

  doc.setFont("times", "italic");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`RUC: ${rucEmpresa} • ${ubicacionStr}`, pageWidth - marginX, 17, { align: "right" });
  doc.text(`Fecha de Emisión: ${formatearFechaFormal(prestamo.fechaDesembolso)}`, pageWidth - marginX, 21.5, {
    align: "right",
  });

  // Línea separadora encabezado
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.5);
  doc.line(marginX, 24, pageWidth - marginX, 24);

  // Título del Expediente
  doc.setFillColor(243, 244, 246);
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, 26, contentWidth, 11.5, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `EXPEDIENTE OFICIAL DE CRÉDITO Y CRONOGRAMA DE PAGOS Nº ${String(prestamo.numero).padStart(6, "0")}`,
    pageWidth / 2,
    33.5,
    { align: "center" }
  );

  // SECCIÓN I: DATOS DEL SOCIO / PRESTATARIO
  let curY = 41;
  doc.setFillColor(30, 58, 138);
  doc.rect(marginX, curY, contentWidth, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("I. DATOS DEL SOCIO PRESTATARIO (FICHA PERSONAL)", marginX + 3, curY + 4);

  curY += 5.5;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(marginX, curY, contentWidth, 23, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);

  // Fila 1: Nombre completo, Código, DNI
  doc.text("Socio Titular:", marginX + 3, curY + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(nombreSocio.toUpperCase(), marginX + 23, curY + 4.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.text("Código:", marginX + 115, curY + 4.5);
  doc.setFont("courier", "bold");
  doc.setTextColor(30, 58, 138);
  doc.text(codigoSocio ? `#${String(codigoSocio).padStart(3, "0")}` : "Externo", marginX + 128, curY + 4.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.text(`${docTipoSocio}:`, marginX + 148, curY + 4.5);
  doc.setFont("courier", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(dniSocio, marginX + 158, curY + 4.5);

  // Fila 2: Dirección y Teléfono
  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.text("Dirección:", marginX + 3, curY + 9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(direccionSocio, marginX + 23, curY + 9.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.text("Teléfono:", marginX + 115, curY + 9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(telefonoSocio, marginX + 130, curY + 9.5);

  // Fila 3: Ocupación, Estado Civil, Edad
  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.text("Ocupación:", marginX + 3, curY + 14.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(ocupacionSocio, marginX + 23, curY + 14.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.text("Estado Civil:", marginX + 90, curY + 14.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(estadoCivilSocio, marginX + 110, curY + 14.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.text("Edad:", marginX + 148, curY + 14.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(edadSocio ? `${edadSocio} años` : "—", marginX + 158, curY + 14.5);

  // Fila 4: Documentos verificados
  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.text("Documentación en Legajo:", marginX + 3, curY + 19.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 58, 138);
  doc.text(
    `[ X ] Copia DNI Vigente     [ X ] Recibo de Servicios Básicos     [ X ] Ficha Registral de Socio`,
    marginX + 42,
    curY + 19.5
  );

  // SECCIÓN II: CONDICIONES FINANCIERAS DEL CRÉDITO
  curY += 26;
  doc.setFillColor(30, 58, 138);
  doc.rect(marginX, curY, contentWidth, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("II. CONDICIONES FINANCIERAS Y CONDICIONES DEL CRÉDITO", marginX + 3, curY + 4);

  curY += 5.5;

  // 4 Cuadros métricos
  const wMetric = (contentWidth - 6) / 4;
  const hMetric = 15;

  const metricas = [
    {
      titulo: "CAPITAL OTORGADO",
      valor: `S/. ${Number(prestamo.montoPrincipal).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`,
      sub: "Desembolso en efectivo",
      color: [16, 185, 129],
    },
    {
      titulo: "TASA DE INTERÉS",
      valor: `${(prestamo.tasaMensual * 100).toFixed(1)}% mensual`,
      sub: "Interés compensatorio",
      color: [30, 58, 138],
    },
    {
      titulo: "PLAZO Y CUOTAS",
      valor: `${prestamo.nroCuotas} cuotas`,
      sub: "Periodicidad mensual",
      color: [15, 23, 42],
    },
    {
      titulo: "ESTADO ACTUAL",
      valor: prestamo.estado,
      sub: prestamo.estado === "VIGENTE" ? "En cobranza activa" : "Registrado en caja",
      color: prestamo.estado === "CANCELADO" ? [16, 185, 129] : [217, 119, 6],
    },
  ];

  metricas.forEach((m, idx) => {
    const x = marginX + idx * (wMetric + 2);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, curY, wMetric, hMetric, 1.2, 1.2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(m.titulo, x + wMetric / 2, curY + 4.2, { align: "center" });

    doc.setFont("courier", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.valor, x + wMetric / 2, curY + 9.5, { align: "center" });

    doc.setFont("times", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(107, 114, 128);
    doc.text(m.sub, x + wMetric / 2, curY + 13.2, { align: "center" });
  });

  curY += hMetric + 2;

  // Cuadro con Importe en Letras y Modalidad
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(202, 138, 4);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, curY, contentWidth, 12, 1.2, 1.2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(113, 63, 18);
  doc.text("IMPORTE EN LETRAS:", marginX + 3, curY + 4.5);

  doc.setFont("times", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(numeroALetras(prestamo.montoPrincipal), marginX + 34, curY + 4.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(113, 63, 18);
  doc.text("SISTEMA DE AMORTIZACIÓN:", marginX + 3, curY + 9.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(formatearMetodo(prestamo.metodoAmortizacion), marginX + 46, curY + 9.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(113, 63, 18);
  doc.text("DESTINO:", marginX + 115, curY + 9.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(prestamo.proposito || "Capital de trabajo / Emprendimiento comunal", marginX + 130, curY + 9.5, {
    maxWidth: contentWidth - 132,
  });

  // SECCIÓN III: CRONOGRAMA DE AMORTIZACIÓN Y PAGOS (TABLA DE CUOTAS)
  curY += 15;
  doc.setFillColor(30, 58, 138);
  doc.rect(marginX, curY, contentWidth, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("III. CRONOGRAMA DE AMORTIZACIÓN Y CONTROL DE PAGOS", marginX + 3, curY + 4);

  curY += 6.5;

  const formatMonto = (num: number) =>
    `S/. ${Number(num).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const filasTabla = cronograma.map((c) => [
    `#${c.nroCuota}`,
    formatFecha(c.fechaVencimiento),
    formatMonto(c.capitalProgramado),
    formatMonto(c.interesProgramado),
    formatMonto(c.cuotaProgramada),
    formatMonto(c.saldoCapital),
    c.estado,
    c.fechaPago ? formatFecha(c.fechaPago) : "—",
  ]);

  const totalCap = cronograma.reduce((acc, c) => acc + Number(c.capitalProgramado), 0);
  const totalInt = cronograma.reduce((acc, c) => acc + Number(c.interesProgramado), 0);
  const totalCuotas = totalCap + totalInt;

  autoTable(doc, {
    startY: curY,
    tableWidth: contentWidth, // 182 mm exacto para coincidir con la cabecera y márgenes
    margin: { left: marginX, right: marginX },
    head: [["N° Cuota", "Vencimiento", "Capital", "Interés", "Total Cuota", "Saldo Deuda", "Estado", "F. Pago"]],
    body: filasTabla,
    foot: [
      [
        "TOTALES",
        `${cronograma.length} cuotas`,
        formatMonto(totalCap),
        formatMonto(totalInt),
        formatMonto(totalCuotas),
        "—",
        prestamo.estado,
        "—",
      ],
    ],
    theme: "grid",
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 1.8, bottom: 1.8, left: 1.5, right: 1.5 },
      font: "helvetica",
      textColor: [31, 41, 55],
      valign: "middle",
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      fontSize: 7.5,
      lineColor: [30, 58, 138],
      lineWidth: 0.2,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: "bold",
      fontSize: 7.5,
      valign: "middle",
      lineColor: [203, 213, 225],
      lineWidth: 0.3,
    },
    // Suma exacta de anchos: 16 + 22 + 24 + 22 + 26 + 24 + 24 + 24 = 182 mm
    columnStyles: {
      0: { halign: "center", font: "courier", fontStyle: "bold", cellWidth: 16 },
      1: { halign: "center", cellWidth: 22 },
      2: { halign: "right", font: "courier", fontStyle: "bold", cellWidth: 24 },
      3: { halign: "right", font: "courier", cellWidth: 22 },
      4: { halign: "right", font: "courier", fontStyle: "bold", textColor: [30, 58, 138], cellWidth: 26 },
      5: { halign: "right", font: "courier", cellWidth: 24 },
      6: { halign: "center", fontStyle: "bold", cellWidth: 24 },
      7: { halign: "center", cellWidth: 24 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 6) {
        const val = String(data.cell.raw);
        if (val === "PAGADA") data.cell.styles.textColor = [16, 185, 129];
        else if (val === "VENCIDA") data.cell.styles.textColor = [220, 38, 38];
        else if (val === "PARCIAL") data.cell.styles.textColor = [37, 99, 235];
        else data.cell.styles.textColor = [217, 119, 6];
      }
      if (data.section === "foot") {
        data.cell.styles.valign = "middle";
        // Las columnas de texto, cuotas, saldo, estado y fecha de pago deben estar perfectamente centradas
        if (
          data.column.index === 0 ||
          data.column.index === 1 ||
          data.column.index === 5 ||
          data.column.index === 6 ||
          data.column.index === 7
        ) {
          data.cell.styles.halign = "center";
          data.cell.styles.font = "helvetica";
        } else {
          // Columnas monetarias: alineadas a la derecha con fuente courier
          data.cell.styles.halign = "right";
          data.cell.styles.font = "courier";
        }
      }
    },
  });

  // Resumen al pie de la tabla en la página 1
  const finalYTable = (doc as any).lastAutoTable?.finalY || 180;
  doc.setFont("times", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "* Las cuotas deben ser abonadas puntualmente en cada reunión mensual ordinaria de la UNICA. El incumplimiento genera mora e inhabilitación crediticia.",
    marginX,
    finalYTable + 5
  );

  // =========================================================================
  // PÁGINA 2: PAGARÉ POR SOLES, COMPROMISO DE PAGO Y FIRMAS DE LA DIRECTIVA
  // =========================================================================
  doc.addPage("a4", "portrait");

  // Encabezado PÁGINA 2
  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(30, 58, 138);
  doc.text(nombreComercial, marginX, 17);

  doc.setFont("times", "italic");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`RUC: ${rucEmpresa} • Pagaré y Contrato Oficial de Crédito`, pageWidth - marginX, 17, { align: "right" });

  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.4);
  doc.line(marginX, 20, pageWidth - marginX, 20);

  let y2 = 25;

  // SECCIÓN IV: PAGARÉ POR SOLES (TÍTULO VALOR)
  doc.setFillColor(30, 58, 138);
  doc.rect(marginX, y2, contentWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("IV. PAGARÉ POR SOLES (TÍTULO VALOR CON MÉRITO EJECUTIVO)", marginX + 3, y2 + 4.3);

  y2 += 6;

  // Caja destacada del Pagaré
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(marginX, y2, contentWidth, 42, "FD");

  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `PAGARÉ POR: S/. ${Number(prestamo.montoPrincipal).toLocaleString("es-PE", { minimumFractionDigits: 2 })} SOLES`,
    marginX + 4,
    y2 + 6
  );

  doc.setFont("times", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(31, 41, 55);

  const textoPagare =
    `Yo, ${nombreSocio.toUpperCase()}, mayor de edad, identificado(a) con ${docTipoSocio} Nº ${dniSocio}, ` +
    `con domicilio legal en ${direccionSocio}, en mi calidad de socio de la ${nombreComercial} — ${nombreEmpresa}, ` +
    `prometo formalmente que pagaré incondicionalmente, sin protesto y a la orden de la ${nombreEmpresa}, ` +
    `la suma principal de S/. ${Number(prestamo.montoPrincipal).toFixed(2)} (${numeroALetras(prestamo.montoPrincipal)}), ` +
    `más el interés compensatorio pactado del ${(prestamo.tasaMensual * 100).toFixed(1)}% mensual, distribuido en ` +
    `${prestamo.nroCuotas} cuotas mensuales según el cronograma de amortización aprobado que forma parte integrante del presente título valor.\n\n` +
    `El pago se realizará en moneda de curso legal en las reuniones ordinarias de la Caja Comunal o mediante depósito en la cuenta institucional autorizada. ` +
    `En caso de mora o incumplimiento, se devengarán los intereses moratorios correspondientes y la institución queda plenamente facultada para ejercer las acciones ejecutivas de cobranza.`;

  doc.text(textoPagare, marginX + 4, y2 + 11.5, {
    maxWidth: contentWidth - 8,
    align: "justify",
    lineHeightFactor: 1.25,
  });

  y2 += 46;

  // SECCIÓN V: DOCUMENTO PRIVADO DE COMPROMISO DE PAGO Y AFECTACIÓN DE ACCIONES
  doc.setFillColor(30, 58, 138);
  doc.rect(marginX, y2, contentWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("V. COMPROMISO PRIVADO DE PAGO Y GARANTÍA SOCIAL EN ACCIONES", marginX + 3, y2 + 4.3);

  y2 += 6;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(marginX, y2, contentWidth, 38, "FD");

  doc.setFont("times", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(31, 41, 55);

  const textoCompromiso =
    `1. GARANTÍA SOCIAL: El prestatario deja voluntariamente en posesión, afectación y prenda de la UNICA la totalidad ` +
    `de sus acciones sociales suscritas y pagadas en la Matrícula de Acciones, sus aportes y los fondos de utilidades anuales ` +
    `líquidas generadas o por liquidarse en la Asamblea General de la asociación, como respaldo y garantía real de la obligación asumida.\n\n` +
    `2. AUTORIZACIÓN DE EJECUCIÓN: En caso de incurrir en mora o retraso reiterado en el pago de las cuotas, autorizo expresa ` +
    `e irrevocablemente a la Junta Directiva a retener y aplicar mis utilidades, ahorros y, de ser necesario, ejecutar o desdoblar ` +
    `el traspaso formal de mis acciones sociales para amortizar o liquidar la deuda insoluta de capital e intereses.\n\n` +
    `3. CONFORMIDAD: Me comprometo a cumplir estrictamente con los Estatutos Sociales y no interponer acción en contrario. ` +
    `Y para constancia formal, firmo y estampo mi huella digital en ${ciudadLugar}, el ${formatearFechaFormal(prestamo.fechaDesembolso)}.`;

  doc.text(textoCompromiso, marginX + 4, y2 + 5.5, {
    maxWidth: contentWidth - 8,
    align: "justify",
    lineHeightFactor: 1.25,
  });

  y2 += 43;

  // SECCIÓN VI: BLOQUE DE FIRMAS OFICIALES
  // (IDÉNTICAS A LAS DE LOS CERTIFICADOS DE ACCIONES + FIRMAS DEL SOCIO Y AVAL)
  doc.setFillColor(30, 58, 138);
  doc.rect(marginX, y2, contentWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    "VI. SUSCRIPCIÓN FORMAL: JUNTA DIRECTIVA (AUTORIZACIÓN) Y PRESTATARIO (DEUDOR / AVAL)",
    marginX + 3,
    y2 + 4.3
  );

  y2 += 8;

  // --- SUB-BLOQUE A: JUNTA DIRECTIVA (PRESIDENTE, SECRETARIO, TESORERO) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  doc.text("JUNTA DIRECTIVA DE LA CAJA COMUNAL (COMITÉ DE CRÉDITO Y ADMINISTRACIÓN)", marginX + 1, y2 + 2);

  y2 += 4;

  const wDirectiva = contentWidth / 3;

  // 1. PRESIDENTE(A)
  const xPres = marginX + wDirectiva * 0.5;
  doc.setDrawColor(55, 65, 81);
  doc.setLineWidth(0.4);
  doc.line(xPres - 25, y2 + 18, xPres + 25, y2 + 18);

  doc.setFont("times", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(pres.nombreCompleto.toUpperCase(), xPres, y2 + 22, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  doc.text(pres.cargoTitulo || "Presidente(a)", xPres, y2 + 25.5, { align: "center" });

  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`${pres.tipoDocumento || "DNI"}: ${pres.numeroDocumento || "—"}`, xPres, y2 + 29, { align: "center" });

  // 2. TESORERO(A)
  const xTes = marginX + wDirectiva * 1.5;
  doc.setDrawColor(55, 65, 81);
  doc.setLineWidth(0.4);
  doc.line(xTes - 25, y2 + 18, xTes + 25, y2 + 18);

  doc.setFont("times", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(tes.nombreCompleto.toUpperCase(), xTes, y2 + 22, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  doc.text(tes.cargoTitulo || "Tesorero(a)", xTes, y2 + 25.5, { align: "center" });

  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`${tes.tipoDocumento || "DNI"}: ${tes.numeroDocumento || "—"}`, xTes, y2 + 29, { align: "center" });

  // 3. SECRETARIO(A)
  const xSec = marginX + wDirectiva * 2.5;
  doc.setDrawColor(55, 65, 81);
  doc.setLineWidth(0.4);
  doc.line(xSec - 25, y2 + 18, xSec + 25, y2 + 18);

  doc.setFont("times", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(sec.nombreCompleto.toUpperCase(), xSec, y2 + 22, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  doc.text(sec.cargoTitulo || "Secretario(a)", xSec, y2 + 25.5, { align: "center" });

  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`${sec.tipoDocumento || "DNI"}: ${sec.numeroDocumento || "—"}`, xSec, y2 + 29, { align: "center" });

  y2 += 34;

  // Separador elegante
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX, y2, pageWidth - marginX, y2);

  y2 += 3;

  // --- SUB-BLOQUE B: SOCIO PRESTATARIO Y AVAL CON HUELLAS DIGITALES ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  doc.text("DEUDOR PRINCIPAL Y GARANTE SOLIDARIO (AVAL)", marginX + 1, y2 + 2);

  y2 += 3;

  const wDebtorCol = contentWidth / 2;

  // B1. SOCIO PRESTATARIO
  const xDebtorCenter = marginX + wDebtorCol * 0.45;
  const xHuellaSocio = marginX + wDebtorCol - 25;

  // Línea de firma socio
  doc.setDrawColor(55, 65, 81);
  doc.setLineWidth(0.4);
  doc.line(marginX + 6, y2 + 22, xHuellaSocio - 6, y2 + 22);

  doc.setFont("times", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(nombreSocio.toUpperCase(), xDebtorCenter, y2 + 26, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  doc.text("SOCIO(A) PRESTATARIO(A)", xDebtorCenter, y2 + 29.5, { align: "center" });

  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`${docTipoSocio}: ${dniSocio}`, xDebtorCenter, y2 + 33, { align: "center" });

  // Recuadro Huella Digital Socio
  doc.setDrawColor(180, 130, 40);
  doc.setFillColor(253, 252, 248);
  doc.setLineWidth(0.35);
  doc.rect(xHuellaSocio, y2 + 4, 21, 27, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(180, 130, 40);
  doc.text("HUELLA DIGITAL", xHuellaSocio + 10.5, y2 + 29.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.5);
  doc.setTextColor(140, 140, 140);
  doc.text("Índice Derecho", xHuellaSocio + 10.5, y2 + 17, { align: "center" });

  // B2. AVAL / FIADOR SOLIDARIO (O CÓNYUGE)
  const xAvalStart = marginX + wDebtorCol + 4;
  const xAvalCenter = xAvalStart + (wDebtorCol - 4) * 0.45;
  const xHuellaAval = marginX + contentWidth - 21;

  // Línea de firma aval
  doc.setDrawColor(55, 65, 81);
  doc.setLineWidth(0.4);
  doc.line(xAvalStart + 2, y2 + 22, xHuellaAval - 6, y2 + 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Firma del Aval / Fiador Solidario", xAvalCenter, y2 + 26, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  doc.text("AVAL / FIADOR SOLIDARIO", xAvalCenter, y2 + 29.5, { align: "center" });

  doc.setFont("courier", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("DNI: ____________________", xAvalCenter, y2 + 33, { align: "center" });

  // Recuadro Huella Digital Aval
  doc.setDrawColor(180, 130, 40);
  doc.setFillColor(253, 252, 248);
  doc.setLineWidth(0.35);
  doc.rect(xHuellaAval, y2 + 4, 21, 27, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(180, 130, 40);
  doc.text("HUELLA DIGITAL", xHuellaAval + 10.5, y2 + 29.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.5);
  doc.setTextColor(140, 140, 140);
  doc.text("Índice Derecho", xHuellaAval + 10.5, y2 + 17, { align: "center" });

  // =========================================================================
  // DIBUJAR MARCOS Y NUMERACIÓN DE PÁGINAS
  // =========================================================================
  dibujarMarcoPagina(1, 2);
  doc.setPage(2);
  dibujarMarcoPagina(2, 2);

  return doc;
}

/**
 * Descarga directamente el archivo PDF generado en el navegador del usuario.
 */
export function descargarDocumentoPrestamoPDF(params: {
  prestamo: PrestamoPDFData;
  cronograma: CuotaPDFData[];
  socio?: SocioFichaPDFData | null;
  directiva?: DirectivaCargoPDFData[];
  empresa?: EmpresaPDFData | null;
}): void {
  const doc = generarDocumentoPrestamoPDF(params);
  const numStr = String(params.prestamo.numero).padStart(6, "0");
  const nombreSocio =
    params.socio?.nombreCompleto || params.prestamo.socioNombreCompleto || "Socio";
  const nombreLimpio = limpiarNombreArchivo(nombreSocio);
  doc.save(`Expediente_Credito_${numStr}_${nombreLimpio}.pdf`);
}

/**
 * Función integral que obtiene de manera automática todos los datos necesarios
 * (préstamo, cronograma, socio enriquecido, directiva oficial y empresa) y descarga el PDF.
 */
export async function descargarExpedientePrestamoCompletoPDF(prestamoId: string): Promise<void> {
  // 1. Obtener detalle del préstamo y cronograma
  const resPrestamo = await fetch(`/api/prestamos/${prestamoId}?t=${Date.now()}`, {
    cache: "no-store",
  });
  if (!resPrestamo.ok) {
    throw new Error("No se pudo obtener la información del préstamo");
  }
  const pData = await resPrestamo.json();
  const prestamo: PrestamoPDFData = pData.prestamo || pData;
  const cronograma: CuotaPDFData[] = pData.cronograma || [];

  // 2. Obtener socio enriquecido (con su DNI real y ficha completa)
  let socio: SocioFichaPDFData | null = null;
  if (prestamo.socioId) {
    try {
      const resSocio = await fetch(`/api/socios/${prestamo.socioId}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (resSocio.ok) {
        socio = await resSocio.json();
      }
    } catch {
      // Continuar con los datos del préstamo
    }
  }

  // 3. Obtener directiva oficial activa
  let directiva: DirectivaCargoPDFData[] = [];
  try {
    const resDirectiva = await fetch(`/api/directiva?soloActivos=true&t=${Date.now()}`, {
      cache: "no-store",
    });
    if (resDirectiva.ok) {
      directiva = await resDirectiva.json();
    }
  } catch {
    // Se utilizarán los valores canónicos por defecto
  }

  // 4. Obtener datos institucionales de la empresa
  let empresa: EmpresaPDFData | null = null;
  try {
    const resEmpresa = await fetch(`/api/empresa?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (resEmpresa.ok) {
      empresa = await resEmpresa.json();
    }
  } catch {
    // Se utilizarán los valores canónicos por defecto
  }

  // 5. Descargar el PDF
  descargarDocumentoPrestamoPDF({
    prestamo,
    cronograma,
    socio,
    directiva,
    empresa,
  });
}
