const express = require("express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(express.json());

// ---------------------------------------------------------------------
// Documentação Swagger / OpenAPI gerada a partir dos comentários JSDoc.
// Serve como fonte de verdade consumida pelo gerador de suítes Playwright.
// ---------------------------------------------------------------------
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Target API - Loja",
      version: "1.0.0",
      description: "API REST com 6 recursos (users, products, orders, categories, reviews, auth), usada como alvo de demonstração do gerador Swagger -> Playwright.",
    },
    servers: [{ url: "http://localhost:3000" }],
  },
  apis: [__filename],
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => res.status(200).json(swaggerSpec));

// ---------------------------------------------------------------------
// Dados em memória
// ---------------------------------------------------------------------
let categories = [
  { id: 1, name: "Eletrônicos" },
  { id: 2, name: "Livros" },
];
let nextCategoryId = 3;

let products = [
  { id: 1, name: "Fone Bluetooth", price: 199.9, categoryId: 1 },
  { id: 2, name: "Livro de Node.js", price: 89.9, categoryId: 2 },
];
let nextProductId = 3;

let users = [
  { id: 1, name: "Ana Souza", email: "ana@example.com", password: "123456" },
  { id: 2, name: "Bruno Lima", email: "bruno@example.com", password: "123456" },
];
let nextUserId = 3;

let orders = [
  { id: 1, userId: 1, productId: 1, quantity: 2, status: "pendente" },
];
let nextOrderId = 2;

let reviews = [
  { id: 1, productId: 1, userId: 1, rating: 5, comment: "Excelente produto" },
];
let nextReviewId = 2;

const activeTokens = new Set();

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ error: "Token inválido ou ausente" });
  }
  next();
}

// ===================== AUTH =====================

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Autentica um usuário e retorna um token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login efetuado com sucesso }
 *       400: { description: Campos obrigatórios ausentes }
 *       401: { description: Credenciais inválidas }
 */
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Campos 'email' e 'password' são obrigatórios" });
  }
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

  const token = `token-${user.id}-${Date.now()}`;
  activeTokens.add(token);
  res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Retorna os dados do usuário autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dados do usuário autenticado }
 *       401: { description: Token inválido ou ausente }
 */
app.get("/auth/me", authMiddleware, (req, res) => {
  const token = req.headers.authorization.replace("Bearer ", "");
  const userId = Number(token.split("-")[1]);
  const user = users.find((u) => u.id === userId);
  res.status(200).json({ id: user.id, name: user.name, email: user.email });
});

// ===================== USERS =====================

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Lista todos os usuários
 *     responses:
 *       200: { description: Lista de usuários }
 *   post:
 *     summary: Cria um novo usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *     responses:
 *       201: { description: Usuário criado }
 *       400: { description: Campos obrigatórios ausentes }
 */
app.get("/users", (req, res) => {
  res.status(200).json(users.map(({ password, ...u }) => u));
});
app.post("/users", (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Campos 'name' e 'email' são obrigatórios" });
  const newUser = { id: nextUserId++, name, email, password: "changeme" };
  users.push(newUser);
  const { password, ...safe } = newUser;
  res.status(201).json(safe);
});

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Retorna um usuário específico
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses:
 *       200: { description: Usuário encontrado }
 *       404: { description: Usuário não encontrado }
 *   put:
 *     summary: Atualiza um usuário existente
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { name: { type: string }, email: { type: string } } }
 *     responses:
 *       200: { description: Usuário atualizado }
 *       404: { description: Usuário não encontrado }
 *   delete:
 *     summary: Remove um usuário
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses:
 *       204: { description: Usuário removido }
 *       404: { description: Usuário não encontrado }
 */
app.get("/users/:id", (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  const { password, ...safe } = user;
  res.status(200).json(safe);
});
app.put("/users/:id", (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  Object.assign(user, req.body);
  const { password, ...safe } = user;
  res.status(200).json(safe);
});
app.delete("/users/:id", (req, res) => {
  const index = users.findIndex((u) => u.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Usuário não encontrado" });
  users.splice(index, 1);
  res.status(204).send();
});

// ===================== CATEGORIES =====================

/**
 * @openapi
 * /categories:
 *   get:
 *     summary: Lista todas as categorias
 *     responses:
 *       200: { description: Lista de categorias }
 *   post:
 *     summary: Cria uma nova categoria
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [name], properties: { name: { type: string } } }
 *     responses:
 *       201: { description: Categoria criada }
 *       400: { description: Campo obrigatório ausente }
 */
app.get("/categories", (req, res) => res.status(200).json(categories));
app.post("/categories", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Campo 'name' é obrigatório" });
  const newCat = { id: nextCategoryId++, name };
  categories.push(newCat);
  res.status(201).json(newCat);
});

/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     summary: Retorna uma categoria específica
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses:
 *       200: { description: Categoria encontrada }
 *       404: { description: Categoria não encontrada }
 *   put:
 *     summary: Atualiza uma categoria existente
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { name: { type: string } } }
 *     responses:
 *       200: { description: Categoria atualizada }
 *       404: { description: Categoria não encontrada }
 *   delete:
 *     summary: Remove uma categoria
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses:
 *       204: { description: Categoria removida }
 *       404: { description: Categoria não encontrada }
 */
app.get("/categories/:id", (req, res) => {
  const cat = categories.find((c) => c.id === Number(req.params.id));
  if (!cat) return res.status(404).json({ error: "Categoria não encontrada" });
  res.status(200).json(cat);
});
app.put("/categories/:id", (req, res) => {
  const cat = categories.find((c) => c.id === Number(req.params.id));
  if (!cat) return res.status(404).json({ error: "Categoria não encontrada" });
  Object.assign(cat, req.body);
  res.status(200).json(cat);
});
app.delete("/categories/:id", (req, res) => {
  const index = categories.findIndex((c) => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Categoria não encontrada" });
  categories.splice(index, 1);
  res.status(204).send();
});

// ===================== PRODUCTS =====================

/**
 * @openapi
 * /products:
 *   get:
 *     summary: Lista todos os produtos
 *     responses:
 *       200: { description: Lista de produtos }
 *   post:
 *     summary: Cria um novo produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, categoryId]
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *               categoryId: { type: integer }
 *     responses:
 *       201: { description: Produto criado }
 *       400: { description: Campos obrigatórios ausentes }
 */
app.get("/products", (req, res) => res.status(200).json(products));
app.post("/products", (req, res) => {
  const { name, price, categoryId } = req.body;
  if (!name || price === undefined || !categoryId) {
    return res.status(400).json({ error: "Campos 'name', 'price' e 'categoryId' são obrigatórios" });
  }
  const newProduct = { id: nextProductId++, name, price, categoryId };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     summary: Retorna um produto específico
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses:
 *       200: { description: Produto encontrado }
 *       404: { description: Produto não encontrado }
 *   put:
 *     summary: Atualiza um produto existente
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { name: { type: string }, price: { type: number }, categoryId: { type: integer } } }
 *     responses:
 *       200: { description: Produto atualizado }
 *       404: { description: Produto não encontrado }
 *   delete:
 *     summary: Remove um produto
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses:
 *       204: { description: Produto removido }
 *       404: { description: Produto não encontrado }
 */
app.get("/products/:id", (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });
  res.status(200).json(product);
});
app.put("/products/:id", (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });
  Object.assign(product, req.body);
  res.status(200).json(product);
});
app.delete("/products/:id", (req, res) => {
  const index = products.findIndex((p) => p.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Produto não encontrado" });
  products.splice(index, 1);
  res.status(204).send();
});

// ===================== ORDERS =====================

/**
 * @openapi
 * /orders:
 *   get:
 *     summary: Lista todos os pedidos
 *     responses:
 *       200: { description: Lista de pedidos }
 *   post:
 *     summary: Cria um novo pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, productId, quantity]
 *             properties:
 *               userId: { type: integer }
 *               productId: { type: integer }
 *               quantity: { type: integer }
 *     responses:
 *       201: { description: Pedido criado }
 *       400: { description: Campos obrigatórios ausentes }
 */
app.get("/orders", (req, res) => res.status(200).json(orders));
app.post("/orders", (req, res) => {
  const { userId, productId, quantity } = req.body;
  if (!userId || !productId || !quantity) {
    return res.status(400).json({ error: "Campos 'userId', 'productId' e 'quantity' são obrigatórios" });
  }
  const newOrder = { id: nextOrderId++, userId, productId, quantity, status: "pendente" };
  orders.push(newOrder);
  res.status(201).json(newOrder);
});

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     summary: Retorna um pedido específico
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses:
 *       200: { description: Pedido encontrado }
 *       404: { description: Pedido não encontrado }
 *   put:
 *     summary: Atualiza um pedido existente
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { status: { type: string }, quantity: { type: integer } } }
 *     responses:
 *       200: { description: Pedido atualizado }
 *       404: { description: Pedido não encontrado }
 *   delete:
 *     summary: Remove um pedido
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses:
 *       204: { description: Pedido removido }
 *       404: { description: Pedido não encontrado }
 */
app.get("/orders/:id", (req, res) => {
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
  res.status(200).json(order);
});
app.put("/orders/:id", (req, res) => {
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
  Object.assign(order, req.body);
  res.status(200).json(order);
});
app.delete("/orders/:id", (req, res) => {
  const index = orders.findIndex((o) => o.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Pedido não encontrado" });
  orders.splice(index, 1);
  res.status(204).send();
});

// ===================== REVIEWS =====================

/**
 * @openapi
 * /reviews:
 *   get:
 *     summary: Lista todas as avaliações
 *     responses:
 *       200: { description: Lista de avaliações }
 *   post:
 *     summary: Cria uma nova avaliação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, userId, rating]
 *             properties:
 *               productId: { type: integer }
 *               userId: { type: integer }
 *               rating: { type: integer }
 *               comment: { type: string }
 *     responses:
 *       201: { description: Avaliação criada }
 *       400: { description: Campos obrigatórios ausentes }
 */
app.get("/reviews", (req, res) => res.status(200).json(reviews));
app.post("/reviews", (req, res) => {
  const { productId, userId, rating, comment } = req.body;
  if (!productId || !userId || rating === undefined) {
    return res.status(400).json({ error: "Campos 'productId', 'userId' e 'rating' são obrigatórios" });
  }
  const newReview = { id: nextReviewId++, productId, userId, rating, comment: comment || "" };
  reviews.push(newReview);
  res.status(201).json(newReview);
});

/**
 * @openapi
 * /reviews/{id}:
 *   get:
 *     summary: Retorna uma avaliação específica
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses:
 *       200: { description: Avaliação encontrada }
 *       404: { description: Avaliação não encontrada }
 *   delete:
 *     summary: Remove uma avaliação
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses:
 *       204: { description: Avaliação removida }
 *       404: { description: Avaliação não encontrada }
 */
app.get("/reviews/:id", (req, res) => {
  const review = reviews.find((r) => r.id === Number(req.params.id));
  if (!review) return res.status(404).json({ error: "Avaliação não encontrada" });
  res.status(200).json(review);
});
app.delete("/reviews/:id", (req, res) => {
  const index = reviews.findIndex((r) => r.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Avaliação não encontrada" });
  reviews.splice(index, 1);
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`target_api rodando em http://localhost:${PORT}`);
    console.log(`Swagger UI disponível em http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
