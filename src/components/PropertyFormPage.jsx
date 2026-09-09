import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const initialForm = {
  titulo: '',
  descripcion: '',
  precio: '',
  direccion: '',
  barrio: 'Centro',
  ambientes: '1',
  amoblado: false,
  tieneAire: false,
  imagen: '',
}

function PropertyFormPage({ usuario, propiedad, onSave }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(propiedad ? { ...propiedad, ambientes: String(propiedad.ambientes), precio: String(propiedad.precio) } : initialForm)

  const update = (event) => {
    const { name, value, type, checked } = event.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const submit = (event) => {
    event.preventDefault()
    const propietarioPublico = { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, telefono: usuario.telefono, ciudad: usuario.ciudad, presentacion: usuario.presentacion }
    onSave({ ...form, precio: Number(form.precio), ambientes: Number(form.ambientes), propietario: propietarioPublico, dueno: usuario.nombre, tipoInmueble: 'Directo', estado: 'available', imagen: form.imagen || propiedad?.imagen || '/favicon.svg', coordenadas: propiedad?.coordenadas || [-26.177, -58.178] })
    navigate('/panel-dueno')
  }

  return (
    <div className="app-shell route-page-shell"><header className="site-header"><Link className="brand-title" to="/">Alquileres Formosa</Link><Link className="button button-accent" to="/panel-dueno">Volver al panel</Link></header><main className="route-page property-form-page"><span className="eyebrow">PANEL DE PROPIETARIO</span><h1>{propiedad ? 'Modificar alquiler' : 'Agregar un nuevo alquiler'}</h1><p className="route-description">{propiedad ? 'Actualizá la información visible de tu publicación.' : 'Publicá una propiedad y empezá a recibir consultas.'}</p><form className="property-form" onSubmit={submit}><div className="property-form-grid"><label>Título<input name="titulo" value={form.titulo} onChange={update} placeholder="Ej: Departamento luminoso" required /></label><label>Precio mensual<input type="number" name="precio" value={form.precio} onChange={update} required /></label><label>Dirección<input name="direccion" value={form.direccion} onChange={update} placeholder="Ej: Av. principal 123" required /></label><label>Barrio<select name="barrio" value={form.barrio} onChange={update}><option>Centro</option><option>San Miguel</option><option>Guadalupe</option><option>UNaF</option></select></label><label>Ambientes<select name="ambientes" value={form.ambientes} onChange={update}><option value="1">Monoambiente</option><option value="2">2 ambientes</option><option value="3">3 ambientes</option><option value="4">4 ambientes</option></select></label><label>Imagen<input name="imagen" value={form.imagen} onChange={update} placeholder="URL de imagen" type="url" /></label></div><label>Descripción<textarea name="descripcion" value={form.descripcion} onChange={update} placeholder="Contá qué hace especial a esta propiedad" rows="5" required /></label><div className="property-form-options"><label className="checkbox-label"><input type="checkbox" name="amoblado" checked={form.amoblado} onChange={update} /> Amoblado</label><label className="checkbox-label"><input type="checkbox" name="tieneAire" checked={form.tieneAire} onChange={update} /> Aire acondicionado</label></div><button className="button button-primary" type="submit">{propiedad ? 'Guardar cambios' : 'Publicar alquiler'}</button></form></main></div>
  )
}

export default PropertyFormPage
