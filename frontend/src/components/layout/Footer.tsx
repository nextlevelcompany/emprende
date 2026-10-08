export default function Footer() {
  return (
    <footer className="border-t bg-background/50">
      <div className="container flex h-14 px-6 items-center justify-between text-xs text-muted-foreground">
        <span>
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold text-foreground">Caja Comunal Emprende Chambala</span>. Todos los derechos reservados.
        </span>
        <span className="hidden sm:inline">
          Sistema de Gestión Financiera y Contable
        </span>
      </div>
    </footer>
  )
}
