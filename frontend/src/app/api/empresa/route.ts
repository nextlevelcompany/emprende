import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "src", "data", "empresa.json");

const DEFAULT_EMPRESA = {
  id: "a0000000-0000-0000-0000-000000000001",
  nombre: "Caja Comunal Emprende Chambala",
  nombreComercial: "UNICA Emprende Chambala",
  ruc: "20608945123",
  logo: "",
  fechaFundacion: "2021-06-08",
  fechaEmisionAcciones: "2021-06-08",
  descripcion: "Organización comunal de crédito y ahorro (UNICA) constituida para el desarrollo productivo y solidario de Chambala.",
  objetoSocial: "Intermediación financiera comunal, custodia del ahorro colectivo y otorgamiento de microcréditos.",
  mision: "Proporcionar a los socios servicios financieros confiables y solidarios.",
  vision: "Ser la organización comunal modelo de desarrollo financiero en la región Junín.",
  direccion: "Av. Principal S/N, Local Comunal de Chambala",
  distrito: "Concepción",
  provincia: "Concepción",
  departamento: "Junín",
  pais: "Perú",
  telefono: "+51 964 123 456",
  email: "cajachambala@gmail.com",
  sitioWeb: "https://emprendechambala.pe",
  moneda: "PEN",
  diaReunion: 8,
  valorAccion: 30,
  representanteLegal: "PONCE HUILCAYA ADELA",
  cargoRepresentante: "Presidenta de Junta Directiva",
  tipoDocumentoRepresentante: "DNI",
  numeroDocumentoRepresentante: "09812345",
  partidaRegistral: "Partida Electrónica N° 11048291 - SUNARP Huancayo",
  updatedAt: new Date().toISOString(),
};

async function getEmpresaData() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    // Si no existe, crear con defaults
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_EMPRESA, null, 2), "utf-8");
    return DEFAULT_EMPRESA;
  }
}

export async function GET() {
  try {
    const data = await getEmpresaData();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { detail: err?.message || "Error al leer datos de la empresa" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const current = await getEmpresaData();

    const updated = {
      ...current,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(updated, null, 2), "utf-8");

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { detail: err?.message || "Error al actualizar datos de la empresa" },
      { status: 500 }
    );
  }
}
