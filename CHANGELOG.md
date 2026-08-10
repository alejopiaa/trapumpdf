# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue el estándar [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y el versionado sigue [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

## [1.1.0] - 2026-08-10

### Added
- Salvaguarda antiaumento de peso en Comprimir PDF que garantiza que el archivo final nunca pese más que el original.
- Indicador visual `⚡ Tamaño óptimo alcanzado` en la pantalla de resultado para documentos previamente optimizados.
- Función `clearPdfjsCache()` y `releaseBlobUrls()` para liberar activamente memoria RAM (proxies PDF.js y Blob URLs) al limpiar archivos.
- Micro-animación de asentamiento sutil periódica (`animate-logo-nod`) de 1.5px cada 6 segundos en el logo de la cabecera.

### Changed
- Rediseño de la pantalla de resultado en procesamiento masivo a 2 botones limpios: `Descargar Paquete (.ZIP)` y `Descargar Archivos Separados`.
- Condicionamiento de accesos directos de encadenado (*Organizar*, *Comprimir*, *Unir*) para mostrarse exclusivamente al procesar 1 solo archivo individual.
- Reestructuración de la maquetación en laptops acomodando el lienzo y el panel lateral lado a lado en un flujo flexible continuo, eliminando el scroll horizontal.
- Unificación del espaciado superior global a `pt-8` en el contenedor principal de `App.tsx`, removiendo paddings superiores duplicados en vistas.
- Envoltorio de `DropZone` ajustado a `max-w-4xl` para alineación simétrica perfecta con el lienzo.
- Actualización del número de versión a `"1.1.0"` en `package.json` y badge `v1.1.0` en el modal informativo.

### Removed
- Eliminación de la lista redundante inferior de descargas por archivo individual en la pantalla de éxito.

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
