export default function CabinetEditor({ armario, onChange }: any) {
  // ============ HELPER: OBTENER ELEMENTOS (con migración de estructura antigua) ============
  const getElementos = (seccion: any): any[] => {
    if (seccion?.interior?.elementos && Array.isArray(seccion.interior.elementos)) {
      return seccion.interior.elementos;
    }
    // Estructura antigua: convertir baldas -> elementos
    if (seccion?.interior?.baldas && Array.isArray(seccion.interior.baldas)) {
      return seccion.interior.baldas.map((b: any) => ({
        id: b.id,
        tipo: 'balda',
        altura: b.altura || 0,
        grosor: b.grosor || 16,
      }));
    }
    return [];
  };

  // ============ HELPER: ESCRIBIR ELEMENTOS EN UNA SECCIÓN ============
  const setElementos = (seccionId: number, nuevosElementos: any[]) => {
    onChange({
      ...armario,
      secciones: armario.secciones.map((s: any) => {
        if (s.id !== seccionId) return s;
        const { baldas, ...restoInterior } = s.interior || {};
        return {
          ...s,
          interior: {
            ...restoInterior,
            elementos: nuevosElementos,
          },
        };
      }),
    });
  };

  // ============ HELPER: ALTURA DE UN ELEMENTO ============
  const alturaElemento = (e: any): number => {
    if (e.tipo === 'balda') return e.altura || 0;
    if (e.tipo === 'cajonera') return e.alturaTotalCajonera || 0;
    return 0;
  };

  // ============ FUNCIONES DE ACTUALIZACIÓN GLOBALES ============
  const updateField = (field: string, value: any) => {
    onChange({ ...armario, [field]: value });
  };

  const updateFinishes = (field: string, value: any) => {
    onChange({
      ...armario,
      finishes: { ...armario.finishes, [field]: value },
    });
  };

  const toggleBarraEnSeccion = (seccionId: number) => {
    onChange({
      ...armario,
      secciones: armario.secciones.map((s: any) => {
        if (s.id !== seccionId) return s;
        return {
          ...s,
          interior: {
            ...s.interior,
            tieneBarraAqui: !s.interior?.tieneBarraAqui,
          },
        };
      }),
    });
  };

  // ============ AGREGAR ELEMENTO ============
  const agregarElemento = (seccion: any, tipo: 'balda' | 'cajonera') => {
    const base = Date.now();
    const nuevoElemento: any = { id: base, tipo };

    if (tipo === 'balda') {
      nuevoElemento.altura = 300;
      nuevoElemento.grosor = 16;
    } else {
      nuevoElemento.numCajones = 3;
      nuevoElemento.alturaTotalCajonera = 600;
      nuevoElemento.cajones = [
        { id: base + 1, numero: 1, altura: 200 },
        { id: base + 2, numero: 2, altura: 200 },
        { id: base + 3, numero: 3, altura: 200 },
      ];
    }

    setElementos(seccion.id, [...getElementos(seccion), nuevoElemento]);
  };

  // ============ ELIMINAR ELEMENTO ============
  const eliminarElemento = (seccion: any, elementoId: number) => {
    setElementos(
      seccion.id,
      getElementos(seccion).filter((e: any) => e.id !== elementoId)
    );
  };

  // ============ MOVER ELEMENTO (reordenar) ============
  const moverElemento = (seccion: any, idx: number, direccion: -1 | 1) => {
    const elementos = [...getElementos(seccion)];
    const destino = idx + direccion;
    if (destino < 0 || destino >= elementos.length) return;
    [elementos[idx], elementos[destino]] = [elementos[destino], elementos[idx]];
    setElementos(seccion.id, elementos);
  };

  // ============ ACTUALIZAR CAMPO DE BALDA ============
  const actualizarBalda = (seccion: any, elementoId: number, campo: string, valor: number) => {
    setElementos(
      seccion.id,
      getElementos(seccion).map((e: any) =>
        e.id === elementoId ? { ...e, [campo]: valor } : e
      )
    );
  };

  // ============ CAMBIAR Nº DE CAJONES (crea/borra cajones) ============
  const actualizarNumCajones = (seccion: any, elementoId: number, nuevoNum: number) => {
    const num = Math.max(1, Math.min(10, nuevoNum || 1));

    setElementos(
      seccion.id,
      getElementos(seccion).map((e: any) => {
        if (e.id !== elementoId || e.tipo !== 'cajonera') return e;

        const actuales = e.cajones || [];
        let nuevos = [...actuales];

        if (num > actuales.length) {
          // Añadir cajones nuevos (copiando la altura del último, o 200 por defecto)
          const alturaPorDefecto = actuales.length > 0 ? actuales[actuales.length - 1].altura : 200;
          for (let i = actuales.length; i < num; i++) {
            nuevos.push({
              id: Date.now() + i,
              numero: i + 1,
              altura: alturaPorDefecto,
            });
          }
        } else if (num < actuales.length) {
          // Quitar los sobrantes (los de arriba)
          nuevos = nuevos.slice(0, num);
        }

        // Renumerar
        nuevos = nuevos.map((c: any, i: number) => ({ ...c, numero: i + 1 }));

        const alturaTotal = nuevos.reduce((sum: number, c: any) => sum + (c.altura || 0), 0);

        return {
          ...e,
          numCajones: num,
          cajones: nuevos,
          alturaTotalCajonera: alturaTotal,
        };
      })
    );
  };

  // ============ ACTUALIZAR ALTURA DE UN CAJÓN ============
  const actualizarCajon = (seccion: any, elementoId: number, cajonId: number, altura: number) => {
    setElementos(
      seccion.id,
      getElementos(seccion).map((e: any) => {
        if (e.id !== elementoId || e.tipo !== 'cajonera') return e;

        const cajonesActualizados = (e.cajones || []).map((c: any) =>
          c.id === cajonId ? { ...c, altura: altura || 0 } : c
        );

        const alturaTotal = cajonesActualizados.reduce(
          (sum: number, c: any) => sum + (c.altura || 0),
          0
        );

        return {
          ...e,
          cajones: cajonesActualizados,
          alturaTotalCajonera: alturaTotal,
        };
      })
    );
  };

  // ============ CÁLCULOS ============
  const calcularSumaElementos = (seccion: any): number =>
    getElementos(seccion).reduce((sum: number, e: any) => sum + alturaElemento(e), 0);

  const contarElementosPorTipo = (seccion: any) => {
    const elementos = getElementos(seccion);
    return {
      baldas: elementos.filter((e: any) => e.tipo === 'balda').length,
      cajoneras: elementos.filter((e: any) => e.tipo === 'cajonera').length,
    };
  };

  // ============ RENDER ============
  return (
    <div style={{ fontSize: '13px', color: '#2D2823' }}>

      {/* ============ PROPIEDADES GLOBALES ============ */}

      {/* Nombre */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px', textTransform: 'uppercase', color: '#6b5d4f' }}>
          Nombre (Opcional)
        </label>
        <input
          type="text"
          value={armario.name || ''}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Ej: Vestidor principal"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #d9cdb8',
            borderRadius: '4px',
            fontSize: '13px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Tipo */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px', textTransform: 'uppercase', color: '#6b5d4f' }}>
          Sistema
        </label>
        <select
          value={armario.type || 'abatible'}
          onChange={(e) => updateField('type', e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #d9cdb8',
            borderRadius: '4px',
            fontSize: '13px',
            boxSizing: 'border-box',
          }}
        >
          <option value="abatible">Abatible</option>
          <option value="corredera">Corredera</option>
        </select>
      </div>

      {/* Acabados */}
      <div style={{ marginBottom: '15px', borderTop: '1px solid #d9cdb8', paddingTop: '10px' }}>
        <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '8px', textTransform: 'uppercase', color: '#6b5d4f' }}>
          Acabados
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px', color: '#6b5d4f' }}>Interior Textil</label>
            <input
              type="text"
              value={armario.finishes?.interiorTextil || ''}
              onChange={(e) => updateFinishes('interiorTextil', e.target.value)}
              placeholder="Ej: Cactus"
              style={{
                width: '100%',
                padding: '6px',
                border: '1px solid #d9cdb8',
                borderRadius: '3px',
                fontSize: '12px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px', color: '#6b5d4f' }}>Tirador</label>
            <input
              type="text"
              value={armario.finishes?.handle || ''}
              onChange={(e) => updateFinishes('handle', e.target.value)}
              placeholder="Ej: Latón mate"
              style={{
                width: '100%',
                padding: '6px',
                border: '1px solid #d9cdb8',
                borderRadius: '3px',
                fontSize: '12px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={armario.finishes?.costadosVistos || false}
              onChange={(e) => updateFinishes('costadosVistos', e.target.checked)}
            />
            Costados vistos
          </label>
        </div>
      </div>

      {/* Notas */}
      <div style={{ marginBottom: '15px', borderTop: '1px solid #d9cdb8', paddingTop: '10px' }}>
        <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px', textTransform: 'uppercase', color: '#6b5d4f' }}>
          Notas Especiales
        </label>
        <textarea
          value={armario.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Anotaciones especiales..."
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #d9cdb8',
            borderRadius: '4px',
            fontSize: '12px',
            minHeight: '60px',
            boxSizing: 'border-box',
            fontFamily: 'Arial, sans-serif',
            resize: 'vertical',
          }}
        />
      </div>

      {/* ============ SECCIONES ============ */}
      <div style={{ marginTop: '20px', borderTop: '2px solid #d9cdb8', paddingTop: '15px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#1a1612' }}>
          CONFIGURACIÓN POR SECCIÓN
        </h4>

        {armario.secciones?.map((seccion: any) => {
          const elementos = getElementos(seccion);
          const sumaElementos = calcularSumaElementos(seccion);
          const { baldas, cajoneras } = contarElementosPorTipo(seccion);
          const excede = sumaElementos > armario.alto;
          const libre = armario.alto - sumaElementos;

          return (
            <div key={seccion.id} style={{
              background: excede ? '#fde8e8' : '#faf7f2',
              padding: '12px',
              marginBottom: '12px',
              borderRadius: '4px',
              border: excede ? '2px solid #c0392b' : '1px solid #d9cdb8',
            }}>

              {/* HEADER DE SECCIÓN */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '10px',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #d9cdb8',
              }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '3px', color: '#6b5d4f' }}>
                    Sección {seccion.numero}
                  </label>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a1612' }}>
                    {seccion.ancho}mm
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '3px', color: '#6b5d4f' }}>
                    Ocupado
                  </label>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: excede ? '#c0392b' : '#2e7d32',
                  }}>
                    {sumaElementos}/{armario.alto}mm
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#6b5d4f', fontSize: '12px' }}>
                  <input
                    type="checkbox"
                    checked={seccion.interior?.tieneBarraAqui || false}
                    onChange={() => toggleBarraEnSeccion(seccion.id)}
                  />
                  Barra colgante
                </label>
              </div>

              {/* ALERTA SI EXCEDE */}
              {excede && (
                <div style={{
                  background: 'white',
                  color: '#c0392b',
                  padding: '8px',
                  borderRadius: '3px',
                  marginBottom: '10px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  border: '1px solid #c0392b',
                }}>
                  ⚠️ ALERTA: los elementos suman {sumaElementos}mm y el armario mide {armario.alto}mm.
                  Sobran {Math.abs(libre)}mm. Corrige las alturas antes de enviar a fábrica.
                </div>
              )}

              {/* CABECERA ELEMENTOS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b5d4f', textTransform: 'uppercase' }}>
                  Elementos ({baldas} baldas · {cajoneras} cajoneras)
                </label>
                {!excede && (
                  <span style={{ fontSize: '10px', color: '#2e7d32', fontWeight: 'bold' }}>
                    Libre: {libre}mm
                  </span>
                )}
              </div>

              {/* BOTONES AGREGAR */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                <button
                  onClick={() => agregarElemento(seccion, 'balda')}
                  style={{
                    background: '#B08D57',
                    color: 'white',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '11px',
                  }}
                >
                  + Balda
                </button>
                <button
                  onClick={() => agregarElemento(seccion, 'cajonera')}
                  style={{
                    background: '#6B5D4F',
                    color: 'white',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '11px',
                  }}
                >
                  + Cajonera
                </button>
              </div>

              {/* LISTA DE ELEMENTOS (orden: primero = más abajo) */}
              {elementos.length > 0 ? (
                <>
                  <div style={{ fontSize: '9px', color: '#6b5d4f', marginBottom: '6px', fontStyle: 'italic' }}>
                    El primero de la lista es el más cercano al suelo.
                  </div>

                  {elementos.map((elemento: any, idx: number) => {
                    const esBalda = elemento.tipo === 'balda';

                    // Numeración por tipo: la primera balda creada es Balda 1
                    const numeroDelTipo = elementos
                      .slice(0, idx + 1)
                      .filter((e: any) => e.tipo === elemento.tipo).length;

                    // Cota desde el suelo hasta este elemento
                    const cotaDesdeSuelo = elementos
                      .slice(0, idx + 1)
                      .reduce((sum: number, e: any) => sum + alturaElemento(e), 0);

                    return (
                      <div key={elemento.id} style={{
                        background: esBalda ? 'white' : '#f5f1e8',
                        padding: '10px',
                        marginBottom: '8px',
                        borderRadius: '3px',
                        border: esBalda ? '1px solid #e0d5c7' : '2px solid #6B5D4F',
                      }}>

                        {/* HEADER DEL ELEMENTO */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                          paddingBottom: '8px',
                          borderBottom: '1px solid #d9cdb8',
                        }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1a1612' }}>
                              {esBalda ? `Balda ${numeroDelTipo}` : `Cajonera ${numeroDelTipo}`}
                            </div>
                            <div style={{ fontSize: '9px', color: '#6b5d4f' }}>
                              Cota desde suelo: <strong>{cotaDesdeSuelo}mm</strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => moverElemento(seccion, idx, -1)}
                              disabled={idx === 0}
                              title="Bajar en el armario"
                              style={{
                                background: idx === 0 ? '#ddd' : '#6B5D4F',
                                color: 'white',
                                border: 'none',
                                padding: '3px 7px',
                                borderRadius: '2px',
                                cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                fontSize: '11px',
                              }}
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => moverElemento(seccion, idx, 1)}
                              disabled={idx === elementos.length - 1}
                              title="Subir en el armario"
                              style={{
                                background: idx === elementos.length - 1 ? '#ddd' : '#6B5D4F',
                                color: 'white',
                                border: 'none',
                                padding: '3px 7px',
                                borderRadius: '2px',
                                cursor: idx === elementos.length - 1 ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                fontSize: '11px',
                              }}
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => eliminarElemento(seccion, elemento.id)}
                              style={{
                                background: '#c0392b',
                                color: 'white',
                                border: 'none',
                                padding: '3px 7px',
                                borderRadius: '2px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '11px',
                              }}
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        {/* CONTENIDO SEGÚN TIPO */}
                        {esBalda ? (
                          // ============ BALDA ============
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <div>
                              <label style={{ fontSize: '9px', fontWeight: 'bold', display: 'block', marginBottom: '2px', color: '#6b5d4f' }}>
                                Altura hueco (mm)
                              </label>
                              <input
                                type="number"
                                value={elemento.altura || 0}
                                onChange={(e) => actualizarBalda(seccion, elemento.id, 'altura', parseInt(e.target.value) || 0)}
                                min="0"
                                style={{
                                  width: '100%',
                                  padding: '5px',
                                  fontSize: '11px',
                                  border: '1px solid #d9cdb8',
                                  borderRadius: '2px',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '9px', fontWeight: 'bold', display: 'block', marginBottom: '2px', color: '#6b5d4f' }}>
                                Grosor (mm)
                              </label>
                              <input
                                type="number"
                                value={elemento.grosor ?? 16}
                                onChange={(e) => actualizarBalda(seccion, elemento.id, 'grosor', parseInt(e.target.value) || 0)}
                                min="0"
                                style={{
                                  width: '100%',
                                  padding: '5px',
                                  fontSize: '11px',
                                  border: '1px solid #d9cdb8',
                                  borderRadius: '2px',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          // ============ CAJONERA ============
                          <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                              <div>
                                <label style={{ fontSize: '9px', fontWeight: 'bold', display: 'block', marginBottom: '2px', color: '#6b5d4f' }}>
                                  Nº Cajones
                                </label>
                                <input
                                  type="number"
                                  value={elemento.cajones?.length || 0}
                                  onChange={(e) => actualizarNumCajones(seccion, elemento.id, parseInt(e.target.value) || 1)}
                                  min="1"
                                  max="10"
                                  style={{
                                    width: '100%',
                                    padding: '5px',
                                    fontSize: '11px',
                                    border: '1px solid #d9cdb8',
                                    borderRadius: '2px',
                                    boxSizing: 'border-box',
                                  }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '9px', fontWeight: 'bold', display: 'block', marginBottom: '2px', color: '#6b5d4f' }}>
                                  Altura total (auto)
                                </label>
                                <input
                                  type="number"
                                  value={elemento.alturaTotalCajonera || 0}
                                  readOnly
                                  style={{
                                    width: '100%',
                                    padding: '5px',
                                    fontSize: '11px',
                                    border: '1px solid #d9cdb8',
                                    borderRadius: '2px',
                                    boxSizing: 'border-box',
                                    background: '#eee',
                                    cursor: 'not-allowed',
                                    fontWeight: 'bold',
                                  }}
                                />
                              </div>
                            </div>

                            {/* CAJONES INDIVIDUALES */}
                            <div style={{
                              background: 'white',
                              padding: '8px',
                              borderRadius: '2px',
                              border: '1px solid #e0d5c7',
                            }}>
                              <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#6b5d4f', marginBottom: '6px' }}>
                                ALTURA DE CADA CAJÓN (mm) — Cajón 1 = el de abajo
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(62px, 1fr))', gap: '5px' }}>
                                {elemento.cajones?.map((cajon: any, cajIdx: number) => (
                                  <div key={cajon.id}>
                                    <label style={{ fontSize: '8px', fontWeight: 'bold', display: 'block', marginBottom: '2px', color: '#6b5d4f' }}>
                                      Cajón {cajIdx + 1}
                                    </label>
                                    <input
                                      type="number"
                                      value={cajon.altura || 0}
                                      onChange={(e) => actualizarCajon(seccion, elemento.id, cajon.id, parseInt(e.target.value) || 0)}
                                      min="0"
                                      style={{
                                        width: '100%',
                                        padding: '4px',
                                        fontSize: '10px',
                                        border: '1px solid #d9cdb8',
                                        borderRadius: '2px',
                                        boxSizing: 'border-box',
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <div style={{
                  padding: '10px',
                  background: '#f5f1e8',
                  borderRadius: '3px',
                  color: '#6b5d4f',
                  fontSize: '11px',
                  textAlign: 'center',
                }}>
                  Sin elementos. Añade una balda o una cajonera.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}