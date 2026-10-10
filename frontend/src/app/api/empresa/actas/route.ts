import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "src", "data", "actas.json");

async function getActasData(): Promise<any[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveActasData(actas: any[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(actas, null, 2), "utf-8");
}

export async function GET() {
  try {
    const actas = await getActasData();
    // Ordenar de más reciente a más antigua
    actas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    return NextResponse.json(actas);
  } catch (err: any) {
    return NextResponse.json(
      { detail: err?.message || "Error al listar actas de reunión" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const actas = await getActasData();

    const nuevaActa = {
      id: "acta-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      numeroActa: body.numeroActa || `Acta N° ${actas.length + 1}-${new Date().getFullYear()}`,
      tipo: body.tipo || "ORDINARIA",
      tipoTitulo: body.tipoTitulo || "Asamblea General Ordinaria",
      fecha: body.fecha || new Date().toISOString().split("T")[0],
      hora: body.hora || "14:00",
      lugar: body.lugar || "Local Comunal de Chambala",
      presidente: body.presidente || "PONCE HUILCAYA ADELA",
      secretario: body.secretario || "MORAN LAIME CIRILO",
      asistentes: Number(body.asistentes) || 0,
      quorumPorcentaje: Number(body.quorumPorcentaje) || 0,
      agenda: Array.isArray(body.agenda) ? body.agenda : (body.agenda ? [body.agenda] : []),
      acuerdos: Array.isArray(body.acuerdos) ? body.acuerdos : (body.acuerdos ? [body.acuerdos] : []),
      resumen: body.resumen || "",
      archivoNombre: body.archivoNombre || "",
      archivoTipo: body.archivoTipo || "",
      archivoTamano: Number(body.archivoTamano) || 0,
      archivoData: body.archivoData || "",
      fechaRegistro: new Date().toISOString().split("T")[0],
    };

    actas.unshift(nuevaActa);
    await saveActasData(actas);

    return NextResponse.json(nuevaActa, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err?.message || "Error al crear acta de reunión" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ detail: "ID de acta requerido" }, { status: 400 });
    }

    const actas = await getActasData();
    const index = actas.findIndex((a) => a.id === body.id);
    if (index === -1) {
      return NextResponse.json({ detail: "Acta no encontrada" }, { status: 404 });
    }

    actas[index] = {
      ...actas[index],
      ...body,
      asistentes: Number(body.asistentes ?? actas[index].asistentes),
      quorumPorcentaje: Number(body.quorumPorcentaje ?? actas[index].quorumPorcentaje),
      updatedAt: new Date().toISOString(),
    };

    await saveActasData(actas);
    return NextResponse.json(actas[index]);
  } catch (err: any) {
    return NextResponse.json(
      { detail: err?.message || "Error al actualizar acta de reunión" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ detail: "ID de acta requerido" }, { status: 400 });
    }

    const actas = await getActasData();
    const filtradas = actas.filter((a) => a.id !== id);
    await saveActasData(filtradas);

    return NextResponse.json({ success: true, message: "Acta eliminada" });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err?.message || "Error al eliminar acta" },
      { status: 500 }
    );
  }
}
