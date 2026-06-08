'use client'
import type { Servicio } from '@/types'
import { fmtDate, calcEdad } from '@/lib/utils'
import { Printer } from 'lucide-react'

function Check({ val }: { val: boolean }) {
  return <span className={val ? 'font-bold' : 'text-gray-400'}>{val ? 'SÍ' : 'NO'}</span>
}

export default function PrintOrden({ servicio: s }: { servicio: Servicio }) {
  return (
    <>
      <button className="btn btn-sm no-print" onClick={() => window.print()}>
        <Printer size={14} /> Imprimir orden
      </button>

      {/* PRINT ONLY */}
      <div className="print-only hidden">
        <style>{`
          @media print {
            .print-only { display: block !important; }
            .no-print { display: none !important; }
            body { font-family: Arial, sans-serif; font-size: 10px; color: #000; }
            .orden-wrap { max-width: 800px; margin: 0 auto; padding: 12px; }
            .orden-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1A1410; padding-bottom: 8px; margin-bottom: 12px; }
            .orden-logo h1 { font-family: Georgia, serif; font-size: 18px; font-weight: 600; }
            .orden-logo p { font-size: 9px; color: #666; }
            .orden-num { text-align: right; }
            .orden-num .num { font-size: 22px; font-weight: bold; }
            .section { margin-bottom: 10px; border: 1px solid #ccc; }
            .section-head { background: #1A1410; color: white; padding: 3px 8px; font-size: 9px; font-weight: bold; letter-spacing: .05em; text-transform: uppercase; }
            .section-body { padding: 6px 8px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px 8px; }
            .grid-2 { grid-template-columns: repeat(2, 1fr); }
            .field label { display: block; font-size: 8px; color: #666; text-transform: uppercase; letter-spacing: .04em; }
            .field span { font-size: 10px; font-weight: 500; }
            .checks { display: flex; flex-wrap: wrap; gap: 6px 12px; padding: 4px 8px; }
            .check-item { font-size: 9px; }
            .firma-row { display: flex; gap: 20px; margin-top: 20px; }
            .firma-box { flex: 1; border-top: 1px solid #000; padding-top: 4px; font-size: 9px; text-align: center; }
          }
        `}</style>
        <div className="orden-wrap">
          <div className="orden-header">
            <div className="orden-logo">
              <h1>Carunchio-Péculo</h1>
              <p>Tradición en Servicios Fúnebres</p>
            </div>
            <div className="orden-num">
              <div style={{fontSize:'9px',color:'#666',textTransform:'uppercase',letterSpacing:'.05em'}}>Orden de Trabajo de Servicio</div>
              <div className="num">{s.nro_orden || '—'}</div>
              <div style={{fontSize:'9px',marginTop:'2px'}}>Asesor: {s.asesor} · Fecha: {fmtDate(s.fecha_servicio)}</div>
            </div>
          </div>

          <div className="section">
            <div className="section-head">Datos del extinto</div>
            <div className="section-body">
              <div className="grid">
                <div className="field"><label>Nombre</label><span>{s.ext_nombre}</span></div>
                <div className="field"><label>Apellido</label><span>{s.ext_apellido}</span></div>
                <div className="field"><label>Documento</label><span>{s.ext_documento}</span></div>
                <div className="field"><label>Fecha fallecimiento</label><span>{fmtDate(s.ext_fallecio)}</span></div>
                <div className="field"><label>Nacimiento</label><span>{fmtDate(s.ext_nacimiento)}{calcEdad(s.ext_nacimiento, s.ext_fallecio) ? ` (${calcEdad(s.ext_nacimiento, s.ext_fallecio)} años)` : ''}</span></div>
                <div className="field"><label>Nacionalidad</label><span>{s.ext_nacionalidad}</span></div>
                <div className="field"><label>Estado civil</label><span>{s.ext_estado_civil}</span></div>
                <div className="field"><label>Profesión</label><span>{s.ext_profesion}</span></div>
                <div className="field"><label>Causa</label><span>{s.ext_causa_fallecimiento}</span></div>
                <div className="field"><label>Religión</label><span>{s.ext_religion}</span></div>
                <div className="field"><label>Contextura</label><span>{s.ext_contextura}</span></div>
                <div className="field"><label>Natural / Interpol</label><span>{s.ext_natural ? 'Natural' : ''}{s.ext_interpol ? ' Interpol' : ''}</span></div>
              </div>
              <div style={{marginTop:'4px'}} className="grid grid-2">
                <div className="field"><label>Lugar de fallecimiento</label><span>{s.ext_lugar_fallecimiento}</span></div>
                <div className="field"><label>Domicilio real</label><span>{s.ext_domicilio}</span></div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-head">Cobertura del servicio</div>
            <div className="section-body">
              <div className="grid">
                <div className="field"><label>Cobertura</label><span>{s.cobertura}</span></div>
                <div className="field"><label>Titular</label><span>{s.titular || '—'}</span></div>
                <div className="field"><label>Código</label><span>{s.codigo_cobertura || '—'}</span></div>
                <div className="field"><label>Legajo</label><span>{s.legajo || '—'}</span></div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-head">Datos del servicio a combinar con el responsable</div>
            <div className="section-body">
              <div className="grid">
                <div className="field"><label>Será velado</label><span><Check val={s.sera_velado} /></span></div>
                <div className="field"><label>Tipo de velatorio</label><span>{s.tipo_velatorio}</span></div>
                <div className="field"><label>Cementerio</label><span>{s.cementerio}</span></div>
                <div className="field"><label>Destino</label><span>{s.destino}</span></div>
                <div className="field"><label>Reg. civil</label><span><Check val={s.registro_civil} /></span></div>
              </div>
              <div style={{marginTop:'4px'}} className="field"><label>Sala / Dirección del velatorio</label><span>{s.sala}</span></div>
            </div>
          </div>

          <div className="section">
            <div className="section-head">Datos del responsable contratante</div>
            <div className="section-body">
              <div className="grid">
                <div className="field"><label>Apellido</label><span>{s.resp_apellido}</span></div>
                <div className="field"><label>Nombre</label><span>{s.resp_nombre}</span></div>
                <div className="field"><label>Documento</label><span>{s.resp_documento}</span></div>
                <div className="field"><label>Parentesco</label><span>{s.resp_parentesco}</span></div>
                <div className="field"><label>Nacimiento</label><span>{fmtDate(s.resp_nacimiento)}</span></div>
                <div className="field"><label>Nacionalidad</label><span>{s.resp_nacionalidad}</span></div>
                <div className="field"><label>Estado civil</label><span>{s.resp_estado_civil}</span></div>
                <div className="field"><label>Teléfono</label><span>{s.resp_telefono}</span></div>
                <div className="field"><label>Celular</label><span>{s.resp_celular}</span></div>
                <div className="field"><label>E-mail</label><span>{s.resp_email}</span></div>
              </div>
              <div style={{marginTop:'4px'}} className="field"><label>Domicilio</label><span>{s.resp_domicilio}</span></div>
            </div>
          </div>

          <div className="section">
            <div className="section-head">Componentes del servicio</div>
            <div className="checks">
              <div className="check-item">Ataúd N°: <strong>{s.ataud_nro || '—'}</strong></div>
              <div className="check-item">Metálica: <Check val={s.tiene_metalica} /></div>
              <div className="check-item">Azafata: <Check val={s.tiene_azafata} /></div>
              <div className="check-item">Urna: <Check val={s.tiene_urna} /></div>
              <div className="check-item">Mat. de calle: <strong>{s.log_ambulancia1 || 'NO'}</strong></div>
              <div className="check-item">Ambulancia: <Check val={s.tiene_ambulancia} /></div>
              <div className="check-item">Cafetería: <Check val={s.tiene_cafeteria} /></div>
              <div className="check-item">Tanatoestética: <Check val={s.tiene_tanatoest} /></div>
              <div className="check-item">Tanatopraxia: <Check val={s.tiene_tanatoprax} /></div>
              <div className="check-item">Responso: <Check val={s.tiene_responso} /></div>
              <div className="check-item">Mortaja: <Check val={s.tiene_mortaja} /></div>
            </div>
          </div>

          <div className="section">
            <div className="section-head">Valores del servicio</div>
            <div className="section-body">
              <div className="grid">
                <div className="field"><label>Total (sin IVA)</label><span>${s.val_total?.toLocaleString('es-AR') ?? '—'}</span></div>
                <div className="field"><label>Urna</label><span>${s.val_urna?.toLocaleString('es-AR') ?? '—'}</span></div>
                <div className="field"><label>Impuestos</label><span>${s.val_impuestos?.toLocaleString('es-AR') ?? '0'}</span></div>
                <div className="field"><label>Total c/ impuestos</label><span><strong>${s.val_total_impuestos?.toLocaleString('es-AR') ?? '—'}</strong></span></div>
                <div className="field"><label>Abonado</label><span>${s.val_abonado?.toLocaleString('es-AR') ?? '0'}</span></div>
                <div className="field"><label>Saldo</label><span><strong>${s.val_saldo?.toLocaleString('es-AR') ?? '0'}</strong></span></div>
              </div>
            </div>
          </div>

          {s.log_observaciones && (
            <div className="section">
              <div className="section-head">Observaciones</div>
              <div className="section-body" style={{fontSize:'10px'}}>{s.log_observaciones}</div>
            </div>
          )}

          <div className="firma-row">
            <div className="firma-box">Firma Contratante</div>
            <div className="firma-box">Aclaración</div>
            <div className="firma-box">DNI</div>
            <div className="firma-box">Asesor</div>
          </div>

          <p style={{fontSize:'8px',color:'#666',marginTop:'12px',textAlign:'center'}}>
            La totalidad de los datos que fueren precedentes consignados y asume a su cargo, cualquier consecuencia derivada de haber proporcionado alguna información incorrecta en relación a la tramitación del servicio que se presta, no pudiendo efectuar reclamo alguno en tal sentido.
          </p>
        </div>
      </div>
    </>
  )
}
