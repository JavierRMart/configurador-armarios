import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent

with open(RAIZ / 'items_procesados.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

resultado = []


def familia_puerta(pagina):
    """
    Devuelve la familia de puerta según la página de origen.
    El catálogo de Imalasa se organiza por rangos de página, tal como
    lo indica el propio PDF: Lisas y Pantografiadas primero, Fresadas después.
    """
    if pagina == 10:
        return 'Lisa'
    if 11 <= pagina <= 17:
        return 'Pantografiada'
    if 20 <= pagina <= 26:
        return 'Fresada'
    return None


for item in items:
    modelo = item.get('modelo', 'sin modelo')
    tipo = item['tipo']
    formato = item['formato']
    acabado = item.get('acabado')
    precio = item['precio']
    pagina = item['pagina']

    # No vendemos armarios de Imalasa, solo puertas — se descartan los KIT
    if formato == 'KIT':
        continue

    # No vendemos puertas blindadas — las páginas 28 y 29 son solo ese producto
    if pagina in (28, 29):
        continue

    # Categoría según formato
    if formato in ['BLOCK', 'HOJA']:
        categoria = 'puerta'
    else:
        categoria = 'otro'

    familia = familia_puerta(pagina)

    # Descripción: modelo, tipo, formato y acabado si lo tiene
    partes_descripcion = [modelo, tipo, formato]
    if acabado:
        partes_descripcion.append(acabado)
    descripcion = ' - '.join(partes_descripcion)

    referencia = ""

    atributos = {
        "modelo": modelo,
        "tipo": tipo,
        "formato": formato,
        "familia": familia,
    }
    if acabado:
        atributos["acabado"] = acabado

    resultado.append({
        'categoria': categoria,
        'referencia': referencia,
        'descripcion': descripcion,
        'precio': precio,
        'tipo_precio': 'fijo',
        'unidad': 'ud',
        'aplica_a': None,
        'atributos': atributos,
        'pagina_origen': pagina,
        'aviso': None
    })

with open(RAIZ / 'items_bd.json', 'w', encoding='utf-8') as f:
    json.dump(resultado, f, indent=2, ensure_ascii=False)

print(f'Items listos para BD: {len(resultado)}')
