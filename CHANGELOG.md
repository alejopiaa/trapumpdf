# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue el estándar [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y el versionado sigue [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

## [1.2.0] - 2026-08-14

### Added
- Soporte para rotar páginas individuales en la herramienta Dividir.
- Botones de selección rápida de páginas pares, impares, todas o ninguna en la herramienta Dividir.
- Detección automática y opción para excluir páginas en blanco en documentos PDF.
- Botón para reajustar los niveles de compresión sin recargar los archivos.
- Indicador visual para la posición exacta de inserción al arrastrar páginas.
- Sistema de tolerancia a fallos para aislar errores en documentos dañados sin interrumpir la aplicación.

### Changed
- Rediseño de la interfaz centrado en el espacio de trabajo con visualización expandida de miniaturas en cuadrícula.
- Paneles laterales de control unificados para todas las herramientas con cuadros de instrucciones contextuales.
- Optimización en la velocidad de carga de miniaturas para documentos extensos.
- Motor de compresión mejorado para preservar texto editable y búsqueda interactiva.
- Gestión de memoria optimizada para liberar recursos del navegador al finalizar tareas o alternar herramientas.

### Fixed
- Corrección en la selección de páginas pares e impares en la herramienta Dividir.
- Corrección en la generación de nombres de archivo para conservar el nombre original con sufijo `_trapumpdf` sin duplicaciones ni caracteres anómalos.
- Corrección en el diálogo de selección de archivos para restringir a un único documento en Organizar y Dividir.
- Corrección en la descarga de archivos individuales separados desde la pantalla de resultados.
- Corrección de comportamiento al reiniciar la aplicación tras procesar un documento.
- Corrección de parpadeo visual al mover páginas entre tarjetas en el lienzo.

## [1.1.0] - 2026-08-10

### Added
- Indicador visual cuando un documento ya se encuentra en su tamaño óptimo de compresión.

### Changed
- Rediseño de la pantalla de resultados con opciones más claras de descarga individual y por paquete ZIP.
- Mejoras de adaptabilidad y navegación en pantallas de menor resolución.

### Fixed
- Corrección de desbordamiento horizontal en pantallas pequeñas.
- Control de compresión para evitar incrementos no deseados en el tamaño del archivo final.

### Removed
- Lista duplicada de descargas por archivo en el panel de resultados.

## [1.0.0] - 2026-08-07

### Added
- Herramienta **Unir PDF**: combinación de múltiples archivos PDF e imágenes en un único documento.
- Herramienta **Organizar PDF**: reordenación, rotación y exclusión de páginas interactivas.
- Herramienta **Dividir PDF**: extracción de páginas por selección directa, rangos o bloques de páginas.
- Herramienta **Comprimir PDF**: reducción del tamaño de archivos con niveles de optimización ajustables.
- Procesamiento 100% local en el navegador sin envío de datos a servidores externos.
- Soporte para arrastrar y soltar archivos.
- Exportación de documentos individuales en PDF y descargas múltiples en paquetes ZIP.
- Soporte para tema visual claro y oscuro con persistencia.

[Unreleased]: https://github.com/alejopiaa/trapumpdf/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/alejopiaa/trapumpdf/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/alejopiaa/trapumpdf/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/alejopiaa/trapumpdf/releases/tag/v1.0.0
