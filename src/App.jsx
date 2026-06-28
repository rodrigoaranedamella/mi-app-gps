import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Tus credenciales reales ya configuradas de forma segura
const SUPABASE_URL = "https://jgddfaasvthwhzpujwlo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnZGRmYWFzdnRod2h6cHVqd2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTY5MzEsImV4cCI6MjA5ODE3MjkzMX0.sTHjDi1q6flUeSOW6FwK3SN2Uje-tVsnIqHt_Be-ruk";
const VEHICULO_IMEI = "865413054877575";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [sesion, setSesion] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [posiciones, setPosiciones] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSesion(session));
    supabase.auth.onAuthStateChange((_event, session) => setSesion(session));
  }, []);

  useEffect(() => {
    if (sesion) {
      obtenerHistorial();
      const intervalo = setInterval(obtenerHistorial, 15000); // Actualiza el mapa cada 15 segundos
      return () => clearInterval(intervalo);
    }
  }, [sesion]);

  const obtenerHistorial = async () => {
    const { data, error } = await supabase
      .from('historial_gps')
      .select('*')
      .eq('imei', VEHICULO_IMEI)
      .order('fecha_gps', { ascending: true });
    if (!error && data) setPosiciones(data);
  };

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);
    if (error) alert("Credenciales incorrectas: " + error.message);
  };

  if (!sesion) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f3f4f6' }}>
        <form onSubmit={iniciarSesion} style={{ background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '300px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#1f2937' }}>Monitoreo GPS</h2>
          <input type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
          <button type="submit" disabled={cargando} style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    );
  }

  const ultimaPos = posiciones[posiciones.length - 1];
  const centroMapa = ultimaPos ? [ultimaPos.latitud, ultimaPos.longitud] : [-33.456, -70.648]; 
  const lineaRuta = posiciones.map(p => [p.latitud, p.longitud]);

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      <header style={{ background: '#1f2937', color: 'white', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '18px' }}>📍 Vehículo IMEI: {VEHICULO_IMEI}</h1>
        <button onClick={() => supabase.auth.signOut()} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Salir</button>
      </header>
      
      {posiciones.length > 0 ? (
        <MapContainer center={centroMapa} zoom={16} style={{ flex: 1, width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          <Polyline positions={lineaRuta} color="#2563eb" weight={5} opacity={0.7} />
          <Marker position={centroMapa}>
            <Popup style={{ fontFamily: 'sans-serif' }}>
              <div style={{ fontSize: '13px' }}>
                <strong style={{ color: '#2563eb' }}>Estado del Auto</strong><br />
                <b>Velocidad:</b> {ultimaPos.velocidad} km/h<br />
                <b>Último Reporte:</b> {new Date(ultimaPos.fecha_gps).toLocaleString()}<br />
                <b>Coordenadas:</b> {ultimaPos.latitud}, {ultimaPos.longitud}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      ) : (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', color: '#4b5563', backgroundColor: '#f9fafb' }}>
          ⏳ Esperando la primera transmisión de coordenadas desde el GPS del vehículo...
        </div>
      )}
    </div>
  );
}