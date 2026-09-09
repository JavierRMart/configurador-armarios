import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent

with open(RAIZ / 'tablas_extraidas.json', 'r', encoding='utf-8') as f:
    tablas_raw = json.load(f)

items = []

def limpiar(texto):
    """Quita saltos de línea y espacios sobrantes de un texto de celda."""
    if texto is None:
        return None
    return texto.replace('\n', ' ').strip()

for entrada in tablas_raw:
    pagina = entrada['pagina']
    modelos = entrada['modelos']
    tabla = entrada['tabla']

    if not tabla or len(tabla) < 2:
        continue

    header1 = tabla[0]

    # Detecta si hay una segunda fila de cabecera (ej. "Ángulo Redondo / Ángulo Recto")
    # Se reconoce porque su primera celda está vacía, a diferencia de una fila de datos normal
    tiene_doble_cabecera = len(tabla) > 1 and (tabla[1][0] is None or tabla[1][0] == '')

    # Columna 0 de la cabecera es la etiqueta de la fila (ej. "PUERTAS"), no un formato.
    # El resto (BLOCK, HOJA...) se "rellena hacia adelante" porque una celda vacía
    # significa "sigue siendo la misma columna de arriba" (celda combinada en el PDF).
    fila_formato = header1[1:]
    columnas = []
    ultimo = None
    for val in fila_formato:
        val_limpio = limpiar(val)
        if val_limpio:
            ultimo = val_limpio
        columnas.append(ultimo)

    if tiene_doble_cabecera:
        header2 = tabla[1]
        fila_acabado = header2[1:]
        acabados = [limpiar(v) for v in fila_acabado]
        primera_fila_datos = 2
    else:
        acabados = [None] * len(columnas)
        primera_fila_datos = 1

    for fila in tabla[primera_fila_datos:]:
        tipo_puerta = limpiar(fila[0])
        if not tipo_puerta:
            continue

        precios = fila[1:]

        for col_idx, precio_str in enumerate(precios):
            if col_idx >= len(columnas):
                break

            formato = columnas[col_idx]
            acabado = acabados[col_idx] if col_idx < len(acabados) else None

            if not formato or not precio_str:
                continue

            try:
                precio = float(str(precio_str).replace(',', '.'))
            except:
                continue

            if modelos:
                for modelo in modelos:
                    items.append({
                        'modelo': modelo,
                        'tipo': tipo_puerta,
                        'formato': formato,
                        'acabado': acabado,
                        'precio': precio,
                        'pagina': pagina
                    })
            else:
                items.append({
                    'modelo': 'sin modelo',
                    'tipo': tipo_puerta,
                    'formato': formato,
                    'acabado': acabado,
                    'precio': precio,
                    'pagina': pagina
                })

with open(RAIZ / 'items_procesados.json', 'w', encoding='utf-8') as f:
    json.dump(items, f, indent=2, ensure_ascii=False)

print(f'Total items: {len(items)}')
print('Guardados en: items_procesados.json')
