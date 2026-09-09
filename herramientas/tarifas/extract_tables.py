import pdfplumber
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent

def extraer_modelos(lineas_pagina):
    """
    Busca el encabezado MOD. que puede estar en una o dos líneas.
    Puede cortarse de dos formas:
    - Termina en "LAC" (el nombre del modelo se parte a la mitad)
    - Termina en "y" (la conjunción antes del último modelo)
    En ambos casos, el modelo completo sigue en la línea siguiente.
    """
    for i, linea in enumerate(lineas_pagina):
        if linea.strip().startswith("MOD."):
            encabezado = linea.replace("MOD.", "").strip()

            termina_en_lac = encabezado.endswith("LAC")
            termina_en_y = encabezado.endswith(" y") or encabezado.endswith(" Y")

            if (termina_en_lac or termina_en_y) and i + 1 < len(lineas_pagina):
                siguiente = lineas_pagina[i + 1].strip()
                # Si la siguiente no es encabezado de tabla, es continuación
                if siguiente and not siguiente.startswith(("PUERTAS", "FRENTE", "CORRED")):
                    if termina_en_lac:
                        # Si no empieza con LAC, le antepongo LAC
                        if not siguiente.startswith("LAC"):
                            siguiente = "LAC " + siguiente
                        # Reemplaza el "LAC" incompleto del final, no concatena
                        if encabezado.endswith(", LAC"):
                            encabezado = encabezado[:-5] + ", " + siguiente
                        else:
                            encabezado += ", " + siguiente
                    else:
                        # Termina en "y": la siguiente línea ya trae el modelo completo
                        encabezado += " " + siguiente

            # Reemplaza " y " o " Y " por coma (mayúscula y minúscula)
            encabezado = encabezado.replace(" y ", ", ")
            encabezado = encabezado.replace(" Y ", ", ")

            # Quita un punto final suelto, si lo hay (ej. "LAC TABLAS 2.")
            encabezado = encabezado.rstrip('.')

            # Separa por coma y limpia
            modelos = [m.strip() for m in encabezado.split(",")]
            return modelos

    return []

todas_las_tablas = []

with pdfplumber.open(RAIZ / "TARIFA_IMALASA.pdf.pdf") as pdf:
    # Recorre páginas 10 a 30 (índices 9 a 29)
    for i in range(9, 30):
        page = pdf.pages[i]

        # Extrae todo el texto de la página
        texto_pagina = page.extract_text()

        # Busca modelos
        lineas_texto = texto_pagina.split('\n')
        modelos_pagina = extraer_modelos(lineas_texto)

        # Caso especial: la página 10 (Puertas Lisas) no tiene línea "MOD."
        # como el resto del catálogo. Solo hay un modelo, así que se asigna
        # a mano en vez de intentar leerlo del texto.
        if i + 1 == 10 and not modelos_pagina:
            modelos_pagina = ["LAC LISA"]

        if modelos_pagina:
            print(f"✓ Página {i + 1}: encontrados modelos {modelos_pagina}")

        # Extrae las tablas de la página
        tablas = page.extract_tables()

        if tablas:
            for tabla in tablas:
                todas_las_tablas.append({
                    "pagina": i + 1,
                    "modelos": modelos_pagina,
                    "tabla": tabla
                })
                print(f"  → tabla con {len(modelos_pagina)} modelos")
        else:
            print(f"  Página {i + 1}: sin tablas")

# Guarda como JSON
with open(RAIZ / "tablas_extraidas.json", "w", encoding="utf-8") as f:
    json.dump(todas_las_tablas, f, indent=2, ensure_ascii=False)

print(f"\nTotal: {len(todas_las_tablas)} tablas extraídas con modelos")
print("Guardadas en: tablas_extraidas.json")
