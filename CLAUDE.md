@AGENTS.md

# LVMeritus / ARVE — Configurador y Presupuestos

## Qué es esto

Herramienta interna de carpintería familiar (LVMeritus, marca ARVE). El padre de Javier mide
puertas y armarios a medida, y esta app calcula el presupuesto real cruzando esas medidas
con la tarifa del fabricante (hoy: Imalasa). Objetivo: pasar de 2 horas a 5 minutos por
presupuesto. No es un producto para vender a terceros — uso interno.

Contexto completo de negocio y arquitectura: ver `CONTEXTO-PROYECTO-LVMeritus.md` en la raíz.

## Cómo trabajar en este proyecto

- **Archivo completo, siempre.** Nunca fragmentos ni "añade esto después de X". Si no tienes
  la versión actual de un archivo, léelo primero.
- **Verificar con datos reales antes de dar algo por bueno.** Este proyecto ha encontrado
  varios bugs reales (ver sección "Fallos de datos ya corregidos" abajo) que una suposición
  razonable no habría detectado. Cuando cambies algo relacionado con precios, tarifas o el
  modelo de datos del armario, comprueba con un caso real antes de darlo por cerrado.
- **Un paso a la vez.** Si algo bloquea (falta una decisión de negocio, falta hablar con el
  padre de Javier), anótalo y sigue con lo que sí se puede avanzar. No lo resuelvas adivinando.
- **Antes de borrar o mover archivos, pregunta y enseña qué vas a hacer.** No borres nada
  sin confirmación explícita, aunque parezca claramente basura.
- **Comitea solo lo que cambia por la razón que estás resolviendo.** Si ves cambios sin
  comitear de otra sesión que no reconoces, pregunta antes de mezclarlos o descartarlos.

## Arquitectura

Next.js 16.2.6 (TypeScript) + Supabase (Postgres + Auth + Storage) + jsPDF/html2canvas para PDFs.

- **Producción:** https://configurador-armarios.vercel.app/ (despliegue automático en Vercel con cada push a `main`)
- **Supabase:** proyecto `zjnhnvcrjsxupvcwenyg`

Rutas: `/` (menú), `/configurador` (medición), `/proyectos` (listado), `/tarifas` (gestión de
tarifas — ver aviso abajo), `/presupuesto?proyecto=ID` (cálculo + PDF), `/empresa` (datos fiscales).

Tablas clave: `price_lists` (una fila por tarifa, con `descuento_porcentaje`),
`price_list_items` (cada precio, con `atributos` JSON: modelo/tipo/formato/familia/acabado,
más `imagen_vidriera`), `datos_empresa`, `margenes_familia`, `presupuestos_generados`.

Bucket de Storage `vidrieras` (público): imágenes de referencia del cristal por modelo, sin precios.

## Cómo se cargan las tarifas HOY (importante)

La pantalla `/tarifas` de la app tiene un flujo de extracción con IA que existe en el código
pero **no es el que se usa** — es un flujo aparte, no consolidado, con un botón "Procesar"
destructivo (ya tiene confirmación añadida, pero sigue sin ser el camino real).

El proceso real es manual, en el ordenador de Javier:
1. `extract_tables.py` — lee el PDF de Imalasa, extrae modelos + tablas
2. `process_tables.py` — convierte tablas en lista plana de precios
3. `format_for_bd.py` — da forma final (categoría, familia, filtra lo que no se vende)
4. Borrar la tarifa vieja en Supabase y recargar con `node seed_prices.js`

Cualquier cambio en la tarifa de Imalasa pasa por repetir estos 4 pasos.

## Decisiones de negocio ya tomadas

- Imalasa: **solo puertas**, no armarios (el padre no los compra ahí) — se filtran al cargar
- Puertas blindadas de Imalasa: no se venden — también filtradas
- El BLOCK ya incluye cerco y tapajuntas; la HOJA suelta solo se usa en correderas
- Descuento habitual: 15%, pero en obra grande Imalasa da precios netos — eso es **otra
  tarifa aparte**, no un descuento mayor (el sistema ya admite varias tarifas a la vez)
- Margen de partida: 30% para puertas y armarios, editable desde la pantalla de tarifas
- Descuento al cliente se aplica sobre la base imponible, **antes** del IVA
- Proveedores nuevos: pedirles listado plano antes de trabajar su tarifa

## Fallos de datos ya corregidos (no repetir el mismo error)

- Modelos partidos en dos líneas del PDF — el extractor los reconstruye, pero cuidado con
  variantes nuevas del corte si cambia el PDF
- 8 modelos de puertas fresadas mezclaban precios de dos tablas distintas bajo el mismo
  precio — se separó con un campo `acabado`
- La página de Puertas Lisas no sigue el patrón `MOD. ...` del resto del catálogo — caso especial
- Dos modelos pueden compartir literalmente la misma vidriera (el catálogo dibuja un solo icono)
- `getVidrierasDisponibles` en algún momento coló tipos de armario (ABATIBLE, CORRED.) en el
  desplegable de vidrieras — hay que filtrar por nombre de tipo, no solo por CIEGA/CARPELINO

Moraleja: nunca asumir que un patrón vale para todo el catálogo sin verificar caso por caso.

## Qué funciona hoy (verificado)

- Medición completa de armarios (con modelo de datos `interior.baldas` + `interior.cajonera`,
  separados — no una lista mixta de "elementos") y puertas
- Tarifa de Imalasa cargada: 706 precios de puerta, con familia y acabado donde aplica
- Cálculo de precio real para Ciega+Batiente y Vidriera+Batiente: tarifa → descuento →
  margen → IVA
- Margen y descuento al cliente ajustables al momento en la pantalla de presupuesto
  (no se guardan, son por presupuesto)
- Desplegable de vidriera con las opciones reales del modelo, más imagen de referencia sin precios
- PDF de presupuesto: datos de empresa/cliente, líneas completas, IVA desglosado, numeración
  correlativa que nunca se repite, orientado a conversión (validez, plazo, forma de pago 50/40/10)

## Pendiente, bloqueado por decisión de negocio (no por código)

- **Corredera** (ciega o vidriera): no es un precio suelto, es una receta de piezas
  (casonetto, kit de herraje, tapetas, canal inferior). Falta una sesión con el padre
  definiendo esa receta, y extraer las páginas 31-45 del PDF de Imalasa
- **Armarios a medida**: sin ningún precio conectado. Necesitaría tarifa de materiales +
  fórmula de despiece según medidas — proyecto grande aparte

## Proyectos aparcados a propósito

- Normalizador de tarifas para otros fabricantes (PDF/Excel distintos)
- Catálogo completo de Imalasa (incluyendo armarios) para posible demo al CEO
- Tabla de clientes + envío automático de presupuestos por email
- Automatizar el pedido a fábrica al aceptar presupuesto (falta saber cómo lo hace el padre hoy)
