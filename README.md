# TrapümPDF

**TrapümPDF** es una aplicación de código abierto para el procesamiento de documentos PDF que se ejecuta directamente en el navegador del usuario, con procesamiento 100% local sin requerir conexión a internet ni servidores externos.

> *Trapüm / Trapümün* — voz mapudungun que significa "unir, juntar y anexar dos o más elementos para hacerlos uno solo."

---

## ✨ Funcionalidades

| Herramienta | Descripción |
|---|---|
| **Unir PDF** | Combina múltiples archivos PDF e imágenes (JPG, PNG, WEBP) en un solo documento |
| **Organizar PDF** | Reordena, rota y elimina páginas con arrastrar y soltar |
| **Dividir PDF** | Extrae páginas individuales o divide el documento en rangos personalizados |
| **Comprimir PDF** | Reduce el peso de archivos PDF con niveles de calidad ajustables |

---

## 🔒 Privacidad y Seguridad

TrapümPDF procesa todos los documentos **exclusivamente en la memoria RAM del equipo del usuario** (Air-Gapped). Ningún archivo es transmitido a servidores externos ni almacenado fuera del equipo.

Este diseño es compatible con los principios establecidos en la **Ley N.º 21.719 de Chile** (Ley de Protección de Datos Personales):

- **Art. 3 y Art. 14** — Principio de Confidencialidad y Deber de Secreto
- **Art. 26 y ss.** — Transferencia Internacional de Datos (riesgo nulo)
- **Art. 14** — Medidas de Seguridad Técnicas y Organizativas

---

## 🛠️ Stack Tecnológico

- **React 19** + **TypeScript**
- **Vite** (bundler)
- **Tailwind CSS v4** + **shadcn/ui**
- **pdf-lib** — generación y manipulación de PDF en cliente
- **pdfjs-dist** — renderizado de miniaturas y previsualización
- **JSZip** — empaquetado de múltiples archivos en ZIP

---

## 📥 Descarga y Uso (Usuarios)

Descarga la última versión estable desde la sección **[Releases](https://github.com/alejopiaa/trapumpdf/releases)** de este repositorio:

1. Ve a **Releases → v1.0.0 → Assets**.
2. Descarga el archivo `.zip` de la versión.
3. Descomprime la carpeta en tu equipo.
4. Abre el archivo `index.html` directamente en tu navegador (Chrome, Edge o Firefox).

No requiere instalación, internet ni permisos de administrador.

---

## 🛠️ Desarrollo Local (Desarrolladores)

Si deseas revisar el código, modificarlo o contribuir al proyecto:

```bash
# 1. Clona el repositorio
git clone https://github.com/alejopiaa/trapumpdf.git
cd trapumpdf

# 2. Instala dependencias
npm install

# 3. Inicia el servidor de desarrollo
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 📦 Archivos Exportados

Todos los archivos generados por TrapümPDF siguen la nomenclatura estándar:

```
[NombreOriginalDelArchivo]_trapumpdf.pdf
[NombreOriginalDelArchivo]_trapumpdf.zip
```

---

## 📄 Licencia

MIT © [alejopia.com](https://alejopia.com)
