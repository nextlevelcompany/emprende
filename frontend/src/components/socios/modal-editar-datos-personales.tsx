"use client";

import * as React from "react";
import {
  Edit,
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DocumentoAdjunto,
  FichaDatosPersonales,
  parseFichaSocio,
  serializeFichaSocio,
  formatTamanoArchivo,
} from "@/lib/socios-datos-personales";

interface ModalEditarDatosPersonalesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  socio: {
    id: string;
    codigo: number;
    nombres: string;
    apellidos: string;
    nombreCompleto?: string;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
    documentoTipo?: string;
    documentoEnmascarado?: string;
    documentoNumero?: string | null;
    numeroDocumento?: string | null;
    notas?: string | null;
  } | null;
  onSuccess?: () => void;
}

export function ModalEditarDatosPersonales({
  open,
  onOpenChange,
  socio,
  onSuccess,
}: ModalEditarDatosPersonalesProps) {
  const [ficha, setFicha] = React.useState<FichaDatosPersonales>(() =>
    parseFichaSocio(socio)
  );
  const [guardando, setGuardando] = React.useState(false);
  const [docParaVer, setDocParaVer] = React.useState<DocumentoAdjunto | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sincronizar estado cuando cambia el socio seleccionado
  React.useEffect(() => {
    if (socio && open) {
      setFicha(parseFichaSocio(socio));
    }
  }, [socio, open]);

  // Manejar subida de documentos locales
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 5 * 1024 * 1024; // 5 MB por archivo

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        toast.error(`El archivo "${file.name}" supera el límite de 5MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const nuevoDoc: DocumentoAdjunto = {
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : Math.random().toString(36).substring(2, 9),
          nombre: file.name,
          tipo: file.type || "application/octet-stream",
          tamano: file.size,
          fecha: new Date().toLocaleDateString("es-PE"),
          data: base64,
        };

        setFicha((prev) => {
          // Auto-marcar checks si el nombre contiene DNI o recibo
          const nombreLower = file.name.toLowerCase();
          let adjDni = prev.adjuntaDni;
          let adjRecibo = prev.adjuntaRecibo;
          if (nombreLower.includes("dni") || nombreLower.includes("identidad")) {
            adjDni = true;
          }
          if (
            nombreLower.includes("recibo") ||
            nombreLower.includes("agua") ||
            nombreLower.includes("luz") ||
            nombreLower.includes("telefono")
          ) {
            adjRecibo = true;
          }

          return {
            ...prev,
            adjuntaDni: adjDni,
            adjuntaRecibo: adjRecibo,
            documentos: [...prev.documentos, nuevoDoc],
          };
        });

        toast.success(`Documento "${file.name}" adjuntado correctamente`);
      };

      reader.onerror = () => {
        toast.error(`Error al leer el archivo "${file.name}"`);
      };

      reader.readAsDataURL(file);
    });

    if (e.target) {
      e.target.value = "";
    }
  };

  const handleEliminarDoc = (docId: string, nombre: string) => {
    setFicha((prev) => ({
      ...prev,
      documentos: prev.documentos.filter((d) => d.id !== docId),
    }));
    toast.info(`Documento "${nombre}" eliminado`);
  };

  const handleDescargarDoc = (doc: DocumentoAdjunto) => {
    try {
      const link = document.createElement("a");
      link.href = doc.data;
      link.download = doc.nombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("No se pudo descargar el archivo");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socio) return;

    if (!ficha.nombres.trim()) {
      toast.error("El nombre del socio es obligatorio");
      return;
    }
    if (!ficha.apellidos.trim()) {
      toast.error("Los apellidos del socio son obligatorios");
      return;
    }

    try {
      setGuardando(true);

      const notasSerializadas = serializeFichaSocio(ficha);

      const payload = {
        nombres: ficha.nombres.trim(),
        apellidos: ficha.apellidos.trim(),
        numeroDocumento: ficha.dni.trim() || null,
        documentoNumero: ficha.dni.trim() || null,
        telefono: ficha.telefono.trim() || null,
        email: ficha.email.trim() || null,
        direccion: ficha.direccion.trim() || null,
        notas: notasSerializadas,
      };

      const res = await fetch(`/api/socios/${socio.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Error al actualizar datos personales");
      }

      toast.success(`Datos personales del socio #${socio.codigo} actualizados con éxito`);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "Error al guardar cambios");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:max-w-4xl md:max-w-5xl lg:max-w-5xl max-h-[92vh] overflow-y-auto p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
              <Edit className="h-5 w-5 text-primary" />
              Editar Datos Personales &bull; Socio #{socio?.codigo}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Ficha oficial del padrón de socios &bull; Datos personales y documentación adjunta
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            {/* SECCIÓN: DATOS PERSONALES */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <div className="border-b pb-2.5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  DATOS PERSONALES
                </h3>
              </div>

              {/* Fila 1: Nombre y DNI */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Nombres *</Label>
                  <Input
                    required
                    value={ficha.nombres}
                    onChange={(e) => setFicha({ ...ficha, nombres: e.target.value })}
                    placeholder="Ej. Cirilo"
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Apellidos *</Label>
                  <Input
                    required
                    value={ficha.apellidos}
                    onChange={(e) => setFicha({ ...ficha, apellidos: e.target.value })}
                    placeholder="Ej. Moran Laime"
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">DNI *</Label>
                  <Input
                    required
                    value={ficha.dni}
                    onChange={(e) => setFicha({ ...ficha, dni: e.target.value })}
                    placeholder="8 dígitos"
                    maxLength={15}
                    className="h-10 text-sm font-mono font-medium"
                  />
                </div>
              </div>

              {/* Fila 2: Edad, Sexo, Estado Civil, Teléfono */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Edad</Label>
                  <Input
                    type="number"
                    min="18"
                    max="110"
                    value={ficha.edad}
                    onChange={(e) => setFicha({ ...ficha, edad: e.target.value })}
                    placeholder="Ej. 45"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Sexo</Label>
                  <Select
                    value={ficha.sexo || "NONE"}
                    onValueChange={(val) =>
                      setFicha({
                        ...ficha,
                        sexo: val === "NONE" ? "" : (val as "MASCULINO" | "FEMENINO"),
                      })
                    }
                  >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Sin especificar</SelectItem>
                      <SelectItem value="MASCULINO">Masculino</SelectItem>
                      <SelectItem value="FEMENINO">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Estado Civil</Label>
                  <Select
                    value={ficha.estadoCivil || "NONE"}
                    onValueChange={(val) =>
                      setFicha({
                        ...ficha,
                        estadoCivil: val === "NONE" ? "" : (val as any),
                      })
                    }
                  >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Sin especificar</SelectItem>
                      <SelectItem value="SOLTERO(A)">Soltero(a)</SelectItem>
                      <SelectItem value="CASADO(A)">Casado(a)</SelectItem>
                      <SelectItem value="CONVIVIENTE">Conviviente</SelectItem>
                      <SelectItem value="VIUDO(A)">Viudo(a)</SelectItem>
                      <SelectItem value="DIVORCIADO(A)">Divorciado(a)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Teléfono</Label>
                  <Input
                    type="tel"
                    value={ficha.telefono}
                    onChange={(e) => setFicha({ ...ficha, telefono: e.target.value })}
                    placeholder="Ej. 964123456"
                    className="h-10 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Fila 3: Dirección */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Dirección</Label>
                <Input
                  value={ficha.direccion}
                  onChange={(e) => setFicha({ ...ficha, direccion: e.target.value })}
                  placeholder="Ej. Av. Chambala S/N, Concepción, Junín"
                  className="h-10 text-sm"
                />
              </div>

              {/* Fila 4: Ocupación y Nº de personas que viven en la casa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Ocupación</Label>
                  <Input
                    value={ficha.ocupacion}
                    onChange={(e) => setFicha({ ...ficha, ocupacion: e.target.value })}
                    placeholder="Ej. Agricultor / Comerciante / Independiente"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Nº de personas que viven en la casa</Label>
                  <Input
                    type="number"
                    min="1"
                    max="25"
                    value={ficha.personasEnCasa}
                    onChange={(e) => setFicha({ ...ficha, personasEnCasa: e.target.value })}
                    placeholder="Ej. 4"
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN: DOCUMENTACIÓN QUE ADJUNTA */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <div className="border-b pb-2.5 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  ADJUNTA DOCUMENTACIÓN
                </h3>
                <span className="text-xs text-muted-foreground">Ficha de ingreso oficial</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Copia de DNI */}
                <div className="flex items-center justify-between p-3.5 rounded-lg border bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold cursor-pointer">
                      Copia de DNI
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Documento oficial de identidad
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={ficha.adjuntaDni ? "default" : "outline"}
                      className="h-8 px-3.5 text-xs font-semibold gap-1.5"
                      onClick={() => setFicha({ ...ficha, adjuntaDni: true })}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Sí
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!ficha.adjuntaDni ? "secondary" : "outline"}
                      className="h-8 px-3.5 text-xs font-semibold gap-1.5"
                      onClick={() => setFicha({ ...ficha, adjuntaDni: false })}
                    >
                      <XCircle className="h-4 w-4" />
                      No
                    </Button>
                  </div>
                </div>

                {/* Copia de recibo */}
                <div className="flex items-center justify-between p-3.5 rounded-lg border bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold cursor-pointer">
                      Copia de recibo de agua, luz o teléfono
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Constancia domiciliaria
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={ficha.adjuntaRecibo ? "default" : "outline"}
                      className="h-8 px-3.5 text-xs font-semibold gap-1.5"
                      onClick={() => setFicha({ ...ficha, adjuntaRecibo: true })}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Sí
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!ficha.adjuntaRecibo ? "secondary" : "outline"}
                      className="h-8 px-3.5 text-xs font-semibold gap-1.5"
                      onClick={() => setFicha({ ...ficha, adjuntaRecibo: false })}
                    >
                      <XCircle className="h-4 w-4" />
                      No
                    </Button>
                  </div>
                </div>
              </div>

              {/* Otros documentos */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Otros Documentos Adjuntos</Label>
                <Input
                  value={ficha.adjuntaOtros}
                  onChange={(e) => setFicha({ ...ficha, adjuntaOtros: e.target.value })}
                  placeholder="Ej. Constancia comunal de posesión, certificado de trabajo, etc."
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {/* SECCIÓN: ADJUNTAR DOCUMENTOS DIGITALES */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    DOCUMENTOS DIGITALES SUBIDOS ({ficha.documentos.length})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Adjunta archivos escaneados o fotos de DNI, recibos o constancias (PDF, PNG, JPG hasta 5MB)
                  </p>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="application/pdf,image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 gap-1.5 text-xs font-semibold bg-background"
                  >
                    <Upload className="h-4 w-4 text-primary" />
                    Adjuntar Archivo
                  </Button>
                </div>
              </div>

              {/* Lista de archivos adjuntados */}
              {ficha.documentos.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    No hay documentos digitales adjuntos
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Haz clic aquí o en &quot;Adjuntar Archivo&quot; para subir copia de DNI, recibo o constancias.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {ficha.documentos.map((doc) => {
                    const isPdf =
                      doc.tipo === "application/pdf" || doc.nombre.toLowerCase().endsWith(".pdf");
                    const isImg =
                      doc.tipo.startsWith("image/") ||
                      /\.(jpe?g|png|webp|gif)$/i.test(doc.nombre);

                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-sm hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            {isPdf ? (
                              <FileText className="h-5 w-5 text-destructive" />
                            ) : isImg ? (
                              <ImageIcon className="h-5 w-5 text-blue-500" />
                            ) : (
                              <FileText className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate" title={doc.nombre}>
                              {doc.nombre}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTamanoArchivo(doc.tamano)} &bull; {doc.fecha}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setDocParaVer(doc)}
                            title="Previsualizar documento"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleDescargarDoc(doc)}
                            title="Descargar documento"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleEliminarDoc(doc.id, doc.nombre)}
                            title="Eliminar documento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECCIÓN: OBSERVACIONES ADICIONALES */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Observaciones Adicionales / Padrón</Label>
              <Textarea
                rows={2}
                value={ficha.observaciones}
                onChange={(e) => setFicha({ ...ficha, observaciones: e.target.value })}
                placeholder="Notas comunales, antecedentes o detalles de asamblea..."
                className="text-sm"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={guardando}
                className="h-10 px-5 text-sm"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando} className="h-10 px-5 text-sm font-semibold">
                {guardando ? "Guardando..." : "Guardar Datos Personales"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE PREVISUALIZACIÓN DE DOCUMENTO */}
      <Dialog open={!!docParaVer} onOpenChange={(open) => !open && setDocParaVer(null)}>
        <DialogContent className="w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-sm sm:text-base pr-6">
              <span className="truncate">{docParaVer?.nombre}</span>
              {docParaVer && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDescargarDoc(docParaVer)}
                  className="h-7 gap-1 text-xs shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 flex items-center justify-center">
            {docParaVer?.tipo.startsWith("image/") ||
            /\.(jpe?g|png|webp|gif)$/i.test(docParaVer?.nombre || "") ? (
              <img
                src={docParaVer?.data}
                alt={docParaVer?.nombre}
                className="max-h-[75vh] w-auto max-w-full rounded border object-contain shadow-sm"
              />
            ) : docParaVer?.tipo === "application/pdf" ||
              docParaVer?.nombre.toLowerCase().endsWith(".pdf") ? (
              <iframe
                src={docParaVer?.data}
                title={docParaVer?.nombre}
                className="w-full h-[75vh] rounded border shadow-sm"
              />
            ) : (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <FileText className="h-12 w-12 mx-auto text-primary" />
                <p className="text-sm font-medium">Formato no previsualizable directamente</p>
                <p className="text-xs">Puede descargarlo para verlo en su equipo.</p>
                <Button
                  size="sm"
                  onClick={() => docParaVer && handleDescargarDoc(docParaVer)}
                  className="mt-2"
                >
                  Descargar Archivo
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
