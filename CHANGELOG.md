# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue el estándar [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y el versionado sigue [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added
- Detección automática y exclusión de páginas en blanco en documentos PDF.

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
