# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue el estándar [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y el versionado sigue [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

## [1.2.0] - 2026-08-14

### Added
- Rediseño Workspace-First con visualización expansiva de miniaturas de 5 a 7 columnas simultáneas.
- Panel lateral de control unificado y persistente en CSS Grid con cálculo matemático `minmax(0, 1fr) 320px`, inmune a desbordes en 1366×768.
- Auto-colapso inteligente del Hero Banner al cargar documentos para maximizar el área de trabajo vertical.
- Tarjetas `PageCard` de alta densidad con micro-acciones en hover (Zoom, Rotar, Quitar) y barra inferior ultracompacta.
- Detección automática y exclusión de páginas en blanco en documentos PDF.
- Motor de compresión híbrido con optimización estructural de objetos y flujos nativos `pdf-lib`.
- Botón para re-ajustar nivel de compresión en la pantalla final conservando los archivos cargados.
- Liberación automática de memoria RAM y descarte de archivos al alternar herramientas en el menú superior.
- Indicador visual de inserción luminoso (*Drop Indicator*) en reordenamiento de páginas por arrastre.
- Generación automática de instalador portable `.bat` y empaquetado en carpetas versionadas `dist/TrapumPDF_vX.X.X`.

### Changed
- Procesamiento directo de compresión sin generación redundante de miniaturas, acelerando el proceso a 1-2 segundos.
- Eliminación de conversiones a Base64 en compresión de imágenes mediante buffers nativos `OffscreenCanvas` y `Blob`.
- Preservación íntegra de texto vectorial y búsqueda interactiva (`Ctrl + F`) en documentos comprimidos.

### Fixed
- Corrección del botón "Descargar Archivos Separados" en la pantalla de resultados tras exportación masiva.
- Corrección de inoperatividad en el botón de reinicio para redirigir limpiamente a la pantalla principal.
- Corrección de parpadeo (*flickering*) y cálculo de posición de inserción (antes/después) al soltar páginas entre tarjetas.

## [1.1.0] - 2026-08-10

### Added
- Liberación activa de memoria RAM al limpiar o vaciar archivos.
- Indicador de tamaño óptimo alcanzado al procesar documentos ya comprimidos.

### Changed
- Rediseño de la pantalla de resultados para optimizar descargas masivas e individuales.
- Optimización de adaptabilidad y flujo de trabajo en pantallas reducidas.

### Fixed
- Corrección de desbordamiento horizontal en dispositivos de pantalla pequeña.
- Control de compresión para evitar incrementos en el peso final del archivo.

### Removed
- Lista redundante de descargas por archivo individual en el panel de resultados.

## [1.0.0] - 2026-08-07

### Added
- Herramienta **Unir PDF**: combina múltiples archivos PDF e imágenes en un único documento.
- Herramienta **Organizar PDF**: reordena, rota y excluye páginas mediante arrastrar y soltar.
- Herramienta **Dividir PDF**: extrae páginas o divide documentos por rangos y bloques.
- Herramienta **Comprimir PDF**: reduce el tamaño de archivos PDF con niveles ajustables.
- Procesamiento 100% local en memoria RAM del navegador.
- Soporte para arrastrar y soltar archivos.
- Exportación en formato PDF o paquetes comprimidos ZIP.
- Modo oscuro y modo claro con persistencia.
