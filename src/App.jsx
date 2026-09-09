import { useEffect, useMemo, useState } from 'react'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'

import './App.css'
import PropertyCard from './components/PropertyCard'
import PropertyDetails from './components/PropertyDetails'
import PropertyFormPage from './components/PropertyFormPage'
import PropertyMapPage from './components/PropertyMapPage'
import InstitutionCarousel from './components/InstitutionCarousel'
import MapPreview from './components/MapPreview'
import { propertiesData } from './data/propiedades'
import { usersData } from './data/usuarios'
import { institucionesEducativas } from './data/instituciones'

const barrios = ['Centro', 'San Miguel', 'Guadalupe', 'UNaF']
const PROPERTIES_STORAGE_KEY = 'alquileres-formosa-properties'
const USER_STORAGE_KEY = 'alquileres-formosa-user'

const propietarios = new Map(usersData.filter((user) => user.rol === 'propietario').map((user) => [user.id, user]))

const normalizarPropiedad = (property) => {
  const propietario = propietarios.get(property.ownerId)

  return {
    id: property.id,
    titulo: property.title,
    descripcion: property.description,
    precio: property.price,
    barrio: property.address.match(/Barrio ([^,]+)/i)?.[1] || 'Centro',
    direccion: property.address,
    ambientes: property.bedrooms,
    tipoInmueble: 'Directo',
    tieneAire: /aire acondicionado/i.test(property.description),
    amoblado: property.is_furnished,
    imagen: property.imageUrl,
    coordenadas: property.coordinates,
    dueno: propietario?.nombre || 'Propietario verificado',
    propietario,
    estado: property.status,
  }
}

const propiedadesLocales = propertiesData.map(normalizarPropiedad)

function cargarPropiedades() {
  const guardadas = localStorage.getItem(PROPERTIES_STORAGE_KEY)
  return guardadas ? JSON.parse(guardadas) : propiedadesLocales
}

function guardarPropiedades(propiedades) {
  localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(propiedades))
}

function Header({ usuario, onLogout }) {
  return (
    <header className="site-header">
      <Link className="brand-title" to="/">Alquileres Formosa <span aria-hidden="true"></span></Link>
      <nav className="main-nav" aria-label="Navegación principal"><Link to="/mapa">Mapa</Link></nav>
      <div className="header-actions">
        {usuario ? <><span className="greeting">Hola, {usuario.nombre}</span><Link className="button button-primary" to={usuario.rol === 'propietario' ? '/panel-dueno' : '/panel-estudiante'}>{usuario.rol === 'propietario' ? '👤 Mi panel' : '🎓 Mi panel'}</Link><button className="button button-outline-danger" type="button" onClick={onLogout}>Cerrar sesión</button></> : <><Link className="button button-primary" to="/login">Iniciar sesión</Link><Link className="button button-accent" to="/registro">Crear cuenta</Link></>}
      </div>
    </header>
  )
}

function Filters({ filters, setFilters, mostrarFavoritos }) {
  const update = (event) => setFilters({ ...filters, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value })
  const limpiarFiltros = () => setFilters({ barrio: 'Todos', ambientes: 'Todos', tipo: 'Todos', orden: 'Defecto', precioMaximo: '', soloConAire: false, soloFavoritos: false })
  return (
    <section className="panel filters-panel">
      <div className="filter-heading"><div><span className="section-kicker">EXPLORAR PROPIEDADES</span><h2>Encontrá tu próximo alquiler</h2><p className="filter-description">Usá los filtros para encontrar una propiedad que se adapte a vos.</p></div><button className="clear-filters" type="button" onClick={limpiarFiltros}>Limpiar filtros</button></div>
      <div className="form-grid filter-grid">
        <label><span>Barrio</span><select name="barrio" value={filters.barrio} onChange={update}><option value="Todos">Todos los barrios</option>{barrios.map((barrio) => <option key={barrio} value={barrio}>{barrio === 'UNaF' ? 'Cerca de la UNaF' : barrio}</option>)}</select></label>
        <label><span>Ambientes</span><select name="ambientes" value={filters.ambientes} onChange={update}><option value="Todos">Cualquier cantidad</option><option value="1">Monoambiente</option><option value="2">2 ambientes</option><option value="3">3 ambientes</option></select></label>
        <label><span>Publicado por</span><select name="tipo" value={filters.tipo} onChange={update}><option value="Todos">Dueño o inmobiliaria</option><option value="Directo">Dueño directo</option><option value="Inmobiliaria">Inmobiliaria</option></select></label>
        <label><span>Ordenar por</span><select name="orden" value={filters.orden} onChange={update}><option value="Defecto">Más recientes</option><option value="MenorMayor">Menor precio</option><option value="MayorMenor">Mayor precio</option></select></label>
        <label><span>Precio máximo</span><div className="input-with-prefix"><span>$</span><input type="number" name="precioMaximo" value={filters.precioMaximo} onChange={update} placeholder="Sin límite" /></div></label>
        <div className="filter-options"><label className="checkbox-label"><input type="checkbox" name="soloConAire" checked={filters.soloConAire} onChange={update} /> Solo con aire acondicionado ❄️</label>{mostrarFavoritos && <label className="checkbox-label favorite-filter"><input type="checkbox" name="soloFavoritos" checked={filters.soloFavoritos} onChange={update} /> ⭐ Ver mis favoritos</label>}</div>
      </div>
    </section>
  )
}

function PropertyDetailsPage({ propiedades }) {
  const { id } = useParams()
  const propiedad = propiedades.find((item) => String(item.id) === id)

  if (!propiedad || propiedad.estado !== 'available') {
    return <InformativePage eyebrow="PROPIEDAD NO DISPONIBLE" title="Este alquiler ya no está disponible." description="Volvé al inicio para explorar las propiedades que siguen disponibles."><Link className="button button-primary" to="/">Ver alquileres</Link></InformativePage>
  }

  return <PropertyDetails propiedad={propiedad} />
}

function HomePage({ usuario, propiedades, onLogout }) {
  const [favoritos, setFavoritos] = useState([])
  const error = ''
  const [filters, setFilters] = useState({ barrio: 'Todos', ambientes: 'Todos', tipo: 'Todos', orden: 'Defecto', precioMaximo: '', soloConAire: false, soloFavoritos: false })

  useEffect(() => {
    const cargarFavoritos = async () => {
      try {
        if (usuario?.rol === 'estudiante') {
          const favoritosResponse = await fetch('/usuarios/favoritos')
          setFavoritos((await favoritosResponse.json()).map(Number))
        }
      } catch (requestError) {
        console.error('Error al cargar favoritos:', requestError)
      }
    }
    cargarFavoritos()
  }, [usuario])

  const alquileres = usuario?.rol === 'propietario'
    ? propiedades.filter((propiedad) => propiedad.propietario?.id === usuario.id)
    : propiedades.filter((propiedad) => propiedad.estado === 'available')

  const alquileresFiltrados = useMemo(() => {
    const resultado = alquileres.filter((alquiler) => {
      const cumpleBarrio = filters.barrio === 'Todos' || alquiler.barrio === filters.barrio
      const cumpleAmbientes = filters.ambientes === 'Todos' || Number(alquiler.ambientes || 1) === Number(filters.ambientes)
      const cumpleTipo = filters.tipo === 'Todos' || (alquiler.tipoInmueble || 'Directo') === filters.tipo
      const cumplePrecio = !filters.precioMaximo || Number(alquiler.precio) <= Number(filters.precioMaximo)
      const cumpleAire = !filters.soloConAire || alquiler.tieneAire === true
      const cumpleFavorito = !filters.soloFavoritos || favoritos.includes(Number(alquiler.id))
      return cumpleBarrio && cumpleAmbientes && cumpleTipo && cumplePrecio && cumpleAire && cumpleFavorito
    })
    return [...resultado].sort((a, b) => filters.orden === 'MenorMayor' ? a.precio - b.precio : filters.orden === 'MayorMenor' ? b.precio - a.precio : 0)
  }, [alquileres, favoritos, filters])

  const alternarFavorito = async (id) => {
    try {
      const response = await fetch('/usuarios/favoritos/toggle', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `idAlquiler=${id}` })
      const data = await response.json()
      if (data.exito) setFavoritos(data.favoritos.map(Number))
    } catch (requestError) { console.error('Error al guardar favorito:', requestError) }
  }

  return (
    <div className="app-shell"><Header usuario={usuario} onLogout={onLogout} />{usuario && <div className="welcome-bar">Hola, {usuario.nombre}. <span>{usuario.rol === 'propietario' ? 'Administrá tus propiedades desde tu panel.' : 'Encontrá tu próximo hogar en Formosa.'}</span></div>}<main>{usuario?.rol !== 'propietario' && <InstitutionCarousel instituciones={institucionesEducativas} propiedades={propiedades} />}<MapPreview propiedades={propiedades} instituciones={institucionesEducativas} /><div className="listings-toolbar"><div><span className="section-kicker">{usuario?.rol === 'propietario' ? 'MIS PUBLICACIONES' : 'CATÁLOGO DISPONIBLE'}</span><h2>{usuario?.rol === 'propietario' ? 'Mis alquileres' : 'Alquileres disponibles en Formosa'}</h2></div>{usuario?.rol === 'propietario' && <Link className="button button-primary" to="/alquileres/nuevo">+ Agregar alquiler</Link>}</div>{usuario?.rol !== 'propietario' && <Filters filters={filters} setFilters={setFilters} mostrarFavoritos={usuario?.rol === 'estudiante'} />}<section className="listings-section">{error && <p className="error-message">{error}</p>}{!error && !alquileres.length ? <p className="muted">No hay propiedades para mostrar.</p> : null}<div className="property-grid">{alquileresFiltrados.map((alquiler) => <PropertyCard key={alquiler.id} propiedad={alquiler} usuario={usuario} favoritos={favoritos} onToggleFavorite={alternarFavorito} />)}</div>{!!alquileres.length && !alquileresFiltrados.length && <p className="empty-message">No encontramos alquileres con esos filtros. 🔍</p>}</section></main><footer className="site-footer"><p>© 2026 Alquileres Formosa</p><div><Link to="/mapa">🗺️ Ver mapa</Link></div></footer></div>
  )
}

function InformativePage({ eyebrow, title, description, children }) {
  return (
    <div className="app-shell route-page-shell"><Header usuario={null} /><main className="route-page"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p className="route-description">{description}</p>{children}</main></div>
  )
}

function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const usuario = usersData.find((user) => user.email === credentials.email && user.password === credentials.password)
    if (!usuario) {
      setError('El email o la contraseña no son correctos.')
      return
    }
    onLogin(usuario)
    navigate('/')
  }

  return <InformativePage eyebrow="TU CUENTA" title="Iniciá sesión y seguí buscando." description="Accedé a tus favoritos, publicaciones y preferencias de búsqueda."><form className="route-form" onSubmit={submit}><label>Email<input type="email" value={credentials.email} onChange={(event) => setCredentials({ ...credentials, email: event.target.value })} required /></label><label>Contraseña<input type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} required /></label>{error && <p className="error-message">{error}</p>}<button className="button button-primary" type="submit">Iniciar sesión</button><p className="muted small-text">¿Todavía no tenés cuenta? <Link to="/registro">Crear cuenta</Link></p></form></InformativePage>
}

function RegisterPage() {
  return <InformativePage eyebrow="COMENZÁ HOY" title="Creá tu cuenta en Formosa." description="Guardá propiedades, contactá anunciantes y publicá tu próximo alquiler."><form className="route-form" action="/registro" method="POST"><label>Email<input type="email" name="email" required /></label><label>Contraseña<input type="password" name="password" required /></label><label>Tipo de cuenta<select name="rol" defaultValue="estudiante"><option value="estudiante">Estoy buscando alquilar</option><option value="propietario">Quiero publicar una propiedad</option></select></label><button className="button button-primary" type="submit">Crear cuenta</button></form></InformativePage>
}

function EditPropertyRoute({ usuario, propiedades, onSave }) {
  const { id } = useParams()
  const propiedad = propiedades.find((item) => String(item.id) === id)
  const puedeEditar = usuario?.rol === 'propietario' && propiedad?.propietario?.id === usuario.id

  if (!puedeEditar) return <InformativePage eyebrow="ACCESO RESTRINGIDO" title="No podés modificar esta propiedad." description="Sólo el propietario de la publicación puede editar sus datos."><Link className="button button-primary" to="/">Volver al inicio</Link></InformativePage>
  return <PropertyFormPage usuario={usuario} propiedad={propiedad} onSave={onSave} />
}

function App() {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem(USER_STORAGE_KEY)
    return guardado ? JSON.parse(guardado) : null
  })
  const [propiedades, setPropiedades] = useState(cargarPropiedades)

  const iniciarSesion = (usuarioLogueado) => {
    setUsuario(usuarioLogueado)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuarioLogueado))
  }

  const cerrarSesion = () => {
    setUsuario(null)
    localStorage.removeItem(USER_STORAGE_KEY)
  }

  const guardarPropiedad = (propiedad) => {
    setPropiedades((actuales) => {
      const existe = actuales.some((actual) => actual.id === propiedad.id)
      const actualizadas = existe ? actuales.map((actual) => actual.id === propiedad.id ? propiedad : actual) : [...actuales, { ...propiedad, id: Math.max(0, ...actuales.map((actual) => Number(actual.id) || 0)) + 1 }]
      guardarPropiedades(actualizadas)
      return actualizadas
    })
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage usuario={usuario} propiedades={propiedades} onLogout={cerrarSesion} />} />
      <Route path="/alquileres/:id" element={<PropertyDetailsPage propiedades={propiedades} />} />
      <Route path="/mapa" element={<PropertyMapPage propiedades={propiedades} instituciones={institucionesEducativas} />} />
      <Route path="/login" element={<LoginPage onLogin={iniciarSesion} />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/panel-dueno" element={<HomePage usuario={usuario} propiedades={propiedades} onLogout={cerrarSesion} />} />
      <Route path="/panel-estudiante" element={<HomePage usuario={usuario} propiedades={propiedades} onLogout={cerrarSesion} />} />
      <Route path="/alquileres/nuevo" element={usuario?.rol === 'propietario' ? <PropertyFormPage usuario={usuario} onSave={guardarPropiedad} /> : <LoginPage onLogin={iniciarSesion} />} />
      <Route path="/alquileres/:id/editar" element={<EditPropertyRoute usuario={usuario} propiedades={propiedades} onSave={guardarPropiedad} />} />
      <Route path="*" element={<InformativePage eyebrow="404" title="Esta pantalla todavía no existe." description="Volvé al inicio para seguir explorando los alquileres disponibles."><Link className="button button-primary" to="/">Volver al inicio</Link></InformativePage>} />
    </Routes>
  )
}

export default App
