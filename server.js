const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Konfigurasi Database
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'TUGAS1',
  password: 'diniaja', 
  port: 5432,
});

// 1. Endpoint Tower Seluler (Titik)
app.get('/api/map-data', async (req, res) => {
  try {
    const query = `
        SELECT 
            t.id_tower, 
            p.provider AS nama_provider,
            p.jenis_jaringan,
            p.pemilik_saham,
            p.produk,
            p.alamat_kantor_pusat,
            ST_AsGeoJSON(t.geom) as geometry 
        FROM tower_seluler t
        JOIN provider p ON t.id_provider = p.id_provider
    `;
    const result = await pool.query(query);
    const features = result.rows.map(row => ({
      type: 'Feature',
      properties: { 
          id_tower: row.id_tower || '-', 
          nama_provider: row.nama_provider || '-',
          jenis_jaringan: row.jenis_jaringan || '-',
          pemilik_saham: row.pemilik_saham || '-',
          produk: row.produk || '-',
          alamat_kantor_pusat: row.alamat_kantor_pusat || '-'
      },
      geometry: JSON.parse(row.geometry)
    }));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Endpoint Batas Wilayah (Poligon)
app.get('/api/wilayah', async (req, res) => {
  try {
    const query = `SELECT id_wilayah, nama_kabupaten, nama_bupati, ST_AsGeoJSON(geom) as geometry FROM wilayah`;
    const result = await pool.query(query);
    const features = result.rows.map(row => ({
      type: 'Feature',
      properties: { 
        id_wilayah: row.id_wilayah,
        nama_kabupaten: row.nama_kabupaten,
        nama_bupati: row.nama_bupati
      },
      geometry: JSON.parse(row.geometry)
    }));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Endpoint Penggunaan Lahan (Poligon)
app.get('/api/lahan', async (req, res) => {
  try {
    const query = `SELECT id_lahan, penggunaan_lahan, ST_AsGeoJSON(geom) as geometry FROM penggunaan_lahan`;
    const result = await pool.query(query);
    const features = result.rows.map(row => ({
      type: 'Feature', 
      properties: { 
        id_lahan: row.id_lahan,
        penggunaan_lahan: row.penggunaan_lahan
      }, 
      geometry: JSON.parse(row.geometry)
    }));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Endpoint Jalan (Garis/Linestring)
app.get('/api/jalan', async (req, res) => {
  try {
    const query = `SELECT id_jalan, nama_jalan, ST_AsGeoJSON(geom) as geometry FROM jalan`;
    const result = await pool.query(query);
    const features = result.rows.map(row => ({
      type: 'Feature', 
      properties: { 
        id_jalan: row.id_jalan,
        nama_jalan: row.nama_jalan
      }, 
      geometry: JSON.parse(row.geometry)
    }));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CRUD BAWAAN ---
app.post('/api/save-feature', async (req, res) => {
  const { nama, kategori, geometry } = req.body; 
  try {
    const query = `INSERT INTO tabel_lokasi (nama, kategori, geom) VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326)) RETURNING id;`;
    const result = await pool.query(query, [nama, kategori, JSON.stringify(geometry)]);
    res.json({ status: 'Success', id: result.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/update-feature/:id', async (req, res) => {
  const { id } = req.params; const { nama, geometry } = req.body;
  try {
    await pool.query(`UPDATE tabel_lokasi SET nama = $1, geom = ST_SetSRID(ST_GeomFromGeoJSON($2), 4326) WHERE id = $3`, [nama, JSON.stringify(geometry), id]);
    res.json({ status: 'Updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/delete-feature/:id', async (req, res) => {
  try { await pool.query('DELETE FROM tabel_lokasi WHERE id = $1', [req.params.id]); res.json({ status: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(3000, () => console.log('Server jalan di http://localhost:3000'));

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});