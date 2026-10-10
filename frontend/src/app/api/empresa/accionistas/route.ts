import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "src", "data", "accionistas.json");

async function getAccionistasData(): Promise<any[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveAccionistasData(accionistas: any[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(accionistas, null, 2), "utf-8");
}

export async function GET() {
  try {
    const accionistas = await getAccionistasData();
    accionistas.sort((a, b) => a.codigo - b.codigo);
    return NextResponse.json(accionistas);
  } catch (err: any) {
    return NextResponse.json(
      { detail: err?.message || "Error al listar accionistas históricos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const accionistas = await getAccionistasData();

    const maxCodigo = accionistas.reduce((max, a) => Math.max(max, a.codigo || 0), 0);
    const nuevo = {
      id: "acc-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      codigo: Number(body.codigo) || maxCodigo + 1,
      nombreCompleto: body.nombreCompleto?.trim() || "",
      documentoNumero: body.documentoNumero?.trim() || "",
      fechaIngreso: body.fechaIngreso || "2021-06-08",
      accionesFundacion: Number(body.accionesFundacion) || 1,
      capitalInicial: Number(body.capitalInicial) || Number(body.accionesFundacion || 1) * 30,
      rolFundacion: body.rolFundacion?.trim() || "Socio Fundador",
      estado: body.estado || "ACTIVO",
      observaciones: body.observaciones?.trim() || "",
    };

    accionistas.push(nuevo);
    await saveAccionistasData(accionistas);

    return NextResponse.json(nuevo, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err?.message || "Error al agregar accionista histórico" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ detail: "ID requerido" }, { status: 400 });
    }

    const accionistas = await getAccionistasData();
    const index = accionistas.findIndex((a) => a.id === body.id);
    if (index === -1) {
      return NextResponse.json({ detail: "Accionista no encontrado" }, { status: 404 });
    }

    accionistas[index] = {
      ...accionistas[index],
      ...body,
      codigo: Number(body.codigo ?? accionistas[index].codigo),
      accionesFundacion: Number(body.accionesFundacion ?? accionistas[index].accionesFundacion),
      capitalInicial: Number(body.capitalInicial ?? accionistas[index].capitalInicial),
    };

    await saveAccionistasData(accionistas);
    return NextResponse.json(accionistas[index]);
  } catch (err: any) {
    return NextResponse.json(
      { detail: err?.message || "Error al actualizar accionista" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ detail: "ID requerido" }, { status: 400 });
    }

    const accionistas = await getAccionistasData();
    const filtrados = accionistas.filter((a) => a.id !== id);
    await saveAccionistasData(filtrados);

    return NextResponse.json({ success: true, message: "Accionista eliminado" });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err?.message || "Error al eliminar accionista" },
      { status: 500 }
    );
  }
}
