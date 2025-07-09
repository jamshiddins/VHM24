const fastify = require('fastify')({ logger: true });
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Import shared middleware and utilities
const { errorHandler } = require('@vhm24/shared/middleware/errorHandler');
const { authMiddleware } = require('@vhm24/shared/middleware/security');
const logger = require('@vhm24/shared/utils/logger');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma
const prisma = new PrismaClient();

// Configuration
const config = {
  port: process.env.RECIPES_SERVICE_PORT || 3007,
  host: process.env.HOST || '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key'
};

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(require('@fastify/cors'), {
    origin: true,
    credentials: true
  });

  // Security headers
  await fastify.register(require('@fastify/helmet'));

  // Rate limiting
  await fastify.register(require('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute'
  });

  // Swagger documentation
  await fastify.register(require('@fastify/swagger'), {
    swagger: {
      info: {
        title: 'VHM24 Recipes API',
        description: 'API for managing recipes, ingredients and cost calculations',
        version: '1.0.0'
      },
      host: 'localhost:3007',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header'
        }
      }
    }
  });

  await fastify.register(require('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    }
  });
}

// Authentication hook
fastify.addHook('preHandler', async (request, reply) => {
  // Skip auth for health check and docs
  if (request.url === '/health' || request.url.startsWith('/docs')) {
    return;
  }

  try {
    await authMiddleware(request, reply, config.jwtSecret);
  } catch (error) {
    reply.code(401).send({ success: false, message: 'Unauthorized' });
  }
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'recipes', timestamp: new Date().toISOString() };
});

// Recipes endpoints
fastify.get('/api/v1/recipes', {
  schema: {
    description: 'Get all recipes',
    tags: ['Recipes'],
    security: [{ Bearer: [] }],
    querystring: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        search: { type: 'string' },
        category: { type: 'string' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string' },
                preparationTime: { type: 'integer' },
                servings: { type: 'integer' },
                cost: { type: 'number' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              pages: { type: 'integer' }
            }
          }
        }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { page = 1, limit = 20, search, category } = request.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category) {
      where.category = category;
    }

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        skip,
        take: limit,
        include: {
          ingredients: {
            include: {
              ingredient: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.recipe.count({ where })
    ]);

    return {
      success: true,
      data: recipes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Get recipes error:', error);
    reply.code(500).send({ success: false, message: 'Internal server error' });
  }
});

fastify.get('/api/v1/recipes/:id', {
  schema: {
    description: 'Get recipe by ID',
    tags: ['Recipes'],
    security: [{ Bearer: [] }],
    params: {
      type: 'object',
      properties: {
        id: { type: 'integer' }
      },
      required: ['id']
    }
  }
}, async (request, reply) => {
  try {
    const { id } = request.params;

    const recipe = await prisma.recipe.findUnique({
      where: { id: parseInt(id) },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    });

    if (!recipe) {
      return reply.code(404).send({ success: false, message: 'Recipe not found' });
    }

    return { success: true, data: recipe };
  } catch (error) {
    logger.error('Get recipe error:', error);
    reply.code(500).send({ success: false, message: 'Internal server error' });
  }
});

fastify.post('/api/v1/recipes', {
  schema: {
    description: 'Create new recipe',
    tags: ['Recipes'],
    security: [{ Bearer: [] }],
    body: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string' },
        category: { type: 'string' },
        preparationTime: { type: 'integer', minimum: 1 },
        servings: { type: 'integer', minimum: 1 },
        instructions: { type: 'string' },
        ingredients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ingredientId: { type: 'integer' },
              quantity: { type: 'number', minimum: 0 },
              unit: { type: 'string' }
            },
            required: ['ingredientId', 'quantity', 'unit']
          }
        }
      },
      required: ['name', 'category', 'preparationTime', 'servings', 'ingredients']
    }
  }
}, async (request, reply) => {
  try {
    const { name, description, category, preparationTime, servings, instructions, ingredients } = request.body;

    // Calculate total cost
    let totalCost = 0;
    for (const ing of ingredients) {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: ing.ingredientId }
      });
      if (ingredient) {
        totalCost += (ingredient.costPerUnit * ing.quantity);
      }
    }

    const recipe = await prisma.recipe.create({
      data: {
        name,
        description,
        category,
        preparationTime,
        servings,
        instructions,
        cost: totalCost,
        ingredients: {
          create: ingredients.map(ing => ({
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ing.unit
          }))
        }
      },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    });

    return { success: true, data: recipe };
  } catch (error) {
    logger.error('Create recipe error:', error);
    reply.code(500).send({ success: false, message: 'Internal server error' });
  }
});

fastify.put('/api/v1/recipes/:id', {
  schema: {
    description: 'Update recipe',
    tags: ['Recipes'],
    security: [{ Bearer: [] }],
    params: {
      type: 'object',
      properties: {
        id: { type: 'integer' }
      },
      required: ['id']
    }
  }
}, async (request, reply) => {
  try {
    const { id } = request.params;
    const { name, description, category, preparationTime, servings, instructions, ingredients } = request.body;

    // Check if recipe exists
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRecipe) {
      return reply.code(404).send({ success: false, message: 'Recipe not found' });
    }

    // Calculate new cost if ingredients provided
    let totalCost = existingRecipe.cost;
    if (ingredients) {
      totalCost = 0;
      for (const ing of ingredients) {
        const ingredient = await prisma.ingredient.findUnique({
          where: { id: ing.ingredientId }
        });
        if (ingredient) {
          totalCost += (ingredient.costPerUnit * ing.quantity);
        }
      }
    }

    const updateData = {
      name,
      description,
      category,
      preparationTime,
      servings,
      instructions,
      cost: totalCost
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const recipe = await prisma.recipe.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    });

    return { success: true, data: recipe };
  } catch (error) {
    logger.error('Update recipe error:', error);
    reply.code(500).send({ success: false, message: 'Internal server error' });
  }
});

fastify.delete('/api/v1/recipes/:id', {
  schema: {
    description: 'Delete recipe',
    tags: ['Recipes'],
    security: [{ Bearer: [] }],
    params: {
      type: 'object',
      properties: {
        id: { type: 'integer' }
      },
      required: ['id']
    }
  }
}, async (request, reply) => {
  try {
    const { id } = request.params;

    const recipe = await prisma.recipe.findUnique({
      where: { id: parseInt(id) }
    });

    if (!recipe) {
      return reply.code(404).send({ success: false, message: 'Recipe not found' });
    }

    await prisma.recipe.delete({
      where: { id: parseInt(id) }
    });

    return { success: true, message: 'Recipe deleted successfully' };
  } catch (error) {
    logger.error('Delete recipe error:', error);
    reply.code(500).send({ success: false, message: 'Internal server error' });
  }
});

// Ingredients endpoints
fastify.get('/api/v1/ingredients', {
  schema: {
    description: 'Get all ingredients',
    tags: ['Ingredients'],
    security: [{ Bearer: [] }]
  }
}, async (request, reply) => {
  try {
    const { page = 1, limit = 50, search } = request.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [ingredients, total] = await Promise.all([
      prisma.ingredient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.ingredient.count({ where })
    ]);

    return {
      success: true,
      data: ingredients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Get ingredients error:', error);
    reply.code(500).send({ success: false, message: 'Internal server error' });
  }
});

fastify.post('/api/v1/ingredients', {
  schema: {
    description: 'Create new ingredient',
    tags: ['Ingredients'],
    security: [{ Bearer: [] }],
    body: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 255 },
        category: { type: 'string' },
        unit: { type: 'string' },
        costPerUnit: { type: 'number', minimum: 0 },
        supplier: { type: 'string' },
        description: { type: 'string' }
      },
      required: ['name', 'category', 'unit', 'costPerUnit']
    }
  }
}, async (request, reply) => {
  try {
    const ingredient = await prisma.ingredient.create({
      data: request.body
    });

    return { success: true, data: ingredient };
  } catch (error) {
    logger.error('Create ingredient error:', error);
    reply.code(500).send({ success: false, message: 'Internal server error' });
  }
});

// Cost calculation endpoint
fastify.post('/api/v1/cost-calculation', {
  schema: {
    description: 'Calculate recipe cost',
    tags: ['Cost Calculation'],
    security: [{ Bearer: [] }],
    body: {
      type: 'object',
      properties: {
        ingredients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ingredientId: { type: 'integer' },
              quantity: { type: 'number', minimum: 0 }
            },
            required: ['ingredientId', 'quantity']
          }
        },
        servings: { type: 'integer', minimum: 1 },
        markup: { type: 'number', minimum: 0, default: 0 }
      },
      required: ['ingredients', 'servings']
    }
  }
}, async (request, reply) => {
  try {
    const { ingredients, servings, markup = 0 } = request.body;

    let totalCost = 0;
    const costBreakdown = [];

    for (const ing of ingredients) {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: ing.ingredientId }
      });

      if (ingredient) {
        const cost = ingredient.costPerUnit * ing.quantity;
        totalCost += cost;
        
        costBreakdown.push({
          ingredient: ingredient.name,
          quantity: ing.quantity,
          unit: ingredient.unit,
          costPerUnit: ingredient.costPerUnit,
          totalCost: cost
        });
      }
    }

    const costPerServing = totalCost / servings;
    const finalCostPerServing = costPerServing * (1 + markup / 100);

    return {
      success: true,
      data: {
        totalCost,
        costPerServing,
        finalCostPerServing,
        servings,
        markup,
        breakdown: costBreakdown
      }
    };
  } catch (error) {
    logger.error('Cost calculation error:', error);
    reply.code(500).send({ success: false, message: 'Internal server error' });
  }
});

// Recipe categories endpoint
fastify.get('/api/v1/recipe-categories', {
  schema: {
    description: 'Get recipe categories',
    tags: ['Recipes'],
    security: [{ Bearer: [] }]
  }
}, async (request, reply) => {
  try {
    const categories = await prisma.recipe.findMany({
      select: {
        category: true
      },
      distinct: ['category'],
      where: {
        category: {
          not: null
        }
      }
    });

    const categoryList = categories.map(c => c.category).filter(Boolean);

    return {
      success: true,
      data: categoryList
    };
  } catch (error) {
    logger.error('Get categories error:', error);
    reply.code(500).send({ success: false, message: 'Internal server error' });
  }
});

// Error handler
fastify.setErrorHandler(errorHandler);

// Start server
async function start() {
  try {
    await registerPlugins();
    
    await fastify.listen({
      port: config.port,
      host: config.host
    });

    logger.info(`🍳 Recipes service running on http://${config.host}:${config.port}`);
    logger.info(`📚 API documentation available at http://${config.host}:${config.port}/docs`);
  } catch (error) {
    console.error('Failed to start recipes service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down recipes service...');
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down recipes service...');
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

start();
