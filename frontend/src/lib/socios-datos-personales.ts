export interface DocumentoAdjunto {
  id: string;
  nombre: string;
  tipo: string;
  tamano: number;
  fecha: string;
  data: string; // Base64 Data URL
}

export interface FichaDatosPersonales {
  nombres: string;
  apellidos: string;
  dni: string;
  edad: string;
  sexo: "MASCULINO" | "FEMENINO" | "";
  estadoCivil: "SOLTERO(A)" | "CASADO(A)" | "CONVIVIENTE" | "VIUDO(A)" | "DIVORCIADO(A)" | "";
  telefono: string;
  email: string;
  direccion: string;
  ocupacion: string;
  personasEnCasa: string;
  adjuntaDni: boolean;
  adjuntaRecibo: boolean;
  adjuntaOtros: string;
  documentos: DocumentoAdjunto[];
  observaciones: string;
}

export function parseFichaSocio(
  socio: {
    nombres?: string;
    apellidos?: string;
    nombreCompleto?: string;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
    documentoEnmascarado?: string | null;
    documentoNumero?: string | null;
    numeroDocumento?: string | null;
    notas?: string | null;
  } | null
): FichaDatosPersonales {
  const defaultFicha: FichaDatosPersonales = {
    nombres: socio?.nombres || "",
    apellidos: socio?.apellidos || "",
    dni: socio?.documentoNumero || socio?.documentoEnmascarado || "",
    edad: "",
    sexo: "",
    estadoCivil: "",
    telefono: socio?.telefono || "",
    email: socio?.email || "",
    direccion: socio?.direccion || "",
    ocupacion: "",
    personasEnCasa: "",
    adjuntaDni: false,
    adjuntaRecibo: false,
    adjuntaOtros: "",
    documentos: [],
    observaciones: "",
  };

  if (!socio) return defaultFicha;

  if (socio.notas) {
    try {
      const parsed = JSON.parse(socio.notas);
      if (parsed && typeof parsed === "object") {
        const dp = parsed.datosPersonales || parsed;
        return {
          nombres: dp.nombres !== undefined ? dp.nombres : socio.nombres || "",
          apellidos: dp.apellidos !== undefined ? dp.apellidos : socio.apellidos || "",
          dni: dp.dni || socio.documentoNumero || socio.documentoEnmascarado || "",
          edad: dp.edad !== undefined && dp.edad !== null ? String(dp.edad) : "",
          sexo: dp.sexo || "",
          estadoCivil: dp.estadoCivil || "",
          telefono: dp.telefono !== undefined ? dp.telefono : socio.telefono || "",
          email: dp.email !== undefined ? dp.email : socio.email || "",
          direccion: dp.direccion !== undefined ? dp.direccion : socio.direccion || "",
          ocupacion: dp.ocupacion || "",
          personasEnCasa: dp.personasEnCasa !== undefined && dp.personasEnCasa !== null ? String(dp.personasEnCasa) : "",
          adjuntaDni: Boolean(dp.adjuntaDni),
          adjuntaRecibo: Boolean(dp.adjuntaRecibo),
          adjuntaOtros: dp.adjuntaOtros || "",
          documentos: Array.isArray(parsed.documentos) ? parsed.documentos : (Array.isArray(dp.documentos) ? dp.documentos : []),
          observaciones: parsed.observaciones || dp.observaciones || "",
        };
      }
    } catch {
      // Si no es JSON válido, el texto completo de notas es la observación previa
      defaultFicha.observaciones = socio.notas;
    }
  }

  return defaultFicha;
}

export function serializeFichaSocio(ficha: FichaDatosPersonales): string {
  const payload = {
    datosPersonales: {
      nombres: ficha.nombres.trim(),
      apellidos: ficha.apellidos.trim(),
      dni: ficha.dni.trim(),
      edad: ficha.edad.trim(),
      sexo: ficha.sexo,
      estadoCivil: ficha.estadoCivil,
      telefono: ficha.telefono.trim(),
      email: ficha.email.trim(),
      direccion: ficha.direccion.trim(),
      ocupacion: ficha.ocupacion.trim(),
      personasEnCasa: ficha.personasEnCasa.trim(),
      adjuntaDni: ficha.adjuntaDni,
      adjuntaRecibo: ficha.adjuntaRecibo,
      adjuntaOtros: ficha.adjuntaOtros.trim(),
    },
    documentos: ficha.documentos,
    observaciones: ficha.observaciones.trim(),
  };

  return JSON.stringify(payload);
}

export function extraerObservaciones(notas: string | null | undefined): string {
  if (!notas) return "";
  try {
    const parsed = JSON.parse(notas);
    if (parsed && typeof parsed === "object") {
      return parsed.observaciones || "";
    }
  } catch {
    return notas;
  }
  return "";
}

export function formatTamanoArchivo(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Extrae los datos personales estructurados almacenados en el campo `notas` de un socio.
 */
export function extraerDatosPersonalesDeNotas(notas?: string | null): Partial<FichaDatosPersonales> | null {
  if (!notas) return null;
  try {
    const parsed = typeof notas === "string" ? JSON.parse(notas) : notas;
    if (parsed && typeof parsed === "object") {
      return (parsed.datosPersonales || parsed) as Partial<FichaDatosPersonales>;
    }
  } catch {}
  return null;
}

/**
 * Enriquece un objeto socio con sus datos personales más actualizados (nombres, apellidos, DNI, teléfono, dirección).
 */
export function enriquecerSocioConDatosPersonales<T extends Record<string, unknown>>(socio: T): T {
  if (!socio) return socio;
  const dp = extraerDatosPersonalesDeNotas(typeof socio.notas === "string" ? socio.notas : null);
  if (!dp) return socio;

  const getText = (key: string) => typeof socio[key] === "string" ? socio[key] as string : undefined;

  const nombres = dp.nombres ? String(dp.nombres).trim() : getText("nombres");
  const apellidos = dp.apellidos ? String(dp.apellidos).trim() : getText("apellidos");
  const nombreCompleto =
    apellidos && nombres
      ? `${apellidos} ${nombres}`.trim()
      : getText("nombreCompleto");

  const dni = dp.dni ? String(dp.dni).trim() : null;
  const documentoNumero = dni || getText("documentoNumero") || getText("numeroDocumento") || null;
  const documentoEnmascarado =
    dni ||
    (getText("documentoEnmascarado") && !getText("documentoEnmascarado")!.startsWith("****00")
      ? getText("documentoEnmascarado")
      : dni || getText("documentoEnmascarado"));

  const telefono = dp.telefono ? String(dp.telefono).trim() : getText("telefono");
  const email = dp.email ? String(dp.email).trim() : getText("email");
  const direccion = dp.direccion ? String(dp.direccion).trim() : getText("direccion");

  return {
    ...socio,
    nombres,
    apellidos,
    nombreCompleto,
    documentoNumero,
    numeroDocumento: documentoNumero,
    documentoEnmascarado,
    telefono,
    email,
    direccion,
  };
}
