# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue el estándar [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y el versionado sigue [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

## [1.0.0] - 2026-08-07

### Added

- Herramienta **Unir PDF**: combina múltiples archivos PDF e imágenes (JPG, PNG, WEBP) en un único documento ordenado.
- Herramienta **Organizar PDF**: reordena, rota (90°/180°/270°) y excluye páginas mediante arrastrar y soltar, con exportación como PDF único o paquete ZIP.
- Herramienta **Dividir PDF**: extrae páginas individuales, divide por rangos personalizados y por bloques de N páginas.
- Herramienta **Comprimir PDF**: reduce el peso de archivos PDF con niveles de calidad ajustables (Recomendado, Alto, Personalizado).
- Procesamiento 100% local en memoria RAM del navegador, sin servidores externos.
- Soporte de arrastrar y soltar para carga de archivos en todas las herramientas.
- Nomenclatura de archivos exportados estandarizada: `[NombreOriginal]_trapumpdf.pdf` / `.zip`.
- Flujo de trabajo encadenado: transfiere el resultado de una herramienta directamente a otra desde la pantalla de resultado.
- Generación de paquete ZIP automático al procesar múltiples archivos simultáneamente.
- Modo oscuro y modo claro con persistencia entre sesiones.
- Previsualización de páginas con zoom en modal Lightbox.
- Atajos de teclado para usuarios avanzados: `Ctrl+A` (seleccionar todo) y `Supr` / `Delete` (eliminar selección).
- Modal informativo "Acerca de TrapümPDF" con fundamentación de cumplimiento de la Ley N.º 21.719 de Chile (Arts. 3, 14 y 26).
