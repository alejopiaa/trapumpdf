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
- Flujo de trabajo encadenado (Pipeline): transfiere el PDF resultante directamente hacia otra herramienta desde la pantalla de resultado.
- Generación de paquete ZIP automático al procesar múltiples archivos en Organizar PDF y Comprimir PDF.
- Diseño glassmorphic con modo oscuro y modo claro, persistido en `localStorage`.
- Menú de navegación de 4 pestañas (Unir, Organizar, Dividir, Comprimir) en la cabecera.
- Modal de previsualización Lightbox con zoom para inspeccionar páginas en alta resolución.
- Conmutadores de vista Cuadrícula / Lista en Unir PDF y Comprimir PDF.
- Modal de progreso animado con barra de porcentaje durante el procesamiento.
- Toast flotante efímero (5 s) para notificación de archivos omitidos no soportados.
- Atajos de teclado silenciosos para usuarios avanzados: `Ctrl+A` (seleccionar todo) y `Supr` / `Delete` (eliminar seleccionados).
- Sistema de diseño basado en Tailwind CSS v4 con tokens de color institucional.
- Componentes shadcn/ui: `Tabs`, `Card`, `Button`, `Badge`, `Dialog`, `Progress`, `Input`.
- Custom Hooks persistentes por herramienta: `usePdfMerge`, `usePdfEdit`, `usePdfSplit`, `usePdfCompress`.
- Modal "Acerca de TrapümPDF" con explicación de la marca y fundamentación de cumplimiento de la Ley N.º 21.719 de Chile (Arts. 3, 14 y 26).
- Footer con enlace al modal informativo y créditos del desarrollador.
