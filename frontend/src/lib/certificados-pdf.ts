import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface CertificadoAccionPDFData {
  id?: string;
  numeroCertificado: number;
  socioId?: string | null;
  socioCodigo?: number | null;
  socioNombre: string;
  socioDocumentoNumero?: string | null;
  socioDocumentoTipo?: string | null;
  serieInicio: number;
  serieFin: number;
  cantidad: number;
  valorNominal: number;
  totalMonto: number;
  fechaEmision: string;
  estado: "ACTIVO" | "DEVUELTO_RETIRO" | "TRANSFERIDO" | string;
  tipoOrigen?: string;
}

export interface DirectivaCargoPDFData {
  cargo: string;
  cargoTitulo: string;
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  activo?: boolean;
}

export interface EmpresaPDFData {
  id?: string;
  nombre?: string;
  nombreComercial?: string;
  ruc?: string;
  logo?: string;
  fechaFundacion?: string;
  fechaEmisionAcciones?: string;
  descripcion?: string;
  direccion?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  pais?: string;
  representanteLegal?: string;
  cargoRepresentante?: string;
  [key: string]: unknown;
}

export function numeroALetras(num: number): string {
  const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const especiales: Record<number, string> = {
    11: "ONCE", 12: "DOCE", 13: "TRECE", 14: "CATORCE", 15: "QUINCE",
    16: "DIECISÉIS", 17: "DIECISIETE", 18: "DIECIOCHO", 19: "DIECINUEVE",
    21: "VEINTIÚN", 22: "VEINTIDÓS", 23: "VEINTITRÉS", 24: "VEINTICUATRO",
    25: "VEINTICINCO", 26: "VEINTISÉIS", 27: "VEINTISIETE", 28: "VEINTIOCHO", 29: "VEINTINUEVE",
  };
  const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  if (num === 0) return "CERO Y 00/100 SOLES";
  if (num === 100) return "CIEN Y 00/100 SOLES";

  function convertirGrupo(n: number): string {
    let output = "";
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    const du = n % 100;

    if (n === 100) return "CIEN";
    if (c > 0) output += centenas[c] + " ";

    if (especiales[du]) {
      output += especiales[du];
    } else {
      if (d > 0) {
        output += decenas[d];
        if (u > 0) output += " Y " + unidades[u];
      } else if (u > 0) {
        output += unidades[u];
      }
    }
    return output.trim();
  }

  const parteEntera = Math.floor(num);
  const centavos = Math.round((num - parteEntera) * 100);
  const centavosStr = centavos.toString().padStart(2, "0") + "/100 SOLES";

  if (parteEntera === 0) return `CERO Y ${centavosStr}`;
  if (parteEntera < 1000) return `${convertirGrupo(parteEntera)} Y ${centavosStr}`;
  if (parteEntera < 1000000) {
    const miles = Math.floor(parteEntera / 1000);
    const resto = parteEntera % 1000;
    const milesStr = miles === 1 ? "MIL" : `${convertirGrupo(miles)} MIL`;
    const restoStr = resto > 0 ? ` ${convertirGrupo(resto)}` : "";
    return `${milesStr}${restoStr} Y ${centavosStr}`;
  }
  return `${num.toFixed(2)} SOLES`;
}

export function cantidadAccionesALetras(n: number): string {
  if (n === 1) return "UNA ACCIÓN";
  const numPalabras: Record<number, string> = {
    2: "DOS ACCIONES", 3: "TRES ACCIONES", 4: "CUATRO ACCIONES", 5: "CINCO ACCIONES",
    6: "SEIS ACCIONES", 7: "SIETE ACCIONES", 8: "OCHO ACCIONES", 9: "NUEVE ACCIONES",
    10: "DIEZ ACCIONES", 11: "ONCE ACCIONES", 12: "DOCE ACCIONES", 15: "QUINCE ACCIONES",
    20: "VEINTE ACCIONES", 25: "VEINTICINCO ACCIONES", 30: "TREINTA ACCIONES",
  };
  return numPalabras[n] || `${n} ACCIONES`;
}

export function extraerAnio(fechaStr?: string | null): number {
  if (!fechaStr) return new Date().getFullYear();
  const soloFecha = String(fechaStr).trim().split("T")[0];
  const partes = soloFecha.split("-");
  const anio = parseInt(partes[0], 10);
  return !isNaN(anio) && anio > 1900 ? anio : new Date().getFullYear();
}

export function formatearFechaFormal(fechaStr?: string | null): string {
  if (!fechaStr) return "";
  try {
    const soloFecha = String(fechaStr).trim().split("T")[0];
    const partes = soloFecha.split("-");
    if (partes.length >= 3) {
      const y = parseInt(partes[0], 10);
      const m = parseInt(partes[1], 10);
      const d = parseInt(partes[2], 10);
      const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
      ];
      if (m >= 1 && m <= 12 && !isNaN(d) && !isNaN(y)) {
        const diaStr = String(d).padStart(2, "0");
        return `${diaStr} de ${meses[m - 1]} de ${y}`;
      }
    }
    return String(fechaStr);
  } catch {
    return String(fechaStr);
  }
}

export function limpiarNombreArchivo(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Renderiza el diseño formal y canónico de un certificado de acciones en una página horizontal A4 de jsPDF.
 */
export function dibujarCertificadoEnPagina(
  doc: jsPDF,
  cert: CertificadoAccionPDFData,
  directiva: DirectivaCargoPDFData[],
  empresa?: EmpresaPDFData | null
): void {
  // 1. Fecha oficial canónica jalada prioritariamente de los datos de la empresa
  const fechaOficialStr =
    empresa?.fechaEmisionAcciones ||
    empresa?.fechaFundacion ||
    cert.fechaEmision ||
    "2021-06-08";

  const anioEmision = extraerAnio(fechaOficialStr);
  const fechaFormateada = formatearFechaFormal(fechaOficialStr);

  // 2. Ubicación institucional dinámica jalada de la empresa
  const ciudadLugar = empresa?.distrito || empresa?.provincia || "Concepción";
  const deptoLugar = empresa?.departamento || "Junín";
  const paisLugar = empresa?.pais || "Perú";
  const ubicacionHeader = `${ciudadLugar} — ${deptoLugar}, ${paisLugar}`;

  // 3. Denominación institucional dinámica
  const nombreComercial = (empresa?.nombreComercial || "UNIÓN DE CRÉDITO Y AHORRO (UNICA)").toUpperCase();
  const razonSocial = (empresa?.nombre || "CAJA COMUNAL EMPRENDE CHAMBALA").toUpperCase();

  const pres = directiva.find((d) => d.cargo && d.cargo.toUpperCase().includes("PRESIDENTE")) || {
    nombreCompleto: "PONCE HUILCAYA ADELA",
    cargoTitulo: "Presidente",
    numeroDocumento: "09812345",
    tipoDocumento: "DNI",
  };

  const tes = directiva.find((d) => d.cargo && d.cargo.toUpperCase().includes("TESORERO")) || {
    nombreCompleto: "HUAMAN MORAN ALEJANDRA SILVIA",
    cargoTitulo: "Tesorero(a)",
    numeroDocumento: "10876543",
    tipoDocumento: "DNI",
  };

  const sec = directiva.find((d) => d.cargo && d.cargo.toUpperCase().includes("SECRETARIO")) || {
    nombreCompleto: "LAIME CCACCRO ANABEL MARIA",
    cargoTitulo: "Secretario(a)",
    numeroDocumento: "41765432",
    tipoDocumento: "DNI",
  };

  // Marco principal exterior azul marino institucional
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(1.2);
  doc.rect(8, 8, 281, 194);

  // Marco secundario dorado/bronce institucional
  doc.setDrawColor(180, 130, 40);
  doc.setLineWidth(0.4);
  doc.rect(10, 10, 277, 190);

  // Marco interior fino azul
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.3);
  doc.rect(11.5, 11.5, 274, 187);

  // Ornamentos en las 4 esquinas
  const drawCorner = (x: number, y: number, dx: number, dy: number) => {
    doc.setDrawColor(180, 130, 40);
    doc.setLineWidth(0.6);
    doc.line(x, y, x + dx * 9, y);
    doc.line(x, y, x, y + dy * 9);
  };
  drawCorner(13, 13, 1, 1);
  drawCorner(284, 13, -1, 1);
  drawCorner(13, 197, 1, -1);
  drawCorner(284, 197, -1, -1);

  // Encabezado institucional
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 138);
  doc.text(nombreComercial, 18, 21);

  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(55, 65, 81);
  doc.text(razonSocial, 18, 26);

  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(ubicacionHeader, 279, 21, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text("REGISTRO OFICIAL DE ACCIONES", 279, 26, { align: "right" });

  // Doble línea divisoria de encabezado
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.6);
  doc.line(18, 29, 279, 29);
  doc.setDrawColor(180, 130, 40);
  doc.setLineWidth(0.25);
  doc.line(18, 29.8, 279, 29.8);

  // Título principal
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text("CERTIFICADO DE COMPRA DE ACCION(ES)", 148.5, 39, { align: "center" });

  // Folio y correlativo
  doc.setFont("courier", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(55, 65, 81);
  const certNumStr = String(cert.numeroCertificado).padStart(6, "0");
  doc.text(`REGISTRO Nº: CERT-${certNumStr}     •     AÑO: ${anioEmision}`, 148.5, 45, { align: "center" });

  // 4 Cajas resumen de valor financiero y series
  const yBox = 49;
  const hBox = 21;
  const wBox = 62;
  const gap = 4.3;

  const boxes = [
    {
      title: "VALOR POR ACCIÓN",
      val: `S/ ${Number(cert.valorNominal).toFixed(2)}`,
      sub: "(Valor nominal)",
      color: [15, 23, 42],
      valSize: 11.5,
    },
    {
      title: "CANTIDAD DE ACCIONES",
      val: String(cert.cantidad),
      sub: `(${cantidadAccionesALetras(cert.cantidad)})`,
      color: [30, 58, 138],
      valSize: 13,
    },
    {
      title: "VALOR TOTAL APORTADO",
      val: `S/ ${Number(cert.totalMonto).toFixed(2)}`,
      sub: numeroALetras(cert.totalMonto),
      color: [6, 95, 70],
      valSize: 11.5,
    },
    {
      title: "SERIES OFICIALES",
      val: `#${cert.serieInicio} al #${cert.serieFin}`,
      sub: "(Correlativo oficial)",
      color: [15, 23, 42],
      valSize: 11,
    },
  ];

  boxes.forEach((b, idx) => {
    const x = 18 + idx * (wBox + gap);
    doc.setFillColor(250, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, yBox, wBox, hBox, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(b.title, x + wBox / 2, yBox + 5, { align: "center" });

    doc.setFont("courier", "bold");
    doc.setFontSize(b.valSize);
    doc.setTextColor(b.color[0], b.color[1], b.color[2]);
    doc.text(b.val, x + wBox / 2, yBox + 12, { align: "center" });

    doc.setFont("times", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    const subStr = b.sub.length > 36 ? b.sub.slice(0, 33) + "..." : b.sub;
    doc.text(subStr, x + wBox / 2, yBox + 17.5, { align: "center" });
  });

  // Cuerpo legal de certificación
  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(31, 41, 55);
  const nombreLegalEntidad = empresa?.nombre || "Caja Comunal Emprende Chambala";
  const tipoEntidad = empresa?.nombreComercial || "Unión de Crédito y Ahorro";
  const textoLegal =
    `La ${tipoEntidad} ${nombreLegalEntidad}, de conformidad con sus Estatutos Sociales y las resoluciones de la Asamblea General, certifica que esta(s) acción(es) pertenece(n) legítimamente a:`;
  doc.text(textoLegal, 18, 77, { maxWidth: 261, align: "justify" });

  // Cuadro destacado con el nombre del Titular
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(202, 138, 4);
  doc.setLineWidth(0.35);
  doc.roundedRect(22, 82.5, 253, 14.5, 1.5, 1.5, "FD");

  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(cert.socioNombre.toUpperCase(), 148.5, 89.5, { align: "center" });

  if (cert.socioCodigo) {
    doc.setFont("courier", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text(`(Socio Código Nº ${cert.socioCodigo})`, 148.5, 94.5, { align: "center" });
  }

  // DNI y declaración de Beneficiarios
  doc.setFont("times", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(31, 41, 55);
  doc.text(`Con Documento de Identidad Nº: ${cert.socioDocumentoNumero || "____________________"}`, 22, 103);

  doc.text("La, el o los beneficiarios constan en:   [ X ] Declaración Jurada     [   ] Libro de Actas", 145, 103);

  // Fecha formal de emisión
  doc.setFont("times", "italic");
  doc.setFontSize(9.5);
  doc.setTextColor(31, 41, 55);
  doc.text(`Fecha de emisión: ${ciudadLugar}, ${fechaFormateada}`, 275, 110, { align: "right" });

  // Separador elegante previo a firmas
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.line(22, 116, 275, 116);

  // 3 FIRMAS OFICIALES DE LA JUNTA DIRECTIVA
  // 1. Presidente (Izquierda)
  const xPres = 68;
  doc.setDrawColor(55, 65, 81);
  doc.setLineWidth(0.4);
  doc.line(36, 135, 100, 135);

  doc.setFont("times", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(pres.nombreCompleto, xPres, 140, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138);
  doc.text(pres.cargoTitulo || "Presidente", xPres, 144.5, { align: "center" });

  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${pres.tipoDocumento || "DNI"}: ${pres.numeroDocumento || "—"}`, xPres, 148.5, { align: "center" });

  // 2. Tesorero(a) (Derecha)
  const xTes = 229;
  doc.setDrawColor(55, 65, 81);
  doc.setLineWidth(0.4);
  doc.line(197, 135, 261, 135);

  doc.setFont("times", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(tes.nombreCompleto, xTes, 140, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138);
  doc.text(tes.cargoTitulo || "Tesorero(a)", xTes, 144.5, { align: "center" });

  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${tes.tipoDocumento || "DNI"}: ${tes.numeroDocumento || "—"}`, xTes, 148.5, { align: "center" });

  // 3. Secretario(a) (Centro inferior)
  const xSec = 148.5;
  doc.setDrawColor(55, 65, 81);
  doc.setLineWidth(0.4);
  doc.line(116.5, 165, 180.5, 165);

  doc.setFont("times", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(sec.nombreCompleto, xSec, 170, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138);
  doc.text(sec.cargoTitulo || "Secretario(a)", xSec, 174.5, { align: "center" });

  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${sec.tipoDocumento || "DNI"}: ${sec.numeroDocumento || "—"}`, xSec, 178.5, { align: "center" });

  // Sello si el certificado está devuelto/cancelado por retiro
  if (cert.estado === "DEVUELTO_RETIRO") {
    doc.setDrawColor(220, 38, 38);
    doc.setFillColor(254, 242, 242);
    doc.setLineWidth(1.2);
    doc.roundedRect(88.5, 93, 120, 18, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(220, 38, 38);
    doc.text("CANCELADO / DEVUELTO", 148.5, 105, { align: "center" });
  }

  // Pie de página oficial
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(18, 191, 279, 191);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138);
  doc.text("NO NEGOCIABLE", 18, 196);

  doc.setFont("times", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Título social nominativo intransferible salvo por cesión formal inscrita en el Libro de Matrícula de Acciones.",
    279,
    196,
    { align: "right" }
  );
}

/**
 * Genera y descarga el archivo PDF de un certificado individual de acciones.
 */
export function descargarCertificadoPDF(
  cert: CertificadoAccionPDFData,
  directiva: DirectivaCargoPDFData[],
  empresa?: EmpresaPDFData | null
): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  dibujarCertificadoEnPagina(doc, cert, directiva, empresa);

  const numStr = String(cert.numeroCertificado).padStart(6, "0");
  const nombreLimpio = limpiarNombreArchivo(cert.socioNombre);
  doc.save(`Certificado_Accion_${numStr}_${nombreLimpio}.pdf`);
}

/**
 * Genera y descarga un archivo PDF (unificado con 1 página por certificado) para los certificados de un socio.
 */
export function descargarCertificadosSocioPDF(
  socioNombre: string,
  certs: CertificadoAccionPDFData[],
  directiva: DirectivaCargoPDFData[],
  empresa?: EmpresaPDFData | null
): void {
  if (certs.length === 0) return;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  certs.forEach((cert, idx) => {
    if (idx > 0) {
      doc.addPage("a4", "landscape");
    }
    dibujarCertificadoEnPagina(doc, cert, directiva, empresa);
  });

  const nombreLimpio = limpiarNombreArchivo(socioNombre);
  if (certs.length === 1) {
    const numStr = String(certs[0].numeroCertificado).padStart(6, "0");
    doc.save(`Certificado_Accion_${numStr}_${nombreLimpio}.pdf`);
  } else {
    doc.save(`Certificados_Acciones_${nombreLimpio}.pdf`);
  }
}

/**
 * Descarga un lote de certificados de acciones en un único PDF (1 página horizontal A4 por certificado).
 */
export function descargarLoteCertificadosPDF(
  certs: CertificadoAccionPDFData[],
  directiva: DirectivaCargoPDFData[],
  tituloLote: string = "Certificados_Acciones",
  empresa?: EmpresaPDFData | null
): void {
  if (certs.length === 0) return;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  certs.forEach((cert, idx) => {
    if (idx > 0) {
      doc.addPage("a4", "landscape");
    }
    dibujarCertificadoEnPagina(doc, cert, directiva, empresa);
  });

  doc.save(`${tituloLote}.pdf`);
}

/**
 * Genera y descarga un reporte formal / padrón de matrícula de acciones en formato PDF para un rango de fechas.
 */
export function descargarReporteAccionesPorFechasPDF(
  certs: CertificadoAccionPDFData[],
  directiva: DirectivaCargoPDFData[],
  fechaDesde?: string,
  fechaHasta?: string,
  empresa?: EmpresaPDFData | null
): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const fechaImpresion = new Date().toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const textoRango =
    fechaDesde && fechaHasta
      ? `Desde: ${formatearFechaFormal(fechaDesde)}  hasta: ${formatearFechaFormal(fechaHasta)}`
      : fechaDesde
      ? `Desde: ${formatearFechaFormal(fechaDesde)} hasta la actualidad`
      : fechaHasta
      ? `Hasta: ${formatearFechaFormal(fechaHasta)}`
      : "Histórico general acumulado";

  const razonSocial = (empresa?.nombre || "CAJA COMUNAL EMPRENDE CHAMBALA").toUpperCase();
  const nombreComercial = (empresa?.nombreComercial || "UNIÓN DE CRÉDITO Y AHORRO (UNICA)").toUpperCase();

  // Encabezado institucional
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.8);
  doc.line(14, 12, 283, 12);

  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 138);
  doc.text(`${nombreComercial} — ${razonSocial}`, 14, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text("LIBRO DE MATRÍCULA Y REGISTRO OFICIAL DE ACCIONES", 14, 25);

  doc.setFont("times", "italic");
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Período de emisión: ${textoRango}`, 14, 30);
  doc.text(`Fecha de reporte: ${fechaImpresion}`, 283, 30, { align: "right" });

  // Totales
  const totalAcciones = certs.reduce((acc, c) => acc + (c.cantidad || 0), 0);
  const totalMonto = certs.reduce((acc, c) => acc + Number(c.totalMonto || 0), 0);
  const totalActivos = certs.filter((c) => c.estado === "ACTIVO").length;
  const totalDevueltos = certs.filter((c) => c.estado === "DEVUELTO_RETIRO").length;

  // Cajas resumen de totales
  const yKpi = 34;
  const wKpi = 64;
  const hKpi = 14;
  const kpis = [
    { label: "CERTIFICADOS EMITIDOS", val: `${certs.length} títulos`, col: [30, 58, 138] },
    { label: "TOTAL ACCIONES REGISTRADAS", val: `${totalAcciones.toLocaleString("es-PE")} acciones`, col: [15, 23, 42] },
    { label: "CAPITAL SOCIAL TOTAL", val: `S/ ${totalMonto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`, col: [6, 95, 70] },
    { label: "ESTADO DE CERTIFICADOS", val: `${totalActivos} Activos · ${totalDevueltos} Devueltos`, col: [71, 85, 105] },
  ];

  kpis.forEach((k, idx) => {
    const x = 14 + idx * (wKpi + 3.3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, yKpi, wKpi, hKpi, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(k.label, x + wKpi / 2, yKpi + 4.5, { align: "center" });

    doc.setFont("courier", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(k.col[0], k.col[1], k.col[2]);
    doc.text(k.val, x + wKpi / 2, yKpi + 10.5, { align: "center" });
  });

  // Filas para la tabla
  const rows = certs.map((c) => [
    `CERT-${String(c.numeroCertificado).padStart(6, "0")}`,
    c.fechaEmision || empresa?.fechaFundacion || "—",
    c.socioCodigo ? `#${c.socioCodigo}` : "—",
    c.socioNombre || "—",
    c.socioDocumentoNumero || "—",
    `#${c.serieInicio} - #${c.serieFin}`,
    String(c.cantidad),
    `S/ ${Number(c.totalMonto).toFixed(2)}`,
    (c.tipoOrigen || "").replace(/_/g, " "),
    c.estado === "ACTIVO" ? "ACTIVO" : c.estado === "DEVUELTO_RETIRO" ? "DEVUELTO" : "TRANSFERIDO",
  ]);

  // Fila de totales al pie de la tabla
  rows.push([
    "TOTALES",
    "",
    "",
    `${certs.length} certificados emitidos`,
    "",
    "",
    String(totalAcciones),
    `S/ ${totalMonto.toFixed(2)}`,
    "",
    "",
  ]);

  autoTable(doc, {
    startY: 52,
    head: [
      [
        "N° Cert.",
        "Fecha",
        "Cód.",
        "Titular / Socio",
        "DNI / Doc.",
        "Series Oficiales",
        "Acciones",
        "Monto (S/)",
        "Origen",
        "Estado",
      ],
    ],
    body: rows,
    theme: "grid",
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      valign: "middle",
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    columnStyles: {
      0: { font: "courier", fontStyle: "bold", halign: "center", cellWidth: 24 },
      1: { halign: "center", cellWidth: 20 },
      2: { font: "courier", halign: "center", cellWidth: 14 },
      3: { cellWidth: "auto", fontStyle: "bold" },
      4: { font: "courier", halign: "center", cellWidth: 20 },
      5: { font: "courier", halign: "center", cellWidth: 26 },
      6: { font: "courier", fontStyle: "bold", halign: "right", cellWidth: 16 },
      7: { font: "courier", fontStyle: "bold", halign: "right", cellWidth: 22 },
      8: { fontSize: 7, halign: "center", cellWidth: 24 },
      9: { fontSize: 7, halign: "center", fontStyle: "bold", cellWidth: 20 },
    },
    didParseCell: (data) => {
      // Estilizar la última fila de totales
      if (data.row.index === rows.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.textColor = [15, 23, 42];
      }
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  // Pie de página en todas las hojas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Libro de Matrícula de Acciones — ${nombreComercial} ${razonSocial} — Página ${i} de ${totalPages}`,
      148.5,
      204,
      { align: "center" }
    );
  }

  const nombreDesde = fechaDesde || "inicio";
  const nombreHasta = fechaHasta || "actual";
  doc.save(`Libro_Matricula_Acciones_${nombreDesde}_a_${nombreHasta}.pdf`);
}
