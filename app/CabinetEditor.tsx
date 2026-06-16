export default function CabinetEditor({ armario, onChange }: any) {
  const updateField = (field: string, value: any) => {
    onChange({ ...armario, [field]: value });
  };

  const updateInterior = (field: string, value: any) => {
    onChange({
      ...armario,
      interior: { ...armario.interior, [field]: value }
    });
  };

  const updateFinishes = (field: string, value: any) => {
    onChange({
      ...armario,
      finishes: { ...armario.finishes, [field]: value }
    });
  };

  const updateDoor = (index: number, width: number) => {
    const newDoors = [...armario.doors];
    newDoors[index] = { width };
    onChange({ ...armario, doors: newDoors });
  };

  return (
    <div style={{ fontSize: '13px', color: '#2D2823' }}>
      {/* Nombre */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px', textTransform: 'uppercase', color: '#6b5d4f' }}>
          Nombre (Opcional)
        </label>
        <input
          type="text"
          value={armario.name}
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
          value={armario.type}
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

      {/* Puertas */}
      <div style={{ marginBottom: '15px', padding: '10px', background: '#faf7f2', borderRadius: '4px' }}>
        <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '8px', textTransform: 'uppercase', color: '#6b5d4f' }}>
          Ancho de puertas (cm)
        </label>
        {armario.doors.map((door: any, i: number) => (
          <div key={i} style={{ marginBottom: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b5d4f', minWidth: '30px' }}>Puerta {i + 1}</span>
            <input
              type="number"
              value={door.width}
              onChange={(e) => updateDoor(i, Number(e.target.value))}
              style={{
                width: '70px',
                padding: '6px',
                border: '1px solid #d9cdb8',
                borderRadius: '3px',
                fontSize: '12px',
              }}
            />
            <span style={{ fontSize: '11px', color: '#6b5d4f' }}>cm</span>
          </div>
        ))}
      </div>

      {/* Interior */}
      <div style={{ marginBottom: '15px', borderTop: '1px solid #d9cdb8', paddingTop: '10px' }}>
        <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '8px', textTransform: 'uppercase', color: '#6b5d4f' }}>
          Interior
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={armario.interior.barraColgar}
              onChange={(e) => updateInterior('barraColgar', e.target.checked)}
            />
            Barra colgante
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={armario.interior.baldas}
              onChange={(e) => updateInterior('baldas', e.target.checked)}
            />
            Baldas
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={armario.interior.cremallera}
              onChange={(e) => updateInterior('cremallera', e.target.checked)}
            />
            Cremallera
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', cursor: 'pointer' }}>Cajones</label>
            <input
              type="number"
              min="0"
              max="5"
              value={armario.interior.cajones}
              onChange={(e) => updateInterior('cajones', Number(e.target.value))}
              style={{
                width: '50px',
                padding: '4px',
                border: '1px solid #d9cdb8',
                borderRadius: '3px',
                fontSize: '12px',
              }}
            />
          </div>
        </div>
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
              value={armario.finishes.interiorTextil}
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
              value={armario.finishes.handle}
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
              checked={armario.finishes.costadosVistos}
              onChange={(e) => updateFinishes('costadosVistos', e.target.checked)}
            />
            Costados vistos
          </label>
        </div>
      </div>

      {/* Notas */}
      <div style={{ marginBottom: '15px', borderTop: '1px solid #d9cdb8', paddingTop: '10px' }}>
        <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px', textTransform: 'uppercase', color: '#6b5d4f' }}>
          Notas
        </label>
        <textarea
          value={armario.notes}
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
    </div>
  );
}