'use client';

import { useEffect, useState } from 'react';
import {
  getModelosPorFamilia,
  getPrecioPuertaCiega,
  getVidrierasDisponibles,
} from '@/lib/price-lists';

const ALTOS = [2030, 2100, 2400];
const ANCHOS = [625, 725, 825, 925];
const CERCOS_BATIENTE = [80, 90, 100, 110, 120, 130, 140];
const CERCOS_CORREDERA = [90, 105];
const TAPETAS_OPTS = ['70x12', '90x12'];
const PERNIOS_OPTS = ['INOX', 'NEGRO'];
const HERRAJE_OPTS = ['INOX', 'NEGRO'];

export default function DoorEditor({ puerta, onChange }: any) {
  const [porFamilia, setPorFamilia] = useState<Record<string, string[]>>({});
  const [cargandoModelos, setCargandoModelos] = useState(true);
  const [errorModelos, setErrorModelos] = useState('');
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState('');

  const [precioInfo, setPrecioInfo] = useState<{ precio: number; descripcion: string } | null>(null);
  const [cargandoPrecio, setCargandoPrecio] = useState(false);

  const [vidrieras, setVidrieras] = useState<string[]>([]);
  const [cargandoVidrieras, setCargandoVidrieras] = useState(false);

  // Carga los modelos agrupados por familia al abrir el editor
  useEffect(() => {
    const cargar = async () => {
      try {
        const grupos = await getModelosPorFamilia();
        setPorFamilia(grupos);

        // Si la puerta ya tenía un modelo (proyecto guardado), averigua
        // a qué familia pertenece para dejar el filtro ya puesto
        if (puerta.modelo) {
          for (const [familia, modelos] of Object.entries(grupos)) {
            if (modelos.includes(puerta.modelo)) {
              setFamiliaSeleccionada(familia);
              break;
            }
          }
        }
      } catch (err: any) {
        setErrorModelos('No se pudieron cargar los modelos');
      } finally {
        setCargandoModelos(false);
      }
    };
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Solo sabemos calcular precio para CIEGA + BATIENTE por ahora.
  useEffect(() => {
    const esCasoSoportado = puerta.tipo === 'CIEGA' && puerta.subtipo === 'BATIENTE';
    if (!esCasoSoportado || !puerta.modelo) {
      setPrecioInfo(null);
      return;
    }

    let cancelado = false;
    setCargandoPrecio(true);
    getPrecioPuertaCiega(puerta.modelo)
      .then((resultado) => {
        if (!cancelado) setPrecioInfo(resultado);
      })
      .catch(() => {
        if (!cancelado) setPrecioInfo(null);
      })
      .finally(() => {
        if (!cancelado) setCargandoPrecio(false);
      });

    return () => { cancelado = true; };
  }, [puerta.modelo, puerta.tipo, puerta.subtipo]);

  // Cuando el tipo es VIDRIERA, carga las vidrieras reales de ese modelo
  useEffect(() => {
    if (puerta.tipo !== 'VIDRIERA' || !puerta.modelo) {
      setVidrieras([]);
      return;
    }

    let cancelado = false;
    setCargandoVidrieras(true);
    getVidrierasDisponibles(puerta.modelo)
      .then((lista) => {
        if (!cancelado) setVidrieras(lista);
      })
      .catch(() => {
        if (!cancelado) setVidrieras([]);
      })
      .finally(() => {
        if (!cancelado) setCargandoVidrieras(false);
      });

    return () => { cancelado = true; };
  }, [puerta.tipo, puerta.modelo]);

  const update = (field: string, value: any) => {
    onChange({ ...puerta, [field]: value });
  };

  const cercosDisponibles =
    puerta.subtipo === 'CORREDERA' ? CERCOS_CORREDERA : CERCOS_BATIENTE;

  const familias = Object.keys(porFamilia).sort();
  const modelosDeFamilia = familiaSeleccionada ? porFamilia[familiaSeleccionada] || [] : [];

  // Si el proyecto ya tenía un modelo que no está en la familia elegida
  // (o aún no hay familia elegida), lo añadimos para no perderlo de vista
  const modeloActual = puerta.modelo || '';
  const listaModelos =
    modeloActual && !modelosDeFamilia.includes(modeloActual)
      ? [modeloActual, ...modelosDeFamilia]
      : modelosDeFamilia;

  const esCasoSoportado = puerta.tipo === 'CIEGA' && puerta.subtipo === 'BATIENTE';

  // Si el subtipo guardado no está entre las vidrieras reales del modelo
  // (por ejemplo, quedó de un V-1/V-2 antiguo), lo añadimos para no perderlo
  const subtipoActual = puerta.subtipo || '';
  const listaVidrieras =
    subtipoActual && vidrieras.length > 0 && !vidrieras.includes(subtipoActual)
      ? [subtipoActual, ...vidrieras]
      : vidrieras;

  const labelStyle: any = {
    fontSize: '11px',
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '4px',
    textTransform: 'uppercase',
    color: '#6b5d4f',
  };

  const inputStyle: any = {
    width: '100%',
    padding: '8px',
    border: '1px solid #d9cdb8',
    borderRadius: '4px',
    fontSize: '13px',
    boxSizing: 'border-box',
  };

  const bloqueTituloStyle: any = {
    margin: '0 0 12px 0',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#1a1612',
  };

  const bloqueStyle: any = {
    borderTop: '1px solid #d9cdb8',
    paddingTop: '15px',
    marginTop: '15px',
  };

  return (
    <div style={{ fontSize: '13px', color: '#2D2823' }}>

      {/* ===== BLOQUE 1: PRODUCTO ===== */}
      <h3 style={bloqueTituloStyle}>PRODUCTO</h3>

      {/* Familia de puerta */}
      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Familia de puerta</label>
        <select
          value={familiaSeleccionada}
          onChange={(e) => {
            setFamiliaSeleccionada(e.target.value);
            // Cambiar de familia invalida el modelo elegido hasta ahora
            update('modelo', '');
          }}
          disabled={cargandoModelos}
          style={inputStyle}
        >
          <option value="">
            {cargandoModelos ? 'Cargando familias...' : '— Selecciona familia —'}
          </option>
          {familias.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        {errorModelos && (
          <p style={{ color: '#c0392b', fontSize: '11px', margin: '4px 0 0 0' }}>
            {errorModelos}
          </p>
        )}
      </div>

      {/* Modelo y Color */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
        <div>
          <label style={labelStyle}>
            Modelo{' '}
            {familiaSeleccionada && modelosDeFamilia.length > 0 && (
              <span style={{ fontWeight: 'normal', textTransform: 'none' }}>
                ({modelosDeFamilia.length} en {familiaSeleccionada})
              </span>
            )}
          </label>
          <select
            value={modeloActual}
            onChange={(e) => update('modelo', e.target.value)}
            disabled={cargandoModelos || !familiaSeleccionada}
            style={inputStyle}
          >
            <option value="">
              {!familiaSeleccionada
                ? 'Elige primero una familia'
                : '— Selecciona modelo —'}
            </option>
            {listaModelos.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Color</label>
          <input
            type="text"
            value={puerta.color}
            onChange={(e) => update('color', e.target.value)}
            placeholder="Ej: Blanco"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Tipo y Subtipo / Tipo de vidriera */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
        <div>
          <label style={labelStyle}>Tipo</label>
          <select
            value={puerta.tipo}
            onChange={(e) => {
              const nuevoTipo = e.target.value;
              const nuevoSubtipo = nuevoTipo === 'CIEGA' ? 'BATIENTE' : '';
              onChange({ ...puerta, tipo: nuevoTipo, subtipo: nuevoSubtipo });
            }}
            style={inputStyle}
          >
            <option value="CIEGA">Ciega</option>
            <option value="VIDRIERA">Vidriera</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>
            {puerta.tipo === 'VIDRIERA' ? 'Tipo de vidriera' : 'Subtipo'}
          </label>
          {puerta.tipo === 'CIEGA' ? (
            <select
              value={puerta.subtipo}
              onChange={(e) => update('subtipo', e.target.value)}
              style={inputStyle}
            >
              <option value="BATIENTE">Batiente</option>
              <option value="CORREDERA">Corredera</option>
            </select>
          ) : (
            <>
              <select
                value={subtipoActual}
                onChange={(e) => update('subtipo', e.target.value)}
                disabled={cargandoVidrieras || !puerta.modelo}
                style={inputStyle}
              >
                <option value="">
                  {!puerta.modelo
                    ? 'Elige primero un modelo'
                    : cargandoVidrieras
                    ? 'Cargando vidrieras...'
                    : '— Selecciona vidriera —'}
                </option>
                {listaVidrieras.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              {!cargandoVidrieras && puerta.modelo && vidrieras.length === 0 && (
                <p style={{ color: '#c0392b', fontSize: '11px', margin: '4px 0 0 0' }}>
                  Este modelo no tiene vidrieras en la tarifa.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Precio estimado — solo caso CIEGA + BATIENTE por ahora */}
      {puerta.modelo && (
        <div style={{
          background: '#f5f1e8',
          border: '1px solid #d9cdb8',
          borderRadius: '4px',
          padding: '10px 12px',
          marginBottom: '15px',
          fontSize: '12px',
        }}>
          {!esCasoSoportado ? (
            <span style={{ color: '#6b5d4f' }}>
              Precio no disponible todavía para {puerta.tipo === 'VIDRIERA' ? 'vidrieras' : 'correderas'}
              — falta definir cómo se calculan.
            </span>
          ) : cargandoPrecio ? (
            <span style={{ color: '#6b5d4f' }}>Buscando precio...</span>
          ) : precioInfo ? (
            <span>
              <strong>Precio de tarifa: {precioInfo.precio.toFixed(2)} €</strong>
              <span style={{ color: '#6b5d4f' }}> (sin aplicar el 15% de descuento habitual)</span>
            </span>
          ) : (
            <span style={{ color: '#c0392b' }}>No se encontró precio para este modelo.</span>
          )}
        </div>
      )}

      {/* ===== BLOQUE 2: HERRAJES Y ACABADOS ===== */}
      <div style={bloqueStyle}>
        <h3 style={bloqueTituloStyle}>HERRAJES Y ACABADOS</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
          <div>
            <label style={labelStyle}>Cerco</label>
            <select value={puerta.cerco} onChange={(e) => update('cerco', e.target.value)} style={inputStyle}>
              <option value="con">Con Burlete</option>
              <option value="sin">Sin Burlete</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tapetas (mm)</label>
            <select value={puerta.tapetas} onChange={(e) => update('tapetas', e.target.value)} style={inputStyle}>
              {TAPETAS_OPTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Pernios</label>
            <select value={puerta.pernios} onChange={(e) => update('pernios', e.target.value)} style={inputStyle}>
              {PERNIOS_OPTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Herraje</label>
            <select value={puerta.herraje} onChange={(e) => update('herraje', e.target.value)} style={inputStyle}>
              {HERRAJE_OPTS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ===== BLOQUE 3: MEDIDAS DE LA PUERTA ===== */}
      <div style={bloqueStyle}>
        <h3 style={bloqueTituloStyle}>MEDIDAS DE LA PUERTA</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
          <div>
            <label style={labelStyle}>Ubicación</label>
            <input
              type="text"
              value={puerta.ubicacion}
              onChange={(e) => update('ubicacion', e.target.value)}
              placeholder="Ej: Dormitorio 1"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Unidades</label>
            <input
              type="number"
              min="1"
              value={puerta.unidades}
              onChange={(e) => update('unidades', Number(e.target.value))}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <div>
            <label style={labelStyle}>Alto (mm)</label>
            <select value={puerta.alto} onChange={(e) => update('alto', Number(e.target.value))} style={inputStyle}>
              {ALTOS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ancho (mm)</label>
            <select value={puerta.ancho} onChange={(e) => update('ancho', Number(e.target.value))} style={inputStyle}>
              {ANCHOS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Cerco (mm)</label>
            <select value={puerta.anchoCerco} onChange={(e) => update('anchoCerco', Number(e.target.value))} style={inputStyle}>
              {cercosDisponibles.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Apertura</label>
          <select value={puerta.apertura} onChange={(e) => update('apertura', e.target.value)} style={inputStyle}>
            <option value="derecha">A derechas</option>
            <option value="izquierda">A izquierdas</option>
          </select>
        </div>
      </div>

      {/* ===== BLOQUE 4: INSTALACIÓN ===== */}
      <div style={bloqueStyle}>
        <h3 style={bloqueTituloStyle}>INSTALACIÓN</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
          <div>
            <label style={labelStyle}>Fecha Medición</label>
            <input
              type="date"
              value={puerta.fechaMedicion}
              onChange={(e) => update('fechaMedicion', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Fecha Instalación</label>
            <input
              type="date"
              value={puerta.fechaInstalacion}
              onChange={(e) => update('fechaInstalacion', e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Equipo Instalación</label>
          <textarea
            value={puerta.equipoInstalacion}
            onChange={(e) => update('equipoInstalacion', e.target.value)}
            placeholder="Notas sobre el equipo de instalación"
            style={{ ...inputStyle, minHeight: '60px', fontFamily: 'Arial' }}
          />
        </div>
      </div>
    </div>
  );
}