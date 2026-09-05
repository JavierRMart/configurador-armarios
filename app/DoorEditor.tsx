'use client';

import { useEffect, useState } from 'react';
import { getModelosDisponibles } from '@/lib/price-lists';

const ALTOS = [2030, 2100, 2400];
const ANCHOS = [625, 725, 825, 925];
const CERCOS_BATIENTE = [80, 90, 100, 110, 120, 130, 140];
const CERCOS_CORREDERA = [90, 105];
const TAPETAS_OPTS = ['70x12', '90x12'];
const PERNIOS_OPTS = ['INOX', 'NEGRO'];
const HERRAJE_OPTS = ['INOX', 'NEGRO'];

export default function DoorEditor({ puerta, onChange }: any) {
  const [modelos, setModelos] = useState<string[]>([]);
  const [cargandoModelos, setCargandoModelos] = useState(true);
  const [errorModelos, setErrorModelos] = useState('');

  // Carga los modelos de la tarifa al abrir el editor
  useEffect(() => {
    const cargar = async () => {
      try {
        const lista = await getModelosDisponibles();
        setModelos(lista);
      } catch (err: any) {
        setErrorModelos('No se pudieron cargar los modelos');
      } finally {
        setCargandoModelos(false);
      }
    };
    cargar();
  }, []);

  const update = (field: string, value: any) => {
    onChange({ ...puerta, [field]: value });
  };

  const cercosDisponibles =
    puerta.subtipo === 'CORREDERA' ? CERCOS_CORREDERA : CERCOS_BATIENTE;

  // Si el proyecto ya tenía un modelo escrito a mano que no está en la
  // tarifa, lo añadimos a la lista para no perderlo
  const modeloActual = puerta.modelo || '';
  const listaModelos =
    modeloActual && !modelos.includes(modeloActual)
      ? [modeloActual, ...modelos]
      : modelos;

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

  return (
    <div style={{ fontSize: '13px', color: '#2D2823' }}>
      {/* FILA 1: MODELO Y COLOR */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
        <div>
          <label style={labelStyle}>
            Modelo{' '}
            {!cargandoModelos && modelos.length > 0 && (
              <span style={{ fontWeight: 'normal', textTransform: 'none' }}>
                ({modelos.length} en tarifa)
              </span>
            )}
          </label>
          <select
            value={modeloActual}
            onChange={(e) => update('modelo', e.target.value)}
            disabled={cargandoModelos}
            style={inputStyle}
          >
            <option value="">
              {cargandoModelos ? 'Cargando modelos...' : '— Selecciona modelo —'}
            </option>
            {listaModelos.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {errorModelos && (
            <p style={{ color: '#c0392b', fontSize: '11px', margin: '4px 0 0 0' }}>
              {errorModelos}
            </p>
          )}
          {!cargandoModelos && !errorModelos && modelos.length === 0 && (
            <p style={{ color: '#6b5d4f', fontSize: '11px', margin: '4px 0 0 0' }}>
              No hay tarifas cargadas todavía
            </p>
          )}
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

      {/* FILA 2: CERCO Y BURLETE */}
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

      {/* FILA 3: PERNIOS Y HERRAJE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
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

      {/* FILA 4: FECHAS */}
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

      {/* EQUIPO INSTALACION */}
      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Equipo Instalación</label>
        <textarea
          value={puerta.equipoInstalacion}
          onChange={(e) => update('equipoInstalacion', e.target.value)}
          placeholder="Notas sobre el equipo de instalación"
          style={{ ...inputStyle, minHeight: '60px', fontFamily: 'Arial' }}
        />
      </div>

      {/* SEPARATOR */}
      <div style={{ borderTop: '1px solid #d9cdb8', margin: '15px 0', paddingTop: '15px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 'bold', color: '#1a1612' }}>
          MEDIDAS DE LA PUERTA
        </h3>
      </div>

      {/* FILA 5: UBICACIÓN Y UNIDADES */}
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

      {/* FILA 6: TIPO Y SUBTIPO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
        <div>
          <label style={labelStyle}>Tipo</label>
          <select
            value={puerta.tipo}
            onChange={(e) => {
              const nuevoTipo = e.target.value;
              const nuevoSubtipo = nuevoTipo === 'CIEGA' ? 'BATIENTE' : 'V-1';
              onChange({ ...puerta, tipo: nuevoTipo, subtipo: nuevoSubtipo });
            }}
            style={inputStyle}
          >
            <option value="CIEGA">Ciega</option>
            <option value="VIDRIERA">Vidriera</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Subtipo</label>
          <select
            value={puerta.subtipo}
            onChange={(e) => update('subtipo', e.target.value)}
            style={inputStyle}
          >
            {puerta.tipo === 'CIEGA' ? (
              <>
                <option value="BATIENTE">Batiente</option>
                <option value="CORREDERA">Corredera</option>
              </>
            ) : (
              <>
                <option value="V-1">V-1</option>
                <option value="V-2">V-2</option>
                <option value="V-3">V-3</option>
                <option value="V-4">V-4</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* FILA 7: MEDIDAS PRINCIPALES */}
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

      {/* FILA 8: APERTURA */}
      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Apertura</label>
        <select value={puerta.apertura} onChange={(e) => update('apertura', e.target.value)} style={inputStyle}>
          <option value="derecha">A derechas</option>
          <option value="izquierda">A izquierdas</option>
        </select>
      </div>
    </div>
  );
}