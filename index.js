const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors'); // Se importa cors

const app = express();
const port = 3001;

const corsOptions = {
  origin: ['http://172.17.40.7:4200', 'http://172.17.22.103:4200', 'http://172.17.40.7:4200'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions)); // Se activa cors globally
app.use(bodyParser.json());



// Base de datos
const pool = mysql.createPool({
  host: '172.17.131.13',
  user: 'root',
  database: 'ApiVehiculos',
  password: 'M12-Traveller',
  port: 3306,
});

// Swagger config
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Vehículos de Alquiler',
      version: '1.0.0',
      description: 'API para gestionar vehículos de alquiler, destinos y tipos de vehículos.',
    },
    servers: [{ url: `http://172.17.40.7:${port}` }],
    components: {},
  },
  apis: [__filename], // Para leer los comentarios del propio archivo
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Middleware
app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * tags:
 *   - name: Vehiculos
 *     description: Operaciones con vehículos
 *   - name: Destinos
 *     description: Operaciones con destinos
 *   - name: TipoVehiculos
 *     description: Tipos de vehículos
 */

// VEHÍCULOS

/**
 * @swagger
 * /apicoches/vehiculos:
 *   get:
 *     summary: Obtener todos los vehículos
 *     tags: [Vehiculos]
 *     responses:
 *       200:
 *         description: Lista de vehículos
 */
app.get('/apicoches/vehiculos', (req, res) => {
  pool.query('SELECT * FROM vehiculos_alquiler', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

/**
 * @swagger
 * /apicoches/vehiculos/detalles/{id}:
 *   get:
 *     summary: Obtener detalles de un vehículo específico con el nombre del tipo
 *     tags: [Vehiculos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     responses:
 *       200:
 *         description: Detalles del vehículo encontrado
 *       404:
 *         description: Vehículo no encontrado
 */
app.get('/apicoches/vehiculos/detalles/:id', (req, res) => {
  const id = req.params.id;
  const query = `
    SELECT 
      v.id_destino,
      v.id_vehiculo, 
      v.nombre_vehiculo, 
      v.tipo_vehiculo,
      t.tipo_vehiculo AS nombre_tipo_vehiculo, 
      v.imagen
    FROM 
      vehiculos_alquiler v
    JOIN 
      tipo_vehiculo t
    ON 
      v.tipo_vehiculo = t.id_tipo_vehiculo
    WHERE 
      v.id_vehiculo = ?
  `;
  
  pool.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Vehículo no encontrado" });
    }

    res.json(results[0]); // Devolvemos solo el primer resultado ya que es búsqueda por ID
  });
});

/**
 * @swagger
 * /apicoches/vehiculos/detalles:
 *   get:
 *     summary: Obtener detalles de los vehículos con el nombre del tipo de vehículo
 *     tags: [Vehiculos]
 *     responses:
 *       200:
 *         description: Lista de vehículos con detalles del tipo de vehículo
 */

app.get('/apicoches/vehiculos/detalles', (req, res) => {
  const query = `
    SELECT 
      v.id_destino,
      v.id_vehiculo, 
      v.nombre_vehiculo, 
      t.tipo_vehiculo AS nombre_tipo_vehiculo, 
      v.imagen
    FROM 
      vehiculos_alquiler v
    JOIN 
      tipo_vehiculo t
    ON 
      v.tipo_vehiculo = t.id_tipo_vehiculo
  `;
  
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Vehículo no encontrado" });
    }

    res.json(results);
  });
});


/**
 * @swagger
 * /apicoches/vehiculos/{id}:
 *   get:
 *     summary: Obtener un vehículo por ID
 *     tags: [Vehiculos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     responses:
 *       200:
 *         description: Vehículo encontrado
 *       404:
 *         description: Vehículo no encontrado
 */
app.get('/apicoches/vehiculos/:id', (req, res) => {
  const id = req.params.id;
  pool.query('SELECT * FROM vehiculos_alquiler WHERE id_vehiculo = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json(results[0]);
  });
});

/**
 * @swagger
 * /apicoches/vehiculos/tipo/{tipo}:
 *   get:
 *     summary: Obtener vehículos por tipo
 *     tags: [Vehiculos]
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tipo de vehículo
 *     responses:
 *       200:
 *         description: Lista de vehículos del tipo especificado
 */
app.get('/apicoches/vehiculos/tipo/:tipo', (req, res) => {
  const tipo = req.params.tipo;
  pool.query('SELECT * FROM vehiculos_alquiler WHERE tipo_vehiculo = ?', [tipo], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

/**
 * @swagger
 * /apicoches/vehiculos:
 *   post:
 *     summary: Agregar un nuevo vehículo
 *     tags: [Vehiculos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_destino:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Vehículo agregado correctamente
 */
app.post('/apicoches/vehiculos', (req, res) => {
  const { id_vehiculo, tipo_vehiculo, id_destino } = req.body;
  pool.query(
    'INSERT INTO vehiculos_alquiler (id_vehiculo, tipo_vehiculo, id_destino) VALUES (?, ?, ?)',
    [id_vehiculo, tipo_vehiculo, id_destino],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Vehículo agregado correctamente' });
    }
  );
});

/**
 * @swagger
 * /apicoches/vehiculos/{id}:
 *   put:
 *     summary: Actualizar un vehículo
 *     tags: [Vehiculos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo_vehiculo:
 *                 type: integer
 *               id_destino:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Vehículo actualizado
 */
app.put('/apicoches/vehiculos/:id', (req, res) => {
  const id = req.params.id;
  const { tipo_vehiculo, id_destino } = req.body;
  pool.query(
    'UPDATE vehiculos_alquiler SET tipo_vehiculo = ?, id_destino = ? WHERE id_vehiculo = ?',
    [tipo_vehiculo, id_destino, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Vehículo actualizado correctamente' });
    }
  );
});


/**
 * @swagger
 * /apicoches/vehiculos/{id}:
 *   delete:
 *     summary: Eliminar un vehículo
 *     tags: [Vehiculos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vehículo eliminado
 */
app.delete('/apicoches/vehiculos/:id', (req, res) => {
  const id = req.params.id;
  pool.query('DELETE FROM vehiculos_alquiler WHERE id_vehiculo = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Vehículo eliminado correctamente' });
  });
});

// DESTINOS

/**
 * @swagger
 * /apicoches/destinos:
 *   get:
 *     summary: Obtener todos los destinos
 *     tags: [Destinos]
 *     responses:
 *       200:
 *         description: Lista de destinos
 */
app.get('/apicoches/destinos', (req, res) => {
  pool.query('SELECT * FROM destinos', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

/**
 * @swagger
 * /apicoches/destinos/{id}:
 *   get:
 *     summary: Obtener un destino por ID
 *     tags: [Destinos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del destino
 *     responses:
 *       200:
 *         description: Destino encontrado
 */
app.get('/apicoches/destinos/:id', (req, res) => {
  const id = req.params.id;
  pool.query('SELECT * FROM destinos WHERE id_destino = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Destino no encontrado' });
    res.json(results[0]);
  });
});

/**
 * @swagger
 * /apicoches/destinos:
 *   post:
 *     summary: Agregar un destino
 *     tags: [Destinos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pais:
 *                 type: string
 *               ciudad:
 *                 type: string
 *     responses:
 *       200:
 *         description: Destino agregado
 */
app.post('/apicoches/destinos', (req, res) => {
  const { pais, ciudad } = req.body;
  pool.query('INSERT INTO destinos (pais, ciudad) VALUES (?, ?)', [pais, ciudad], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Destino agregado correctamente' });
  });
});

/**
 * @swagger
 * /apicoches/destinos/{id}:
 *   put:
 *     summary: Actualizar un destino
 *     tags: [Destinos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del destino
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pais:
 *                 type: string
 *               ciudad:
 *                 type: string
 *     responses:
 *       200:
 *         description: Destino actualizado
 */
app.put('/apicoches/destinos/:id', (req, res) => {
  const id = req.params.id;
  const { pais, ciudad } = req.body;
  pool.query('UPDATE destinos SET pais = ?, ciudad = ? WHERE id_destino = ?', [pais, ciudad, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Destino actualizado correctamente' });
  });
});

/**
 * @swagger
 * /apicoches/destinos/{id}:
 *   delete:
 *     summary: Eliminar un destino
 *     tags: [Destinos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Destino eliminado
 */
app.delete('/apicoches/destinos/:id', (req, res) => {
  const id = req.params.id;
  pool.query('DELETE FROM destinos WHERE id_destino = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Destino eliminado correctamente' });
  });
});

// TIPO VEHICULOS

/**
 * @swagger
 * /apicoches/tipoVehiculos:
 *   get:
 *     summary: Obtener todos los tipos de vehículos
 *     tags: [TipoVehiculos]
 *     responses:
 *       200:
 *         description: Lista de tipos de vehículos
 */
app.get('/apicoches/tipoVehiculos', (req, res) => {
  pool.query('SELECT * FROM tipo_vehiculo', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

/**
 * @swagger
 * /apicoches/tipoVehiculos/{id}:
 *   get:
 *     summary: Obtener un tipo de vehículo por ID
 *     tags: [TipoVehiculos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tipo de vehículo
 *     responses:
 *       200:
 *         description: Tipo de vehículo encontrado
 *       404:
 *         description: No se encontró el tipo de vehículo
 */
app.get('/apicoches/tipoVehiculos/:id', (req, res) => {
  const id = req.params.id;
  pool.query('SELECT * FROM tipo_vehiculo WHERE tipo_vehiculo = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Tipo de vehículo no encontrado' });
    res.json(results[0]);
  });
});

/**
 * @swagger
 * /apicoches/tipoVehiculos:
 *   post:
 *     summary: Crear un nuevo tipo de vehículo
 *     tags: [TipoVehiculos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo_vehiculo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tipo de vehículo creado correctamente
 */
app.post('/apicoches/tipoVehiculos', (req, res) => {
  const { tipo_vehiculo } = req.body;
  pool.query('INSERT INTO tipo_vehiculo (tipo_vehiculo) VALUES (?)', [tipo_vehiculo], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Tipo de vehículo creado correctamente' });
  });
});

/**
 * @swagger
 * /apicoches/tipoVehiculos/{id}:
 *   put:
 *     summary: Actualizar un tipo de vehículo
 *     tags: [TipoVehiculos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo_vehiculo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tipo de vehículo actualizado correctamente
 */
app.put('/apicoches/tipoVehiculos/:id', (req, res) => {
  const id = req.params.id;
  const { tipo_vehiculo } = req.body;
  pool.query('UPDATE tipo_vehiculo SET tipo_vehiculo = ? WHERE tipo_vehiculo = ?', [tipo_vehiculo, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Tipo de vehículo actualizado correctamente' });
  });
});

/**
 * @swagger
 * /apicoches/tipoVehiculos/{id}:
 *   delete:
 *     summary: Eliminar un tipo de vehículo
 *     tags: [TipoVehiculos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tipo de vehículo eliminado correctamente
 */
app.delete('/apicoches/tipoVehiculos/:id', (req, res) => {
  const id = req.params.id;
  pool.query('DELETE FROM tipo_vehiculo WHERE tipo_vehiculo = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Tipo de vehículo eliminado correctamente' });
  });
});


// Start
app.listen(port, () => {
  console.log(`Servidor corriendo en http://172.17.40.7:${port}`);
  console.log(`Swagger en http://172.17.40.7:${port}/api-docs`);
});
