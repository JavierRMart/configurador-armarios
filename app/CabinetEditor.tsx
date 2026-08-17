export default function CabinetEditor({ armario, onChange }: any) {

  // ============ HELPERS DE LECTURA ============
  const getBaldas = (seccion: any): any[] => {
    if (Array.isArray(seccion?.interior?.baldas)) return seccion.interior.baldas;
    // Migración desde la estructura "elementos"
    if (Array.isArray(seccion?.interior?.elementos)) {
      return seccion.interior.elementos
        .filter((e: any) => e.tipo === 'balda')
        .map((e: any) => ({ id: e.id, altura: e.altura || 0, grosor: e.grosor ?? 16 }));
    }
    return [];
  };

  const getCajonera = (seccion: any): any => {
    if (seccion?.interior?.cajonera) return seccion.interior.cajonera;
    // Migración: si había una cajonera dentro de "elementos", la rescatamos
    if (Array.isArray(seccion?.interior?.elementos)) {
      const c = seccion.interior.elementos.find((e: any) => e.tipo === 'cajonera');
      if (c) {
        return {
          id: c.id,
          cajones: c.cajones || [],
          alturaTotal: c.alturaTotalCajonera || 0,
        };
      }
    }
    return null;
  };

  const alturaCajonera = (cajonera: any): number => {
    if (!cajonera) return 0;
    return (cajonera.cajones || []).reduce((sum: number, c: any) => sum + (c.altura || 0), 0);
  };

  const sumaBaldas = (seccion: any): number =>
    getBaldas(seccion).reduce((sum: number, b: any) => sum + (b.altura || 0), 0);

  const sumaTotal = (seccion: any): number =>
    alturaCajonera(getCajonera(seccion)) + sumaBaldas(seccion);

  // ============ HELPER DE ESCRITURA ============
  const setInterior = (seccionId: number, cambios: any) => {
    onChange({
      ...armario,
      secciones: armario.secciones.map((s: any) => {
        if (s.id !== seccionId) return s;
        // Limpiamos "elementos" de la estructura antigua al escribir
        const { elementos, ...restoInterior } = s.interior || {};
        return {
          ...s,
          interior: {
            ...restoInterior,
            baldas: getBaldas(s),
            cajonera: getCajonera(s),
            tieneBarraAqui: s.interior?.tieneBarraAqui || false,
            ...cambios,
          },
        };
      }),
    });
  };

  // ============ GLOBALES ============
  const updateField = (field: string, value: any) => {
    onChange({ ...armario, [field]: value });
  };

  const updateFinishes = (field: string, value: any) => {
    onChange({ ...armario, finishes: { ...armario.finishes, [field]: value } });
  };

  const toggleBarra = (seccion: any) => {
    setInterior(seccion.id, { tieneBarraAqui: !seccion.interior?.tieneBarraAqui });
  };

  // ============ CAJONERA ============
  const toggleCajonera = (seccion: any) => {
    if (getCajonera(seccion)) {
      setInterior(seccion.id, { cajonera: null });
    } else {
      const base = Date.now();
      setInterior(seccion.id, {
        cajonera: {
          id: base,
          cajones: [
            { id: base + 1, altura: 200 },
            { id: base + 2, altura: 200 },
            { id: base + 3, altura: 200 },
          ],
          alturaTotal: 600,
        },
      });
    }
  };

  const cambiarNumCajones = (seccion: any, nuevoNum: number) => {
    const cajonera = getCajonera(seccion);
    if (!cajonera) return;

    const num = Math.max(1, Math.min(10, nuevoNum || 1));
    const actuales = cajonera.cajones || [];
    let nuevos = [...actuales];

    if (num > actuales.length) {
      const alturaRef = actuales.length > 0 ? actuales[actuales.length - 1].altura : 200;
      for (let i = actuales.length; i < num; i++) {
        nuevos.push({ id: Date.now() + i, altura: alturaRef });
      }
    } else {
      nuevos = nuevos.slice(0, num);
    }

    setInterior(seccion.id, {
      cajonera: {
        ...cajonera,
        cajones: nuevos,
        alturaTotal: nuevos.reduce((s: number, c: any) => s + (c.altura || 0), 0),
      },
    });
  };

  const cambiarAlturaCajon = (seccion: any, cajonId: number, altura: number) => {
    const cajonera = getCajonera(seccion);
    if (!cajonera) return;

    const nuevos = (cajonera.cajones || []).map((c: any) =>
      c.id === cajonId ? { ...c, altura: altura || 0 } : c
    );

    setInterior(seccion.id, {
      cajonera: {
        ...cajonera,
        cajones: nuevos,
        alturaTotal: nuevos.reduce((s: number, c: any) => s + (c.altura || 0), 0),
      },
    });
  };

  // ============ BALDAS ============
  const agregarBalda = (seccion: any) => {
    setInterior(seccion.id, {
      baldas: [...getBaldas(seccion), { id: Date.now(), altura: 300, grosor: 16 }],
    });
  };

  const actualizarBalda = (seccion: any, baldaId: number, campo: string, valor: number) => {
    setInterior(seccion.id, {
      baldas: getBaldas(seccion).map((b: any) =>
        b.id === baldaId ? { ...b, [campo]: valor } : b
      ),
    });
  };

  const eliminarBalda = (seccion: any, baldaId: number) => {
    setInterior(seccion.id, {
      baldas: getBaldas(seccion).filter((b: any) => b.id !== baldaId),
    });
  };

  const moverBalda = (seccion: any, idx: number, dir: -1 | 1) => {
    const baldas = [...getBaldas(seccion)];
    const destino = idx + dir;
    if (destino < 0 || destino >= baldas.length) return;
    [baldas[idx], baldas[destino]] = [baldas[destino], baldas[idx]];
    setInterior(seccion.id, { baldas });
  };

  // ============ RENDER ============
  return (
    <div style={{ fontSize: '13px', color: '#2D2823' }}>

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
          style={{ width: '100%', padding: '8px', border: '1px solid #d9cdb8', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
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
          style={{ width: '100%', padding: '8px', border: '1px solid #d9cdb8', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
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
              style={{ width: '100%', padding: '6px', border: '1px solid #d9cdb8', borderRadius: '3px', fontSize: '12px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px', color: '#6b5d4f' }}>Tirador</label>
            <input
              type="text"
              value={armario.finishes?.handle || ''}
              onChange={(e) => updateFinishes('handle', e.target.value)}
              placeholder="Ej: Latón mate"
              style={{ width: '100%', padding: '6px', border: '1px solid #d9cdb8', borderRadius: '3px', fontSize: '12px', boxSizing: 'border-box' }}
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
          style={{ width: '100%', padding: '8px', border: '1px solid #d9cdb8', borderRadius: '4px', fontSize: '12px', minHeight: '60px', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif', resize: 'vertical' }}
        />
      </div>

      {/* ============ SECCIONES ============ */}
      <div style={{ marginTop: '20px', borderTop: '2px solid #d9cdb8', paddingTop: '15px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#1a1612' }}>
          CONFIGURACIÓN POR SECCIÓN
        </h4>

        {armario.secciones?.map((seccion: any) => {
          const cajonera = getCajonera(seccion);
          const baldas = getBaldas(seccion);
          const hCajonera = alturaCajonera(cajonera);
          const total = sumaTotal(seccion);
          const excede = total > armario.alto;
          const libre = armario.alto - total;

          return (
            <div key={seccion.id} style={{
              background: excede ? '#fde8e8' : '#faf7f2',
              padding: '12px',
              marginBottom: '12px',
              borderRadius: '4px',
              border: excede ? '2px solid #c0392b' : '1px solid #d9cdb8',
            }}>

              {/* HEADER SECCIÓN */}
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
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a1612' }}>{seccion.ancho}mm</div>
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '3px', color: '#6b5d4f' }}>
                    Ocupado
                  </label>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: excede ? '#c0392b' : '#2e7d32' }}>
                    {total}/{armario.alto}mm
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#6b5d4f', fontSize: '12px' }}>
                  <input
                    type="checkbox"
                    checked={seccion.interior?.tieneBarraAqui || false}
                    onChange={() => toggleBarra(seccion)}
                  />
                  Barra colgante
                </label>
              </div>

              {/* ALERTA */}
              {excede && (
                <div style={{
                  background: 'white', color: '#c0392b', padding: '8px', borderRadius: '3px',
                  marginBottom: '10px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #c0392b',
                }}>
                  ⚠️ El interior suma {total}mm y el armario mide {armario.alto}mm.
                  Sobran {Math.abs(libre)}mm. Corrige antes de enviar a fábrica.
                </div>
              )}

              {/* ============ 1. CAJONERA (SIEMPRE ABAJO) ============ */}
              <div style={{
                background: cajonera ? '#f5f1e8' : 'white',
                border: cajonera ? '2px solid #6B5D4F' : '1px dashed #d9cdb8',
                borderRadius: '3px',
                padding: '10px',
                marginBottom: '12px',
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', color: '#1a1612' }}>
                  <input type="checkbox" checked={!!cajonera} onChange={() => toggleCajonera(seccion)} />
                  CAJONERA (apoyada en el suelo)
                </label>

                {cajonera && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                      <div>
                        <label style={{ fontSize: '9px', fontWeight: 'bold', display: 'block', marginBottom: '2px', color: '#6b5d4f' }}>
                          Nº Cajones
                        </label>
                        <input
                          type="number"
                          value={cajonera.cajones?.length || 0}
                          onChange={(e) => cambiarNumCajones(seccion, parseInt(e.target.value) || 1)}
                          min="1"
                          max="10"
                          style={{ width: '100%', padding: '5px', fontSize: '11px', border: '1px solid #d9cdb8', borderRadius: '2px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '9px', fontWeight: 'bold', display: 'block', marginBottom: '2px', color: '#6b5d4f' }}>
                          Altura total (auto)
                        </label>
                        <input
                          type="number"
                          value={hCajonera}
                          readOnly
                          style={{ width: '100%', padding: '5px', fontSize: '11px', border: '1px solid #d9cdb8', borderRadius: '2px', boxSizing: 'border-box', background: '#eee', fontWeight: 'bold', cursor: 'not-allowed' }}
                        />
                      </div>
                    </div>

                    <div style={{ background: 'white', padding: '8px', borderRadius: '2px', border: '1px solid #e0d5c7' }}>
                      <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#6b5d4f', marginBottom: '6px' }}>
                        ALTURA DE CADA CAJÓN (mm) — Cajón 1 = el de abajo
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(62px, 1fr))', gap: '5px' }}>
                        {cajonera.cajones?.map((cajon: any, i: number) => (
                          <div key={cajon.id}>
                            <label style={{ fontSize: '8px', fontWeight: 'bold', display: 'block', marginBottom: '2px', color: '#6b5d4f' }}>
                              Cajón {i + 1}
                            </label>
                            <input
                              type="number"
                              value={cajon.altura || 0}
                              onChange={(e) => cambiarAlturaCajon(seccion, cajon.id, parseInt(e.target.value) || 0)}
                              min="0"
                              style={{ width: '100%', padding: '4px', fontSize: '10px', border: '1px solid #d9cdb8', borderRadius: '2px', boxSizing: 'border-box' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ============ 2. BALDAS (POR ENCIMA) ============ */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b5d4f', textTransform: 'uppercase' }}>
                    Baldas ({baldas.length})
                  </label>
                  {!excede && (
                    <span style={{ fontSize: '10px', color: '#2e7d32', fontWeight: 'bold' }}>Libre: {libre}mm</span>
                  )}
                </div>

                <div style={{ fontSize: '9px', color: '#6b5d4f', marginBottom: '8px', fontStyle: 'italic' }}>
                  {cajonera
                    ? `Balda 1 se mide desde la cajonera (a ${hCajonera}mm del suelo).`
                    : 'Balda 1 se mide desde el suelo del armario.'}
                </div>

                <button
                  onClick={() => agregarBalda(seccion)}
                  style={{
                    background: '#B08D57', color: 'white', border: 'none', padding: '8px',
                    borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px',
                    width: '100%', marginBottom: '10px',
                  }}
                >
                  + Balda
                </button>

                {baldas.length > 0 ? (
                  baldas.map((balda: any, idx: number) => {
                    const cotaSuelo = hCajonera + baldas.slice(0, idx + 1).reduce((s: number, b: any) => s + (b.altura || 0), 0);

                    return (
                      <div key={balda.id} style={{
                        background: 'white', padding: '10px', marginBottom: '8px',
                        borderRadius: '3px', border: '1px solid #e0d5c7',
                      }}>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #d9cdb8',
                        }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1a1612' }}>
                              Balda {idx + 1}
                            </div>
                            <div style={{ fontSize: '9px', color: '#6b5d4f' }}>
                              Cota desde suelo: <strong>{cotaSuelo}mm</strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => moverBalda(seccion, idx, -1)}
                              disabled={idx === 0}
                              title="Bajar"
                              style={{
                                background: idx === 0 ? '#ddd' : '#6B5D4F', color: 'white', border: 'none',
                                padding: '3px 7px', borderRadius: '2px',
                                cursor: idx === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '11px',
                              }}
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => moverBalda(seccion, idx, 1)}
                              disabled={idx === baldas.length - 1}
                              title="Subir"
                              style={{
                                background: idx === baldas.length - 1 ? '#ddd' : '#6B5D4F', color: 'white', border: 'none',
                                padding: '3px 7px', borderRadius: '2px',
                                cursor: idx === baldas.length - 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '11px',
                              }}
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => eliminarBalda(seccion, balda.id)}
                              style={{
                                background: '#c0392b', color: 'white', border: 'none',
                                padding: '3px 7px', borderRadius: '2px', cursor: 'pointer',
                                fontWeight: 'bold', fontSize: '11px',
                              }}
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          <div>
                            <label style={{ fontSize: '9px', fontWeight: 'bold', display: 'block', marginBottom: '2px', color: '#6b5d4f' }}>
                              {idx === 0
                                ? (cajonera ? 'Altura sobre cajonera (mm)' : 'Altura desde suelo (mm)')
                                : `Altura sobre balda ${idx} (mm)`}
                            </label>
                            <input
                              type="number"
                              value={balda.altura || 0}
                              onChange={(e) => actualizarBalda(seccion, balda.id, 'altura', parseInt(e.target.value) || 0)}
                              min="0"
                              style={{ width: '100%', padding: '5px', fontSize: '11px', border: '1px solid #d9cdb8', borderRadius: '2px', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '9px', fontWeight: 'bold', display: 'block', marginBottom: '2px', color: '#6b5d4f' }}>
                              Grosor (mm)
                            </label>
                            <input
                              type="number"
                              value={balda.grosor ?? 16}
                              onChange={(e) => actualizarBalda(seccion, balda.id, 'grosor', parseInt(e.target.value) || 0)}
                              min="0"
                              style={{ width: '100%', padding: '5px', fontSize: '11px', border: '1px solid #d9cdb8', borderRadius: '2px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{
                    padding: '10px', background: '#f5f1e8', borderRadius: '3px',
                    color: '#6b5d4f', fontSize: '11px', textAlign: 'center',
                  }}>
                    Sin baldas en esta sección.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}